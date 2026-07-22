'use client';

import React, { useEffect, useState, Suspense } from 'react';
import MBTITest from '@/components/tests/MBTITest';
import { useRouter, usePathname } from 'next/navigation';
import { generateTestCode } from '@/utils/testCodeGenerator';
import { clearTestProgress, generateTestId } from '@/utils/testResume';
import MbtiProCodeInput from '@/components/tests/MbtiProCodeInput';
import MbtiProClientInfo from '@/components/tests/MbtiProClientInfo';
import { useAppChromeNav } from '@/components/AppChrome';
import type { PersonalAmateurTestFlowConfig } from '@/config/personalAmateurTestFlow';

function PersonalAmateurTestFlowContent({ config }: { config: PersonalAmateurTestFlowConfig }) {
  const router = useRouter();
  const pathname = usePathname();
  const [testId] = useState(() => {
    try {
      return generateTestId(pathname || config.defaultPath);
    } catch {
      return `${config.defaultPath.replace(/\//g, '-')}-test-default`;
    }
  });
  const [currentStep, setCurrentStep] = useState<'code' | 'info' | 'test'>(() =>
    config.skipCodeAndInfoSteps ? 'test' : 'code',
  );
  const { setTopNavHidden } = useAppChromeNav();

  useEffect(() => {
    const hideNav = !config.keepAppTopNavVisible && currentStep === 'code';
    setTopNavHidden(hideNav);
    return () => setTopNavHidden(false);
  }, [currentStep, setTopNavHidden, config.keepAppTopNavVisible]);

  const [codeData, setCodeData] = useState<{ groupCode: string; groupPassword: string } | null>(null);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [savedAnswers, setSavedAnswers] = useState<any>(null);
  const [savedCurrentQuestion, setSavedCurrentQuestion] = useState<number | undefined>(undefined);
  const [testComponentKey, setTestComponentKey] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

const handleCodeSubmit = (submitted: { groupCode: string; groupPassword: string }) => {
    setCodeData(submitted);
    setCurrentStep('info');
  };

  const handleClientInfoSubmit = (info: any) => {
    setClientInfo(info);
    setCurrentStep('test');
  };

  const handleBackFromInfo = (currentClientInfo: any) => {
    setClientInfo(currentClientInfo ? { ...currentClientInfo } : null);
    setCurrentStep('code');
  };

  const handleBackFromTest = () => {
    setCurrentStep('info');
  };

  const handleTestComplete = async (results: any) => {
    // 중복 실행 방지
    if (isCompleting) {
      console.log('[MbtiTestPage] 검사 완료 처리 이미 진행 중, 중복 호출 무시');
      return;
    }
    
    try {
      setIsCompleting(true);
      console.log('[MbtiTestPage] 검사 완료 처리 시작');
      
      // 테스트 코드 생성
      const testCode = generateTestCode(config.codePrefix);
      
      // 현재 시간
      const timestamp = new Date().toISOString();
      
      // counselorCode 생성 (groupCode를 counselorCode로 사용)
      const counselorCode = codeData?.groupCode || null;
      
      // 현재 로그인한 사용자 정보 가져오기
      let currentUserId = null;
      let currentUserEmail = null;
      
      // Firebase Auth에서 사용자 정보 가져오기
      try {
        const { initializeFirebase, auth } = await import('@/lib/firebase');
        const { testResults } = await import('@/utils/firebaseIntegration');
        initializeFirebase();
        if (auth && auth.currentUser) {
          currentUserId = auth.currentUser.uid;
          currentUserEmail = auth.currentUser.email;
        }
        
        // 결과 데이터 구성
        const testData = {
          testType: config.displayName,
          code: testCode,
          counselorCode: counselorCode,
          timestamp: timestamp,
          answers: results,
          mbtiType: results.mbtiType || 'INTJ',
          status: '완료',
          userId: currentUserId, // Firebase 저장을 위한 userId 추가
          userData: {
            name: clientInfo?.name || '게스트 사용자',
            email: currentUserEmail || 'guest@example.com',
            testType: config.displayName,
            clientInfo: {
              ...(clientInfo || {}),
              counselorCode: counselorCode
            }
          }
        };
        
        // 1. Firebase DB에 먼저 저장 (주 저장소)
        let firebaseSaveSuccess = false;
        if (currentUserId) {
          try {
            await testResults.saveTestResult({
              ...testData,
              userId: currentUserId,
              createdAt: new Date(timestamp)
            });
            firebaseSaveSuccess = true;
            console.log('✅ Firebase DB에 개인용 MBTI 검사 결과 저장 성공:', testCode);
          } catch (firebaseError) {
            console.error('❌ Firebase DB 저장 실패:', firebaseError);
            // Firebase 저장 실패 시 오프라인 큐에 추가
            try {
              const { addToOfflineQueue } = await import('@/utils/offlineQueue');
              addToOfflineQueue({
                type: 'save',
                collection: 'test_results',
                data: {
                  ...testData,
                  userId: currentUserId,
                  createdAt: new Date(timestamp)
                }
              });
              console.log('✅ 오프라인 큐에 작업 추가 완료');
            } catch (queueError) {
              console.error('오프라인 큐 추가 실패:', queueError);
            }
          }
        } else {
          console.warn('⚠️ 사용자 ID가 없어 Firebase 저장을 건너뜁니다.');
        }
        
        // 2. 성공 후 LocalStorage에 캐시 저장
        if (typeof window !== 'undefined') {
          // 1. test_records에 저장 (중복 체크)
          const existingRecords = localStorage.getItem('test_records');
          let records = existingRecords ? JSON.parse(existingRecords) : [];
        
          // 중복 체크: 같은 testCode가 이미 존재하는지 확인
          const existingIndex = records.findIndex((record: any) => record.code === testCode);
          
          if (existingIndex >= 0) {
            // 이미 존재하는 경우 업데이트
            records[existingIndex] = testData;
            console.log('[MbtiTestPage] 기존 기록 업데이트 (test_records):', testCode);
          } else {
            // 새 기록 추가
            records.push(testData);
            console.log('[MbtiTestPage] 새 기록 추가 (test_records):', testCode);
          }
          
          // 최대 50개까지만 유지
          if (records.length > 50) {
            records = records.slice(-50);
          }
          
          // 저장
          localStorage.setItem('test_records', JSON.stringify(records));
          localStorage.setItem(`test-result-${testCode}`, JSON.stringify(testData));

          // 로그인 사용자면 Firestore(testResults)에 추가 저장 (이메일 없이 UID 기준 조회용)
          try {
            const { saveUserTestResultToFirestore } = await import('@/utils/testResultsStore');
            void saveUserTestResultToFirestore({
              code: testCode,
              testType: config.displayName,
              counselorCode: counselorCode ?? undefined,
              userData: testData.userData,
              resultData: results,
              status: 'completed',
            });
          } catch (e) {
            console.warn('[MbtiTestPage] Firestore(testResults) 저장 실패(무시):', e);
          }
          
          // 2. mbti-user-test-records에 저장 (중복 체크)
          const mbtiRecordsStr = localStorage.getItem('mbti-user-test-records') || '[]';
          let mbtiRecords: any[] = [];
          
          try {
            mbtiRecords = JSON.parse(mbtiRecordsStr);
            if (!Array.isArray(mbtiRecords)) {
              mbtiRecords = [];
            }
          } catch (e) {
            console.error('[MbtiTestPage] mbti-user-test-records 파싱 오류:', e);
            mbtiRecords = [];
          }
          
          // mbti-user-test-records 형식으로 데이터 구성
          const mbtiRecord = {
            testCode: testCode,
            testType: config.displayName,
            timestamp: timestamp,
            counselorCode: counselorCode,
            userData: testData.userData,
            result: {
              code: testCode,
              timestamp: timestamp,
              testType: config.displayName,
              answers: results,
              mbtiType: results.mbtiType || 'INTJ'
            },
            answers: results,
            mbtiType: results.mbtiType || 'INTJ'
          };
          
          // 중복 체크: 같은 testCode가 이미 존재하는지 확인
          const existingMbtiIndex = mbtiRecords.findIndex((record: any) => record.testCode === testCode);
          
          if (existingMbtiIndex >= 0) {
            // 이미 존재하는 경우 업데이트
            mbtiRecords[existingMbtiIndex] = mbtiRecord;
            console.log('[MbtiTestPage] 기존 기록 업데이트 (mbti-user-test-records):', testCode);
          } else {
            // 새 기록 추가 (맨 앞에 추가)
            mbtiRecords.unshift(mbtiRecord);
            console.log('[MbtiTestPage] 새 기록 추가 (mbti-user-test-records):', testCode);
          }
          
          // 최대 100개까지만 유지
          if (mbtiRecords.length > 100) {
            mbtiRecords = mbtiRecords.slice(0, 100);
          }
          
          // 저장
          localStorage.setItem('mbti-user-test-records', JSON.stringify(mbtiRecords));
          
          // Firebase 저장 성공 여부를 기록
          if (firebaseSaveSuccess) {
            console.log('[MbtiTestPage] ✅ 검사 기록 저장 완료 (Firebase + LocalStorage 캐시):', testCode);
          } else {
            console.log('[MbtiTestPage] ⚠️ 검사 기록 LocalStorage 캐시 저장 완료 (Firebase 저장 실패):', testCode);
          }
        }
      } catch (authError) {
        console.warn('Firebase Auth에서 사용자 정보 가져오기 실패:', authError);
        // Firebase 없이 LocalStorage만 저장 (폴백)
        const testData = {
          testType: config.displayName,
          code: testCode,
          counselorCode: counselorCode,
          timestamp: timestamp,
          answers: results,
          mbtiType: results.mbtiType || 'INTJ',
          status: '완료',
          userData: {
            name: clientInfo?.name || '게스트 사용자',
            email: 'guest@example.com',
            testType: config.displayName,
            clientInfo: {
              ...(clientInfo || {}),
              counselorCode: counselorCode
            }
          }
        };
        
        if (typeof window !== 'undefined') {
          // LocalStorage에 저장 (폴백)
          const existingRecords = localStorage.getItem('test_records');
          let records = existingRecords ? JSON.parse(existingRecords) : [];
          
          const existingIndex = records.findIndex((record: any) => record.code === testCode);
          if (existingIndex >= 0) {
            records[existingIndex] = testData;
          } else {
            records.push(testData);
          }
          
          if (records.length > 50) {
            records = records.slice(-50);
          }
          
          localStorage.setItem('test_records', JSON.stringify(records));
          localStorage.setItem(`test-result-${testCode}`, JSON.stringify(testData));
          console.log('[MbtiTestPage] ⚠️ LocalStorage만 저장 완료 (Firebase 사용 불가):', testCode);
        }
      }
      
      // 검사 완료 시 진행 상태 삭제
      clearTestProgress(testId);
      
      // 검사 완료 직후임을 표시하는 플래그 설정
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('testJustCompleted', 'true');
        // 검사 완료 시 currentTestStep 정리
      }
      
      // 결과 페이지로 이동 (검사 완료 직후임을 표시하는 파라미터 추가)
      const resultPath = config.buildResultPath(testCode, results);
      router.push(resultPath);
      
    } catch (error) {
      console.error('[MbtiTestPage] 검사 완료 처리 중 오류:', error);
      
      // 사용자에게 친화적인 에러 메시지 표시
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      alert(`검사 결과 처리 중 문제가 발생했습니다: ${errorMessage}\n\n마이페이지에서 검사 기록을 확인해주세요.`);
      
      // 에러 발생 시 마이페이지로 이동
      router.push('/mypage?tab=records');
    } finally {
      setIsCompleting(false);
    }
  };

  // 단계별 렌더링
  return (
    <>
      
      
      <div className={config.pageShellClassName ?? 'bg-emerald-950 min-h-screen'}>
        {!config.skipCodeAndInfoSteps && currentStep === 'code' && (
          <MbtiProCodeInput
            key={`code-${testId}-${codeData ? `${codeData.groupCode || 'empty'}-${codeData.groupPassword || 'empty'}` : 'null'}`}
            onSubmit={handleCodeSubmit}
            initialData={codeData}
            isPersonalTest={true}
          />
        )}
        
        {!config.skipCodeAndInfoSteps && currentStep === 'info' && (
          <MbtiProClientInfo
            key={`info-${testId}-${clientInfo ? `${clientInfo.name || 'empty'}-${clientInfo.birthYear || 'empty'}-${clientInfo.gender || 'empty'}` : 'null'}`}
            onSubmit={handleClientInfoSubmit}
            isPersonalTest={true}
            initialData={clientInfo}
            onBack={handleBackFromInfo}
          />
        )}
        
        {currentStep === 'test' && (
          <MBTITestWrapper 
            key={testComponentKey}
            config={config}
            onComplete={handleTestComplete}
            testId={testId}
            savedAnswers={savedAnswers}
            savedCurrentQuestion={savedCurrentQuestion}
            codeData={codeData}
            clientInfo={clientInfo}
            onStepChange={setCurrentStep}
            onBack={config.skipCodeAndInfoSteps ? undefined : handleBackFromTest}
            onAnswersUpdate={(answers, currentQuestion) => {
              // 답변 변경 시 부모 컴포넌트 상태 업데이트
              setSavedAnswers(answers);
              setSavedCurrentQuestion(currentQuestion);
            }}
          />
        )}
      </div>
    </>
  );
}

// MBTITest 래퍼 컴포넌트 (진행 상태 자동 저장)
function MBTITestWrapper({ 
  onComplete, 
  testId, 
  savedAnswers, 
  savedCurrentQuestion: propSavedCurrentQuestion,
  codeData,
  clientInfo,
  onStepChange,
  onBack,
  onAnswersUpdate,
  config,
}: { 
  onComplete: (results: any) => void;
  testId: string;
  savedAnswers?: any;
  savedCurrentQuestion?: number;
  codeData?: any;
  clientInfo?: any;
  onStepChange?: (step: 'code' | 'info' | 'test') => void;
  onBack?: () => void;
  onAnswersUpdate?: (answers: any, currentQuestion: number) => void;
  config: PersonalAmateurTestFlowConfig;
}) {
  // 저장된 답변을 정규화 (문자열 키를 숫자로 변환)
  const normalizeAnswers = (rawAnswers: any): { [key: string]: { type: string; answer: number } } => {
    if (!rawAnswers) return {};
    const normalized: { [key: string]: { type: string; answer: number } } = {};
    
    Object.keys(rawAnswers).forEach((key) => {
      const value = rawAnswers[key];
      if (typeof value === 'object' && value.type && value.answer !== undefined) {
        normalized[key] = value;
      } else if (typeof value === 'number') {
        // 숫자만 있는 경우 기본 타입 설정 (나중에 질문에서 가져올 수 있음)
        normalized[key] = { type: '', answer: value };
      }
    });
    
    return normalized;
  };

  const normalizedSavedAnswers = normalizeAnswers(savedAnswers);
  
  // prop으로 전달된 savedCurrentQuestion 우선 사용, 없으면 마지막 답변한 질문 다음으로 계산
  const savedCurrentQuestion = propSavedCurrentQuestion !== undefined
    ? propSavedCurrentQuestion
    : (savedAnswers && Object.keys(normalizedSavedAnswers).length > 0
        ? Math.max(...Object.keys(normalizedSavedAnswers).map(k => parseInt(k) || 0)) + 1
        : 0);

  // MBTITest 컴포넌트의 상태를 추적하기 위한 state
  const [trackedAnswers, setTrackedAnswers] = useState<any>(normalizedSavedAnswers);
  const [trackedCurrentQuestion, setTrackedCurrentQuestion] = useState<number>(savedCurrentQuestion || 0);

  // 답변 변경 핸들러 (MBTITest에서 직접 호출)
  const handleAnswerChange = (newAnswers: any, newCurrentQuestion: number) => {
    setTrackedAnswers(newAnswers);
    setTrackedCurrentQuestion(newCurrentQuestion);
    
    // 부모 컴포넌트에 답변 업데이트 알림
    if (onAnswersUpdate) {
      onAnswersUpdate(newAnswers, newCurrentQuestion);
    }
  };

  // 이전 페이지로 돌아가기 핸들러
  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  const handleComplete = (results: any) => {
    clearTestProgress(testId);
    onComplete(results);
  };

  // MBTITest에 저장된 답변과 현재 질문 번호 전달
  return (
    <MBTITest 
      onComplete={handleComplete}
      savedAnswers={normalizedSavedAnswers}
      savedCurrentQuestion={savedCurrentQuestion}
      onAnswerChange={handleAnswerChange}
      onBack={handleBack}
      theme={config.testUiTheme ?? 'emerald'}
      title={config.testScreenTitle ?? config.displayName}
      subtitle={config.testScreenSubtitle ?? '자신에게 맞는 답변을 선택해주세요'}
    />
  );
}

// Suspense로 감싼 export
export default function PersonalAmateurTestFlowPage({ config }: { config: PersonalAmateurTestFlowConfig }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-emerald-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-emerald-200 text-lg">로딩 중...</p>
        </div>
      </div>
    }>
      <PersonalAmateurTestFlowContent config={config} />
    </Suspense>
  );
}