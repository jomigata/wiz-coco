'use client';

import React from 'react';
import Link from 'next/link';

export default function IdentityValuesPage() {
  const testItems = [
    { 
      name: '자아 정체성 확립과 자기 통합', 
      desc: '진정한 자아 발견과 일관된 정체성 형성', 
      time: '30분', 
      difficulty: '어려움', 
      icon: '🗺️',
      href: '/tests/identity-values/identity-integration',
      worryExamples: ['저는 누구인지 혼란스러워요', '다른 사람 눈치를 너무 많이 봐요', '진정한 제 모습이 뭘까요?', '앞으로 어떻게 살아가야 할지 모르겠어요', '제가 가진 잠재력을 발견하고 싶어요']
    },
    { 
      name: '가치관 및 삶의 동기 탐색', 
      desc: '개인의 핵심 가치관과 삶의 동력 발견', 
      time: '25분', 
      difficulty: '보통', 
      icon: '💎',
      href: '/tests/identity-values/values-exploration',
      worryExamples: ['무엇을 위해 사는지 모르겠어요', '제가 정말 원하는 게 뭘까요?', '일에 쉽게 흥미를 잃어요', '열심히 하는데 보람이 없어요', '어떤 가치를 중요하게 생각해야 할지 모르겠어요']
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 min-h-full">
      <div className="max-w-5xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-3xl">
              🌟
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">자아정체감 및 가치관</h1>
              <p className="text-gray-300 text-lg mt-2">자아 정체성과 개인의 가치관 체계를 탐색하여 일관된 자아상을 형성하도록 돕습니다.</p>
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
                발달 심리학(Erikson의 심리사회적 발달단계), 사회 정체성 이론, 인본주의 심리학을 기반으로 자아 정체성을 탐색합니다.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                <span>📋</span> 연관 기존 검사
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                자아정체감 검사, 자존감 척도(Rosenberg), SCT, TCI, 가치관 검사(Values Scale) 등과 연계됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* 검사 목록 */}
        <div className="space-y-4">
          {testItems.map((item, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">{item.name}</h3>
                  <p className="text-gray-300 mb-4">{item.desc}</p>
                  
                  {/* 고민 예시 */}
                  <div className="bg-black/30 rounded-lg p-3 mb-4">
                    <h4 className="text-sm font-semibold text-yellow-400 mb-2">💭 이런 고민이 있으신가요?</h4>
                    <div className="flex flex-wrap gap-2">
                      {item.worryExamples.map((worry, idx) => (
                        <span key={idx} className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded-full">
                          "{worry}"
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.difficulty === '쉬움' ? 'bg-green-500/20 text-green-400' :
                        item.difficulty === '보통' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {item.difficulty}
                      </span>
                      <span className="text-gray-400 text-sm">{item.time}</span>
                    </div>
                    <Link
                      href={item.href}
                      className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-300"
                    >
                      <span>검사 시작</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 하단 안내 */}
        <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-2">검사 전 안내사항</h3>
            <p className="text-gray-300 text-sm">
              자아 정체성과 가치관 탐색은 깊은 성찰이 필요합니다. 충분한 시간을 갖고 진솔하게 답변해 주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
