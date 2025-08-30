"use client";

import { useState } from 'react';
import Link from 'next/link';

interface EmergencyQuestion {
  id: number;
  question: string;
  options: string[];
  category: string;
}

interface DiagnosisResult {
  level: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendations: string[];
  immediateActions: string[];
  professionalHelp: boolean;
  color: string;
}

export default function EmergencyDiagnosisPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);

  const emergencyQuestions: EmergencyQuestion[] = [
    {
      id: 1,
      question: "현재 극도로 우울하거나 절망적인 기분을 느끼고 있나요?",
      options: ["전혀 그렇지 않다", "그렇지 않다", "보통이다", "그렇다", "매우 그렇다"],
      category: "depression"
    },
    {
      id: 2,
      question: "자해나 자살에 대한 생각이 있나요?",
      options: ["전혀 그렇지 않다", "그렇지 않다", "가끔 생각한다", "자주 생각한다", "매우 심각하다"],
      category: "suicide"
    },
    {
      id: 3,
      question: "현재 극도로 불안하거나 공포를 느끼고 있나요?",
      options: ["전혀 그렇지 않다", "그렇지 않다", "보통이다", "그렇다", "매우 그렇다"],
      category: "anxiety"
    },
    {
      id: 4,
      question: "현재 상황을 통제할 수 없다고 느끼나요?",
      options: ["전혀 그렇지 않다", "그렇지 않다", "보통이다", "그렇다", "매우 그렇다"],
      category: "control"
    },
    {
      id: 5,
      question: "현재 극도로 화가 나거나 폭력적인 충동을 느끼나요?",
      options: ["전혀 그렇지 않다", "그렇지 않다", "보통이다", "그렇다", "매우 그렇다"],
      category: "anger"
    },
    {
      id: 6,
      question: "현재 극도로 외로움이나 고립감을 느끼나요?",
      options: ["전혀 그렇지 않다", "그렇지 않다", "보통이다", "그렇다", "매우 그렇다"],
      category: "loneliness"
    }
  ];

  const diagnosisResults: { [key: string]: DiagnosisResult } = {
    low: {
      level: 'low',
      title: '안정적인 상태',
      description: '현재 마음 상태는 비교적 안정적입니다. 하지만 지속적인 관심이 필요합니다.',
      recommendations: [
        '정기적인 마음 체크업을 계속하세요',
        '건강한 생활 습관을 유지하세요',
        '스트레스 관리 기법을 연습하세요'
      ],
      immediateActions: [
        '깊은 호흡을 10번 해보세요',
        '마음이 편안해지는 활동을 해보세요',
        '신뢰할 수 있는 사람과 대화해보세요'
      ],
      professionalHelp: false,
      color: 'from-green-500 to-green-600'
    },
    medium: {
      level: 'medium',
      title: '주의가 필요한 상태',
      description: '현재 마음 상태에 주의가 필요합니다. 적극적인 관리가 권장됩니다.',
      recommendations: [
        '일상적인 스트레스 관리 기법을 실천하세요',
        '규칙적인 운동과 휴식을 취하세요',
        '마음 건강에 대한 관심을 높이세요'
      ],
      immediateActions: [
        '현재 상황에서 벗어날 수 있는 활동을 찾아보세요',
        '마음이 편안해지는 음악을 들어보세요',
        '가족이나 친구와 대화해보세요'
      ],
      professionalHelp: false,
      color: 'from-yellow-500 to-yellow-600'
    },
    high: {
      level: 'high',
      title: '전문가 상담 권장',
      description: '현재 마음 상태가 심각합니다. 전문가의 도움이 필요합니다.',
      recommendations: [
        '가까운 정신건강의학과나 상담센터를 방문하세요',
        '전문 상담사와 상담을 받아보세요',
        '약물치료가 필요할 수 있습니다'
      ],
      immediateActions: [
        '즉시 신뢰할 수 있는 사람에게 연락하세요',
        '자해나 자살 생각이 있다면 1393으로 연락하세요',
        '응급실이나 정신건강의학과를 방문하세요'
      ],
      professionalHelp: true,
      color: 'from-orange-500 to-orange-600'
    },
    critical: {
      level: 'critical',
      title: '즉시 전문가 도움 필요',
      description: '현재 상황이 매우 심각합니다. 즉시 전문가의 도움을 받아야 합니다.',
      recommendations: [
        '즉시 응급실이나 정신건강의학과를 방문하세요',
        '자해나 자살 시도가 있다면 119에 연락하세요',
        '가족이나 친구에게 즉시 도움을 요청하세요'
      ],
      immediateActions: [
        '자해나 자살 생각이 있다면 즉시 1393으로 연락하세요',
        '응급실이나 정신건강의학과를 즉시 방문하세요',
        '혼자 있지 마시고 누군가와 함께 있으세요'
      ],
      professionalHelp: true,
      color: 'from-red-500 to-red-600'
    }
  };

  const handleAnswer = (questionId: number, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleNext = () => {
    if (currentStep < emergencyQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateDiagnosis = () => {
    setIsAnalyzing(true);
    
    // 1초 후 결과 표시 (실제로는 AI 분석이 들어갈 자리)
    setTimeout(() => {
      const totalScore = Object.values(answers).reduce((sum, answer) => sum + answer, 0);
      const averageScore = totalScore / Object.keys(answers).length;
      
      let resultLevel: keyof typeof diagnosisResults;
      if (averageScore <= 1.5) resultLevel = 'low';
      else if (averageScore <= 2.5) resultLevel = 'medium';
      else if (averageScore <= 3.5) resultLevel = 'high';
      else resultLevel = 'critical';
      
      setDiagnosisResult(diagnosisResults[resultLevel]);
      setIsAnalyzing(false);
    }, 1000);
  };

  const canProceed = answers[emergencyQuestions[currentStep]?.id] !== undefined;
  const isLastQuestion = currentStep === emergencyQuestions.length - 1;
  const allQuestionsAnswered = Object.keys(answers).length === emergencyQuestions.length;

  if (diagnosisResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        {/* 헤더 */}
        <div className={`bg-gradient-to-r ${diagnosisResult.color} text-white py-12`}>
          <div className="container mx-auto px-6 text-center">
            <Link href="/ai-mind-assistant" className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              AI 마음 비서로 돌아가기
            </Link>
            <h1 className="text-4xl font-bold mb-2">🚨 긴급 마음진단 결과</h1>
            <p className="text-xl text-white/90">
              {diagnosisResult.title}
            </p>
          </div>
        </div>

        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">
            {/* 진단 결과 */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">
                  {diagnosisResult.level === 'low' ? '😊' : 
                   diagnosisResult.level === 'medium' ? '😐' : 
                   diagnosisResult.level === 'high' ? '😰' : '🚨'}
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">{diagnosisResult.title}</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  {diagnosisResult.description}
                </p>
              </div>

              {/* 즉시 행동 */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  ⚡ 즉시 행동하기
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {diagnosisResult.immediateActions.map((action, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-red-500 text-xl">•</div>
                        <p className="text-red-800">{action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 권장사항 */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  💡 권장사항
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {diagnosisResult.recommendations.map((recommendation, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-blue-500 text-xl">•</div>
                        <p className="text-blue-800">{recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 전문가 도움 */}
              {diagnosisResult.professionalHelp && (
                <div className="bg-red-100 border border-red-300 rounded-xl p-6 mb-8">
                  <h3 className="text-2xl font-bold text-red-800 mb-4 flex items-center">
                    🆘 전문가 도움 필요
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="text-red-600 text-xl">📞</div>
                      <div>
                        <p className="font-semibold text-red-800">자살예방상담전화: 1393</p>
                        <p className="text-red-700 text-sm">24시간 무료 상담</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-red-600 text-xl">🚨</div>
                      <div>
                        <p className="font-semibold text-red-800">응급상황: 119</p>
                        <p className="text-red-700 text-sm">즉시 도움이 필요한 경우</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {
                    setDiagnosisResult(null);
                    setCurrentStep(0);
                    setAnswers({});
                  }}
                  className="flex-1 bg-gray-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-gray-700 transition-colors"
                >
                  다시 진단하기
                </button>
                <Link
                  href="/ai-mind-assistant"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 text-center"
                >
                  AI 마음 비서로 돌아가기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white py-12">
        <div className="container mx-auto px-6 text-center">
          <Link href="/ai-mind-assistant" className="inline-flex items-center text-red-100 hover:text-white mb-4 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            AI 마음 비서로 돌아가기
          </Link>
          <h1 className="text-4xl font-bold mb-2">🚨 긴급 마음진단</h1>
          <p className="text-xl text-red-100">
            1분 AI 솔루션으로 현재 마음 상태를 빠르게 진단해보세요
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          {/* 진행 상황 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">
                {currentStep + 1} / {emergencyQuestions.length}
              </span>
              <span className="text-sm font-medium text-gray-600">
                {Math.round(((currentStep + 1) / emergencyQuestions.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / emergencyQuestions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* 질문 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {emergencyQuestions[currentStep]?.question}
            </h2>
            
            <div className="space-y-3">
              {emergencyQuestions[currentStep]?.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(emergencyQuestions[currentStep].id, index)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    answers[emergencyQuestions[currentStep].id] === index
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      answers[emergencyQuestions[currentStep].id] === index
                        ? 'border-red-500 bg-red-500'
                        : 'border-gray-300'
                    }`}>
                      {answers[emergencyQuestions[currentStep].id] === index && (
                        <div className="w-2 h-2 bg-white rounded-full m-auto"></div>
                      )}
                    </div>
                    <span className="font-medium">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 네비게이션 버튼 */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-6 py-3 bg-gray-500 text-white rounded-xl font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              이전
            </button>
            
            {isLastQuestion ? (
              <button
                onClick={calculateDiagnosis}
                disabled={!allQuestionsAnswered || isAnalyzing}
                className="px-8 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-semibold hover:from-red-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isAnalyzing ? '분석 중...' : '진단 결과 보기'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceed}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-medium hover:from-red-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                다음
              </button>
            )}
          </div>

          {/* 주의사항 */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
              ⚠️ 주의사항
            </h3>
            <ul className="text-yellow-700 space-y-2 text-sm">
              <li>• 이 진단은 참고용이며, 전문가 진단을 대체할 수 없습니다.</li>
              <li>• 자해나 자살 생각이 있다면 즉시 1393으로 연락하세요.</li>
              <li>• 응급상황이라면 119나 가까운 응급실을 이용하세요.</li>
              <li>• 심각한 증상이 있다면 반드시 전문가와 상담하세요.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
