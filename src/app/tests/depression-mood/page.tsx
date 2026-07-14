'use client';

import React from 'react';
import Link from 'next/link';

export default function DepressionMoodPage() {
  const testItems = [
    { 
      name: '우울감 및 무기력감 극복', 
      desc: 'PHQ-9 기반 우울 증상 모니터링 및 회복', 
      time: '20분', 
      difficulty: '쉬움', 
      icon: '😔',
      href: '/tests/depression-mood/depression-assessment',
      worryExamples: ['만사가 귀찮고 의욕이 없어요', '계속 우울하고 슬퍼요', '아무것도 하고 싶지 않아요', '삶의 의미를 못 찾겠어요', '불면증 때문에 힘들어요']
    },
    { 
      name: '분노 조절 및 충동성 관리', 
      desc: '분노와 충동적 행동 패턴 조절 훈련', 
      time: '25분', 
      difficulty: '보통', 
      icon: '🔥',
      href: '/tests/depression-mood/anger-management',
      worryExamples: ['쉽게 화를 내고 후회해요', '욱하는 성격 때문에 힘들어요', '분노를 조절하기 어려워요', '충동적으로 행동해서 손해를 봐요', '화를 참는 게 너무 힘들어요']
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 min-h-full">
      <div className="max-w-5xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-3xl">
              💙
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">우울 및 기분 문제</h1>
              <p className="text-gray-300 text-lg mt-2">우울감, 무기력감, 분노 조절 등 기분과 관련된 문제를 다룹니다.</p>
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
                인지행동 이론(CBT - Beck의 인지삼제), 행동 활성화, 정신분석 이론을 바탕으로 기분 장애를 분석합니다.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                <span>📋</span> 연관 기존 검사
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                BDI(벡 우울 척도), CES-D, SCL-90-R(우울 척도), 상태-특성 분노 표현 척도(STAXI) 등과 연계됩니다.
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
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 text-center text-sm font-medium"
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
            <h3 className="text-lg font-semibold text-white mb-2">⚠️ 중요 안내</h3>
            <p className="text-gray-300 text-sm">
              심각한 우울감이나 자해 충동이 있으시면 즉시 전문의와 상담하시기 바랍니다. 본 검사는 진단이 아닌 선별 도구입니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
