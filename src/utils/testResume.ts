/**
 * 심리검사 진행 상태 저장/복원 유틸리티
 * 모든 심리검사에서 중단 후 이어하기 기능을 지원하기 위한 공통 기능
 */

export interface TestProgress {
  testId: string;
  testName: string;
  answers: { [key: string]: any };
  currentStep?: number | string; // number (일반 검사) 또는 string (MBTI Pro: 'code' | 'info' | 'test')
  currentQuestion?: number;
  currentChapter?: number;
  clientInfo?: any;
  codeData?: any;
  studentInfo?: any;
  timestamp: number;
  testType?: string;
  totalQuestions?: number;
}

/**
 * 검사 진행 상태를 localStorage에 저장
 */
export function saveTestProgress(progress: TestProgress): void {
  try {
    if (typeof window === 'undefined') return;
    const key = `test_progress_${progress.testId}`;
    localStorage.setItem(key, JSON.stringify(progress));
    // 전체 진행 중인 검사 목록에도 추가
    const saved = localStorage.getItem('test_progress_list');
    let list: Array<{ testId: string; testName: string; timestamp: number; testType?: string }>
      = saved ? JSON.parse(saved) : [];
    // 중복 제거 후 타임스탬프 갱신
    const filtered = list.filter(t => t.testId !== progress.testId);
    filtered.push({
      testId: progress.testId,
      testName: progress.testName,
      timestamp: progress.timestamp,
      testType: progress.testType
    });
    localStorage.setItem('test_progress_list', JSON.stringify(filtered));
  } catch (error) {
    console.error('검사 진행 상태 저장 실패:', error);
  }
}

/**
 * 주어진 진행 상태가 100% 완료인지 여부를 판단
 * - 우선 순위: totalQuestions → 검사 유형별 기본 문항 수 → answers 내 완료 여부
 */
function isProgressCompleted(progress: TestProgress | null): boolean {
  if (!progress || !progress.answers) return false;
  const answeredCount = Object.keys(progress.answers || {}).length;

  // 1) 저장된 총 문항 수 기준
  const totalQuestions = progress.totalQuestions || 0;
  if (totalQuestions > 0 && answeredCount >= totalQuestions) return true;

  // 2) 검사 유형별 기본 문항 수 추정치 (fallback)
  const type = (progress.testType || '').toUpperCase();
  const fallbackTotal =
    type.includes('MBTI PRO') ? 24 : // MBTI Pro 실제 문항수
    type.includes('MBTI') ? 20 : // 개인용 MBTI 실제 문항수
    type.includes('AI_PROFILING') || type.includes('AI-PROFILING') ? (progress.totalQuestions || 0) :
    type.includes('INTEGRATED') ? (progress.totalQuestions || 0) : 0;

  if (fallbackTotal > 0 && answeredCount >= fallbackTotal) return true;

  return false;
}

/**
 * 완료 기록이 진행 저장보다 최신(또는 거의 동일)인지 확인
 * 주의: 같은 testId를 가진 완료 기록만 확인 (다른 검사의 완료 기록과 혼동 방지)
 */
function hasNewerOrSameCompletion(progress: TestProgress): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const recordsStr = localStorage.getItem('test_records');
    if (!recordsStr) return false;
    const records = JSON.parse(recordsStr) as any[];
    if (!Array.isArray(records) || records.length === 0) return false;
    
    // testId에서 검사 식별자 추출 (타임스탬프 제거)
    const progressTestId = progress.testId || '';
    const baseTestId = progressTestId.split('_').slice(0, -1).join('_'); // 마지막 타임스탬프 제거
    
    // 검사 유형 매칭 (더 정확하게)
    const progressType = (progress.testType || '').toLowerCase();
    const matchingRecords = records.filter(r => {
      if (!r || !r.testType) return false;
      const recordType = (r.testType || '').toLowerCase();
      
      // 완료 상태 확인 (status 필드 또는 명시적 완료 표시)
      const isCompleted = r.status === '완료' || r.status === 'completed' || r.code;
      
      // 타입 매칭 로직 개선
      let typeMatches = false;
      if (progressType.includes('mbti') && !progressType.includes('pro')) {
        // 일반 MBTI 검사
        typeMatches = recordType.includes('mbti') && !recordType.includes('pro') && !recordType.includes('전문가');
      } else if (progressType.includes('mbti_pro')) {
        // MBTI Pro 검사
        typeMatches = (recordType.includes('mbti') && recordType.includes('전문가')) || recordType.includes('mbti pro');
      } else if (progressType.includes('ai_profiling') || progressType.includes('ai-profiling')) {
        typeMatches = recordType.includes('ai') && recordType.includes('프로파일링');
      } else if (progressType.includes('integrated')) {
        typeMatches = recordType.includes('통합');
      }
      
      return typeMatches && isCompleted;
    });
    
    if (matchingRecords.length === 0) return false;
    
    // 가장 최신 완료 기록의 타임스탬프 확인
    const latestCompleted = matchingRecords
      .map(r => new Date(r.timestamp || r.testDate || 0).getTime())
      .sort((a, b) => b - a)[0];
    
    if (!latestCompleted || latestCompleted === 0) return false;
    
    const progressTs = Number(progress.timestamp) || 0;
    
    // 진행 상태가 완료 기록보다 오래 전 것이면 완료로 간주하지 않음
    // (같은 검사를 다시 시작한 경우를 고려)
    // 완료 기록이 진행 저장보다 최신이면서, 시간 차이가 5분 이내인 경우만 완료로 간주
    const timeDiff = latestCompleted - progressTs;
    const threshold = 5 * 60 * 1000; // 5분 허용오차로 축소
    
    // 완료 기록이 진행 저장보다 최신이고, 5분 이내에 생성된 경우만 완료로 간주
    // 이렇게 하면 진행 중인 검사를 삭제하지 않음
    if (timeDiff > 0 && timeDiff <= threshold) {
      return true;
    }
    
    return false;
  } catch (e) {
    console.error('hasNewerOrSameCompletion 오류:', e);
    return false;
  }
}

/**
 * 단일 진행 상태 정합성 확인 및 정리. true=정리되어 삭제됨
 */
export function cleanupProgressForTest(testId: string): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const key = `test_progress_${testId}`;
    const saved = localStorage.getItem(key);
    if (!saved) return false;
    const progress = JSON.parse(saved) as TestProgress;

    // 가드 1) 답변이 없거나 timestamp가 30일 초과 → 삭제
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (!progress.answers || Object.keys(progress.answers).length === 0 || Date.now() - (progress.timestamp || 0) > thirtyDays) {
      clearTestProgress(testId);
      return true;
    }

    // 가드 2) 총 문항 수 기반 완료
    if (isProgressCompleted(progress)) {
      clearTestProgress(testId);
      return true;
    }

    // 가드 3) 검사기록에 더 최신(또는 거의 동일) 완료가 존재
    if (hasNewerOrSameCompletion(progress)) {
      clearTestProgress(testId);
      return true;
    }

    return false;
  } catch (e) {
    console.error('cleanupProgressForTest 실패:', e);
    return false;
  }
}

/**
 * 모든 진행 목록에 대해 일괄 정리 및 목록 업데이트
 */
export function sweepAllInProgress(): void {
  try {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('test_progress_list');
    const list: Array<{ testId: string; testName: string; timestamp: number; testType?: string }> = saved ? JSON.parse(saved) : [];
    const kept: typeof list = [];
    for (const item of list) {
      const removed = cleanupProgressForTest(item.testId);
      if (!removed) kept.push(item);
    }
    localStorage.setItem('test_progress_list', JSON.stringify(kept));
  } catch (e) {
    console.error('sweepAllInProgress 실패:', e);
  }
}

/**
 * 이어하기 팝업을 보여줄지 여부 판단 (정리 수행 후 결과 반환)
 * 주의: 전역 정리(sweepAllInProgress)는 호출하지 않음 - 특정 testId만 검증
 */
export function shouldShowResumeDialog(testId: string): boolean {
  try {
    if (typeof window === 'undefined') return false;
    
    // 특정 testId에 대한 정리만 수행 (전역 정리는 하지 않음)
    // 전역 정리는 getInProgressTests에서만 수행하여 중복 호출 방지
    const removed = cleanupProgressForTest(testId);
    if (removed) {
      return false;
    }
    
    // 진행 상태 로드 및 검증
    const progress = loadTestProgress(testId);
    if (!progress || !progress.answers || Object.keys(progress.answers).length === 0) {
      return false;
    }
    
    // 추가 검증: 답변 수가 0이거나 총 문항 수 이상이면 표시하지 않음
    const answeredCount = Object.keys(progress.answers).length;
    if (answeredCount === 0) {
      return false;
    }
    
    // 총 문항 수 기반 완료 여부 재확인
    const totalQuestions = progress.totalQuestions || 0;
    if (totalQuestions > 0 && answeredCount >= totalQuestions) {
      // 완료된 것으로 간주하고 삭제
      clearTestProgress(testId);
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('shouldShowResumeDialog 오류:', e);
    return false;
  }
}

/**
 * 검사 진행 상태를 localStorage에서 불러오기
 */
export function loadTestProgress(testId: string): TestProgress | null {
  try {
    if (typeof window === 'undefined') return null;
    const key = `test_progress_${testId}`;
    const saved = localStorage.getItem(key);
    if (!saved) return null;
    return JSON.parse(saved) as TestProgress;
  } catch (error) {
    console.error('검사 진행 상태 불러오기 실패:', error);
    return null;
  }
}

/**
 * 검사 진행 상태 삭제 (검사 완료 시)
 */
export function clearTestProgress(testId: string): void {
  try {
    if (typeof window === 'undefined') return;
    const key = `test_progress_${testId}`;
    localStorage.removeItem(key);
    // 진행 목록에서도 제거 (순환 참조 방지를 위해 직접 처리)
    const saved = localStorage.getItem('test_progress_list');
    if (saved) {
      try {
        const list = JSON.parse(saved) as Array<{
          testId: string;
          testName: string;
          timestamp: number;
          testType?: string;
        }>;
        const filtered = list.filter(t => t.testId !== testId);
        localStorage.setItem('test_progress_list', JSON.stringify(filtered));
      } catch (e) {
        console.error('진행 목록 업데이트 실패:', e);
      }
    }
  } catch (error) {
    console.error('검사 진행 상태 삭제 실패:', error);
  }
}

/**
 * 진행 중인 모든 검사 목록 가져오기
 * 완료된 검사(100% 진행률)는 제외합니다
 */
export function getInProgressTests(): Array<{
  testId: string;
  testName: string;
  timestamp: number;
  testType?: string;
}> {
  try {
    if (typeof window === 'undefined') return [];
    // 먼저 일괄 정리
    sweepAllInProgress();
    const saved = localStorage.getItem('test_progress_list');
    if (!saved) return [];
    const list = JSON.parse(saved) as Array<{
      testId: string;
      testName: string;
      timestamp: number;
      testType?: string;
    }>;
    
    // 30일 이상 된 진행 상태는 자동 삭제
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let filtered = list.filter(t => t.timestamp > thirtyDaysAgo);
    
    // 완료된 검사(100% 진행률) 제외 (순환 참조 방지를 위해 직접 처리)
    const completedTestIds: string[] = [];
    filtered = filtered.filter(test => {
      try {
        const key = `test_progress_${test.testId}`;
        const saved = localStorage.getItem(key);
        if (!saved) return false;
        
        const progress = JSON.parse(saved) as TestProgress;
        if (!progress || !progress.answers) return false;

        // 완성 판단
        if (isProgressCompleted(progress)) {
          completedTestIds.push(test.testId);
          return false;
        }
        
        return true;
      } catch (e) {
        console.error(`검사 ${test.testId} 진행 상태 확인 실패:`, e);
        return true; // 오류 발생 시 유지
      }
    });
    
    // 완료된 검사들 삭제
    completedTestIds.forEach(testId => {
      try {
        const key = `test_progress_${testId}`;
        localStorage.removeItem(key);
      } catch (e) {
        console.error(`검사 ${testId} 삭제 실패:`, e);
      }
    });
    
    // 필터링된 목록 저장
    if (filtered.length !== list.length) {
      // localStorage에서 직접 업데이트
      const filteredTestIds = filtered.map(t => t.testId);
      const updatedList = list.filter(t => filteredTestIds.includes(t.testId));
      localStorage.setItem('test_progress_list', JSON.stringify(updatedList));
    }
    
    return filtered;
  } catch (error) {
    console.error('진행 중인 검사 목록 불러오기 실패:', error);
    return [];
  }
}

/**
 * 검사 ID 생성 (경로 기반)
 */
export function generateTestId(pathname: string, userId?: string): string {
  // 경로에서 검사 식별자 추출
  const pathParts = pathname.split('/').filter(Boolean);
  const testPath = pathParts.slice(pathParts.indexOf('tests') + 1).join('_');
  return userId ? `${testPath}_${userId}` : testPath;
}

