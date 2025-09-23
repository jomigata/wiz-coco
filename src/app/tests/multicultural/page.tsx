'use client';

import React from 'react';
import Link from 'next/link';

export default function MulticulturalPage() {
  const testItems = [
    { 
      name: '초기 정착과 문화 충격', 
      desc: '한국 문화 적응과 언어 소통 문제 해결', 
      time: '25분', 
      difficulty: '보통', 
      icon: '🌏',
      href: '/tests/multicultural/cultural-adaptation',
      worryExamples: ['한국어가 서툴러 오해를 자주 받아요', '한국의 빨리빨리 문화에 적응하기 힘들어요', '회식, 명절 등 한국의 집단주의 문화가 낯설고 불편해요', '본국의 가치관과 한국의 가치관 사이에서 혼란스러워요']
    },
    { 
      name: '사회적 편견과 차별 경험', 
      desc: '차별 경험으로 인한 심리적 상처 치유', 
      time: '30분', 
      difficulty: '어려움', 
      icon: '🩹',
      href: '/tests/multicultural/discrimination-healing',
      worryExamples: ['단지 외국인이라는 이유만으로 무시당하는 기분이에요', '출신 국가에 대한 편견 어린 시선 때문에 힘들어요', '취업 과정에서 보이지 않는 차별을 겪었어요', '너희 나라로 돌아가라는 말을 들었어요']
    },
    { 
      name: '다문화 가족 관계와 갈등', 
      desc: '국제부부 문화 갈등 진단 및 해결', 
      time: '30분', 
      difficulty: '보통', 
      icon: '👨‍👩‍👧‍👦',
      href: '/tests/multicultural/family-conflict',
      worryExamples: ['배우자와의 가치관 차이로 자주 싸워요', '시댁/처가에서 제 문화를 존중해주지 않아요', '배우자가 제 모국어를 배우려는 노력을 하지 않아 서운해요', '가정 폭력을 당하고 있지만 신고하면 추방될까 봐 두려워요']
    },
    { 
      name: '이중문화 정체성과 소속감', 
      desc: '이중문화 정체성 맵핑과 통합', 
      time: '25분', 
      difficulty: '보통', 
      icon: '🎭',
      href: '/tests/multicultural/identity-integration',
      worryExamples: ['한국에서도, 부모님 나라에서도 저는 이방인 같아요', '저는 어느 나라 사람일까요? 정체성이 혼란스러워요', '두 문화 사이에서 균형을 잡기가 힘들어요', '어디에도 온전히 속하지 못하는 느낌이에요']
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 min-h-full">
      <div className="max-w-5xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center text-3xl">
              🌍
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">다문화 적응</h1>
              <p className="text-gray-300 text-lg mt-2">다문화 가정, 이민자, 유학생 등의 문화 적응 문제를 전문적으로 지원합니다.</p>
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
                문화 충격 이론(Oberg의 U-Curve Model), 문화변용 스트레스 모델, 소수자 스트레스 모델을 바탕으로 합니다.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                <span>📋</span> 연관 기존 검사
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                문화적응 스트레스 척도(SACC), 다문화 청소년 정체성 척도(MEIM), 외상 척도 등과 연계됩니다.
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
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-2 px-4 rounded-lg hover:from-teal-600 hover:to-cyan-700 transition-all duration-300 text-center text-sm font-medium"
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
            <h3 className="text-lg font-semibold text-white mb-2">🌍 다문화 상담 안내</h3>
            <p className="text-gray-300 text-sm">
              문화적 차이로 인한 어려움은 자연스러운 과정입니다. 천천히 적응해 나가시면서 전문가의 도움을 받으시기 바랍니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
