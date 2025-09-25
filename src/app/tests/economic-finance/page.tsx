'use client';

import React from 'react';
import Link from 'next/link';

export default function EconomicFinancePage() {
  const testItems = [
    { 
      name: '재정 스트레스와 부채 문제', 
      desc: '경제적 부담이 정신건강에 미치는 영향 관리', 
      time: '25분', 
      difficulty: '보통', 
      icon: '💳',
      href: '/tests/economic-finance/financial-stress',
      worryExamples: [
        '학자금 대출 상환 압박감 때문에 미래가 안 보여요', '카드값 돌려막기로 하루하루를 버티고 있어요', '주택 대출 이자가 너무 부담스러워요', 
        '가족/친구에게 빌린 돈 때문에 관계가 멀어졌어요', '월급이 나와도 빚 갚는 데 다 써요', '파산할까 봐 매일 두려워요'
      ]
    },
    { 
      name: '소비·투자 심리와 돈 습관', 
      desc: '소비 패턴과 투자 성향 분석', 
      time: '25분', 
      difficulty: '보통', 
      icon: '💰',
      href: '/tests/economic-finance/spending-habits',
      worryExamples: [
        '스트레스를 받으면 충동구매를 해요', '주식/코인 투자 실패로 무기력감에 빠졌어요', '남들에게 잘 보이기 위해 무리해서 소비해요',
        '돈에 대한 강박 때문에 구두쇠 소리를 들어요', '돈을 쓰는 것에 대한 죄책감이 커요', '투자에 대한 두려움 때문에 아무것도 못해요'
      ]
    },
    { 
      name: '미래 불안과 경제적 안정', 
      desc: '경제적 미래에 대한 불안 수준 평가', 
      time: '20분', 
      difficulty: '쉬움', 
      icon: '📈',
      href: '/tests/economic-finance/future-security',
      worryExamples: [
        '월급이 너무 적어서 미래가 불안해요', '프리랜서라 수입이 너무 불안정해요', '결혼/출산을 경제적인 이유로 포기하고 싶어요',
        '노후 준비가 전혀 되어있지 않아 두려워요', '물가 상승 때문에 생활이 점점 어려워져요'
      ]
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 min-h-full">
      <div className="max-w-5xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-yellow-500 to-green-500 flex items-center justify-center text-3xl">
              💰
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">경제 및 재정 문제</h1>
              <p className="text-gray-300 text-lg mt-2">재정 스트레스, 부채 문제, 소비 패턴 등 경제적 어려움을 심리적 관점에서 해결합니다.</p>
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
                행동 경제학, 사회비교 이론, 스트레스 이론, 학습된 무기력 이론을 바탕으로 합니다.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                <span>📋</span> 연관 기존 검사
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                재정 스트레스 척도, 소비성향 검사, 투자자 성향 분석, 충동성 척도 등과 연계됩니다.
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
                  className="w-full bg-gradient-to-r from-yellow-500 to-green-600 text-white py-2 px-4 rounded-lg hover:from-yellow-600 hover:to-green-700 transition-all duration-300 text-center text-sm font-medium"
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
            <h3 className="text-lg font-semibold text-white mb-2">💰 경제적 웰빙 안내</h3>
            <p className="text-gray-300 text-sm">
              경제적 문제는 심리적 스트레스와 밀접한 관련이 있습니다. 전문가의 도움을 받아 건강한 재정 관리 습관을 기르세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
