"use client";

import { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

interface MoodCheckItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  questions: string[];
}

export default function DailyMoodPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [isCompleted, setIsCompleted] = useState(false);

  const moodCheckItems: MoodCheckItem[] = [
    {
      id: 'sleep',
      name: '수면의 질',
      description: '오늘 밤의 수면 상태를 평가해주세요',
      icon: '😴',
      questions: [
        '오늘 밤 잠들기까지 걸린 시간은?',
        '전체 수면 시간은 얼마나 되었나요?',
        '수면의 깊이는 어땠나요?',
        '아침에 깨어났을 때의 컨디션은?'
      ]
    },
    {
      id: 'energy',
      name: '에너지 레벨',
      description: '오늘 하루의 에너지 수준을 평가해주세요',
      icon: '⚡',
      questions: [
        '아침에 일어났을 때의 에너지는?',
        '하루 중 가장 활력이 넘쳤던 시간은?',
        '오후의 피로도는 어땠나요?',
        '저녁까지 에너지를 유지했나요?'
      ]
    },
    {
      id: 'stress',
      name: '스트레스 지수',
      description: '현재 느끼고 있는 스트레스 수준을 평가해주세요',
      icon: '😰',
      questions: [
        '전반적인 스트레스 수준은?',
        '업무/학업 관련 스트레스는?',
        '대인관계 스트레스는?',
        '건강 관련 걱정은?'
      ]
    },
    {
      id: 'depression',
      name: '우울/불안 상태',
      description: '오늘 하루의 기분과 불안 수준을 평가해주세요',
      icon: '😔',
      questions: [
        '전반적인 기분은 어땠나요?',
        '불안감이나 걱정은 어땠나요?',
        '일상생활에 대한 흥미는?',
        '미래에 대한 희망은?'
      ]
    }
  ];

  const handleAnswer = (itemId: string, questionIndex: number, value: number) => {
    setAnswers(prev => ({
      ...prev,
      [`${itemId}_${questionIndex}`]: value
    }));
  };

  const getAverageScore = (itemId: string) => {
    const itemAnswers = Object.keys(answers)
      .filter(key => key.startsWith(itemId))
      .map(key => answers[key]);
    
    if (itemAnswers.length === 0) return 0;
    return Math.round(itemAnswers.reduce((sum, val) => sum + val, 0) / itemAnswers.length * 10) / 10;
  };

  const getOverallScore = () => {
    const allScores = Object.keys(answers).map(key => answers[key]);
    if (allScores.length === 0) return 0;
    return Math.round(allScores.reduce((sum, val) => sum + val, 0) / allScores.length * 10) / 10;
  };

  const getScoreDescription = (score: number) => {
    if (score >= 4.5) return '매우 좋음';
    if (score >= 3.5) return '좋음';
    if (score >= 2.5) return '보통';
    if (score >= 1.5) return '나쁨';
    return '매우 나쁨';
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 3.5) return 'text-blue-600';
    if (score >= 2.5) return 'text-yellow-600';
    if (score >= 1.5) return 'text-orange-600';
    return 'text-red-600';
  };

  const handleNext = () => {
    if (currentStep < moodCheckItems.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentItem = moodCheckItems[currentStep];

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
        <Navigation />
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 text-white py-16 pt-24">
          <div className="container mx-auto px-6 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-4xl font-bold mb-4">오늘의 마음 상태 기록 완료!</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              AI가 분석한 오늘의 마음 건강 리포트를 확인해보세요
            </p>
          </div>
        </div>

        <div className="container mx-auto px-6 py-12">
          {/* 종합 점수 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">🎯 오늘의 종합 마음 건강 점수</h2>
            <div className="text-center mb-8">
              <div className={`text-6xl font-bold ${getScoreColor(getOverallScore())} mb-4`}>
                {getOverallScore()}/5.0
              </div>
              <div className={`text-xl font-semibold ${getScoreColor(getOverallScore())}`}>
                {getScoreDescription(getOverallScore())}
              </div>
            </div>
          </div>

          {/* 세부 점수 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {moodCheckItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">{item.icon}</div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(getAverageScore(item.id))} mb-2`}>
                    {getAverageScore(item.id)}/5.0
                  </div>
                  <div className={`text-sm font-medium ${getScoreColor(getAverageScore(item.id))}`}>
                    {getScoreDescription(getAverageScore(item.id))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* AI 분석 결과 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">🤖 AI 마음 건강 분석</h3>
            <div className="bg-white rounded-xl p-6 shadow-md">
              <p className="text-gray-700 leading-relaxed mb-4">
                오늘의 마음 상태를 종합적으로 분석한 결과, 전반적으로 <strong className="text-blue-600">
                {getScoreDescription(getOverallScore())}</strong> 상태입니다.
              </p>
              <p className="text-gray-700 leading-relaxed">
                {getOverallScore() >= 4.0 
                  ? '건강한 마음 상태를 잘 유지하고 계십니다. 현재의 생활 패턴을 계속 유지하시면 됩니다.'
                  : getOverallScore() >= 3.0
                  ? '전반적으로 안정적인 마음 상태입니다. 약간의 개선점이 있다면 더 나은 결과를 얻을 수 있습니다.'
                  : '마음 건강에 주의가 필요한 상태입니다. 전문가와의 상담을 고려해보시거나, 일상생활에서 스트레스 관리에 더 많은 관심을 기울여보세요.'
                }
              </p>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/ai-mind-assistant"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-300"
            >
              🏠 AI 마음 비서로 돌아가기
            </Link>
            <button
              onClick={() => {
                setIsCompleted(false);
                setCurrentStep(0);
                setAnswers({});
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors duration-300"
            >
              🔄 다시 기록하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      <Navigation />
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 text-white py-16 pt-24">
        <div className="container mx-auto px-6 text-center">
          <div className="text-6xl mb-4">{currentItem.icon}</div>
          <h1 className="text-4xl font-bold mb-4">오늘의 마음 상태 기록</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            {currentItem.name} - {currentItem.description}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* 진행률 표시 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              {currentStep + 1} / {moodCheckItems.length}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(((currentStep + 1) / moodCheckItems.length) * 100)}% 완료
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / moodCheckItems.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* 현재 질문들 */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {currentItem.name} 체크
          </h2>
          
          <div className="space-y-6">
            {currentItem.questions.map((question, index) => (
              <div key={index} className="border-b border-gray-100 pb-6 last:border-b-0">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  {index + 1}. {question}
                </h3>
                <div className="grid grid-cols-5 gap-3">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => handleAnswer(currentItem.id, index, value)}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                        answers[`${currentItem.id}_${index}`] === value
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <div className="text-lg font-bold">{value}</div>
                      <div className="text-xs text-gray-500">
                        {value === 1 ? '매우 나쁨' : 
                         value === 2 ? '나쁨' : 
                         value === 3 ? '보통' : 
                         value === 4 ? '좋음' : '매우 좋음'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 네비게이션 버튼들 */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl transition-colors duration-300 ${
              currentStep === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            이전
          </button>

          <button
            onClick={handleNext}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-300"
          >
            {currentStep === moodCheckItems.length - 1 ? '완료하기' : '다음'}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* 뒤로가기 버튼 */}
        <div className="text-center mt-12">
          <Link
            href="/ai-mind-assistant"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            AI 마음 비서로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
