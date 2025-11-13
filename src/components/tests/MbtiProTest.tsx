'use client';

import { useState, useEffect } from 'react';
import { questions } from '@/data/mbtiProQuestions';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import MbtiProClientInfo, { ClientInfo } from './MbtiProClientInfo';
import MbtiProCodeInput from './MbtiProCodeInput';
import Navigation from '@/components/Navigation';
import { generateTestCode } from '@/utils/testCodeGenerator';
import { saveTestProgress, loadTestProgress, clearTestProgress, generateTestId } from '@/utils/testResume';
import { initializeFirebase, auth } from '@/lib/firebase';
import { testResults } from '@/utils/firebaseIntegration';

interface Answer {
  [key: string]: number;
}

interface Question {
  number: number;
  text: string;
  baseScore: number;
  codeScore: number;
  direction: string;
  type: string;
  category: string;
  subCategory: string;
  relatedType: string;
  note?: string;
}

interface MbtiProTestProps {
  isLoggedIn: boolean;
}

export default function MbtiProTest({ isLoggedIn }: MbtiProTestProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer>({});
  const [isMouseMoved, setIsMouseMoved] = useState(false);
  const [direction, setDirection] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [popupPosition, setPopupPosition] = useState<'bottom' | 'up'>('bottom');
  const [mouseIdleTimer, setMouseIdleTimer] = useState<NodeJS.Timeout | null>(null);
  
  // 검사 단계 상태 추가
  const [currentStep, setCurrentStep] = useState<'code' | 'info' | 'test'>('code');
  
  // currentStep 변경 시 sessionStorage에 저장 (Navigation에서 말풍선 표시 여부 판단용)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 코드입력, 정보입력, 문항선택(selectedQuestions.length === 0), 질문 답변 단계에서는 말풍선 숨김
      if (currentStep === 'code' || currentStep === 'info' || currentStep === 'test') {
        sessionStorage.setItem('currentTestStep', currentStep);
      } else {
        sessionStorage.removeItem('currentTestStep');
      }
    }
  }, [currentStep, selectedQuestions.length]);
  const [codeData, setCodeData] = useState<{ groupCode: string; groupPassword: string } | null>(null);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [hasResumeData, setHasResumeData] = useState(false);
  const testId = generateTestId(pathname || '/tests/mbti_pro');

  // 컴포넌트 마운트 시 저장된 진행 상태 확인
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // 마이페이지에서 resume 파라미터로 왔을 경우 이미 팝업을 봤으므로 다시 표시하지 않음
    const resumeParam = searchParams.get('resume');
    if (resumeParam) {
      // resume 파라미터가 있으면 바로 진행 상태 복원
      const savedProgress = loadTestProgress(testId);
      if (savedProgress) {
        if (savedProgress.answers) setAnswers(savedProgress.answers);
        if (savedProgress.currentQuestion !== undefined) setCurrentQuestion(savedProgress.currentQuestion);
        if (savedProgress.currentStep) {
          if (typeof savedProgress.currentStep === 'string' && 
              (savedProgress.currentStep === 'code' || savedProgress.currentStep === 'info' || savedProgress.currentStep === 'test')) {
            setCurrentStep(savedProgress.currentStep);
          }
        }
        if (savedProgress.clientInfo) setClientInfo(savedProgress.clientInfo);
        if (savedProgress.codeData) setCodeData(savedProgress.codeData);
      }
      return; // 팝업 표시하지 않고 바로 진행
    }
    
    const savedProgress = loadTestProgress(testId);
    if (savedProgress && savedProgress.answers && Object.keys(savedProgress.answers).length > 0) {
      // 완료 여부 확인 (100% 진행률인 경우 제외)
      const answeredCount = Object.keys(savedProgress.answers || {}).length;
      const savedTotalQuestions = savedProgress.totalQuestions || 24; // MBTI Pro는 기본 24개 질문
      
      // 총 문항 수가 있고, 모든 문항이 완료되었으면 이어하기 표시하지 않음
      if (savedTotalQuestions > 0 && answeredCount >= savedTotalQuestions) {
        // 완료된 검사는 진행 상태 삭제
        clearTestProgress(testId);
        return;
      }
      
      setHasResumeData(true);
      setShowResumeDialog(true);
    }
  }, [testId, searchParams]);

  // 검사 진행 상태 자동 저장
  useEffect(() => {
    if (currentStep === 'test' && Object.keys(answers).length > 0) {
      saveTestProgress({
        testId,
        testName: '전문가용 MBTI 검사',
        answers,
        currentQuestion,
        currentStep,
        clientInfo,
        codeData,
        timestamp: Date.now(),
        testType: 'MBTI_PRO',
        totalQuestions: 24 // MBTI Pro 총 질문 수
      });
    }
  }, [answers, currentQuestion, currentStep, clientInfo, codeData, testId]);

  // 페이지를 벗어날 때 진행 상태 저장 (초기화 대신)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (typeof window !== 'undefined' && currentStep === 'test' && Object.keys(answers).length > 0) {
        saveTestProgress({
          testId,
          testName: '전문가용 MBTI 검사',
          answers,
          currentQuestion,
          currentStep,
          clientInfo,
          codeData,
          timestamp: Date.now(),
          testType: 'MBTI_PRO',
          totalQuestions: 24 // MBTI Pro 총 질문 수
        });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [answers, currentQuestion, currentStep, clientInfo, codeData, testId]);

  // 이어하기 기능: 저장된 진행 상태 복원
  const handleResumeTest = () => {
    const savedProgress = loadTestProgress(testId);
    if (savedProgress) {
      if (savedProgress.answers) setAnswers(savedProgress.answers);
      if (savedProgress.currentQuestion !== undefined) setCurrentQuestion(savedProgress.currentQuestion);
      if (savedProgress.currentStep) {
        // 타입 안전성 체크: string 타입인 경우에만 설정
        if (typeof savedProgress.currentStep === 'string' && 
            (savedProgress.currentStep === 'code' || savedProgress.currentStep === 'info' || savedProgress.currentStep === 'test')) {
          setCurrentStep(savedProgress.currentStep);
        }
      }
      if (savedProgress.clientInfo) setClientInfo(savedProgress.clientInfo);
      if (savedProgress.codeData) setCodeData(savedProgress.codeData);
      setShowResumeDialog(false);
    }
  };

  // 새로 시작하기
  const handleStartNew = () => {
    clearTestProgress(testId);
    setAnswers({});
    setCurrentQuestion(0);
    setCurrentStep('code');
    setCodeData(null);
    setClientInfo(null);
    setShowResumeDialog(false);
    setHasResumeData(false);
    
    // localStorage에서 검사코드 데이터 삭제
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mbti_pro_code_data');
      }
    } catch (e) {
      console.error('검사코드 데이터 삭제 오류:', e);
    }
  };

  // MBTI 유형 계산 함수
  const calculateMbtiType = (answers: Answer): string => {
    const scores = {
      E: 0, I: 0,
      S: 0, N: 0,
      T: 0, F: 0,
      J: 0, P: 0
    };
    
    // 각 답변에 대해 점수 계산
    Object.entries(answers).forEach(([questionIndex, answer]) => {
      const questionNum = parseInt(questionIndex);
      const question = selectedQuestions[questionNum];
      
      if (question) {
        const direction = question.direction as keyof typeof scores;
        scores[direction] += answer;
      }
    });
    
    // MBTI 유형 결정
    const type = [
      scores.E >= scores.I ? 'E' : 'I',
      scores.S >= scores.N ? 'S' : 'N',
      scores.T >= scores.F ? 'T' : 'F',
      scores.J >= scores.P ? 'J' : 'P'
    ].join('');
    
    return type;
  };

  // 검사코드 입력 핸들러
  const handleCodeSubmit = (codeData: { groupCode: string; groupPassword: string }) => {
    console.log('MbtiProTest - 검사코드 제출:', codeData);
    setCodeData(codeData);
    setCurrentStep('info');
  };

  // 클라이언트 정보 제출 핸들러 (기존 함수 수정)

  useEffect(() => {
    // clientInfo가 있을 때만 질문을 준비합니다
    if (!clientInfo) return;
    
    // 각 direction별로 3개씩 문항 선택 (총 24개)
    const directionCounts = {
      E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0
    };
    
    const selected: Question[] = [];
    
    for (const question of questions) {
      const dir = question.direction;
      if (directionCounts[dir as keyof typeof directionCounts] < 3) {
        selected.push(question);
        directionCounts[dir as keyof typeof directionCounts]++;
      }
      
      // 모든 direction에서 3개씩 선택했으면 종료
      if (Object.values(directionCounts).every(count => count === 3)) {
        break;
      }
    }
    
    setSelectedQuestions(selected);
  }, [clientInfo]); // clientInfo가 변경될 때 실행

  const totalQuestions = 24; // 총 질문 수는 24개 (각 방향별 3개씩)

  const handleClientInfoSubmit = (info: ClientInfo) => {
    console.log('MbtiProTest - 클라이언트 정보 제출 시작:', info);
    
    // 필수 정보 검증
    if (!info.birthYear || !info.gender || !info.maritalStatus || !info.privacyAgreed) {
      console.error('MbtiProTest - 필수 정보 누락:', {
        birthYear: info.birthYear,
        gender: info.gender,
        maritalStatus: info.maritalStatus,
        privacyAgreed: info.privacyAgreed
      });
      return;
    }
    
    // 검사코드 데이터와 클라이언트 정보를 결합
    const completeInfo: ClientInfo = {
      ...info,
      groupCode: codeData?.groupCode || '',
      groupPassword: codeData?.groupPassword || '',
      privacyAgreed: info.privacyAgreed || false
    };
    
    console.log('MbtiProTest - 완성된 클라이언트 정보:', completeInfo);
    
    // 상태 업데이트
    setClientInfo(completeInfo);
    setCurrentStep('test');
    
    console.log('MbtiProTest - 클라이언트 정보 설정 완료, 검사 시작');
  };

  const handleMouseMove = () => {
    // 첫 번째 문항에서는 항상 텍스트 보이게 설정
    if (currentQuestion === 0) {
      setIsMouseMoved(true);
      return;
    }

    setIsMouseMoved(true);
    
    // 기존 타이머가 있다면 클리어
    if (mouseIdleTimer) {
      clearTimeout(mouseIdleTimer);
    }
    
    // 마우스가 1초 이상 움직이지 않으면 텍스트 표시
    const timer = setTimeout(() => {
      setIsMouseMoved(true);
    }, 1000);
    
    setMouseIdleTimer(timer);
  };

  // 문항 변경 시 타이머 초기화 및 mouseMoved 상태 재설정
  useEffect(() => {
    // 첫 번째 문항에서는 항상 텍스트 보이게 설정
    if (currentQuestion === 0) {
      setIsMouseMoved(true);
      return;
    }
    
    // 초기 상태는 텍스트 숨김
    setIsMouseMoved(false);
    
    // 1초 후에 자동으로 텍스트 표시
    const timer = setTimeout(() => {
      setIsMouseMoved(true);
    }, 1000);
    
    setMouseIdleTimer(timer);
    
    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (mouseIdleTimer) {
        clearTimeout(mouseIdleTimer);
      }
    };
  }, [currentQuestion]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (mouseIdleTimer) {
        clearTimeout(mouseIdleTimer);
      }
    };
  }, []);

  const handleAnswer = (value: number) => {
    // 로그인 상태 확인
    if (!isLoggedIn) {
      return;
    }
    
    const newAnswers = {
      ...answers,
      [currentQuestion]: value
    };
    setAnswers(newAnswers);
    setIsMouseMoved(false);
    setDirection(1);
    
    if (currentQuestion < totalQuestions - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
      }, 100);
    }
  };

  const handleComplete = async () => {
    // 로그인 상태 확인
    if (!isLoggedIn) {
      return;
    }
    
    setIsLoading(true); // 로딩 시작
    
    try {
      // 현재 시간을 타임스탬프로 기록
      const completionTime = new Date().toISOString();
      
      // clientInfo와 answers를 함께 전달, 타임스탬프 추가
      const testData = {
        answers,
        clientInfo: {
          birthYear: clientInfo?.birthYear || '-',
          gender: clientInfo?.gender || '-',
          name: clientInfo?.name || '-',
          groupCode: clientInfo?.groupCode || '-',
          privacyAgreed: clientInfo?.privacyAgreed || false
        },
        timestamp: completionTime // 검사 완료 시간 기록
      };
      
      // 검사 코드 생성 (로그인 사용자만)
      let testCode: string | null = null;
      if (isLoggedIn) {
        testCode = generateTestCode('PROFESSIONAL');
      }
      
      // 로컬 스토리지에 검사 완료 시간 저장
      if (typeof window !== 'undefined') {
        localStorage.setItem('mbti_pro_completion_time', completionTime);
        
        // 마이페이지 검사 기록에 추가 (로그인 사용자만)
        if (isLoggedIn && testCode) {
          try {
            // counselorCode 생성 (groupCode를 counselorCode로 사용)
            const counselorCode = clientInfo?.groupCode || codeData?.groupCode || null;
            
            // 현재 로그인한 사용자 정보 가져오기
            let currentUserId = null;
            let currentUserEmail = null;
            
            // Firebase Auth에서 사용자 정보 가져오기
            try {
              initializeFirebase();
              if (auth && auth.currentUser) {
                currentUserId = auth.currentUser.uid;
                currentUserEmail = auth.currentUser.email;
              }
            } catch (authError) {
              console.warn('Firebase Auth에서 사용자 정보 가져오기 실패:', authError);
            }
            
            // LocalStorage에서도 사용자 정보 확인 (폴백)
            if (!currentUserEmail) {
              const currentUserData = localStorage.getItem('user');
              if (currentUserData) {
                try {
                  const userData = JSON.parse(currentUserData);
                  currentUserEmail = userData.email;
                  currentUserId = userData.id || currentUserId;
                } catch (parseError) {
                  console.error('사용자 데이터 파싱 오류:', parseError);
                }
              }
            }
            
            const testRecord = {
              code: testCode,
              counselorCode: counselorCode,
              testType: '전문가용 MBTI 검사',
              timestamp: completionTime,
              mbtiType: calculateMbtiType(answers),
              userId: currentUserId, // Firebase 저장을 위한 userId 추가
              userData: {
                answers: answers,
                result: calculateMbtiType(answers),
                clientInfo: {
                  ...(clientInfo || {}),
                  counselorCode: counselorCode
                },
                counselorCode: counselorCode,
                groupCode: clientInfo?.groupCode || codeData?.groupCode || undefined
              },
              status: '완료'
            };
            
            // 1. Firebase DB에 먼저 저장 (주 저장소)
            let firebaseSaveSuccess = false;
            if (currentUserId) {
              try {
                await testResults.saveTestResult({
                  ...testRecord,
                  userId: currentUserId,
                  createdAt: new Date(completionTime)
                });
                firebaseSaveSuccess = true;
                console.log('✅ Firebase DB에 검사 결과 저장 성공:', testCode);
              } catch (firebaseError) {
                console.error('❌ Firebase DB 저장 실패:', firebaseError);
                // Firebase 저장 실패 시 오프라인 큐에 추가
                try {
                  const { addToOfflineQueue } = await import('@/utils/offlineQueue');
                  addToOfflineQueue({
                    type: 'save',
                    collection: 'test_results',
                    data: {
                      ...testRecord,
                      userId: currentUserId,
                      createdAt: new Date(completionTime)
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
            try {
              // 사용자별 키로 저장
              const userSpecificKey = currentUserEmail ? `mbti-user-test-records-${currentUserEmail}` : 'mbti-user-test-records';
              
              // 기존 검사 기록 가져오기
              const existingRecords = localStorage.getItem(userSpecificKey);
              let records = [];
              
              if (existingRecords) {
                try {
                  records = JSON.parse(existingRecords);
                  if (!Array.isArray(records)) {
                    records = [];
                  }
                } catch (parseError) {
                  console.error('기존 검사 기록 파싱 오류:', parseError);
                  records = [];
                }
              }
              
              // 새 기록 추가
              records.unshift(testRecord);
              
              // 최대 50개까지만 저장
              if (records.length > 50) {
                records = records.slice(0, 50);
              }
              
              // 로컬 스토리지에 저장
              localStorage.setItem(userSpecificKey, JSON.stringify(records));
              
              // test_records에도 저장 (마이페이지에서 표시되도록)
              const globalRecords = JSON.parse(localStorage.getItem('test_records') || '[]');
              globalRecords.unshift(testRecord);
              
              // 최대 50개까지만 저장
              if (globalRecords.length > 50) {
                globalRecords.splice(50);
              }
              
              localStorage.setItem('test_records', JSON.stringify(globalRecords));
              
              // Firebase 저장 성공 여부를 기록
              if (firebaseSaveSuccess) {
                console.log(`✅ 검사 기록 저장 완료 (Firebase + LocalStorage 캐시):`, testRecord);
              } else {
                console.log(`⚠️ 검사 기록 LocalStorage 캐시 저장 완료 (Firebase 저장 실패):`, testRecord);
              }
            } catch (storageError) {
              console.error('❌ LocalStorage 캐시 저장 오류:', storageError);
            }
          } catch (storageError) {
            console.error('검사 기록 저장 오류:', storageError);
          }
        }
      }
      
      // 검사 완료 시 진행 상태 삭제
      clearTestProgress(testId);
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('mbti_pro_code_data');
          // 검사 완료 직후임을 표시하는 플래그 설정
          sessionStorage.setItem('testJustCompleted', 'true');
          // 검사 완료 시 currentTestStep 정리
          sessionStorage.removeItem('currentTestStep');
        }
        setCodeData(null);
      } catch {}
      
      // 다음 페이지로 이동하기 전에 약간의 지연 추가 (UI 표시를 위해)
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 생성한 testCode를 URL 파라미터로 전달 (검사기록 목록의 코드와 일치시키기 위해)
      const queryString = encodeURIComponent(JSON.stringify(testData));
      const testCodeParam = testCode ? `&code=${encodeURIComponent(testCode)}` : '';
      router.push(`/tests/mbti_pro/result?data=${queryString}${testCodeParam}&from=completion`);
    } catch (error) {
      console.error('검사 완료 중 오류 발생:', error);
      setIsLoading(false); // 오류 발생 시 로딩 상태 해제
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setDirection(-1);
      setTimeout(() => {
        setCurrentQuestion(prev => prev - 1);
      }, 100);
    } else {
      // 첫 번째 질문에서는 기본정보 입력 단계로 이동
      setCurrentStep('info');
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < totalQuestions - 1 && answers[currentQuestion] !== undefined) {
      setDirection(1);
      setTimeout(() => {
        setCurrentQuestion(prev => prev + 1);
      }, 100);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 500 : -500,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 500 : -500,
      opacity: 0
    })
  };

  // 이어하기 다이얼로그
  if (showResumeDialog && hasResumeData) {
    const savedProgress = loadTestProgress(testId);
    const answeredCount = savedProgress ? Object.keys(savedProgress.answers || {}).length : 0;
    const totalCount = totalQuestions;
    const progressPercent = Math.round((answeredCount / totalCount) * 100);
    
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
              <span className="text-emerald-300 font-semibold">{progressPercent}%</span>
            </div>
            <div className="w-full bg-emerald-900 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-emerald-300/80 text-xs mt-2 text-center">
              {answeredCount}개 문항 완료 / 전체 {totalCount}개
            </p>
          </div>
          <div className="flex gap-3">
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
          </div>
        </motion.div>
      </div>
    );
  }

  // 단계별 렌더링
  if (currentStep === 'code') {
    return <MbtiProCodeInput onSubmit={handleCodeSubmit} initialData={codeData} />;
  }

  if (currentStep === 'info') {
    return (
      <>
        <Navigation />
        <div className="relative min-h-screen pb-12 overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 z-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                  <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>
          
          {/* Gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

          <MbtiProClientInfo 
            onSubmit={handleClientInfoSubmit} 
            isPersonalTest={true}
            initialData={clientInfo}
            onBack={(info) => {
              // 입력값 유지하며 검사코드 단계로 이동
              setClientInfo(info);
              setCurrentStep('code');
            }}
          />
        </div>
      </>
    );
  }

  // 검사 단계 (currentStep === 'test')

  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  // 선택된 문항이 아직 로드되지 않았으면 로딩 표시
  if (selectedQuestions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-950 relative overflow-y-auto">
        {/* Background pattern */}
        <div className="absolute inset-0 z-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
        
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        <div className="relative z-10 text-white text-2xl">문항을 준비하는 중입니다...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-full flex flex-col relative overflow-y-auto bg-emerald-950">
      {/* Background pattern */}
      <div className="absolute inset-0 z-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>
      
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      
      {/* 상단 고정 메뉴 */}
      <Navigation />
      
      {/* 상단 메뉴의 높이만큼 여백 추가 (기본정보 화면과 동일) */}
      <div className="h-4"></div>

      <div className="flex-1 bg-emerald-950 py-4 px-4 sm:px-6 lg:px-8 relative z-10" onMouseMove={handleMouseMove}>
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="text-center mb-5">
            <h1 className="text-3xl font-bold text-white mb-4">전문가용 MBTI 검사</h1>
            <p className="text-emerald-300 max-w-lg mx-auto">
              깊이 생각하지 말고, 자연스럽게 떠오르는 대로 선택해주세요.
            </p>
          </div>

          <div className="bg-emerald-900/50 backdrop-blur-sm rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <div className="text-emerald-200">문항 {currentQuestion + 1} / {totalQuestions}</div>
              <div className="text-emerald-200">진행률: {Math.round(((currentQuestion + 1) / totalQuestions) * 100)}%</div>
            </div>

            <div className="w-full bg-emerald-800/50 rounded-full h-2 mb-8">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="text-center mb-12">
              <div className="h-[120px] relative overflow-hidden mb-10">
                <AnimatePresence mode="wait" initial={false} custom={direction}>
                  <motion.div
                    key={currentQuestion}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="bg-emerald-800/50 backdrop-blur-sm rounded-xl p-6 mb-8 flex items-center justify-center min-h-[120px] border border-emerald-700/20"
                  >
                    <h2 className="text-xl text-white text-center">
                      {selectedQuestions[currentQuestion].text}
                    </h2>
                  </motion.div>
                </AnimatePresence>
              </div>
              
              <div className="flex flex-col gap-8">
                <div className="relative flex justify-between items-end gap-3 px-4">
                  <div className="absolute top-0 left-0 right-0 h-24 bg-emerald-900/10 rounded-[100%/20px] -z-10"></div>
                  <button
                    onClick={() => handleAnswer(6)}
                    className={`group relative py-10 px-4 flex-1 rounded-xl bg-emerald-800/40 transition-all duration-300 border border-emerald-700/20 after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[15px] after:bg-gradient-to-t after:from-sky-400/60 after:to-transparent after:rounded-b-xl after:pointer-events-none ${isMouseMoved ? 'hover:bg-emerald-800/60 hover:translate-y-[-2px]' : ''}`}
                  >
                    {answers[currentQuestion] === 6 && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className="flex flex-col items-center justify-center w-full space-y-3">
                      <div className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center transform group-hover:scale-110 transition-all duration-300">
                        <span className="text-white text-lg font-bold">A</span>
                      </div>
                      <span className={`text-sm font-bold text-emerald-400 transform transition-all duration-500 ${isMouseMoved ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>매우<br/>그렇다</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleAnswer(5)}
                    className={`group relative py-[2.625rem] px-4 flex-1 rounded-[20px] bg-emerald-800/40 transition-all duration-300 border border-emerald-700/20 after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[15px] after:bg-gradient-to-t after:from-sky-400/60 after:to-transparent after:rounded-b-[20px] after:pointer-events-none ${isMouseMoved ? 'hover:bg-emerald-800/60 hover:translate-y-[-2px]' : ''}`}
                  >
                    {answers[currentQuestion] === 5 && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className="flex flex-col items-center justify-center w-full space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center transform group-hover:scale-110 transition-all duration-300">
                        <span className="text-white text-lg font-bold">B</span>
                      </div>
                      <span className={`text-sm font-bold text-emerald-400 transform transition-all duration-500 ${isMouseMoved ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>그렇다</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleAnswer(4)}
                    className={`group relative py-5 px-4 flex-1 rounded-[20px] bg-emerald-800/40 transition-all duration-300 border border-emerald-700/20 after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[15px] after:bg-gradient-to-t after:from-sky-400/60 after:to-transparent after:rounded-b-[20px] after:pointer-events-none ${isMouseMoved ? 'hover:bg-emerald-800/60 hover:translate-y-[-2px]' : ''}`}
                  >
                    {answers[currentQuestion] === 4 && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className="flex flex-col items-center justify-center w-full space-y-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center transform group-hover:scale-110 transition-all duration-300">
                        <span className="text-white text-lg font-bold">C</span>
                      </div>
                      <span className={`text-sm font-bold text-emerald-400 transform transition-all duration-500 ${isMouseMoved ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>약간<br/>그렇다</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleAnswer(3)}
                    className={`group relative py-5 px-4 flex-1 rounded-[20px] bg-emerald-800/40 transition-all duration-300 border border-emerald-700/20 after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[15px] after:bg-gradient-to-t after:from-pink-400/60 after:to-transparent after:rounded-b-[20px] after:pointer-events-none ${isMouseMoved ? 'hover:bg-emerald-800/60 hover:translate-y-[-2px]' : ''}`}
                  >
                    {answers[currentQuestion] === 3 && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className="flex flex-col items-center justify-center w-full space-y-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center transform group-hover:scale-110 transition-all duration-300">
                        <span className="text-white text-lg font-bold">D</span>
                      </div>
                      <span className={`text-sm font-bold text-emerald-400 transform transition-all duration-500 ${isMouseMoved ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>약간<br/>아니다</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleAnswer(2)}
                    className={`group relative py-[2.625rem] px-4 flex-1 rounded-[20px] bg-emerald-800/40 transition-all duration-300 border border-emerald-700/20 after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[15px] after:bg-gradient-to-t after:from-pink-400/60 after:to-transparent after:rounded-b-[20px] after:pointer-events-none ${isMouseMoved ? 'hover:bg-emerald-800/60 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-emerald-900/20' : ''}`}
                  >
                    {answers[currentQuestion] === 2 && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className="flex flex-col items-center justify-center w-full space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center transform group-hover:scale-110 transition-all duration-300">
                        <span className="text-white text-lg font-bold">E</span>
                      </div>
                      <span className={`text-sm font-bold text-emerald-400 transform transition-all duration-500 ${isMouseMoved ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>아니다</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleAnswer(1)}
                    className={`group relative py-10 px-4 flex-1 rounded-[20px] bg-emerald-800/40 transition-all duration-300 border border-emerald-700/20 after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[15px] after:bg-gradient-to-t after:from-pink-400/60 after:to-transparent after:rounded-b-[20px] after:pointer-events-none ${isMouseMoved ? 'hover:bg-emerald-800/60 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-emerald-900/20' : ''}`}
                  >
                    {answers[currentQuestion] === 1 && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className="flex flex-col items-center justify-center w-full space-y-3">
                      <div className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center transform group-hover:scale-110 transition-all duration-300">
                        <span className="text-white text-lg font-bold">F</span>
                      </div>
                      <span className={`text-sm font-bold text-emerald-400 transform transition-all duration-500 ${isMouseMoved ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>매우<br/>아니다</span>
                    </div>
                  </button>
                </div>
                
                {/* G(모르겠다) 옵션 제거 */}
              </div>

              <div className="text-center mt-8">
                <p className="text-base text-gray-400 font-medium">
                  깊이 생각하지 않고, 자연스럽게 떠오르는 대로 선택해주세요.
                </p>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={handlePrevQuestion}
                  className="px-6 py-2.5 rounded-lg font-medium transition-all duration-300 bg-gray-700/50 text-gray-300 hover:bg-gray-700/70"
                >
                  {currentQuestion === 0 ? '이전 페이지' : '이전 문항'}
                </button>

                <button
                  onClick={handleNextQuestion}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                    currentQuestion < totalQuestions - 1 && answers[currentQuestion] !== undefined
                    ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700/70'
                    : 'bg-gray-800/30 text-gray-600 cursor-not-allowed'
                  }`}
                  disabled={currentQuestion >= totalQuestions - 1 || answers[currentQuestion] === undefined}
                >
                  {currentQuestion === totalQuestions - 1 ? '결과 확인' : '다음 문항'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 검사완료 버튼 (마지막 질문에 답변 후 계속 표시) */}
      {answers[totalQuestions - 1] !== undefined && (
        <>
          <div className={`fixed left-0 right-0 mx-auto w-1/4 bg-blue-900/90 backdrop-blur-sm py-6 px-10 rounded-2xl shadow-lg z-50 text-center border border-blue-800/50 transition-all duration-500 transform ${popupPosition === 'bottom' ? 'bottom-[7%]' : 'bottom-[calc(7%+150px)] -translate-y-full'}`}>
            <button 
              onClick={() => setPopupPosition(popupPosition === 'bottom' ? 'up' : 'bottom')}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-700/80 flex items-center justify-center hover:bg-blue-600/80 transition-colors"
              aria-label="팝업 위치 변경"
            >
              {popupPosition === 'bottom' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
            </button>
            <p className="text-lg text-white mb-4">검사가 완료되었습니다.<br />확인을 누르면, 검사결과로 이동합니다.</p>
            <button
              onClick={handleComplete}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-12 rounded-xl transition-colors duration-200 mx-auto shadow-md w-3/4"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  결과 페이지로 이동 중...
                </>
              ) : (
                '확인'
              )}
            </button>
          </div>
        </>
      )}

    </div>
  );
} 