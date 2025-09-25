'use client';

import React from 'react';
import Link from 'next/link';

export default function LifecycleAdaptationPage() {
  const testItems = [
    { 
      name: '아동·청소년기 발달과업과 위기', 
      desc: '아동·청소년 성장 분석 및 학교 적응', 
      time: '25분', 
      difficulty: '보통', 
      icon: '🧒',
      href: '/tests/lifecycle-adaptation/child-adolescent',
      worryExamples: [
        '아이가 저와 안정적인 애착을 형성했는지 궁금해요', '아이가 학교에서 따돌림을 당하는 것 같아요', '자녀가 장래 희망이 없어서 걱정이에요', 
        '성적 압박감 때문에 너무 힘들어요', '사춘기 자녀와 소통이 안 돼요', '또래 관계에서 어려움을 겪고 있어요'
      ]
    },
    { 
      name: '청년기 발달과업과 위기', 
      desc: '대학 적응, 사회초년생 스트레스, 결혼 준비', 
      time: '25분', 
      difficulty: '보통', 
      icon: '👨‍🎓',
      href: '/tests/lifecycle-adaptation/young-adult',
      worryExamples: [
        '전공이 저와 맞지 않는 것 같아요', '첫 직장생활에 적응하기 너무 힘들어요', '결혼 생활에 대한 막연한 두려움이 있어요',
        '산후우울증을 겪고 있어요', '독립에 대한 두려움이 커요', '진로 선택에 확신이 없어요'
      ]
    },
    { 
      name: '중년기 발달과업과 위기', 
      desc: '중년기 위기 진단 및 역할 재정립', 
      time: '30분', 
      difficulty: '어려움', 
      icon: '👨‍💼',
      href: '/tests/lifecycle-adaptation/middle-age',
      worryExamples: [
        '샌드위치 세대로서의 역할 부담이 너무 커요', '갱년기 증상으로 감정 조절이 힘들어요', '자녀가 독립한 후 극심한 허무함과 외로움을 느껴요(빈 둥지 증후군)',
        '중년의 위기를 겪고 있어요', '인생의 의미를 다시 찾고 싶어요', '부모님 돌봄과 자녀 교육 사이에서 지쳐요'
      ]
    },
    { 
      name: '노년기 발달과업과 위기', 
      desc: '은퇴 적응, 건강 불안, 죽음 준비', 
      time: '25분', 
      difficulty: '보통', 
      icon: '👴',
      href: '/tests/lifecycle-adaptation/elderly',
      worryExamples: [
        '은퇴 후 역할 상실감으로 무기력해요', '건강 악화와 죽음에 대한 두려움이 커요', '황혼 이혼을 고민하고 있어요',
        '존엄한 삶의 마무리를 준비하고 싶어요', '외로움과 고독감이 심해요', '젊은 세대와의 소통이 어려워요'
      ]
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 min-h-full">
      <div className="max-w-5xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-3xl">
              👶
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">생애주기별 적응</h1>
              <p className="text-gray-300 text-lg mt-2">아동기부터 노년기까지 각 생애주기별 발달과업과 위기를 지원합니다.</p>
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
                발달 심리학(Piaget, Erikson), 애착 이론, 가족 생활주기 이론, 노년학을 바탕으로 합니다.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                <span>📋</span> 연관 기존 검사
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                애착유형검사, 대학생활적응 척도, 중년기 위기 척도, 노인 우울 척도(GDS) 등과 연계됩니다.
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
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-300 text-center text-sm font-medium"
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
            <h3 className="text-lg font-semibold text-white mb-2">👶 생애주기별 발달 안내</h3>
            <p className="text-gray-300 text-sm">
              각 생애주기마다 고유한 발달과업과 위기가 있습니다. 전문가의 도움을 받아 건강한 발달을 이루시기 바랍니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
