'use client';

import React from 'react';
import Link from 'next/link';

export default function CareerWorkPage() {
  const testItems = [
    { 
      name: '진로 탐색과 직업 선택', 
      desc: '적성과 흥미에 맞는 진로 방향 탐색', 
      time: '30분', 
      difficulty: '보통', 
      icon: '🧭',
      href: '/tests/career-work/career-exploration',
      worryExamples: ['어떤 직업을 선택해야 할지 모르겠어요', '제게 맞는 진로가 있을까요?', '진로를 결정했는데 확신이 없어요', '취업 준비가 너무 막막해요', '이직을 고민 중인데 어떻게 해야 할까요?']
    },
    { 
      name: '직무 스트레스와 번아웃', 
      desc: '직장 번아웃 위험도 측정과 예방', 
      time: '25분', 
      difficulty: '보통', 
      icon: '🔥',
      href: '/tests/career-work/burnout-assessment',
      worryExamples: ['업무량이 너무 많아 소진 상태예요', '감정 노동으로 인해 정신적으로 지쳤어요', '성과 압박 때문에 매일이 살얼음판 같아요', '직장에서의 역할이 너무 모호해서 스트레스 받아요']
    },
    { 
      name: '창업 스트레스와 실패 두려움', 
      desc: '창업 과정의 심리적 부담 관리', 
      time: '30분', 
      difficulty: '어려움', 
      icon: '🏢',
      href: '/tests/career-work/entrepreneurship-stress',
      worryExamples: ['사업 실패에 대한 두려움으로 잠을 못 자요', '모든 책임을 혼자 져야 한다는 압박감이 커요', '직원 관리 문제가 가장 힘들어요', '자금 압박 때문에 극심한 스트레스를 받아요']
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 min-h-full">
      <div className="max-w-5xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-3xl">
              💼
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">진로 및 직업 문제</h1>
              <p className="text-gray-300 text-lg mt-2">진로 선택부터 직장 생활의 어려움까지 직업과 관련된 모든 문제를 다룹니다.</p>
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
                직업 발달 이론(Super, Holland), 사회인지 진로 이론(SCCT), 직무요구-자원 모델(JD-R Model)을 기반으로 합니다.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                <span>📋</span> 연관 기존 검사
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                STRONG, Holland, 진로준비도 검사, 소진척도(MBI), 직무 스트레스 검사(KOSS) 등과 연계됩니다.
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
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-2 px-4 rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 text-center text-sm font-medium"
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
              진로와 직업 선택은 인생의 중요한 결정입니다. 현재 상황과 미래 목표를 종합적으로 고려하여 답변해 주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
