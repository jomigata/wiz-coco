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
    const inProgressList = getInProgressTests();
    if (!inProgressList.find(t => t.testId === progress.testId)) {
      inProgressList.push({
        testId: progress.testId,
        testName: progress.testName,
        timestamp: progress.timestamp,
        testType: progress.testType
      });
      localStorage.setItem('test_progress_list', JSON.stringify(inProgressList));
    }
  } catch (error) {
    console.error('검사 진행 상태 저장 실패:', error);
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
        
        // 진행률 계산
        const answeredCount = Object.keys(progress.answers || {}).length;
        const totalQuestions = progress.totalQuestions || 0;
        
        // 총 문항 수가 있고, 모든 문항이 완료되었으면 제외
        if (totalQuestions > 0 && answeredCount >= totalQuestions) {
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

