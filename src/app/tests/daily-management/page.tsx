'use client';

import React from 'react';
import Link from 'next/link';

export default function DailyManagementPage() {
  const testItems = [
    { 
      name: '시간 관리 및 생산성 향상', 
      desc: '효율적인 시간 관리와 생산성 증대 방법', 
      time: '25분', 
      difficulty: '쉬움', 
      icon: '⏰',
      href: '/tests/daily-management/time-management',
      worryExamples: [
        '시간 관리가 너무 어려워요', '미루는 습관 때문에 항상 급하게 처리해요', '중요한 일과 급한 일을 구분하지 못해요', 
        '계획을 세워도 지키지 못해요', '멀티태스킹을 하다가 모든 것이 중도반단돼요', '완벽주의 때문에 일이 늦어져요'
      ]
    },
    { 
      name: '생활 습관 및 루틴 관리', 
      desc: '건강한 생활 패턴 형성과 루틴 관리', 
      time: '20분', 
      difficulty: '쉬움', 
      icon: '🔄',
      href: '/tests/daily-management/lifestyle-habits',
      worryExamples: [
        '생활 패턴이 엉망이에요', '일찍 자고 일찍 일어나는 게 너무 어려워요', '운동을 시작해도 오래 지속하지 못해요',
        '건강한 습관을 만들고 싶은데 의지력이 부족해요', '나쁜 습관을 끊기가 너무 힘들어요', '규칙적인 생활을 하고 싶어요'
      ]
    },
    { 
      name: '자기 관리 및 셀프케어', 
      desc: '신체적, 정신적 자기 관리 능력 향상', 
      time: '20분', 
      difficulty: '쉬움', 
      icon: '🧘‍♀️',
      href: '/tests/daily-management/self-care',
      worryExamples: [
        '자기 관리를 못하겠어요', '스트레스 해소법을 모르겠어요', '휴식을 취하는 것에 죄책감을 느껴요',
        '자신을 돌보는 방법을 모르겠어요', '번아웃이 와도 쉬지 못해요', '건강 관리를 소홀히 해요'
      ]
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 min-h-full">
      <div className="max-w-5xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-3xl">
              📅
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">일상생활 및 자기 관리</h1>
              <p className="text-gray-300 text-lg mt-2">시간 관리, 생활 습관, 자기 관리 등 일상생활의 어려움을 해결합니다.</p>
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
                행동주의 심리학, 인지행동 이론, 자기조절 이론, 습관 형성 이론을 바탕으로 합니다.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                <span>📋</span> 연관 기존 검사
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                시간 관리 척도, 자기효능감 척도, 생활 만족도 척도, 자기조절 능력 척도 등과 연계됩니다.
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
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 text-center text-sm font-medium"
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
            <h3 className="text-lg font-semibold text-white mb-2">📅 일상 관리 향상 안내</h3>
            <p className="text-gray-300 text-sm">
              건강한 일상 관리는 작은 습관의 변화에서 시작됩니다. 점진적이고 지속 가능한 변화를 목표로 하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
