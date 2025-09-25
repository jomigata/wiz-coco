'use client';

import React from 'react';
import Link from 'next/link';

export default function HealthBodyPage() {
  const testItems = [
    { 
      name: '신체 이미지와 외모 불만', 
      desc: '외모에 대한 극심한 불만 해결', 
      time: '20분', 
      difficulty: '쉬움', 
      icon: '💄',
      href: '/tests/health-body/body-image',
      worryExamples: [
        '제 외모에 대한 극심한 불만이 있어요', '노화로 인한 외모 변화를 받아들이기 힘들어요', '다이어트 요요 현상 때문에 자괴감이 들어요', 
        'SNS 속 보정된 이미지와 제 몸을 비교하게 돼요', '거울을 보는 것이 두려워요', '외모 때문에 사람들을 피해요'
      ]
    },
    { 
      name: '섭식 문제와 건강한 식습관', 
      desc: '폭식/거식 경향 및 다이어트 강박 해결', 
      time: '25분', 
      difficulty: '보통', 
      icon: '🍎',
      href: '/tests/health-body/eating-habits',
      worryExamples: [
        '폭식/거식 경향이 있어요', '다이어트 강박 때문에 힘들어요', '건강한 음식에 대한 강박이 있어요',
        '스트레스를 받으면 폭식하게 돼요', '음식에 대한 죄책감이 커요', '체중 조절이 안 돼서 절망적이에요'
      ]
    },
    { 
      name: '만성 질환과 심리적 적응', 
      desc: '만성 질환으로 인한 심리적 어려움 지원', 
      time: '30분', 
      difficulty: '어려움', 
      icon: '🏥',
      href: '/tests/health-body/chronic-illness',
      worryExamples: [
        '만성 질환으로 인해 우울해요', '가족이 희귀병 진단을 받았어요', '장기적인 치료 과정에 지쳤어요',
        '겉으로 티 나지 않는 질병이라 꾀병으로 오해받아요', '건강했던 예전으로 돌아갈 수 없다는 현실이 힘들어요'
      ]
    },
    { 
      name: '건강염려증과 의료 불안', 
      desc: '사소한 건강 문제에 대한 과도한 불안 완화', 
      time: '20분', 
      difficulty: '보통', 
      icon: '🩺',
      href: '/tests/health-body/health-anxiety',
      worryExamples: [
        '사소한 건강 문제에도 죽을 것 같은 불안감을 느껴요', '병원 방문이나 치료에 대한 공포가 있어요', '만성 통증 때문에 삶의 질이 너무 떨어졌어요',
        '유전병에 대한 막연한 두려움이 커요', '인터넷으로 증상을 검색하면 더 불안해져요'
      ]
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 min-h-full">
      <div className="max-w-5xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center text-3xl">
              🏥
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">건강 및 신체 문제</h1>
              <p className="text-gray-300 text-lg mt-2">신체 이미지, 건강 불안, 만성 질환 등 건강과 관련된 심리적 문제를 다룹니다.</p>
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
                인지행동 이론(CBT), 건강 심리학, 스트레스-대처 이론, 건강 신념 모델을 바탕으로 합니다.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                <span>📋</span> 연관 기존 검사
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                신체상 척도, 건강염려증 척도, 건강관련 삶의 질 척도(HRQoL), 섭식태도 검사(EAT-26) 등과 연계됩니다.
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
            <h3 className="text-lg font-semibold text-white mb-2">🏥 건강 심리 안내</h3>
            <p className="text-gray-300 text-sm">
              신체적 건강과 정신적 건강은 서로 밀접한 관련이 있습니다. 전문의와 상담하여 종합적인 치료를 받으시기 바랍니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
