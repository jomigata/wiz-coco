'use client';

import React from 'react';
import Link from 'next/link';

export default function LegalAdminPage() {
  const testItems = [
    { 
      name: '법적 분쟁 및 소송 스트레스', 
      desc: '법적 절차로 인한 심리적 부담 관리', 
      time: '30분', 
      difficulty: '어려움', 
      icon: '⚖️',
      href: '/tests/legal-admin/legal-disputes',
      worryExamples: [
        '법적 분쟁으로 인한 스트레스가 심해요', '소송 과정에서 심리적 부담이 커요', '변호사 비용이 부담스러워요', 
        '상대방과의 갈등이 장기화되고 있어요', '법정에서 증언하는 것이 두려워요', '판결 결과가 불안해요'
      ]
    },
    { 
      name: '행정 절차 및 관료주의 스트레스', 
      desc: '복잡한 행정 절차로 인한 심리적 어려움', 
      time: '25분', 
      difficulty: '보통', 
      icon: '📋',
      href: '/tests/legal-admin/bureaucracy-stress',
      worryExamples: [
        '행정 절차가 너무 복잡해서 막막해요', '공무원들의 불친절한 태도가 스트레스예요', '서류 준비가 너무 어려워요',
        '민원 처리가 지연되어 답답해요', '관공서에 가는 것 자체가 두려워요', '규정이 자주 바뀌어서 혼란스러워요'
      ]
    },
    { 
      name: '권리 침해 및 부당 대우', 
      desc: '부당한 대우나 권리 침해로 인한 심리적 상처', 
      time: '35분', 
      difficulty: '어려움', 
      icon: '🛡️',
      href: '/tests/legal-admin/rights-violation',
      worryExamples: [
        '부당한 대우를 받았지만 어떻게 해야 할지 모르겠어요', '권리를 주장하기가 두려워요', '신고해도 달라질 게 없을 것 같아요',
        '증거가 부족해서 억울해요', '가해자가 더 유리한 위치에 있어서 포기하고 싶어요', '법적 보호를 받을 수 있을지 의문이에요'
      ]
    }
  ];

  return (
    <div className="bg-[#f8fafc] p-6 min-h-full">
      <div className="max-w-5xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-gray-500 to-slate-500 flex items-center justify-center text-3xl">
              ⚖️
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">법률 및 행정 문제</h1>
              <p className="text-slate-600 text-lg mt-2">법적 분쟁, 행정 절차 등으로 인한 스트레스와 심리적 부담을 관리합니다.</p>
            </div>
          </div>
        </div>

        {/* 이론적 배경 */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                <span>🧠</span> 기본 심리 이론
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                스트레스 이론, 사회정의 이론, 트라우마 이론, 권력 관계 심리학을 바탕으로 합니다.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                <span>📋</span> 연관 기존 검사
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                법적 스트레스 척도, 정의 민감성 척도, 권리 침해 경험 척도 등과 연계됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* 검사 목록 - 카드 그리드 레이아웃 */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {testItems.map((item, index) => (
            <div key={index} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-blue-200 hover:shadow-md hover:scale-[1.02] transition-all duration-300 flex flex-col h-full">
              {/* 카드 헤더 */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-lg flex-shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-slate-900 leading-tight">{item.name}</h3>
                </div>
              </div>

              {/* 카드 내용 */}
              <div className="flex-1 flex flex-col">
                <p className="text-slate-600 text-sm mb-3 leading-relaxed">{item.desc}</p>
                
                {/* 고민 예시 - 축약된 형태 */}
                <div className="bg-slate-100 rounded-lg p-3 mb-4 flex-1">
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
                  className="w-full bg-gradient-to-r from-gray-500 to-slate-600 text-white py-2 px-4 rounded-lg hover:from-gray-600 hover:to-slate-700 transition-all duration-300 text-center text-sm font-medium"
                >
                  검사 시작 →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* 하단 안내 */}
        <div className="mt-8 bg-slate-50 rounded-xl p-6 border border-slate-200">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">⚖️ 법률 문제 지원 안내</h3>
            <p className="text-slate-600 text-sm">
              법적 문제는 전문가의 도움이 필요합니다. 변호사 상담과 함께 심리적 지원도 받으시기 바랍니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
