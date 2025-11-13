'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Navigation from '@/components/Navigation';
import MBTITest from '@/components/tests/MBTITest';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { generateTestCode } from '@/utils/testCodeGenerator';
import { saveTestProgress, loadTestProgress, clearTestProgress, generateTestId, shouldShowResumeDialog, getInProgressTests } from '@/utils/testResume';
import { motion } from 'framer-motion';
import MbtiProCodeInput from '@/components/tests/MbtiProCodeInput';
import MbtiProClientInfo from '@/components/tests/MbtiProClientInfo';

function MbtiTestPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // URL에서 resume 파라미터로 전달된 testId 확인 (마이페이지에서 이어하기 클릭 시)
  const resumeTestId = searchParams.get('resume');
  
  // testId를 상태로 관리: resume 파라미터가 있으면 사용, 없으면 고정된 testId 사용 (다른 검사들과 동일하게)
  const [testId, setTestId] = useState(() => {
    try {
      if (resumeTestId) {
        // 마이페이지에서 이어하기 클릭한 경우, 전달된 testId 사용
        console.log('[MbtiTestPage] Resume testId from URL:', resumeTestId);
        return resumeTestId;
      }
      // 새로 시작하는 경우, 고정된 testId 사용 (다른 검사들과 동일하게)
      const fixedTestId = generateTestId(pathname || '/tests/mbti');
      console.log('[MbtiTestPage] Fixed testId:', fixedTestId);
      return fixedTestId;
    } catch (error) {
      console.warn('[MbtiTestPage] testId 초기화 에러:', error);
      // 에러 발생 시 기본값 사용
      return 'mbti-test-default';
    }
  });
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [hasResumeData, setHasResumeData] = useState(false);
  
  // 개인용 MBTI 검사 단계 관리 (전문가용과 동일한 구조)
  // 초기 상태에서 resume 파라미터가 있으면 진행 상태에 따라 currentStep 설정
  const getInitialStep = (): 'code' | 'info' | 'test' => {
    // 서버 사이드에서는 항상 'code'로 시작
    if (typeof window === 'undefined') return 'code';
    
    // 클라이언트 사이드에서만 저장된 진행 상태 확인
    if (!resumeTestId) return 'code';
    
    try {
      const savedProgress = loadTestProgress(resumeTestId);
      if (savedProgress) {
        if (savedProgress.currentStep && 
            (savedProgress.currentStep === 'code' || savedProgress.currentStep === 'info' || savedProgress.currentStep === 'test')) {
          return savedProgress.currentStep;
        } else if (savedProgress.answers && Object.keys(savedProgress.answers).length > 0) {
          return 'test';
        } else if (savedProgress.clientInfo) {
          return 'info';
        }
      }
    } catch (error) {
      console.warn('[MbtiTestPage] getInitialStep 에러:', error);
    }
    
    return 'code';
  };
  
  // 초기 상태에서 resume 파라미터가 있으면 진행 상태 복원
  const getInitialProgress = () => {
    if (typeof window === 'undefined' || !resumeTestId) {
      return { codeData: null, clientInfo: null, savedAnswers: null, savedCurrentQuestion: undefined };
    }
    const savedProgress = loadTestProgress(resumeTestId);
    if (savedProgress) {
      const savedCurrent = savedProgress.currentQuestion !== undefined 
        ? savedProgress.currentQuestion 
        : (savedProgress.answers && Object.keys(savedProgress.answers).length > 0
            ? Math.max(...Object.keys(savedProgress.answers).map(k => parseInt(k) || 0)) + 1
            : 0);
      return {
        codeData: savedProgress.codeData || null,
        clientInfo: savedProgress.clientInfo || null,
        savedAnswers: savedProgress.answers || null,
        savedCurrentQuestion: savedCurrent
      };
    }
    return { codeData: null, clientInfo: null, savedAnswers: null, savedCurrentQuestion: undefined };
  };
  
  const initialProgress = getInitialProgress();
  const [currentStep, setCurrentStep] = useState<'code' | 'info' | 'test'>(getInitialStep());
  
  // currentStep 변경 시 sessionStorage에 저장 (Navigation에서 말풍선 표시 여부 판단용)
  // 코드입력, 정보입력, 질문 답변 단계에서는 말풍선 숨김
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (currentStep === 'code' || currentStep === 'info' || currentStep === 'test') {
        sessionStorage.setItem('currentTestStep', currentStep);
      } else {
        sessionStorage.removeItem('currentTestStep');
      }
    }
  }, [currentStep]);
  const [codeData, setCodeData] = useState<{ groupCode: string; groupPassword: string } | null>(initialProgress.codeData);
  const [clientInfo, setClientInfo] = useState<any>(initialProgress.clientInfo);
  const [savedAnswers, setSavedAnswers] = useState<any>(initialProgress.savedAnswers);
  const [savedCurrentQuestion, setSavedCurrentQuestion] = useState<number | undefined>(initialProgress.savedCurrentQuestion);
  // 초기 상태에서 resume 파라미터가 있고 답변이 있으면 testComponentKey 설정
  const [testComponentKey, setTestComponentKey] = useState(() => {
    try {
      if (initialProgress.savedAnswers && Object.keys(initialProgress.savedAnswers).length > 0) {
        return 1; // 초기화 시 답변이 있으면 컴포넌트 리렌더링을 위해 1로 설정
      }
    } catch (error) {
      console.warn('[MbtiTestPage] testComponentKey 초기화 에러:', error);
    }
    return 0;
  });
  
  // 검사 완료 처리 중복 방지 플래그
  const [isCompleting, setIsCompleting] = useState(false);
  
    // URL 파라미터 변경 시 testId 업데이트 (마이페이지에서 이어하기 클릭 시)
    useEffect(() => {
      const urlResumeTestId = searchParams.get('resume');
      if (urlResumeTestId && urlResumeTestId !== testId) {
        console.log('[MbtiTestPage] Updating testId from URL parameter:', urlResumeTestId);
        
        // 마이페이지에서 resume 파라미터로 왔을 경우 이미 팝업을 봤으므로 바로 진행 상태 복원
        const savedProgress = loadTestProgress(urlResumeTestId);
        if (savedProgress) {
          // currentStep을 먼저 복원 (중요!) - testId 변경 전에 설정
          if (savedProgress.currentStep) {
            if (typeof savedProgress.currentStep === 'string' && 
                (savedProgress.currentStep === 'code' || savedProgress.currentStep === 'info' || savedProgress.currentStep === 'test')) {
              setCurrentStep(savedProgress.currentStep);
              console.log('[MbtiTestPage] 저장된 currentStep으로 복원:', savedProgress.currentStep);
            }
          } else {
            // currentStep이 없으면 답변 상태에 따라 결정
            if (savedProgress.answers && Object.keys(savedProgress.answers).length > 0) {
              setCurrentStep('test');
              console.log('[MbtiTestPage] 답변이 있어 test 단계로 설정');
            } else if (savedProgress.clientInfo) {
              setCurrentStep('info');
              console.log('[MbtiTestPage] clientInfo가 있어 info 단계로 설정');
            } else {
              setCurrentStep('code');
              console.log('[MbtiTestPage] 기본값으로 code 단계 설정');
            }
          }
          
          // 다른 상태들도 복원
          if (savedProgress.answers && Object.keys(savedProgress.answers).length > 0) {
            setSavedAnswers(savedProgress.answers);
            const savedCurrent = savedProgress.currentQuestion !== undefined 
              ? savedProgress.currentQuestion 
              : (Object.keys(savedProgress.answers || {}).length > 0
                  ? Math.max(...Object.keys(savedProgress.answers).map(k => parseInt(k) || 0)) + 1
                  : 0);
            setSavedCurrentQuestion(savedCurrent);
            setTestComponentKey(prev => prev + 1);
          }
          if (savedProgress.codeData) setCodeData(savedProgress.codeData);
          if (savedProgress.clientInfo) setClientInfo(savedProgress.clientInfo);
          
          // testId는 마지막에 설정 (다른 상태들이 먼저 설정되도록)
          setTestId(urlResumeTestId);
        } else {
          // 진행 상태가 없어도 testId는 설정
          setTestId(urlResumeTestId);
        }
        // resume 파라미터가 있으면 팝업 표시하지 않고 바로 진행
        return;
      }
    }, [searchParams, testId]);
  
  // 저장된 진행 상태 확인
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // URL 파라미터로 resume이 전달된 경우는 이미 처리했으므로 건너뜀 (팝업 표시하지 않음)
    const urlResumeTestId = searchParams.get('resume');
    if (urlResumeTestId) {
      // URL 파라미터에서 온 경우 이미 처리됨 (팝업 표시하지 않음)
      return;
    }
    
    // 개인용 MBTI 검사 진행 중인 검사 찾기 (모든 testId 확인)
    const inProgressTests = getInProgressTests();
    const mbtiTest = inProgressTests.find(test => {
      const testType = (test.testType || '').toLowerCase();
      return testType.includes('mbti') && !testType.includes('pro') && !testType.includes('전문가');
    });
    
    if (mbtiTest && mbtiTest.testId !== testId) {
      // 진행 중인 개인용 MBTI 검사 발견 (testId가 다른 경우만 업데이트)
      const savedProgress = loadTestProgress(mbtiTest.testId);
      if (savedProgress) {
        // testId를 발견된 진행 중인 검사의 testId로 업데이트
        setTestId(mbtiTest.testId);
        
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
      }
    } else {
      // 진행 중인 개인용 MBTI 검사가 없으면 고정된 testId로 확인
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
    }
  }, [testId, searchParams]);

  // 검사코드 입력 핸들러
  const handleCodeSubmit = (codeData: { groupCode: string; groupPassword: string }) => {
    console.log('[MbtiTestPage] 검사코드 제출:', codeData);
    setCodeData(codeData);
    
    // 진행 상태 저장 (전문가용과 동일)
    const savedProgress = loadTestProgress(testId);
    saveTestProgress({
      testId,
      testName: '개인용 MBTI 검사',
      answers: savedProgress?.answers || {},
      currentQuestion: savedProgress?.currentQuestion || 0,
      currentStep: 'info',
      codeData: codeData,
      clientInfo: savedProgress?.clientInfo || null,
      timestamp: Date.now(),
      testType: 'MBTI',
      totalQuestions: 20
    });
    
    // 저장된 진행 상태에서 최신 답변 가져오기
    const latestAnswers = savedProgress?.answers || savedAnswers || {};
    
    setCurrentStep('info');
    
    // 진행 상태 저장 (기존 답변 유지)
    saveTestProgress({
      testId,
      testName: '개인용 MBTI 검사',
      answers: latestAnswers, // 기존 답변 유지
      currentQuestion: savedProgress?.currentQuestion || savedCurrentQuestion || 0,
      currentStep: 'info',
      codeData: codeData,
      clientInfo: clientInfo, // 기존 clientInfo 유지
      timestamp: Date.now(),
      testType: 'MBTI',
      totalQuestions: 20
    });
  };

  // 기본정보 제출 핸들러
  const handleClientInfoSubmit = (info: any) => {
    console.log('[MbtiTestPage] 기본정보 제출:', info);
    setClientInfo(info);
    
    // 진행 상태 저장 (전문가용과 동일)
    const savedProgress = loadTestProgress(testId);
    saveTestProgress({
      testId,
      testName: '개인용 MBTI 검사',
      answers: savedProgress?.answers || {},
      currentQuestion: savedProgress?.currentQuestion || 0,
      currentStep: 'test',
      codeData: codeData,
      clientInfo: info,
      timestamp: Date.now(),
      testType: 'MBTI',
      totalQuestions: 20
    });
    
    // 저장된 진행 상태에서 최신 답변 가져오기
    const latestAnswers = savedProgress?.answers || savedAnswers || {};
    
    setCurrentStep('test');
    
    // 진행 상태 저장 (기존 답변 유지)
    saveTestProgress({
      testId,
      testName: '개인용 MBTI 검사',
      answers: latestAnswers, // 기존 답변 유지
      currentQuestion: savedProgress?.currentQuestion || savedCurrentQuestion || 0,
      currentStep: 'test',
      codeData: codeData,
      clientInfo: info,
      timestamp: Date.now(),
      testType: 'MBTI',
      totalQuestions: 20
    });
  };

  // 이전 단계로 돌아가기 핸들러들
  const handleBackFromInfo = (currentClientInfo: any) => {
    // 기본정보 입력에서 코드 입력으로 돌아가기
    console.log('[MbtiTestPage] 기본정보 -> 코드 입력으로 이동');
    
    // 저장된 진행 상태에서 최신 데이터 가져오기
    const savedProgress = loadTestProgress(testId);
    
    // 현재 입력된 정보를 상태에 저장
    const updatedClientInfo = currentClientInfo ? { ...currentClientInfo } : null;
    setClientInfo(updatedClientInfo);
    
    // 저장된 codeData 복원 (이전에 입력한 값 유지)
    const restoredCodeData = savedProgress?.codeData || codeData;
    console.log('[MbtiTestPage] 복원할 codeData:', restoredCodeData);
    
    // 상태 업데이트 (강제로 새로운 객체 생성)
    setCodeData(restoredCodeData ? { ...restoredCodeData } : null);
    
    // 현재 상태 저장 (clientInfo와 codeData 모두 유지)
    saveTestProgress({
      testId,
      testName: '개인용 MBTI 검사',
      answers: savedProgress?.answers || {},
      currentQuestion: savedProgress?.currentQuestion || 0,
      currentStep: 'code',
      codeData: restoredCodeData, // 저장된 값 우선 사용
      clientInfo: updatedClientInfo, // 현재 입력된 정보 유지
      timestamp: Date.now(),
      testType: 'MBTI',
      totalQuestions: 20
    });
    
    setCurrentStep('code');
  };

  const handleBackFromTest = () => {
    // 테스트에서 기본정보 입력으로 돌아가기
    console.log('[MbtiTestPage] 테스트 -> 기본정보 입력으로 이동');
    
    // 저장된 진행 상태에서 최신 데이터 가져오기 (MBTITestWrapper에서 자동 저장된 최신 값)
    const savedProgress = loadTestProgress(testId);
    const latestAnswers = savedProgress?.answers || savedAnswers || {};
    const latestCurrentQuestion = savedProgress?.currentQuestion || savedCurrentQuestion || 0;
    
    // 저장된 codeData와 clientInfo 복원 (이전에 입력한 값 유지)
    const restoredCodeData = savedProgress?.codeData || codeData;
    const restoredClientInfo = savedProgress?.clientInfo || clientInfo;
    
    console.log('[MbtiTestPage] 복원할 codeData:', restoredCodeData);
    console.log('[MbtiTestPage] 복원할 clientInfo:', restoredClientInfo);
    
    // 상태 업데이트 (강제로 새로운 객체 생성)
    setCodeData(restoredCodeData ? { ...restoredCodeData } : null);
    setClientInfo(restoredClientInfo ? { ...restoredClientInfo } : null);
    
    // 최신 답변을 상태에 반영
    setSavedAnswers(latestAnswers);
    setSavedCurrentQuestion(latestCurrentQuestion);
    
    // 현재 상태 저장 (최신 답변과 clientInfo 모두 유지)
    saveTestProgress({
      testId,
      testName: '개인용 MBTI 검사',
      answers: latestAnswers, // 최신 답변 사용
      currentQuestion: latestCurrentQuestion,
      currentStep: 'info',
      codeData: restoredCodeData, // 저장된 값 우선 사용
      clientInfo: restoredClientInfo, // 저장된 값 우선 사용
      timestamp: Date.now(),
      testType: 'MBTI',
      totalQuestions: 20
    });
    
    setCurrentStep('info');
  };

  // 이어하기
  const handleResumeTest = () => {
    setShowResumeDialog(false);
    const savedProgress = loadTestProgress(testId);
    
    console.log('[MbtiTestPage] handleResumeTest - savedProgress:', savedProgress);
    
    if (savedProgress) {
      // currentStep을 먼저 복원 (중요!)
      if (savedProgress.currentStep) {
        if (typeof savedProgress.currentStep === 'string' && 
            (savedProgress.currentStep === 'code' || savedProgress.currentStep === 'info' || savedProgress.currentStep === 'test')) {
          setCurrentStep(savedProgress.currentStep);
          console.log('[MbtiTestPage] handleResumeTest - currentStep 복원:', savedProgress.currentStep);
        }
      } else {
        // currentStep이 없으면 상태에 따라 결정
        if (savedProgress.answers && Object.keys(savedProgress.answers).length > 0) {
          setCurrentStep('test');
          console.log('[MbtiTestPage] handleResumeTest - 답변이 있어 test 단계로 설정');
        } else if (savedProgress.clientInfo) {
          setCurrentStep('info');
          console.log('[MbtiTestPage] handleResumeTest - clientInfo가 있어 info 단계로 설정');
        } else {
          setCurrentStep('code');
          console.log('[MbtiTestPage] handleResumeTest - 기본값으로 code 단계 설정');
        }
      }
      
      // 저장된 답변이 있으면 테스트 단계로 이동 (currentStep이 이미 설정되었으므로 덮어쓰지 않음)
      if (savedProgress.answers && Object.keys(savedProgress.answers).length > 0) {
        // currentStep이 'test'가 아니면 'test'로 설정
        if (savedProgress.currentStep !== 'test') {
          setCurrentStep('test');
        }
        if (savedProgress.codeData) setCodeData(savedProgress.codeData);
        if (savedProgress.clientInfo) setClientInfo(savedProgress.clientInfo);
        // 저장된 답변과 질문 번호 복원
        setSavedAnswers(savedProgress.answers);
        const savedCurrent = savedProgress.currentQuestion !== undefined 
          ? savedProgress.currentQuestion 
          : (Object.keys(savedProgress.answers || {}).length > 0
              ? Math.max(...Object.keys(savedProgress.answers).map(k => parseInt(k) || 0)) + 1
              : 0);
        setSavedCurrentQuestion(savedCurrent);
        setTestComponentKey(prev => prev + 1);
      } else {
        // 답변이 없으면 저장된 단계 정보를 사용 (이미 위에서 설정됨)
        if (savedProgress.codeData) setCodeData(savedProgress.codeData);
        if (savedProgress.clientInfo) setClientInfo(savedProgress.clientInfo);
      }
    }
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
    // 중복 실행 방지
    if (isCompleting) {
      console.log('[MbtiTestPage] 검사 완료 처리 이미 진행 중, 중복 호출 무시');
      return;
    }
    
    try {
      setIsCompleting(true);
      console.log('[MbtiTestPage] 검사 완료 처리 시작');
      
      // 테스트 코드 생성
      const testCode = generateTestCode('AMATEUR');
      
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
          testType: '개인용 MBTI 검사',
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
            testType: '개인용 MBTI 검사',
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
            testType: '개인용 MBTI 검사',
            timestamp: timestamp,
            counselorCode: counselorCode,
            userData: testData.userData,
            result: {
              code: testCode,
              timestamp: timestamp,
              testType: '개인용 MBTI 검사',
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
          testType: '개인용 MBTI 검사',
          code: testCode,
          counselorCode: counselorCode,
          timestamp: timestamp,
          answers: results,
          mbtiType: results.mbtiType || 'INTJ',
          status: '완료',
          userData: {
            name: clientInfo?.name || '게스트 사용자',
            email: 'guest@example.com',
            testType: '개인용 MBTI 검사',
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
        sessionStorage.removeItem('currentTestStep');
      }
      
      // 결과 페이지로 이동 (검사 완료 직후임을 표시하는 파라미터 추가)
      const resultPath = `/results/mbti?code=${encodeURIComponent(testCode)}&type=${encodeURIComponent(results.mbtiType || 'INTJ')}&from=completion`;
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

  // 이어하기 다이얼로그
  if (showResumeDialog) {
    const savedProgress = loadTestProgress(testId);
    const answeredCount = savedProgress ? Object.keys(savedProgress.answers || {}).length : 0;
    const totalQuestions = 20; // MBTI 질문 수 (실제 문항수)
    const actualHasResumeData = savedProgress && Object.keys(savedProgress.answers || {}).length > 0;
    
    return (
      <div className="min-h-screen bg-emerald-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-900/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 max-w-md w-full border border-emerald-700"
        >
          <h2 className="text-2xl font-bold text-white mb-4 text-center">이어하기</h2>
          <p className="text-emerald-200 mb-6 text-center">
            {actualHasResumeData 
              ? '진행 중이던 검사를 발견했습니다. 이어서 계속하시겠습니까?'
              : '검사를 새로 시작하시겠습니까?'}
          </p>
          {actualHasResumeData && (
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
          )}
          <div className="flex gap-3">
            {actualHasResumeData && (
              <>
                <motion.button
                  onClick={handleStartNew}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-3 bg-gray-700/60 text-gray-200 font-medium rounded-lg hover:bg-gray-700 transition-colors"
                >
                  처음부터 시작
                </motion.button>
                <motion.button
                  onClick={handleResumeTest}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  이어서 계속
                </motion.button>
              </>
            )}
            {!actualHasResumeData && (
              <motion.button
                onClick={handleStartNew}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-4 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
              >
                새로 시작
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // currentStep 변경 시 저장된 진행 상태에서 codeData와 clientInfo 복원
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedProgress = loadTestProgress(testId);
    if (savedProgress) {
      // codeData 복원 (항상 저장된 값으로 덮어쓰기)
      if (savedProgress.codeData) {
        setCodeData(savedProgress.codeData);
        console.log('[MbtiTestPage] useEffect - 저장된 codeData 복원:', savedProgress.codeData);
      }
      // clientInfo 복원 (항상 저장된 값으로 덮어쓰기)
      if (savedProgress.clientInfo) {
        setClientInfo(savedProgress.clientInfo);
        console.log('[MbtiTestPage] useEffect - 저장된 clientInfo 복원:', savedProgress.clientInfo);
      }
    }
  }, [currentStep, testId]); // currentStep이 변경될 때마다 실행

  // 검사 진행 상태 자동 저장 (전문가용과 동일)
  useEffect(() => {
    if (currentStep === 'test' && Object.keys(savedAnswers || {}).length > 0) {
      saveTestProgress({
        testId,
        testName: '개인용 MBTI 검사',
        answers: savedAnswers,
        currentQuestion: savedCurrentQuestion || 0,
        currentStep,
        clientInfo,
        codeData,
        timestamp: Date.now(),
        testType: 'MBTI',
        totalQuestions: 20
      });
    }
  }, [savedAnswers, savedCurrentQuestion, currentStep, clientInfo, codeData, testId]);

  // 페이지를 벗어날 때 진행 상태 저장 (전문가용과 동일)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (typeof window !== 'undefined' && currentStep === 'test' && Object.keys(savedAnswers || {}).length > 0) {
        saveTestProgress({
          testId,
          testName: '개인용 MBTI 검사',
          answers: savedAnswers,
          currentQuestion: savedCurrentQuestion || 0,
          currentStep,
          clientInfo,
          codeData,
          timestamp: Date.now(),
          testType: 'MBTI',
          totalQuestions: 20
        });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [savedAnswers, savedCurrentQuestion, currentStep, clientInfo, codeData, testId]);

  // 단계별 렌더링
  return (
    <>
      {currentStep !== 'code' && <Navigation />}
      
      <div className="bg-emerald-950 min-h-screen">
        {currentStep === 'code' && (
          <MbtiProCodeInput
            key={`code-${testId}-${codeData ? `${codeData.groupCode || 'empty'}-${codeData.groupPassword || 'empty'}` : 'null'}`}
            onSubmit={handleCodeSubmit}
            initialData={codeData}
            isPersonalTest={true}
          />
        )}
        
        {currentStep === 'info' && (
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
            onComplete={handleTestComplete}
            testId={testId}
            savedAnswers={savedAnswers}
            savedCurrentQuestion={savedCurrentQuestion}
            codeData={codeData}
            clientInfo={clientInfo}
            onStepChange={setCurrentStep}
            onBack={handleBackFromTest}
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
  onAnswersUpdate
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
      onBack={handleBack}
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