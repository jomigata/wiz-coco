'use client';

import React from 'react';
import Link from 'next/link';

export default function RomanticRelationsPage() {
  const testItems = [
    { 
      name: '연인 관계 갈등과 애착 문제', 
      desc: '연애 갈등 해결과 건강한 애착 관계 형성', 
      time: '25분', 
      difficulty: '보통', 
      icon: '💕',
      href: '/tests/romantic-relations/couple-conflict',
      worryExamples: ['연인과 계속 싸워요', '사랑받고 있는지 모르겠어요', '애인에게 너무 집착해요', '자꾸 상처 주는 말을 해요', '헤어진 후유증이 너무 커요']
    },
    { 
      name: '이성 관계와 데이팅 전략', 
      desc: '건강한 이성 관계 시작과 발전 전략', 
      time: '20분', 
      difficulty: '쉬움', 
      icon: '💘',
      href: '/tests/romantic-relations/dating-strategy',
      worryExamples: ['이성을 어떻게 만나야 할지 모르겠어요', '소개팅이 너무 힘들어요', '썸 단계에서 항상 끝나요', '고백할 용기가 없어요', '이성에게 인기가 없어요']
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 min-h-full">
      <div className="max-w-5xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center text-3xl">
              💕
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">연인 및 부부 관계</h1>
              <p className="text-gray-300 text-lg mt-2">연애 관계의 갈등부터 결혼 생활의 어려움까지 친밀한 관계의 문제를 다룹니다.</p>
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
                애착 이론(Bowlby, Ainsworth), 사랑의 삼각형 이론(Sternberg), 투자 모델을 바탕으로 합니다.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                <span>📋</span> 연관 기존 검사
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                성인애착유형 검사(ECR-R), 결혼만족도척도(ENRICH, MSI), 성격유형검사(MBTI, NEO) 등과 연계됩니다.
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
                  className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-300 text-center text-sm font-medium"
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
            <h3 className="text-lg font-semibold text-white mb-2">💕 연인관계 상담 안내</h3>
            <p className="text-gray-300 text-sm">
              건강한 연애 관계는 서로를 이해하고 존중하는 것에서 시작됩니다. 솔직하게 답변해 주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
