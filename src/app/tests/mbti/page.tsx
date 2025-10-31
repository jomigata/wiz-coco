'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Navigation from '@/components/Navigation';
import MBTITest from '@/components/tests/MBTITest';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { generateTestCode } from '@/utils/testCodeGenerator';
import { saveTestProgress, loadTestProgress, clearTestProgress, generateTestId, shouldShowResumeDialog } from '@/utils/testResume';
import { motion } from 'framer-motion';
import MbtiProCodeInput from '@/components/tests/MbtiProCodeInput';
import MbtiProClientInfo from '@/components/tests/MbtiProClientInfo';

function MbtiTestPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // URL에서 resume 파라미터로 전달된 testId 확인 (마이페이지에서 이어하기 클릭 시)
  const resumeTestId = searchParams.get('resume');
  
  // testId를 상태로 관리: resume 파라미터가 있으면 사용, 없으면 새로 생성
  const [testId, setTestId] = useState(() => {
    if (resumeTestId) {
      // 마이페이지에서 이어하기 클릭한 경우, 전달된 testId 사용
      console.log('[MbtiTestPage] Resume testId from URL:', resumeTestId);
      return resumeTestId;
    }
    // 새로 시작하는 경우, 새로운 testId 생성
    const newTestId = generateTestId(pathname || '/tests/mbti') + '_' + Date.now();
    console.log('[MbtiTestPage] New testId generated:', newTestId);
    return newTestId;
  });
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [hasResumeData, setHasResumeData] = useState(false);
  const [testComponentKey, setTestComponentKey] = useState(0);
  const [savedAnswers, setSavedAnswers] = useState<any>(null);
  
  // 저장된 currentQuestion과 전체 진행 상태를 관리
  const [savedCurrentQuestion, setSavedCurrentQuestion] = useState<number | undefined>(undefined);
  
  // 개인용 MBTI 검사 단계 관리 (전문가용과 동일한 구조)
  const [currentStep, setCurrentStep] = useState<'code' | 'info' | 'test'>('code');
  const [codeData, setCodeData] = useState<{ groupCode: string; groupPassword: string } | null>(null);
  const [clientInfo, setClientInfo] = useState<any>(null);
  
    // URL 파라미터 변경 시 testId 업데이트 (마이페이지에서 이어하기 클릭 시)
    useEffect(() => {
      const urlResumeTestId = searchParams.get('resume');
      if (urlResumeTestId && urlResumeTestId !== testId) {
        console.log('[MbtiTestPage] Updating testId from URL parameter:', urlResumeTestId);
        setTestId(urlResumeTestId);
        // URL 파라미터에서 온 경우에도 이어하기 다이얼로그를 표시
        const savedProgress = loadTestProgress(urlResumeTestId);
        if (savedProgress) {
          // 저장된 단계 정보 복원
          if (savedProgress.currentStep === 'code') {
            setCurrentStep('code');
          } else if (savedProgress.currentStep === 'info') {
            setCurrentStep('info');
            if (savedProgress.codeData) setCodeData(savedProgress.codeData);
          } else if (savedProgress.answers && Object.keys(savedProgress.answers).length > 0) {
            // 테스트 단계인 경우 이어하기 팝업 표시
            setHasResumeData(true);
            setShowResumeDialog(true);
            setSavedAnswers(savedProgress.answers);
            // 저장된 currentQuestion 사용
            const savedCurrent = savedProgress.currentQuestion !== undefined 
              ? savedProgress.currentQuestion 
              : (Object.keys(savedProgress.answers || {}).length > 0
                  ? Math.max(...Object.keys(savedProgress.answers).map(k => parseInt(k) || 0)) + 1
                  : 0);
            setSavedCurrentQuestion(savedCurrent);
            if (savedProgress.codeData) setCodeData(savedProgress.codeData);
            if (savedProgress.clientInfo) setClientInfo(savedProgress.clientInfo);
          } else {
            // 단계 정보만 있고 답변이 없는 경우
            if (savedProgress.currentStep) setCurrentStep(savedProgress.currentStep as any);
            if (savedProgress.codeData) setCodeData(savedProgress.codeData);
            if (savedProgress.clientInfo) setClientInfo(savedProgress.clientInfo);
          }
        }
      }
    }, [searchParams]);
  
  // 저장된 진행 상태 확인
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // URL 파라미터로 resume이 전달된 경우는 이미 처리했으므로 건너뜀
    const urlResumeTestId = searchParams.get('resume');
    if (urlResumeTestId && urlResumeTestId === testId) {
      // URL 파라미터에서 온 경우 이미 처리됨
      return;
    }
    
    // 전역 정리는 호출하지 않음 - getInProgressTests에서만 수행
    // 특정 testId만 확인하여 중복 호출 방지
    const savedProgress = loadTestProgress(testId);
    const show = shouldShowResumeDialog(testId);
    
    if (show && savedProgress) {
      // 저장된 단계 정보 복원
      if (savedProgress.currentStep === 'code') {
        setCurrentStep('code');
      } else if (savedProgress.currentStep === 'info') {
        setCurrentStep('info');
        if (savedProgress.codeData) setCodeData(savedProgress.codeData);
      } else if (savedProgress.answers && Object.keys(savedProgress.answers).length > 0) {
        // 테스트 단계인 경우 이어하기 팝업 표시
        setHasResumeData(true);
        setShowResumeDialog(true);
        setSavedAnswers(savedProgress.answers || {});
        // 저장된 currentQuestion 설정
        const savedCurrent = savedProgress.currentQuestion !== undefined 
          ? savedProgress.currentQuestion 
          : (Object.keys(savedProgress.answers || {}).length > 0
              ? Math.max(...Object.keys(savedProgress.answers || {}).map(k => parseInt(k) || 0)) + 1
              : 0);
        setSavedCurrentQuestion(savedCurrent);
        if (savedProgress.codeData) setCodeData(savedProgress.codeData);
        if (savedProgress.clientInfo) setClientInfo(savedProgress.clientInfo);
      } else {
        // 단계 정보만 있고 답변이 없는 경우
        if (savedProgress.currentStep) setCurrentStep(savedProgress.currentStep as any);
        if (savedProgress.codeData) setCodeData(savedProgress.codeData);
        if (savedProgress.clientInfo) setClientInfo(savedProgress.clientInfo);
      }
    } else {
      // 이어하기 데이터가 없으면 상태 초기화 (단, 현재 단계가 code가 아닌 경우에만)
      if (currentStep !== 'code') {
        setHasResumeData(false);
        setShowResumeDialog(false);
        setSavedAnswers(null);
        setSavedCurrentQuestion(undefined);
      }
    }
  }, [testId, searchParams]);

  // 검사코드 입력 핸들러
  const handleCodeSubmit = (codeData: { groupCode: string; groupPassword: string }) => {
    console.log('[MbtiTestPage] 검사코드 제출:', codeData);
    setCodeData(codeData);
    setCurrentStep('info');
    
    // 진행 상태 저장
    saveTestProgress({
      testId,
      testName: '개인용 MBTI 검사',
      answers: {},
      currentStep: 'info',
      codeData: codeData,
      timestamp: Date.now(),
      testType: 'MBTI',
      totalQuestions: 20
    });
  };

  // 기본정보 제출 핸들러
  const handleClientInfoSubmit = (info: any) => {
    console.log('[MbtiTestPage] 기본정보 제출:', info);
    setClientInfo(info);
    setCurrentStep('test');
    
    // 진행 상태 저장
    saveTestProgress({
      testId,
      testName: '개인용 MBTI 검사',
      answers: {},
      currentStep: 'test',
      codeData: codeData,
      clientInfo: info,
      timestamp: Date.now(),
      testType: 'MBTI',
      totalQuestions: 20
    });
  };

  // 이어하기
  const handleResumeTest = () => {
    setShowResumeDialog(false);
    const savedProgress = loadTestProgress(testId);
    
    // 저장된 단계 정보 복원
    if (savedProgress) {
      if (savedProgress.currentStep === 'code') {
        setCurrentStep('code');
      } else if (savedProgress.currentStep === 'info') {
        setCurrentStep('info');
        if (savedProgress.codeData) setCodeData(savedProgress.codeData);
      } else {
        setCurrentStep('test');
        if (savedProgress.codeData) setCodeData(savedProgress.codeData);
        if (savedProgress.clientInfo) setClientInfo(savedProgress.clientInfo);
      }
    } else {
      setCurrentStep('test');
    }
    
    // MBTITest 컴포넌트에 저장된 답변 전달
    setTestComponentKey(prev => prev + 1);
  };

  // 새로 시작 - 완전히 새로운 testId 생성하여 이전 진행 상태와 완전히 분리
  const handleStartNew = () => {
    // 1. 현재 testId의 진행 상태 완전 삭제
    clearTestProgress(testId);
    
    // 2. 완전히 새로운 testId 생성 (타임스탬프 포함)
    const newTestId = generateTestId(pathname || '/tests/mbti') + '_' + Date.now();
    setTestId(newTestId);
    
    // 3. 모든 상태 초기화
    setSavedAnswers(null);
    setShowResumeDialog(false);
    setHasResumeData(false);
    setCurrentStep('code');
    setCodeData(null);
    setClientInfo(null);
    
    // 4. 컴포넌트 강제 리셋
    setTestComponentKey(prev => prev + 1);
    
    // 5. localStorage에서 관련 데이터 모두 정리
    if (typeof window !== 'undefined') {
      // 이전 testId와 관련된 모든 키 삭제
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes(testId) || key.startsWith(`test_progress_${testId.split('_')[0]}`))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error(`키 삭제 실패: ${key}`, e);
        }
      });
      
      // 검사코드 데이터도 삭제
      localStorage.removeItem('mbti_pro_code_data');
      
      // 진행 목록에서도 정리 (선택적)
      // 주의: sweepAllInProgress는 모든 진행 상태를 정리하므로 신중하게 사용
      // getInProgressTests 호출 시 자동으로 정리되므로 여기서는 호출하지 않음
    }
  };

  const handleTestComplete = async (results: any) => {
    try {
      console.log('[MbtiTestPage] 검사 완료 처리 시작');
      
      // 테스트 코드 생성
      const testCode = generateTestCode('AMATEUR');
      
      // 현재 시간
      const timestamp = new Date().toISOString();
      
      // 결과 데이터 구성
      const testData = {
        testType: '개인용 MBTI 검사',
        code: testCode,
        timestamp: timestamp,
        answers: results,
        mbtiType: results.mbtiType || 'INTJ', // 기본값 설정
        status: '완료', // 명시적으로 완료 상태 설정
        userData: {
          name: clientInfo?.name || '게스트 사용자',
          email: 'guest@example.com',
          testType: '개인용 MBTI 검사',
          clientInfo: clientInfo || {}
        }
      };
      
      // 로컬 스토리지에 결과 저장
      if (typeof window !== 'undefined') {
        // 기존 테스트 기록 가져오기
        const existingRecords = localStorage.getItem('test_records');
        let records = existingRecords ? JSON.parse(existingRecords) : [];
        
        // 새 기록 추가
        records.push(testData);
        
        // 최대 50개까지만 유지
        if (records.length > 50) {
          records = records.slice(-50);
        }
        
        // 저장
        localStorage.setItem('test_records', JSON.stringify(records));
        localStorage.setItem(`test-result-${testCode}`, JSON.stringify(testData));
        
        console.log('[MbtiTestPage] 로컬 스토리지에 결과 저장 완료:', testCode);
      }
      
      // 검사 완료 시 진행 상태 삭제
      clearTestProgress(testId);
      
      // 결과 페이지로 이동
      const resultPath = `/results/mbti?code=${encodeURIComponent(testCode)}&type=${encodeURIComponent(results.mbtiType || 'INTJ')}`;
      router.push(resultPath);
      
    } catch (error) {
      console.error('[MbtiTestPage] 검사 완료 처리 중 오류:', error);
      
      // 사용자에게 친화적인 에러 메시지 표시
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      alert(`검사 결과 처리 중 문제가 발생했습니다: ${errorMessage}\n\n마이페이지에서 검사 기록을 확인해주세요.`);
      
      // 에러 발생 시 마이페이지로 이동
      router.push('/mypage?tab=records');
    }
  };

  // 이어하기 다이얼로그
  if (showResumeDialog && hasResumeData) {
    const savedProgress = loadTestProgress(testId);
    const answeredCount = Object.keys(savedProgress?.answers || {}).length;
    const totalQuestions = 20; // MBTI 질문 수 (실제 문항수)
    
    return (
      <div className="min-h-screen bg-emerald-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-900/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 max-w-md w-full border border-emerald-700"
        >
          <h2 className="text-2xl font-bold text-white mb-4 text-center">이어하기</h2>
          <p className="text-emerald-200 mb-6 text-center">
            진행 중이던 검사를 발견했습니다. 이어서 계속하시겠습니까?
          </p>
          <div className="bg-emerald-800/50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-emerald-200 text-sm">진행률</span>
              <span className="text-emerald-300 font-semibold">{Math.round((answeredCount / totalQuestions) * 100)}%</span>
            </div>
            <div className="w-full bg-emerald-900 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.round((answeredCount / totalQuestions) * 100)}%` }}
              />
            </div>
            <p className="text-emerald-300/80 text-xs mt-2 text-center">
              {answeredCount}개 문항 완료 / 전체 {totalQuestions}개
            </p>
          </div>
          <div className="flex gap-3">
            <motion.button
              onClick={handleStartNew}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-4 py-3 bg-gray-700/60 text-gray-200 font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              새로 시작
            </motion.button>
            <motion.button
              onClick={handleResumeTest}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-4 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              이어서 계속
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // 단계별 렌더링
  return (
    <>
      <Navigation />
      
      <div className="bg-emerald-950 min-h-screen">
        {currentStep === 'code' && (
          <MbtiProCodeInput
            onSubmit={handleCodeSubmit}
            initialData={codeData}
          />
        )}
        
        {currentStep === 'info' && (
          <MbtiProClientInfo
            onSubmit={handleClientInfoSubmit}
            isPersonalTest={true}
            initialData={clientInfo}
            onBack={() => setCurrentStep('code')}
          />
        )}
        
        {currentStep === 'test' && (
          <MBTITestWrapper 
            key={testComponentKey}
            onComplete={handleTestComplete}
            testId={testId}
            savedAnswers={savedAnswers}
            savedCurrentQuestion={savedCurrentQuestion}
            codeData={codeData}
            clientInfo={clientInfo}
            onStepChange={setCurrentStep}
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
  onStepChange
}: { 
  onComplete: (results: any) => void;
  testId: string;
  savedAnswers?: any;
  savedCurrentQuestion?: number;
  codeData?: any;
  clientInfo?: any;
  onStepChange?: (step: 'code' | 'info' | 'test') => void;
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
  };

  // 답변 변경 시 자동 저장
  useEffect(() => {
    if (Object.keys(trackedAnswers).length > 0) {
      saveTestProgress({
        testId,
        testName: '개인용 MBTI 검사',
        answers: trackedAnswers,
        currentQuestion: trackedCurrentQuestion,
        currentStep: 'test',
        codeData: codeData,
        clientInfo: clientInfo,
        timestamp: Date.now(),
        testType: 'MBTI',
        totalQuestions: 20
      });
    }
  }, [trackedAnswers, trackedCurrentQuestion, testId, codeData, clientInfo]);

  // 페이지 이탈 시 저장
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (Object.keys(trackedAnswers).length > 0) {
        saveTestProgress({
          testId,
          testName: '개인용 MBTI 검사',
          answers: trackedAnswers,
          currentQuestion: trackedCurrentQuestion,
          timestamp: Date.now(),
          testType: 'MBTI',
          totalQuestions: 20
        });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [trackedAnswers, trackedCurrentQuestion, testId]);

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
    />
  );
}

// Suspense로 감싼 export default 컴포넌트
export default function MbtiTestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-emerald-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-emerald-200 text-lg">로딩 중...</p>
        </div>
      </div>
    }>
      <MbtiTestPageContent />
    </Suspense>
  );
} 