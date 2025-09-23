'use client';

import React from 'react';
import Link from 'next/link';

export default function PersonalityTemperamentPage() {
  const testItems = [
    { 
      name: '성격 유형과 강점 분석', 
      desc: 'MBTI, 에니어그램 등 다각적 성격 분석', 
      time: '20분', 
      difficulty: '보통', 
      icon: '🎭',
      href: '/tests/personality-temperament/personality-analysis',
      worryExamples: ['저는 어떤 사람인가요?', '제 성격의 장단점이 궁금해요', '왜 저는 늘 이런 식으로 행동할까요?', '다른 사람들은 저를 어떻게 볼까요?', '제 성격 때문에 힘든 부분이 있어요']
    },
    { 
      name: '타고난 기질과 행동 패턴 분석', 
      desc: '생물학적 기질과 행동 패턴 심층 분석', 
      time: '25분', 
      difficulty: '보통', 
      icon: '⚡',
      href: '/tests/personality-temperament/temperament-analysis',
      worryExamples: ['저는 왜 이렇게 예민할까요?', '새로운 도전을 두려워해요', '자꾸 충동적으로 결정해요', '끈기가 부족해서 고민이에요', '사람들 앞에서 말이 잘 안 나와요']
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 min-h-full">
      <div className="max-w-5xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-3xl">
              🎭
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">성격 및 기질 탐색</h1>
              <p className="text-gray-300 text-lg mt-2">개인의 성격 특성과 타고난 기질을 파악하여 자기 이해를 돕습니다.</p>
            </div>
          </div>
        </div>

        {/* 이론적 배경 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                <span>🧠</span> 기본 심리 이론
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                성격 유형론(Type Theory), 특질 이론(Trait Theory), 정신분석 이론을 바탕으로 개인의 성격과 기질을 과학적으로 분석합니다.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                <span>📋</span> 연관 기존 검사
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                MBTI, NEO-PI-R(Big Five), TCI, DISC, EPPS, SCT(문장완성검사) 등 표준화된 검사 도구와 연계됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* 검사 목록 - 카드 그리드 레이아웃 */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {testItems.map((item, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 hover:bg-white/15 hover:scale-[1.02] transition-all duration-300 flex flex-col h-full">
              {/* 카드 헤더 */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white leading-tight">{item.name}</h3>
                </div>
              </div>

              {/* 카드 내용 */}
              <div className="flex-1 flex flex-col">
                <p className="text-gray-300 text-sm mb-3 leading-relaxed">{item.desc}</p>
                
                {/* 고민 예시 - 축약된 형태 */}
                <div className="bg-black/20 rounded-lg p-3 mb-4 flex-1">
                  <h4 className="text-xs font-semibold text-yellow-400 mb-2 flex items-center gap-1">
                    <span>💭</span> 주요 고민
                  </h4>
                  <div className="space-y-1">
                    {item.worryExamples.slice(0, 3).map((worry, idx) => (
                      <div key={idx} className="text-xs text-gray-300 truncate">
                        • "{worry}"
                      </div>
                    ))}
                    {item.worryExamples.length > 3 && (
                      <div className="text-xs text-gray-400">
                        +{item.worryExamples.length - 3}개 더...
                      </div>
                    )}
                  </div>
                </div>

                {/* 카드 하단 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.difficulty === '쉬움' ? 'bg-green-500/20 text-green-400' :
                      item.difficulty === '보통' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {item.difficulty}
                    </span>
                    <span className="text-gray-400 text-xs">{item.time}</span>
                  </div>
                </div>

                {/* 검사 시작 버튼 */}
                <Link
                  href={item.href}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 text-center text-sm font-medium"
                >
                  검사 시작 →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* 하단 안내 */}
        <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-2">검사 전 안내사항</h3>
            <p className="text-gray-300 text-sm">
              정확한 결과를 위해 솔직하고 자연스럽게 답변해 주세요. 모든 검사는 전문 상담사의 해석과 함께 제공됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
