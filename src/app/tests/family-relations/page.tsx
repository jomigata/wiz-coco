'use client';

import React from 'react';
import Link from 'next/link';

export default function FamilyRelationsPage() {
  const testItems = [
    { 
      name: '원가족 문제와 가족 갈등 해결', 
      desc: '부모, 형제자매와의 관계 개선 및 갈등 해결', 
      time: '30분', 
      difficulty: '보통', 
      icon: '👨‍👩‍👧‍👦',
      href: '/tests/family-relations/family-conflict-resolution',
      worryExamples: ['부모님과 대화가 안 통해요', '형제자매와 자주 다퉈요', '시댁/처가 갈등이 너무 심해요', '가족과의 관계가 너무 힘들어요', '가족이 저를 이해해주지 않아요']
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 min-h-full">
      <div className="max-w-5xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-3xl">
              👨‍👩‍👧‍👦
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">가족 관계</h1>
              <p className="text-gray-300 text-lg mt-2">원가족 문제부터 현재 가족 관계까지 다양한 가족 갈등을 해결합니다.</p>
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
                가족 체계 이론(Bowen, Minuchin), 애착 이론, 발달 심리학을 바탕으로 가족 관계의 역학을 분석합니다.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                <span>📋</span> 연관 기존 검사
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                가족화(KFD), 가계도(Genogram), 부모양육태도검사(PAT), 결혼만족도척도(K-MSI) 등과 연계됩니다.
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
                      className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-rose-700 transition-all duration-300"
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
              가족 관계는 복잡하고 민감한 영역입니다. 객관적이고 균형잡힌 시각으로 답변해 주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
