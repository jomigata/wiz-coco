'use client';

import React from 'react';
import Link from 'next/link';

export default function LifeMeaningPage() {
  const testItems = [
    { 
      name: '존재론적 고민과 삶의 의미 탐색', 
      desc: '삶의 궁극적 의미와 존재 이유 탐색', 
      time: '40분', 
      difficulty: '어려움', 
      icon: '🌟',
      href: '/tests/life-meaning/existential-exploration',
      worryExamples: ['사는 게 무슨 의미가 있는지 모르겠어요', '인생의 목표가 사라졌어요', '모든 것이 무의미하게 느껴져요', '나는 왜 존재할까?', '삶의 궁극적인 의미를 찾고 싶어요']
    },
    { 
      name: '죽음 불안과 상실 애도', 
      desc: '죽음에 대한 불안과 상실 경험의 치유', 
      time: '35분', 
      difficulty: '어려움', 
      icon: '🕊️',
      href: '/tests/life-meaning/death-grief',
      worryExamples: ['죽음이 너무 두려워요', '내 삶이 곧 끝날 것 같아요', '사랑하는 사람의 죽음을 받아들이기 힘들어요', '사후 세계에 대해 궁금해요', '존엄한 죽음을 맞이하고 싶어요']
    },
    { 
      name: '영적 성장과 내면 탐색', 
      desc: '내면의 평화와 영적 성숙을 위한 탐색', 
      time: '30분', 
      difficulty: '보통', 
      icon: '🧘',
      href: '/tests/life-meaning/spiritual-growth',
      worryExamples: ['내면의 평화를 얻고 싶어요', '영적인 경험을 해보고 싶어요', '종교에 대한 회의감이 들어요', '명상이나 수련을 통해 자신을 돌아보고 싶어요', '삶의 초월적인 면을 이해하고 싶어요']
    },
    { 
      name: '윤리적 딜레마와 도덕적 갈등', 
      desc: '도덕적 가치관 정립과 윤리적 의사결정', 
      time: '30분', 
      difficulty: '어려움', 
      icon: '⚖️',
      href: '/tests/life-meaning/ethical-dilemma',
      worryExamples: ['옳다고 생각하는 것과 현실이 달라 갈등해요', '윤리적으로 올바른 선택이 무엇인지 모르겠어요', '내 결정이 타인에게 미칠 영향이 두려워요', '양심에 어긋나는 일을 해야 할 상황이에요', '도덕적 신념을 지키기가 너무 힘들어요']
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 min-h-full">
      <div className="max-w-5xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-3xl">
              🌌
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">삶의 의미 및 실존적 문제</h1>
              <p className="text-gray-300 text-lg mt-2">삶의 근본적인 의미를 탐색하고 실존적 고민을 해결하여 충만한 삶을 지원합니다.</p>
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
                실존주의 심리학, 인본주의 심리학, 의미치료(Logotherapy), 초개인 심리학을 바탕으로 합니다.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                <span>📋</span> 연관 기존 검사
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                삶의 의미 척도(PIL), 삶의 만족도 척도, 영성 척도, 도덕 판단력 검사(DIT) 등과 연계됩니다.
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
            <h3 className="text-lg font-semibold text-white mb-2">🌌 실존적 문제 상담 안내</h3>
            <p className="text-gray-300 text-sm">
              실존적 문제는 인간의 근본적인 고민입니다. 충분한 시간을 갖고 깊이 있게 성찰해 주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
