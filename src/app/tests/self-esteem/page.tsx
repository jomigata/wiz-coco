'use client';

import React from 'react';
import Link from 'next/link';

export default function SelfEsteemPage() {
  const testItems = [
    { 
      name: '낮은 자존감과 자기 비난 극복', 
      desc: '건강한 자아상 형성 지원', 
      time: '30분', 
      difficulty: '보통', 
      icon: '💪',
      href: '/tests/self-esteem/low-self-esteem',
      worryExamples: [
        '제가 너무 한심하게 느껴져요', '남들과 비교해서 열등감이 심해요', '제 자신을 사랑할 수가 없어요', 
        '계속 자책하고 후회해요', '저는 실패작이라고 생각해요', '다른 사람들이 저를 어떻게 볼까 봐 두려워요',
        '완벽하지 않으면 가치가 없다고 느껴져요', '칭찬을 받아도 믿어지지 않아요', '실수를 하면 세상이 무너지는 것 같아요'
      ]
    },
    { 
      name: '완벽주의와 자기 기대 조절', 
      desc: '과도한 완벽주의 성향 완화와 현실적 목표 설정', 
      time: '25분', 
      difficulty: '보통', 
      icon: '🎯',
      href: '/tests/self-esteem/perfectionism',
      worryExamples: [
        '완벽하지 않으면 시작도 못해요', '작은 실수도 용납할 수 없어요', '남들보다 뛰어나야 한다는 압박감이 커요',
        '기준이 너무 높아서 늘 불만족스러워요', '완벽하게 하려다 보니 시간이 너무 오래 걸려요'
      ]
    },
    { 
      name: '자기 자비와 내적 치유', 
      desc: '자기 자비 함양과 내면의 상처 치유', 
      time: '35분', 
      difficulty: '어려움', 
      icon: '🌸',
      href: '/tests/self-esteem/self-compassion',
      worryExamples: [
        '제게 너무 가혹해요', '실수를 용서하기 어려워요', '남에게는 친절한데 제게는 냉정해요',
        '내면의 상처가 아물지 않아요', '자기 자비가 뭔지 모르겠어요', '스스로를 위로하는 방법을 모르겠어요'
      ]
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 min-h-full">
      <div className="max-w-5xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-3xl">
              💪
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">자존감 및 자기 문제</h1>
              <p className="text-gray-300 text-lg mt-2">낮은 자존감, 자기 비난, 완벽주의 등 자기 자신과 관련된 문제를 다룹니다.</p>
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
                인본주의 심리학(Rogers), 인지행동 이론(CBT), 자기 자비(Self-Compassion) 이론을 바탕으로 합니다.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                <span>📋</span> 연관 기존 검사
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                자존감 척도(Rosenberg), 자기효능감 척도, 역기능적 태도 척도(DAS) 등과 연계됩니다.
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
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 text-center text-sm font-medium"
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
            <h3 className="text-lg font-semibold text-white mb-2">💪 자존감 향상 안내</h3>
            <p className="text-gray-300 text-sm">
              건강한 자존감은 하루아침에 형성되지 않습니다. 꾸준한 자기 돌봄과 연습이 필요합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
