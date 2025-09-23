'use client';

import React from 'react';
import Link from 'next/link';

export default function PotentialDevelopmentPage() {
  const testItems = [
    { 
      name: '인지 능력과 학습 전략 최적화', 
      desc: '개인 맞춤형 학습 방법과 인지 능력 향상', 
      time: '25분', 
      difficulty: '보통', 
      icon: '🧠',
      href: '/tests/potential-development/cognitive-optimization',
      worryExamples: ['공부하는 게 너무 힘들어요', '아무리 해도 성적이 안 올라요', '집중력이 너무 부족해요', '어떻게 하면 더 효율적으로 공부할 수 있을까요?', '암기가 너무 어려워요']
    },
    { 
      name: '적성 및 재능 발굴', 
      desc: '숨겨진 재능과 적성 영역 탐색', 
      time: '30분', 
      difficulty: '보통', 
      icon: '💫',
      href: '/tests/potential-development/talent-discovery',
      worryExamples: ['제가 잘하는 게 뭔지 모르겠어요', '어떤 분야에 재능이 있을까요?', '새로운 것을 배우고 싶은데 뭘 해야 할지…', '제 잠재력을 최대한 발휘하고 싶어요', '현재 일이 적성에 안 맞는 것 같아요']
    },
    { 
      name: '리더십 및 의사결정 역량 강화', 
      desc: '리더십 스타일 분석과 의사결정 능력 향상', 
      time: '35분', 
      difficulty: '어려움', 
      icon: '👑',
      href: '/tests/potential-development/leadership-development',
      worryExamples: ['리더 역할을 잘하고 싶어요', '결정하는 게 너무 어려워요', '다른 사람을 설득하는 게 힘들어요', '책임감이 부담스러워요', '팀을 효과적으로 이끌고 싶어요']
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 min-h-full">
      <div className="max-w-5xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center text-3xl">
              🚀
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">잠재력 및 역량 개발</h1>
              <p className="text-gray-300 text-lg mt-2">개인의 숨겨진 잠재력을 발굴하고 역량을 체계적으로 개발할 수 있는 방향을 제시합니다.</p>
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
                인지 심리학, 다중지능 이론, 정보처리 이론, 긍정 심리학을 바탕으로 개인의 잠재력을 과학적으로 분석합니다.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                <span>📋</span> 연관 기존 검사
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                웩슬러 지능검사(WAIS/WISC), STRONG 직업흥미검사, 다중지능검사, 창의성 검사(TTCT) 등과 연계됩니다.
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
                      className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-300"
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
              잠재력과 역량 평가는 현재 상태를 정확히 파악하는 것이 중요합니다. 평소의 모습 그대로 답변해 주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
