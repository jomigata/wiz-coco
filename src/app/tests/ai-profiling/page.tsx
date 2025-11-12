'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { saveTestProgress, loadTestProgress, clearTestProgress, generateTestId, shouldShowResumeDialog } from '@/utils/testResume';
import { generateTestCode } from '@/utils/testCodeGenerator';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';

function AIProfilingPageContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const testId = generateTestId(pathname || '/tests/ai-profiling');
  const [currentChapter, setCurrentChapter] = useState(0);
  
  // currentChapter 변경 시 sessionStorage에 저장 (Navigation에서 말풍선 표시 여부 판단용)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // currentChapter가 0보다 크면 검사 진행 중으로 간주
      if (currentChapter > 0) {
        sessionStorage.setItem('currentTestStep', 'test');
      } else {
        sessionStorage.removeItem('currentTestStep');
      }
    }
  }, [currentChapter]);
  const [answers, setAnswers] = useState<{[key: string]: any}>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [hasResumeData, setHasResumeData] = useState(false);
  const [testCode, setTestCode] = useState<string>('');

  // 저장된 진행 상태 확인
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // URL 파라미터로 resume이 전달된 경우 바로 진행 상태 복원
    const resumeParam = searchParams.get('resume');
    if (resumeParam) {
      const savedProgress = loadTestProgress(testId);
      if (savedProgress) {
        setAnswers(savedProgress.answers || {});
        setCurrentChapter(savedProgress.currentChapter || 0);
      }
      return; // 팝업 표시하지 않고 바로 진행
    }
    
    const show = shouldShowResumeDialog(testId);
    if (show) {
      setHasResumeData(true);
      setShowResumeDialog(true);
    }
  }, [testId, searchParams]);

  // 진행 상태 자동 저장
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      const totalQuestions = chapters.reduce((sum, ch) => sum + ch.questions.length, 0);
      saveTestProgress({
        testId,
        testName: 'AI 프로파일링 검사',
        answers,
        currentChapter,
        timestamp: Date.now(),
        testType: 'AI_PROFILING',
        totalQuestions
      });
    }
  }, [answers, currentChapter, testId]);

  // 페이지 이탈 시 저장
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (Object.keys(answers).length > 0) {
        const totalQuestions = chapters.reduce((sum, ch) => sum + ch.questions.length, 0);
        saveTestProgress({
          testId,
          testName: 'AI 프로파일링 검사',
          answers,
          currentChapter,
          timestamp: Date.now(),
          testType: 'AI_PROFILING',
          totalQuestions
        });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [answers, currentChapter, testId]);

  // 이어하기
  const handleResumeTest = () => {
    const savedProgress = loadTestProgress(testId);
    if (savedProgress) {
      setAnswers(savedProgress.answers || {});
      setCurrentChapter(savedProgress.currentChapter || 0);
      setShowResumeDialog(false);
    }
  };

  // 새로 시작
  const handleStartNew = () => {
    clearTestProgress(testId);
    setAnswers({});
    setCurrentChapter(0);
    setShowResumeDialog(false);
    setHasResumeData(false);
  };

  const chapters = [
    {
      id: 1,
      title: "#기본 프로파일링: 당신의 고유 코드 분석",
      description: "MBTI, 성격 5요인, 부캐 등 핵심 기질을 빠르게 파악합니다.",
      icon: "🔍",
      questions: [
        {
          id: "q1",
          text: "무인도에 가져갈 3가지를 선택하세요",
          type: "multiple",
          options: [
            { value: "a", text: "생존 도구", category: "practical" },
            { value: "b", text: "책", category: "intellectual" },
            { value: "c", text: "음악", category: "artistic" },
            { value: "d", text: "사진", category: "emotional" }
          ]
        },
        {
          id: "q2",
          text: "더 끌리는 이미지는?",
          type: "image",
          options: [
            { value: "a", text: "🌅 일출", category: "optimistic" },
            { value: "b", text: "🌙 달빛", category: "contemplative" },
            { value: "c", text: "⚡ 번개", category: "dynamic" },
            { value: "d", text: "🌸 벚꽃", category: "gentle" }
          ]
        },
        {
          id: "q3",
          text: "새로운 환경에서 가장 먼저 하는 일은?",
          type: "single",
          options: [
            { value: "a", text: "주변을 둘러보며 분석", category: "analytical" },
            { value: "b", text: "사람들과 인사", category: "social" },
            { value: "c", text: "혼자만의 공간 찾기", category: "introverted" },
            { value: "d", text: "즉시 활동 시작", category: "active" }
          ]
        }
      ]
    },
    {
      id: 2,
      title: "#관계망 분석: 캠퍼스 인맥 시뮬레이션",
      description: "관계 스타일, 연애관, 친구 유형을 묻는 질문을 통해 대인관계 패턴을 분석합니다.",
      icon: "👥",
      questions: [
        {
          id: "q4",
          text: "나는 팀플에서 주로...",
          type: "single",
          options: [
            { value: "a", text: "리더 역할을 맡는다", category: "leadership" },
            { value: "b", text: "아이디어를 제안한다", category: "creative" },
            { value: "c", text: "조용히 듣고 있다", category: "observant" },
            { value: "d", text: "분위기를 띄운다", category: "social" }
          ]
        },
        {
          id: "q5",
          text: "단톡방에서 나는...",
          type: "single",
          options: [
            { value: "a", text: "활발하게 참여한다", category: "extroverted" },
            { value: "b", text: "필요할 때만 답한다", category: "selective" },
            { value: "c", text: "읽기만 한다", category: "passive" },
            { value: "d", text: "이모티콘으로 반응한다", category: "expressive" }
          ]
        }
      ]
    },
    {
      id: 3,
      title: "#생활 패턴 분석: 슬기로운 캠퍼스 갓생 설계",
      description: "소비 습관, 시간 관리, 스마트폰 사용 패턴 등 현실적인 질문을 통해 라이프스타일을 진단합니다.",
      icon: "📱",
      questions: [
        {
          id: "q6",
          text: "시험 기간 나의 공부 패턴은?",
          type: "single",
          options: [
            { value: "a", text: "미리 계획하고 꾸준히", category: "planned" },
            { value: "b", text: "벼락치기로 집중 공부", category: "intensive" },
            { value: "c", text: "그룹 스터디 선호", category: "collaborative" },
            { value: "d", text: "혼자 조용히 공부", category: "independent" }
          ]
        },
        {
          id: "q7",
          text: "스마트폰 사용 시간이 가장 많은 앱은?",
          type: "single",
          options: [
            { value: "a", text: "SNS", category: "social_media" },
            { value: "b", text: "유튜브/넷플릭스", category: "entertainment" },
            { value: "c", text: "메신저", category: "communication" },
            { value: "d", text: "게임", category: "gaming" }
          ]
        }
      ]
    },
    {
      id: 4,
      title: "#잠재 능력 분석: A+를 향한 히든 재능 탐색",
      description: "학습 전략, 진로 흥미, 직업 가치관을 파악하여 학업 및 진로 잠재력을 분석합니다.",
      icon: "🎯",
      questions: [
        {
          id: "q8",
          text: "더 선호하는 수업 방식은?",
          type: "single",
          options: [
            { value: "a", text: "암기 위주 강의", category: "memorization" },
            { value: "b", text: "토론 중심 수업", category: "discussion" },
            { value: "c", text: "실습 위주 수업", category: "practical" },
            { value: "d", text: "프로젝트 기반 수업", category: "project" }
          ]
        },
        {
          id: "q9",
          text: "미래에 가장 중요하게 생각하는 것은?",
          type: "single",
          options: [
            { value: "a", text: "안정적인 직장", category: "stability" },
            { value: "b", text: "높은 연봉", category: "income" },
            { value: "c", text: "자아실현", category: "fulfillment" },
            { value: "d", text: "사회적 기여", category: "contribution" }
          ]
        }
      ]
    },
    {
      id: 5,
      title: "#내면 에너지 분석: 마음 건강 & 멘탈 강화",
      description: "현재 기분, 스트레스 정도, 자존감 등 내면 상태를 묻는 질문들을 통해 마음 건강을 분석합니다.",
      icon: "💚",
      questions: [
        {
          id: "q10",
          text: "최근 스트레스를 받는 상황은?",
          type: "single",
          options: [
            { value: "a", text: "학업 압박", category: "academic_stress" },
            { value: "b", text: "인간관계", category: "relationship_stress" },
            { value: "c", text: "미래 불안", category: "future_anxiety" },
            { value: "d", text: "경제적 부담", category: "financial_stress" }
          ]
        },
        {
          id: "q11",
          text: "힘들 때 가장 많이 하는 것은?",
          type: "single",
          options: [
            { value: "a", text: "친구들과 만나기", category: "social_support" },
            { value: "b", text: "혼자 시간 보내기", category: "self_care" },
            { value: "c", text: "운동하기", category: "physical_activity" },
            { value: "d", text: "취미 활동", category: "hobby" }
          ]
        }
      ]
    }
  ];

  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const nextChapter = async () => {
    if (currentChapter < chapters.length - 1) {
      setCurrentChapter(currentChapter + 1);
    } else {
      setIsCompleted(true);
      setShowResult(true);
      
      // 검사 코드 생성 및 검사기록 목록에 저장
      const generatedCode = generateTestCode('AMATEUR'); // AI 프로파일링은 개인용으로 분류
      setTestCode(generatedCode);
      
      // 검사 기록 저장
      if (typeof window !== 'undefined') {
        const timestamp = new Date().toISOString();
        const profile = generateProfile();
        
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
          
          const testData = {
            testType: 'AI 프로파일링 검사',
            code: generatedCode,
            timestamp: timestamp,
            answers: answers,
            status: '완료',
            userId: currentUserId, // Firebase 저장을 위한 userId 추가
            userData: {
              profile: profile,
              answers: answers
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
              console.log('✅ Firebase DB에 AI 프로파일링 검사 결과 저장 성공:', generatedCode);
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
          localStorage.setItem(`test-result-${generatedCode}`, JSON.stringify(testData));
          
          // Firebase 저장 성공 여부를 기록
          if (firebaseSaveSuccess) {
            console.log(`✅ AI 프로파일링 검사 기록 저장 완료 (Firebase + LocalStorage 캐시):`, generatedCode);
          } else {
            console.log(`⚠️ AI 프로파일링 검사 기록 LocalStorage 캐시 저장 완료 (Firebase 저장 실패):`, generatedCode);
          }
          
          // 검사 완료 직후임을 표시하는 플래그 설정
          sessionStorage.setItem('testJustCompleted', 'true');
        } catch (authError) {
          console.warn('Firebase Auth에서 사용자 정보 가져오기 실패:', authError);
          // Firebase 없이 LocalStorage만 저장 (폴백)
          const testData = {
            testType: 'AI 프로파일링 검사',
            code: generatedCode,
            timestamp: timestamp,
            answers: answers,
            status: '완료',
            userData: {
              profile: profile,
              answers: answers
            }
          };
          
          const existingRecords = localStorage.getItem('test_records');
          let records = existingRecords ? JSON.parse(existingRecords) : [];
          records.push(testData);
          
          if (records.length > 50) {
            records = records.slice(-50);
          }
          
          localStorage.setItem('test_records', JSON.stringify(records));
          localStorage.setItem(`test-result-${generatedCode}`, JSON.stringify(testData));
          sessionStorage.setItem('testJustCompleted', 'true');
          console.log('⚠️ LocalStorage만 저장 완료 (Firebase 사용 불가):', generatedCode);
        }
      }
      
      // 검사 완료 시 진행 상태 삭제
      clearTestProgress(testId);
    }
  };

  const prevChapter = () => {
    if (currentChapter > 0) {
      setCurrentChapter(currentChapter - 1);
    }
  };

  const calculateResult = () => {
    const categories: {[key: string]: number} = {};
    
    Object.values(answers).forEach((answer: any) => {
      if (answer && answer.category) {
        categories[answer.category] = (categories[answer.category] || 0) + 1;
      }
    });

    return categories;
  };

  const generateProfile = () => {
    const result = calculateResult();
    const topCategories = Object.entries(result)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    return {
      personality: topCategories[0]?.[0] || "balanced",
      traits: topCategories.map(([category]) => category),
      strengths: topCategories.map(([category]) => getStrengthDescription(category)),
      recommendations: generateRecommendations(topCategories)
    };
  };

  const getStrengthDescription = (category: string) => {
    const descriptions: {[key: string]: string} = {
      practical: "실용적이고 현실적인 접근",
      intellectual: "지적 호기심과 학습 능력",
      artistic: "창의적이고 예술적 감성",
      emotional: "감정적 이해와 공감 능력",
      leadership: "리더십과 조직 능력",
      creative: "창의적 사고와 혁신",
      social: "사교성과 소통 능력"
    };
    return descriptions[category] || "균형 잡힌 성향";
  };

  const generateRecommendations = (topCategories: [string, number][]) => {
    const recommendations = [];
    
    if (topCategories.some(([cat]) => cat === "leadership")) {
      recommendations.push("팀 프로젝트에서 리더 역할을 맡아보세요!");
    }
    if (topCategories.some(([cat]) => cat === "creative")) {
      recommendations.push("창의적 활동이나 동아리에 참여해보세요!");
    }
    if (topCategories.some(([cat]) => cat === "social")) {
      recommendations.push("다양한 사람들과의 네트워킹을 적극 활용하세요!");
    }
    
    return recommendations;
  };

  const currentChapterData = chapters[currentChapter];
  const profile = showResult ? generateProfile() : null;

  // 이어하기 다이얼로그
  if (showResumeDialog && hasResumeData) {
    const savedProgress = loadTestProgress(testId);
    const answeredCount = Object.keys(savedProgress?.answers || {}).length;
    const totalQuestions = chapters.reduce((sum, ch) => sum + ch.questions.length, 0);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-blue-900/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 max-w-md w-full border border-blue-700"
        >
          <h2 className="text-2xl font-bold text-white mb-4 text-center">이어하기</h2>
          <p className="text-blue-200 mb-6 text-center">
            진행 중이던 검사를 발견했습니다. 이어서 계속하시겠습니까?
          </p>
          <div className="bg-blue-800/50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-blue-200 text-sm">진행률</span>
              <span className="text-blue-300 font-semibold">{Math.round((answeredCount / totalQuestions) * 100)}%</span>
            </div>
            <div className="w-full bg-blue-900 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.round((answeredCount / totalQuestions) * 100)}%` }}
              />
            </div>
            <p className="text-blue-300/80 text-xs mt-2 text-center">
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
              처음부터 시작
            </motion.button>
            <motion.button
              onClick={handleResumeTest}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              이어서 계속
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (showResult && profile) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <main className="relative bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 overflow-hidden min-h-screen pt-16 pb-12">
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
          
          <div className="container mx-auto max-w-4xl relative z-10 px-4 py-6">
            {/* 뒤로 돌아가기 버튼 - 최상단 좌측 */}
            <div className="mb-4">
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    // 검사 완료 직후인지 확인
                    if (sessionStorage.getItem('testJustCompleted') === 'true') {
                      sessionStorage.removeItem('testJustCompleted');
                      // 검사 완료 직후는 무조건 검사기록 목록으로 이동
                      router.push('/mypage?tab=records');
                      return;
                    }
                    
                    // 검사기록 목록에서 접근한 경우 이전 페이지로 이동
                    router.back();
                  }
                }}
                className="flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">뒤로 돌아가기</span>
              </button>
            </div>

            {/* 헤더 섹션 */}
            <div className="mb-8 relative">
              <div className="absolute -left-4 -top-8 w-20 h-20 bg-blue-500 rounded-full opacity-20 blur-2xl"></div>
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-500 rounded-full opacity-20 blur-2xl"></div>
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300 inline-block drop-shadow-lg">
                캠퍼스 라이프 시크릿 리포트
              </h1>
              <div className="h-1.5 w-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full mt-2 shadow-lg"></div>
              {testCode && (
                <p className="text-blue-200 mt-4">
                  테스트 코드: <span className="font-mono font-semibold">{testCode}</span>
                </p>
              )}
            </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 mb-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-3xl">🎭</span>
              나의 프로파일링 결과
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">주요 특성</h3>
                <div className="space-y-2">
                  {profile.traits.map((trait, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                      <span className="text-gray-200">{getStrengthDescription(trait)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">맞춤 추천</h3>
                <div className="space-y-2">
                  {profile.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-yellow-400">💡</span>
                      <span className="text-gray-200">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

            {/* 버튼 그룹 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link 
                href="/tests"
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-300 shadow-lg text-center"
              >
                다른 검사도 해보기
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-4xl mx-auto mb-4">
            🔍
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">AI 프로파일링</h1>
          <p className="text-gray-300 text-lg">너의 모든 것을 알려줄게, 캠퍼스 라이프 시크릿 리포트</p>
        </div>

        {/* 진행률 바 */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-300 mb-2">
            <span>Chapter {currentChapter + 1} / {chapters.length}</span>
            <span>{Math.round(((currentChapter + 1) / chapters.length) * 100)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentChapter + 1) / chapters.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* 현재 챕터 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-4xl">{currentChapterData.icon}</span>
            <div>
              <h2 className="text-2xl font-bold text-white">{currentChapterData.title}</h2>
              <p className="text-gray-300">{currentChapterData.description}</p>
            </div>
          </div>

          {/* 질문들 */}
          <div className="space-y-6">
            {currentChapterData.questions.map((question) => (
              <div key={question.id} className="bg-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">{question.text}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {question.options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer(question.id, option)}
                      className={`p-4 rounded-lg text-left transition-all duration-300 ${
                        answers[question.id]?.value === option.value
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                          : 'bg-white/10 text-gray-200 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      <span className="text-lg mr-2">{option.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 네비게이션 버튼 */}
        <div className="flex justify-between">
          <button
            onClick={prevChapter}
            disabled={currentChapter === 0}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
              currentChapter === 0
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            이전
          </button>
          
          <button
            onClick={nextChapter}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300"
          >
            {currentChapter === chapters.length - 1 ? '결과 보기' : '다음'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AIProfilingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
        <div className="text-white text-lg">로딩 중...</div>
      </div>
    }>
      <AIProfilingPageContent />
    </Suspense>
  );
}
