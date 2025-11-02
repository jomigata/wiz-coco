'use client';

import React, { useState, useEffect, useRef } from 'react';
import { questions } from '@/data/mbtiQuestions';

interface Props {
  onComplete: (results: { [key: string]: { type: string; answer: number } }) => void;
  savedAnswers?: { [key: string]: { type: string; answer: number } };
  savedCurrentQuestion?: number;
  onAnswerChange?: (answers: { [key: string]: { type: string; answer: number } }, currentQuestion: number) => void;
  onBack?: () => void;
}

export default function MBTITest({ onComplete, savedAnswers, savedCurrentQuestion, onAnswerChange, onBack }: Props) {
  // 저장된 답변이 있으면 복원, 없으면 처음부터 시작
  const initialAnswers = savedAnswers || {};
  const initialCurrentQuestion = savedCurrentQuestion !== undefined ? savedCurrentQuestion : 0;
  
  // 디버깅 로그 추가
  console.log('[MBTITest] 초기화:', { 
    savedCurrentQuestion, 
    initialCurrentQuestion, 
    savedAnswersCount: Object.keys(initialAnswers).length 
  });
  
  const [currentQuestion, setCurrentQuestion] = useState(initialCurrentQuestion);
  const [answers, setAnswers] = useState<{ [key: string]: { type: string; answer: number } }>(initialAnswers);
  const [loading, setLoading] = useState(false);
  const [showStar, setShowStar] = useState(false);
  
  // 마우스 움직임 타이머 ref 추가
  const autoEnableTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 질문 변경시 별표 표시 여부 설정
  useEffect(() => {
    setShowStar(true);
    // 타이머 초기화
    if (autoEnableTimerRef.current) {
      clearTimeout(autoEnableTimerRef.current);
    }
  }, [currentQuestion]);

  // 현재 질문의 답변 상태를 업데이트하는 함수
  const updateAnswer = (value: number) => {
    const currentType = questions[currentQuestion].type;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: { type: currentType, answer: value }
    }));
  };

  const getAnswerText = (value: number) => {
    switch(value) {
      case 7: return '매우 그렇다';
      case 6: return '그렇다';
      case 5: return '약간 그렇다';
      case 4: return '모르겠다';
      case 3: return '약간 그렇지 않다';
      case 2: return '그렇지 않다';
      case 1: return '매우 그렇지 않다';
      default: return '';
    }
  };

  // 답변 변경 시 부모 컴포넌트에 알림 (진행 상태 저장용)
  useEffect(() => {
    if (onAnswerChange && Object.keys(answers).length > 0) {
      onAnswerChange(answers, currentQuestion);
    }
  }, [answers, currentQuestion, onAnswerChange]);

  const handleAnswer = (value: number) => {
    setShowStar(false);
    const newAnswers = { ...answers };
    const currentType = questions[currentQuestion].type;
    newAnswers[currentQuestion] = { type: currentType, answer: value };
    setAnswers(newAnswers);

    // 마지막 질문이 아닌 경우 0.5초 후 자동으로 다음 질문으로 이동
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
        
        // 0.5초 후에 자동으로 hover 활성화
        autoEnableTimerRef.current = setTimeout(() => {
          setShowStar(true);
        }, 500);
      }, 500);
    } else {
      // 마지막 질문인 경우 결과 제출 전 약간의 지연 시간을 줌
      setTimeout(() => {
        setLoading(true);
        onComplete(newAnswers);
      }, 500);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      // 답변 저장 (이전 문항으로 이동 전)
      if (onAnswerChange && Object.keys(answers).length > 0) {
        onAnswerChange(answers, currentQuestion);
      }
      setShowStar(true);
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleBack = () => {
    // 이전페이지로 이동 전 답변 저장
    if (onAnswerChange && Object.keys(answers).length > 0) {
      onAnswerChange(answers, currentQuestion);
    }
    if (onBack) {
      onBack();
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setShowStar(false);
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setLoading(true);
      onComplete(answers);
    }
  };

  const getCircleSize = (value: number) => {
    switch(value) {
      case 7: return 'w-16 h-16';
      case 6: return 'w-14 h-14';
      case 5: return 'w-12 h-12';
      case 4: return 'w-11 h-11';
      case 3: return 'w-12 h-12';
      case 2: return 'w-14 h-14';
      case 1: return 'w-16 h-16';
      default: return 'w-12 h-12';
    }
  };

  const isAnswered = (value: number) => {
    return answers[currentQuestion]?.answer === value;
  };

  const getCurrentAnswer = () => {
    return answers[currentQuestion]?.answer;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-emerald-200 text-lg">결과를 분석하고 있습니다...</p>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="relative">
      {/* 메인 컨텐츠 영역 - 모든 내용을 하나의 페이지로 통합 */}
      <div className="max-w-3xl mx-auto pt-8 px-6 pb-12"
        tabIndex={0}
        ref={containerRef}
      >
        {/* 상단 제목 및 진행률 표시 영역 - 메인 컨텐츠 안으로 이동 */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-white mb-2">개인용 MBTI 검사</h1>
            <p className="text-emerald-200">자신에게 맞는 답변을 선택해주세요</p>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-lg font-semibold text-emerald-200">
                질문 {currentQuestion + 1} / {questions.length}
              </span>
              <span className="text-emerald-300">
                진행률: {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-emerald-800/50 rounded-full h-3">
              <div
                className="bg-emerald-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
        {/* 질문 표시 영역 - 더 명확하게 강조 */}
        <div 
          key={currentQuestion}
          className="mb-12 animate-fade-in bg-emerald-800/30 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-emerald-700/50"
          style={{
            animation: 'fadeInOut 0.5s ease-in-out',
          }}
        >
          <style jsx>{`
            @keyframes fadeInOut {
              0% {
                opacity: 0;
                transform: translateX(200px);
              }
              100% {
                opacity: 1;
                transform: translateX(0);
              }
            }
            .animate-fade-in {
              opacity: 1;
              animation-fill-mode: both;
            }
          `}</style>
          <div className="text-center">
            <span className="inline-block px-4 py-2 bg-emerald-600/30 text-emerald-200 rounded-full text-sm font-medium mb-4">
              질문 {currentQuestion + 1}
            </span>
            <h2 className="text-2xl md:text-3xl text-white font-medium leading-relaxed">
              {questions[currentQuestion].question}
            </h2>
          </div>
        </div>

        {/* 답변 선택 영역 */}
        <div className="bg-emerald-800/50 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-emerald-700/50 mb-8">
          <div className="flex flex-col items-center space-y-8">
            <div className="w-full max-w-2xl">
              {/* 답변 선택지 */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-emerald-300 font-medium">그렇다</span>
                <span className="text-emerald-300 font-medium">그렇지 않다</span>
              </div>
              <div className="flex items-center justify-between gap-0">
                {[7, 6, 5, 4, 3, 2, 1].map((value) => (
                  <div key={value} className="relative group flex-1 flex flex-col items-center">
                    <button
                      onClick={() => handleAnswer(value)}
                      className={`${getCircleSize(value)} rounded-full border-2 transition-all duration-300 flex items-center justify-center
                        ${value > 4 
                          ? 'border-emerald-500 hover:bg-emerald-500 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20' 
                          : value === 4 
                            ? 'border-emerald-400 hover:bg-emerald-400 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-400/20'
                            : 'border-emerald-500 hover:bg-emerald-500 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20'
                        }
                        ${isAnswered(value) && showStar
                          ? value > 4 
                            ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20'
                            : value === 4
                              ? 'bg-emerald-400 border-emerald-400 shadow-lg shadow-emerald-400/20'
                              : 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20'
                          : 'bg-emerald-900/50 hover:scale-110'
                        }
                        group/btn
                      `}
                      aria-label={getAnswerText(value)}
                    >
                      {/* 체크 아이콘 - 답변 표시용 */}
                      {isAnswered(value) && (
                        <svg 
                          className="w-6 h-6 transition-all duration-200 absolute text-white opacity-100 scale-110"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                    {/* 답변 텍스트 - 마우스 오버시에만 보이도록 수정 */}
                    <p className={`text-center text-xs mt-2 transition-all duration-200 
                      opacity-0 group-hover:opacity-100 absolute top-full 
                      text-emerald-300 whitespace-nowrap pointer-events-none`}>
                      {getAnswerText(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 하단 설명 및 버튼 */}
        <div className="text-center text-emerald-300 text-sm mb-8">
          깊이 생각하지 말고 자연스럽게 떠오르는 첫 느낌으로 선택해 주세요.
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={() => {
              if (currentQuestion === 0 && onBack) {
                handleBack();
              } else if (currentQuestion > 0) {
                handlePrevQuestion();
              }
            }}
            className={`px-5 py-2 rounded-lg font-medium 
              ${(currentQuestion > 0 || (currentQuestion === 0 && onBack))
                ? 'bg-emerald-600/70 text-emerald-100 hover:bg-emerald-600/90' 
                : 'bg-emerald-900/30 text-emerald-700 cursor-not-allowed'
              } transition-all duration-300`}
            disabled={currentQuestion === 0 && !onBack}
          >
            {currentQuestion === 0 ? '이전페이지' : '이전 문항'}
          </button>
          
          <div className="text-sm text-emerald-300">
            <span className="font-semibold">{currentQuestion + 1}</span> / {questions.length}
          </div>
          
          <button
            onClick={handleNextQuestion}
            className={`px-5 py-2 rounded-lg font-medium 
              ${answers[currentQuestion] !== undefined
                ? 'bg-emerald-700/50 text-emerald-200 hover:bg-emerald-700/80'
                : 'bg-emerald-900/30 text-emerald-700 cursor-not-allowed'
              } transition-all duration-300`}
            disabled={answers[currentQuestion] === undefined}
          >
            {currentQuestion === questions.length - 1 ? '결과 보기' : '다음 문항'}
          </button>
        </div>
      </div>
    </div>
  );
} 