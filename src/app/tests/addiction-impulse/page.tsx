'use client';

import React from 'react';
import Link from 'next/link';

export default function AddictionImpulsePage() {
  const testItems = [
    { 
      name: '물질 및 행위 중독 문제 해결', 
      desc: '알코올, 게임, 쇼핑 등 다양한 중독 문제 해결', 
      time: '30분', 
      difficulty: '어려움', 
      icon: '🔗',
      href: '/tests/addiction-impulse/substance-behavioral',
      worryExamples: [
        '술(담배)을 끊고 싶은데 안 돼요', '인터넷/게임에 너무 중독됐어요', '도박에서 헤어나올 수 없어요', 
        '특정 행동에 대한 통제가 안 돼요', '음식에 대한 강한 욕구가 힘들어요', '쇼핑 중독으로 빚이 늘어나요',
        '성적 행동을 조절할 수 없어요', '일 중독으로 가족을 잃을 것 같아요', '스마트폰 없이는 불안해요',
        '약물에 의존하게 됐어요', '중독 때문에 인간관계가 망가져요', '끊으려고 하면 금단증상이 와요'
      ]
    },
    { 
      name: '성인 ADHD 및 집중력 문제', 
      desc: 'ADHD 증상 평가와 관리 방안', 
      time: '30분', 
      difficulty: '보통', 
      icon: '🎯',
      href: '/tests/addiction-impulse/adhd-focus',
      worryExamples: [
        '집중을 잘 못하고 산만해요', '자꾸 중요한 걸 잊어버려요', '일을 시작하기가 너무 힘들어요',
        '한 가지 일을 끝까지 못해요', '쉽게 지루해하고 다른 일을 찾아요', '계획을 세워도 실행이 안 돼요'
      ]
    },
    { 
      name: '충동성 및 자기 조절 능력 향상', 
      desc: '충동적 행동 패턴 분석과 조절 능력 강화', 
      time: '25분', 
      difficulty: '보통', 
      icon: '🛑',
      href: '/tests/addiction-impulse/impulse-control',
      worryExamples: [
        '화가 나면 참을 수 없어요', '생각 없이 행동하고 후회해요', '욕구를 참는 게 너무 어려워요',
        '순간적으로 폭발하는 성격이에요', '계획 없이 충동적으로 결정해요', '자제력이 부족해서 고민이에요'
      ]
    },
    { 
      name: '강박적 행동 및 반복 행위', 
      desc: '강박 증상과 반복적 행동 패턴 관리', 
      time: '35분', 
      difficulty: '어려움', 
      icon: '🔄',
      href: '/tests/addiction-impulse/compulsive-behavior',
      worryExamples: [
        '같은 행동을 계속 반복해요', '확인하지 않으면 불안해요', '정리 정돈에 지나치게 집착해요',
        '특정 숫자나 순서에 매달려요', '더러워질까 봐 계속 씻어요', '나쁜 일이 생길 것 같아서 의식을 해요'
      ]
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 min-h-full">
      <div className="max-w-5xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-3xl">
              🔗
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">중독 및 충동 조절 문제</h1>
              <p className="text-gray-300 text-lg mt-2">물질 및 행위 중독, 성인 ADHD 등 충동 조절의 어려움을 해결합니다.</p>
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
                중독의 뇌과학(보상회로), 행동주의 심리학, 12단계 프로그램, 신경발달장애 이론을 바탕으로 합니다.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                <span>📋</span> 연관 기존 검사
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                중독 선별 검사(AUDIT-K, DAST), 성인 ADHD 자가보고 척도(K-ASRS), 종합주의력검사(CAT) 등과 연계됩니다.
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
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 text-center text-sm font-medium"
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
            <h3 className="text-lg font-semibold text-white mb-2">🔗 중독 및 충동 조절 안내</h3>
            <p className="text-gray-300 text-sm">
              중독이나 심각한 충동 조절 문제가 있으시면 즉시 전문의와 상담하시기 바랍니다. 본 검사는 진단이 아닌 선별 도구입니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
