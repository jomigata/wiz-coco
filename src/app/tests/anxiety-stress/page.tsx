'use client';

import React from 'react';
import Link from 'next/link';

export default function AnxietyStressPage() {
  const testItems = [
    { 
      name: '불안, 걱정, 공황 증상 완화', 
      desc: 'GAD-7 기반 불안 관리 솔루션', 
      time: '20분', 
      difficulty: '보통', 
      icon: '😰',
      href: '/tests/anxiety-stress/anxiety-panic',
      worryExamples: ['늘 불안하고 초조해요', '사소한 일에도 걱정이 많아요', '가슴이 답답하고 숨쉬기 힘들어요', '갑자기 공황 발작이 와요', '시험이나 발표 때 너무 긴장해요']
    },
    { 
      name: '스트레스 관리와 회복탄력성 증진', 
      desc: '스트레스 대처 능력 강화 프로그램', 
      time: '25분', 
      difficulty: '보통', 
      icon: '🛡️',
      href: '/tests/anxiety-stress/stress-resilience',
      worryExamples: ['스트레스를 너무 많이 받아요', '스트레스 해소법을 모르겠어요', '작은 일에도 쉽게 무너져요', '번아웃이 온 것 같아요', '스트레스 때문에 몸이 아파요']
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 min-h-full">
      <div className="max-w-5xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center text-3xl">
              😰
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">불안 및 스트레스</h1>
              <p className="text-gray-300 text-lg mt-2">불안 장애, 공황 증상, 스트레스 관리 등 불안과 관련된 문제를 해결합니다.</p>
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
                인지행동 이론(CBT), 노출 치료, 스트레스-대처 이론(Lazarus & Folkman)을 바탕으로 합니다.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                <span>📋</span> 연관 기존 검사
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                BAI(벡 불안 척도), STAI(상태-특성 불안 척도), 스트레스 척도(PSS), 회복탄력성 지수(KRQ-53) 등과 연계됩니다.
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
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-2 px-4 rounded-lg hover:from-yellow-600 hover:to-orange-700 transition-all duration-300 text-center text-sm font-medium"
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
            <h3 className="text-lg font-semibold text-white mb-2">⚠️ 불안·스트레스 관리 안내</h3>
            <p className="text-gray-300 text-sm">
              심각한 불안이나 공황 증상이 있으시면 즉시 전문의와 상담하시기 바랍니다. 본 검사는 진단이 아닌 선별 도구입니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
