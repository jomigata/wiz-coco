'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

function MbtiAgeResultContent() {
  const searchParams = useSearchParams();
  const mbtiType = searchParams.get('type') || 'ISFP';
  const age = searchParams.get('age') || '25';
  const name = searchParams.get('name') || '사용자';

  // 연령대별 조언
  const getAgeSpecificAdvice = (type: string, userAge: string) => {
    const ageNum = parseInt(userAge);
    
    if (ageNum <= 12) {
      return {
        title: '아동기 (7-12세)',
        advice: `${type} 유형의 아이는 자신만의 특별한 재능을 가지고 있습니다. 창의성과 상상력을 키워주세요.`,
        tips: [
          '다양한 경험을 통해 흥미를 찾아보세요',
          '강요보다는 격려와 지지를 해주세요',
          '아이의 감정을 인정하고 공감해주세요'
        ]
      };
    } else if (ageNum <= 19) {
      return {
        title: '청소년기 (13-19세)',
        advice: `${type} 유형의 청소년은 자아 정체성을 형성하는 중요한 시기입니다. 자신의 가치관을 찾아가도록 도와주세요.`,
        tips: [
          '진로 탐색을 위한 다양한 활동을 경험해보세요',
          '또래와의 건강한 관계를 형성하세요',
          '자신의 강점을 발견하고 개발하세요'
        ]
      };
    } else if (ageNum <= 59) {
      return {
        title: '성인기 (20-59세)',
        advice: `${type} 유형의 성인은 자신의 강점을 활용하여 사회에 기여할 수 있습니다. 지속적인 성장을 추구하세요.`,
        tips: [
          '자신의 가치관에 맞는 일을 찾으세요',
          '인간관계에서 균형을 유지하세요',
          '스트레스 관리 방법을 개발하세요'
        ]
      };
    } else {
      return {
        title: '노년기 (60세 이상)',
        advice: `${type} 유형의 어르신은 풍부한 경험과 지혜를 가지고 있습니다. 이를 후세에 전달하는 역할을 하세요.`,
        tips: [
          '건강한 생활 습관을 유지하세요',
          '새로운 취미나 관심사를 개발하세요',
          '가족과 지역사회와의 연결을 유지하세요'
        ]
      };
    }
  };

  const ageAdvice = getAgeSpecificAdvice(mbtiType, age);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-green-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              연령별 MBTI 분석 결과
            </h1>
            <p className="text-emerald-200 text-lg">
              {name}님의 {mbtiType} 유형 분석 ({age}세)
            </p>
          </div>

          {/* 결과 카드 */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 mb-8 border border-white/20">
            <div className="text-center mb-6">
              <div className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg text-2xl font-bold mb-4">
                {mbtiType}
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">
                {ageAdvice.title}
              </h2>
              <p className="text-emerald-200 text-lg leading-relaxed">
                {ageAdvice.advice}
              </p>
            </div>

            {/* 연령별 조언 */}
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                이 시기에 중요한 것들
              </h3>
              <ul className="space-y-3">
                {ageAdvice.tips.map((tip, index) => (
                  <li key={index} className="flex items-start text-emerald-200">
                    <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="text-center space-y-4">
            <Link
              href="/tests/mbti"
              className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              다시 검사하기
            </Link>
            <div>
              <Link
                href="/mypage"
                className="text-emerald-300 hover:text-emerald-200 transition-colors"
              >
                마이페이지로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingComponent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-green-900 flex items-center justify-center">
      <div className="text-white text-xl">결과를 불러오는 중...</div>
    </div>
  );
}

export default function MbtiAgeResultPage() {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <MbtiAgeResultContent />
    </Suspense>
  );
}