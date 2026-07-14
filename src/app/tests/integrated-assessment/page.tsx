'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { saveTestProgress, loadTestProgress, clearTestProgress, generateTestId, shouldShowResumeDialog } from '@/utils/testResume';
import { motion } from 'framer-motion';

function IntegratedAssessmentPageContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const testId = generateTestId(pathname || '/tests/integrated-assessment');
  const [currentStep, setCurrentStep] = useState(0);
  
  // currentStep 변경 시 sessionStorage에 저장 (Navigation에서 말풍선 표시 여부 판단용)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // currentStep이 0보다 크면 검사 진행 중으로 간주
      if (currentStep > 0) {
        sessionStorage.setItem('currentTestStep', 'test');
      } else {
        sessionStorage.removeItem('currentTestStep');
      }
    }
  }, [currentStep]);
  const [answers, setAnswers] = useState<{[key: string]: any}>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [hasResumeData, setHasResumeData] = useState(false);
  const [studentInfo, setStudentInfo] = useState({
    name: '',
    major: '',
    studentId: '',
    year: '2024'
  });

  // 저장된 진행 상태 확인
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // URL 파라미터로 resume이 전달된 경우 바로 진행 상태 복원
    const resumeParam = searchParams.get('resume');
    if (resumeParam) {
      const savedProgress = loadTestProgress(testId);
      if (savedProgress) {
        setAnswers(savedProgress.answers || {});
        // 타입 안전성 체크: number 타입인 경우에만 설정
        if (savedProgress.currentStep !== undefined) {
          const step = savedProgress.currentStep;
          if (typeof step === 'number') {
            setCurrentStep(step);
          } else {
            setCurrentStep(0); // 기본값
          }
        } else {
          setCurrentStep(0);
        }
        if (savedProgress.studentInfo) setStudentInfo(savedProgress.studentInfo);
      }
      return; // 팝업 표시하지 않고 바로 진행
    }
    
    const show = shouldShowResumeDialog(testId);
    if (show) {
      const savedProgress = loadTestProgress(testId);
      setHasResumeData(true);
      setShowResumeDialog(true);
      if (savedProgress?.studentInfo) setStudentInfo(savedProgress.studentInfo);
    }
  }, [testId, searchParams]);

  // 진행 상태 자동 저장
  useEffect(() => {
    if (Object.keys(answers).length > 0 || currentStep > 0) {
      const totalQuestions = assessmentSteps.reduce((sum, step) => 
        sum + (step.questions ? step.questions.length : 0), 0
      );
      saveTestProgress({
        testId,
        testName: '통합 평가 검사',
        answers,
        currentStep,
        studentInfo,
        timestamp: Date.now(),
        testType: 'INTEGRATED_ASSESSMENT',
        totalQuestions
      });
    }
  }, [answers, currentStep, studentInfo, testId]);

  // 페이지 이탈 시 저장
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (Object.keys(answers).length > 0 || currentStep > 0) {
        const totalQuestions = assessmentSteps.reduce((sum, step) => 
          sum + (step.questions ? step.questions.length : 0), 0
        );
        saveTestProgress({
          testId,
          testName: '통합 평가 검사',
          answers,
          currentStep,
          studentInfo,
          timestamp: Date.now(),
          testType: 'INTEGRATED_ASSESSMENT',
          totalQuestions
        });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [answers, currentStep, studentInfo, testId]);

  // 이어하기
  const handleResumeTest = () => {
    const savedProgress = loadTestProgress(testId);
    if (savedProgress) {
      setAnswers(savedProgress.answers || {});
      // 타입 안전성 체크: number 타입인 경우에만 설정
      if (savedProgress.currentStep !== undefined) {
        const step = savedProgress.currentStep;
        if (typeof step === 'number') {
          setCurrentStep(step);
        } else {
          setCurrentStep(0); // 기본값
        }
      } else {
        setCurrentStep(0);
      }
      if (savedProgress.studentInfo) setStudentInfo(savedProgress.studentInfo);
      setShowResumeDialog(false);
    }
  };

  // 새로 시작
  const handleStartNew = () => {
    clearTestProgress(testId);
    setAnswers({});
    setCurrentStep(0);
    setStudentInfo({ name: '', major: '', studentId: '', year: '2024' });
    setShowResumeDialog(false);
    setHasResumeData(false);
  };

  const assessmentSteps = [
    {
      id: 0,
      title: "신입생 정보 입력",
      description: "검사 결과를 더 정확하게 분석하기 위한 기본 정보를 입력해주세요.",
      type: "info",
      fields: [
        { id: "name", label: "이름", type: "text", required: true },
        { id: "studentId", label: "학번", type: "text", required: true },
        { id: "major", label: "전공", type: "select", required: true, 
          options: [
            "인문학부", "사회과학부", "자연과학부", "공학부", 
            "경영학부", "의학부", "예술학부", "교육학부", "기타"
          ]
        }
      ]
    },
    {
      id: 1,
      title: "성격 및 기질 분석",
      description: "MBTI와 성격 5요인을 통한 기본 성격 특성 분석",
      icon: "🎭",
      questions: [
        {
          id: "personality_1",
          text: "새로운 사람들과 만날 때 나는...",
          type: "single",
          options: [
            { value: "a", text: "적극적으로 다가간다", category: "extroversion" },
            { value: "b", text: "상대방이 먼저 다가오길 기다린다", category: "introversion" },
            { value: "c", text: "상황에 따라 다르다", category: "ambiversion" }
          ]
        },
        {
          id: "personality_2",
          text: "문제를 해결할 때 나는...",
          type: "single",
          options: [
            { value: "a", text: "논리적 분석을 우선한다", category: "thinking" },
            { value: "b", text: "감정과 직감을 중시한다", category: "feeling" },
            { value: "c", text: "상황에 맞게 조절한다", category: "balanced" }
          ]
        }
      ]
    },
    {
      id: 2,
      title: "학습 스타일 및 적성 분석",
      description: "학습 방법과 전공 적합성 분석",
      icon: "📚",
      questions: [
        {
          id: "learning_1",
          text: "가장 효과적인 학습 방법은?",
          type: "single",
          options: [
            { value: "a", text: "혼자 조용히 공부하기", category: "independent" },
            { value: "b", text: "그룹 스터디", category: "collaborative" },
            { value: "c", text: "실습 위주 학습", category: "hands_on" },
            { value: "d", text: "이론 중심 학습", category: "theoretical" }
          ]
        },
        {
          id: "learning_2",
          text: "어려운 과목을 접할 때 나는...",
          type: "single",
          options: [
            { value: "a", text: "기초부터 차근차근 공부한다", category: "systematic" },
            { value: "b", text: "실용적인 부분부터 시작한다", category: "practical" },
            { value: "c", text: "다른 사람의 도움을 받는다", category: "social" },
            { value: "d", text: "직접 경험해보며 학습한다", category: "experiential" }
          ]
        }
      ]
    },
    {
      id: 3,
      title: "대인관계 및 소통 스타일",
      description: "캠퍼스 내 인간관계 패턴 분석",
      icon: "👥",
      questions: [
        {
          id: "social_1",
          text: "팀 프로젝트에서 나의 역할은?",
          type: "single",
          options: [
            { value: "a", text: "리더 역할을 맡는다", category: "leader" },
            { value: "b", text: "아이디어를 제안한다", category: "creative" },
            { value: "c", text: "조용히 듣고 기여한다", category: "supporter" },
            { value: "d", text: "분위기를 띄운다", category: "motivator" }
          ]
        },
        {
          id: "social_2",
          text: "갈등 상황에서 나는...",
          type: "single",
          options: [
            { value: "a", text: "직접적으로 문제를 제기한다", category: "direct" },
            { value: "b", text: "중재자 역할을 한다", category: "mediator" },
            { value: "c", text: "피하고 싶어한다", category: "avoidant" },
            { value: "d", text: "상대방 입장을 이해하려 한다", category: "empathetic" }
          ]
        }
      ]
    },
    {
      id: 4,
      title: "스트레스 관리 및 적응력",
      description: "대학 생활 적응과 스트레스 대처 능력 분석",
      icon: "💪",
      questions: [
        {
          id: "stress_1",
          text: "시험 기간 스트레스를 받을 때 나는...",
          type: "single",
          options: [
            { value: "a", text: "운동으로 스트레스를 해소한다", category: "physical" },
            { value: "b", text: "친구들과 이야기한다", category: "social" },
            { value: "c", text: "혼자만의 시간을 갖는다", category: "solitary" },
            { value: "d", text: "취미 활동을 한다", category: "hobby" }
          ]
        },
        {
          id: "stress_2",
          text: "새로운 환경에 적응하는 데 걸리는 시간은?",
          type: "single",
          options: [
            { value: "a", text: "즉시 적응한다", category: "fast" },
            { value: "b", text: "1-2주 정도", category: "medium" },
            { value: "c", text: "1개월 이상", category: "slow" },
            { value: "d", text: "상황에 따라 다르다", category: "variable" }
          ]
        }
      ]
    },
    {
      id: 5,
      title: "진로 및 미래 계획",
      description: "진로 흥미와 미래 목표 분석",
      icon: "🎯",
      questions: [
        {
          id: "career_1",
          text: "미래 직업을 선택할 때 가장 중요한 것은?",
          type: "single",
          options: [
            { value: "a", text: "안정성", category: "stability" },
            { value: "b", text: "수입", category: "income" },
            { value: "c", text: "자아실현", category: "fulfillment" },
            { value: "d", text: "사회적 기여", category: "contribution" }
          ]
        },
        {
          id: "career_2",
          text: "대학 졸업 후 계획은?",
          type: "single",
          options: [
            { value: "a", text: "취업", category: "employment" },
            { value: "b", text: "대학원 진학", category: "graduate" },
            { value: "c", text: "창업", category: "entrepreneurship" },
            { value: "d", text: "아직 결정하지 않았다", category: "undecided" }
          ]
        }
      ]
    }
  ];

  const handleInfoChange = (field: string, value: string) => {
    setStudentInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const nextStep = () => {
    if (currentStep < assessmentSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsCompleted(true);
      setShowResult(true);
      // 검사 완료 시 진행 상태 삭제
      clearTestProgress(testId);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
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

  const generateComprehensiveReport = () => {
    const result = calculateResult();
    const topCategories = Object.entries(result)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return {
      studentInfo,
      personality: analyzePersonality(result),
      learningStyle: analyzeLearningStyle(result),
      socialStyle: analyzeSocialStyle(result),
      stressManagement: analyzeStressManagement(result),
      careerInterest: analyzeCareerInterest(result),
      recommendations: generateRecommendations(result, studentInfo.major),
      strengths: topCategories.map(([category]) => getStrengthDescription(category)),
      areasForGrowth: generateGrowthAreas(result)
    };
  };

  const analyzePersonality = (result: {[key: string]: number}) => {
    const extroversion = result.extroversion || 0;
    const introversion = result.introversion || 0;
    const thinking = result.thinking || 0;
    const feeling = result.feeling || 0;

    return {
      energy: extroversion > introversion ? "외향적" : "내향적",
      decision: thinking > feeling ? "사고형" : "감정형",
      score: { extroversion, introversion, thinking, feeling }
    };
  };

  const analyzeLearningStyle = (result: {[key: string]: number}) => {
    const styles: {[key: string]: number} = {
      independent: result.independent || 0,
      collaborative: result.collaborative || 0,
      hands_on: result.hands_on || 0,
      theoretical: result.theoretical || 0
    };

    const dominantStyle = Object.entries(styles).reduce((a, b) => styles[a[0]] > styles[b[0]] ? a : b)[0];
    
    return {
      dominant: dominantStyle,
      styles,
      recommendation: getLearningRecommendation(dominantStyle)
    };
  };

  const analyzeSocialStyle = (result: {[key: string]: number}) => {
    return {
      leadership: result.leader || 0,
      creativity: result.creative || 0,
      support: result.supporter || 0,
      motivation: result.motivator || 0
    };
  };

  const analyzeStressManagement = (result: {[key: string]: number}) => {
    return {
      physical: result.physical || 0,
      social: result.social || 0,
      solitary: result.solitary || 0,
      hobby: result.hobby || 0
    };
  };

  const analyzeCareerInterest = (result: {[key: string]: number}) => {
    return {
      stability: result.stability || 0,
      income: result.income || 0,
      fulfillment: result.fulfillment || 0,
      contribution: result.contribution || 0
    };
  };

  const getStrengthDescription = (category: string) => {
    const descriptions: {[key: string]: string} = {
      extroversion: "활발한 소통과 리더십",
      introversion: "깊이 있는 사고와 집중력",
      thinking: "논리적 분석과 객관적 판단",
      feeling: "공감과 조화로운 관계",
      independent: "자립적 학습 능력",
      collaborative: "협력적 학습 스타일",
      hands_on: "실습 중심 학습",
      theoretical: "이론 중심 학습",
      leader: "리더십과 조직력",
      creative: "창의적 사고",
      supporter: "지지와 협력",
      motivator: "동기 부여와 분위기 조성"
    };
    return descriptions[category] || "균형 잡힌 특성";
  };

  const getLearningRecommendation = (style: string) => {
    const recommendations: {[key: string]: string} = {
      independent: "개별 학습 공간을 활용하고, 자기주도적 학습 계획을 세우세요.",
      collaborative: "스터디 그룹을 만들고, 토론 수업에 적극 참여하세요.",
      hands_on: "실습실과 현장 체험을 적극 활용하세요.",
      theoretical: "도서관과 연구 자료를 활용한 깊이 있는 학습을 추천합니다."
    };
    return recommendations[style] || "다양한 학습 방법을 시도해보세요.";
  };

  const generateRecommendations = (result: {[key: string]: number}, major: string) => {
    const recommendations = [];
    
    if (result.leader > 0) {
      recommendations.push("학생회나 동아리 리더 역할을 고려해보세요.");
    }
    if (result.creative > 0) {
      recommendations.push("창의적 활동이나 예술 동아리에 참여해보세요.");
    }
    if (result.collaborative > 0) {
      recommendations.push("팀 프로젝트와 그룹 스터디를 적극 활용하세요.");
    }
    
    // 전공별 맞춤 추천
    if (major.includes("공학")) {
      recommendations.push("프로그래밍 동아리나 프로젝트에 참여해보세요.");
    } else if (major.includes("인문")) {
      recommendations.push("독서 모임이나 토론 동아리에 참여해보세요.");
    }
    
    return recommendations;
  };

  const generateGrowthAreas = (result: {[key: string]: number}) => {
    const areas = [];
    
    if ((result.solitary || 0) > (result.social || 0)) {
      areas.push("사회적 소통 능력 향상");
    }
    if ((result.avoidant || 0) > 0) {
      areas.push("갈등 해결 능력 개발");
    }
    if ((result.undecided || 0) > 0) {
      areas.push("진로 탐색 및 목표 설정");
    }
    
    return areas;
  };

  const currentStepData = assessmentSteps[currentStep];
  const report = showResult ? generateComprehensiveReport() : null;

  // 이어하기 다이얼로그
  if (showResumeDialog && hasResumeData) {
    const savedProgress = loadTestProgress(testId);
    const answeredCount = Object.keys(savedProgress?.answers || {}).length;
    const totalQuestions = assessmentSteps.reduce((sum, step) => 
      sum + (step.questions ? step.questions.length : 0), 0
    );
    
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-indigo-900/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 max-w-md w-full border border-indigo-700"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-4 text-center">이어하기</h2>
          <p className="text-indigo-200 mb-6 text-center">
            진행 중이던 검사를 발견했습니다. 이어서 계속하시겠습니까?
          </p>
          <div className="bg-indigo-800/50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-indigo-200 text-sm">진행률</span>
              <span className="text-indigo-300 font-semibold">{totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-indigo-900 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0}%` }}
              />
            </div>
            <p className="text-indigo-300/80 text-xs mt-2 text-center">
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
              className="flex-1 px-4 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              이어서 계속
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (showResult && report) {
    return (
      <div className="bg-[#f8fafc] p-6 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-4xl mx-auto mb-4">
              🎓
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">신입생 통합 심리검사 결과</h1>
            <p className="text-slate-600 text-lg">{report.studentInfo.name}님의 맞춤형 분석 리포트</p>
          </div>

          {/* 기본 정보 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">기본 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <span className="text-gray-300">이름</span>
                <p className="text-white font-semibold">{report.studentInfo.name}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <span className="text-gray-300">학번</span>
                <p className="text-white font-semibold">{report.studentInfo.studentId}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <span className="text-gray-300">전공</span>
                <p className="text-white font-semibold">{report.studentInfo.major}</p>
              </div>
            </div>
          </div>

          {/* 분석 결과 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* 성격 분석 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-slate-200">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">🎭</span>
                성격 분석
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">에너지 방향</span>
                  <span className="text-white font-semibold">{report.personality.energy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">의사결정 방식</span>
                  <span className="text-white font-semibold">{report.personality.decision}</span>
                </div>
              </div>
            </div>

            {/* 학습 스타일 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-slate-200">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">📚</span>
                학습 스타일
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">주요 학습 방식</span>
                  <span className="text-white font-semibold">{report.learningStyle.dominant}</span>
                </div>
                <p className="text-slate-600 text-sm">{report.learningStyle.recommendation}</p>
              </div>
            </div>
          </div>

          {/* 강점 및 추천사항 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-slate-200">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">💪</span>
                주요 강점
              </h3>
              <div className="space-y-2">
                {report.strengths.map((strength, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    <span className="text-gray-200">{strength}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-slate-200">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                맞춤 추천
              </h3>
              <div className="space-y-2">
                {report.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-yellow-400">💡</span>
                    <span className="text-gray-200">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 성장 영역 */}
          {report.areasForGrowth.length > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 mb-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">📈</span>
                성장 영역
              </h3>
              <div className="space-y-2">
                {report.areasForGrowth.map((area, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-blue-400">🔧</span>
                    <span className="text-gray-200">{area}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-center">
            <Link 
              href="/tests"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300"
            >
              다른 검사도 해보기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] p-6 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-4xl mx-auto mb-4">
            🎓
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">신입생 통합 심리검사</h1>
          <p className="text-slate-600 text-lg">대학 생활 적응을 위한 종합 분석</p>
        </div>

        {/* 진행률 바 */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-300 mb-2">
            <span>Step {currentStep + 1} / {assessmentSteps.length}</span>
            <span>{Math.round(((currentStep + 1) / assessmentSteps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / assessmentSteps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* 현재 단계 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-slate-200 mb-6">
          <div className="flex items-center gap-4 mb-6">
            {currentStepData.icon && <span className="text-4xl">{currentStepData.icon}</span>}
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{currentStepData.title}</h2>
              <p className="text-gray-300">{currentStepData.description}</p>
            </div>
          </div>

          {/* 정보 입력 단계 */}
          {currentStepData.type === "info" && (
            <div className="space-y-6">
              {currentStepData.fields.map((field) => (
                <div key={field.id} className="bg-white/5 rounded-xl p-6">
                  <label className="block text-lg font-semibold text-slate-900 mb-3">
                    {field.label} {field.required && <span className="text-red-400">*</span>}
                  </label>
                  {field.type === "text" ? (
                    <input
                      type="text"
                      value={studentInfo[field.id as keyof typeof studentInfo]}
                      onChange={(e) => handleInfoChange(field.id, e.target.value)}
                      className="w-full p-3 bg-white/10 border border-slate-200 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                      placeholder={`${field.label}을(를) 입력하세요`}
                      required={field.required}
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={studentInfo[field.id as keyof typeof studentInfo]}
                      onChange={(e) => handleInfoChange(field.id, e.target.value)}
                      className="w-full p-3 bg-white/10 border border-slate-200 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                      required={field.required}
                    >
                      <option value="">선택하세요</option>
                      {field.options?.map((option) => (
                        <option key={option} value={option} className="bg-gray-800">
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {/* 질문 단계 */}
          {currentStepData.type !== "info" && (
            <div className="space-y-6">
              {currentStepData.questions?.map((question) => (
                <div key={question.id} className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">{question.text}</h3>
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
          )}
        </div>

        {/* 네비게이션 버튼 */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
              currentStep === 0
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            이전
          </button>
          
          <button
            onClick={nextStep}
            disabled={currentStep === 0 && (!studentInfo.name || !studentInfo.studentId || !studentInfo.major)}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {currentStep === assessmentSteps.length - 1 ? '결과 보기' : '다음'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IntegratedAssessmentPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="text-white text-lg">로딩 중...</div>
      </div>
    }>
      <IntegratedAssessmentPageContent />
    </Suspense>
  );
}
