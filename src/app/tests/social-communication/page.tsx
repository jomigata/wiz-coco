'use client';

import React from 'react';
import Link from 'next/link';

export default function SocialCommunicationPage() {
  const testItems = [
    { 
      name: '사회성 및 의사소통 기술 향상', 
      desc: '효과적인 소통 능력과 사회적 기술 개발', 
      time: '20분', 
      difficulty: '쉬움', 
      icon: '💬',
      href: '/tests/social-communication/communication-skills',
      worryExamples: ['낯선 사람들과 대화하기 힘들어요', '제 의견을 잘 표현 못 해요', '상대방 말을 잘 이해 못 하는 것 같아요', '어색한 분위기를 못 견뎌요', '발표하는 게 너무 두려워요']
    },
    { 
      name: '조직 내 소통과 팀워크 증진', 
      desc: '직장 내 갈등 해결과 효과적인 협업 능력', 
      time: '30분', 
      difficulty: '보통', 
      icon: '⚡',
      href: '/tests/social-communication/teamwork-enhancement',
      worryExamples: ['직장 내 갈등이 너무 힘들어요', '팀원들과 소통이 잘 안 돼요', '리더와 관계가 어려워요', '불합리한 대우를 받는 것 같아요', '팀원 간 협력이 안 돼요']
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 min-h-full">
      <div className="max-w-5xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-3xl">
              💬
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">사회적 기술 및 소통</h1>
              <p className="text-gray-300 text-lg mt-2">효과적인 의사소통과 사회적 기술 향상으로 원만한 인간관계를 형성합니다.</p>
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
                의사소통 이론, 인지행동 이론, 사회기술훈련(SST), 조직 심리학을 바탕으로 합니다.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                <span>📋</span> 연관 기존 검사
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                의사소통 능력 검사, 자기표현 척도(Assertiveness Scale), 갈등해결방식 검사 등과 연계됩니다.
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
              </div>
            </Link>
          ))}
        </div>

        {/* 하단 안내 */}
        <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-2">💬 소통 기술 향상 안내</h3>
            <p className="text-gray-300 text-sm">
              효과적인 소통은 연습을 통해 향상됩니다. 현재 소통 패턴을 정확히 파악해 주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
