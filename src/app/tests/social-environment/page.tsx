'use client';

import React from 'react';
import Link from 'next/link';

export default function SocialEnvironmentPage() {
  const testItems = [
    { 
      name: '학교 및 교육 시스템 부적응', 
      desc: '학교폭력, 학업 스트레스, 교육 부적응 해결', 
      time: '25분', 
      difficulty: '보통', 
      icon: '🏫',
      href: '/tests/social-environment/school-maladjustment',
      worryExamples: [
        '학교폭력 피해로 등교를 거부하고 있어요', '시험 기간만 되면 몸이 아파요', '사교육에 대한 압박감이 너무 심해요', 
        '자퇴를 고민 중인데 막막해요', '성적 지상주의 교육에 회의감을 느껴요', '선생님과의 관계가 어려워요'
      ]
    },
    { 
      name: '사회적 소수자로서의 어려움', 
      desc: '성소수자 정체성 지원 및 사회적 편견 극복', 
      time: '30분', 
      difficulty: '어려움', 
      icon: '🏳️‍🌈',
      href: '/tests/social-environment/minority-struggles',
      worryExamples: [
        '성 정체성 때문에 고민이에요', '커밍아웃이 두려워요', '사람들의 시선이 힘들어요',
        '성소수자로서의 삶에 대한 조언이 필요해요', '전환(transition) 과정에서 심리적 어려움을 겪고 있어요', '가족의 이해를 받지 못해요'
      ]
    },
    { 
      name: '기후변화와 환경 불안', 
      desc: '환경 문제로 인한 미래 불안과 생태 우울 완화', 
      time: '20분', 
      difficulty: '쉬움', 
      icon: '🌍',
      href: '/tests/social-environment/climate-anxiety',
      worryExamples: [
        '기후 위기 뉴스를 보면 미래에 대한 희망이 사라져요', '미세먼지, 오염 때문에 건강이 나빠질까 봐 걱정돼요', '자연재해에 대한 불안감이 커요',
        '환경을 파괴하는 소비 생활에 죄책감을 느껴요', '지구의 미래가 걱정돼서 아이를 낳기 망설여져요', '환경 보호를 위해 뭘 해야 할지 모르겠어요'
      ]
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 min-h-full">
      <div className="max-w-5xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-3xl">
              🏫
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">특정 사회·환경 문제</h1>
              <p className="text-gray-300 text-lg mt-2">학교 부적응, 사회적 소수자, 환경 불안 등 특별한 사회적 맥락의 문제를 다룹니다.</p>
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
                교육 심리학, 소수자 스트레스 모델, 환경 심리학, 젠더 이론을 바탕으로 합니다.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                <span>📋</span> 연관 기존 검사
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                학교생활적응 척도, 자아정체감 검사, 생태 불안 척도(Eco-Anxiety Scale) 등과 연계됩니다.
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
                  className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-300 text-center text-sm font-medium"
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
            <h3 className="text-lg font-semibold text-white mb-2">🏫 사회·환경 문제 지원 안내</h3>
            <p className="text-gray-300 text-sm">
              사회적 맥락에서 발생하는 문제들은 개인의 노력만으로는 해결하기 어려울 수 있습니다. 전문가와 지원 기관의 도움을 받으시기 바랍니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
