'use client';

import React from 'react';
import Link from 'next/link';

export default function TraumaCrisisPage() {
  const testItems = [
    { 
      name: '트라우마와 외상 후 스트레스(PTSD) 치유', 
      desc: 'PTSD 증상 관리와 회복 프로그램', 
      time: '40분', 
      difficulty: '어려움', 
      icon: '🆘',
      href: '/tests/trauma-crisis/ptsd-recovery',
      worryExamples: [
        '끔찍한 기억이 계속 떠올라요', '사고 후 잠을 잘 수가 없어요', '특정 장소나 상황을 피하게 돼요', 
        '외상 후 감정 조절이 안 돼요', '세상이 안전하지 않다고 느껴져요', '악몽 때문에 잠들기가 무서워요',
        '갑자기 그때 상황이 재현되는 것 같아요', '사람들과의 관계가 어려워졌어요', '예전처럼 일상생활을 할 수 없어요',
        '죄책감과 자책감에 시달려요', '미래에 대한 희망이 없어요', '몸이 늘 긴장되어 있어요'
      ]
    },
    { 
      name: '급성 스트레스 및 위기 상황 대응', 
      desc: '갑작스러운 위기 상황과 급성 스트레스 관리', 
      time: '30분', 
      difficulty: '어려움', 
      icon: '⚡',
      href: '/tests/trauma-crisis/acute-stress',
      worryExamples: [
        '갑작스러운 사고를 당했어요', '가족의 죽음으로 충격을 받았어요', '자연재해를 경험했어요',
        '폭력 사건에 노출되었어요', '응급상황에서 패닉이 와요', '큰 변화에 적응하기 힘들어요'
      ]
    },
    { 
      name: '복합 트라우마 및 아동기 외상', 
      desc: '어린 시절 지속적 외상과 복합 트라우마 치료', 
      time: '45분', 
      difficulty: '어려움', 
      icon: '👶',
      href: '/tests/trauma-crisis/complex-trauma',
      worryExamples: [
        '어린 시절 학대를 당했어요', '방치와 무관심 속에서 자랐어요', '반복적인 폭력에 노출되었어요',
        '애착 관계가 불안정했어요', '어린 시절 기억이 없어요', '성인이 되어서도 그 영향이 계속돼요'
      ]
    },
    { 
      name: '생존자 증후군 및 죄책감', 
      desc: '재난이나 사고에서 살아남은 후의 심리적 어려움', 
      time: '35분', 
      difficulty: '어려움', 
      icon: '💔',
      href: '/tests/trauma-crisis/survivor-syndrome',
      worryExamples: [
        '왜 나만 살아남았을까요?', '다른 사람들이 죽었는데 내가 살아있어도 되나요?', '살아남은 것이 죄책감을 줘요',
        '희생자들을 생각하면 행복할 수 없어요', '내가 더 도움을 줄 수 있었을 텐데', '생존에 대한 감사함과 죄책감이 공존해요'
      ]
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 min-h-full">
      <div className="max-w-5xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center text-3xl">
              🆘
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">외상 및 위기 개입</h1>
              <p className="text-gray-300 text-lg mt-2">PTSD, 트라우마, 위기 상황에 대한 전문적인 개입과 치유를 제공합니다.</p>
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
                외상 이론, 인지처리치료(CPT), 안구운동 민감소실 및 재처리 요법(EMDR)을 바탕으로 합니다.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                <span>📋</span> 연관 기존 검사
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                외상후 스트레스 장애 척도(PCL-5), SCL-90-R, 로르샤흐 검사 등과 연계됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* 검사 목록 - 카드 그리드 레이아웃 */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {testItems.map((item, index) => (
            <Link key={index} href={item.href} className="block">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 hover:bg-white/15 hover:scale-[1.02] transition-all duration-300 flex flex-col h-full cursor-pointer">
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

              </div>
            </Link>
          ))}
        </div>

        {/* 하단 안내 */}
        <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-2">🆘 외상 및 위기 개입 안내</h3>
            <p className="text-gray-300 text-sm">
              심각한 외상이나 위기 상황에서는 즉시 전문의와 상담하시기 바랍니다. 본 검사는 진단이 아닌 선별 도구입니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
