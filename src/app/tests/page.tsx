'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function PsychologyTestsPage() {
  const [activeCategory, setActiveCategory] = useState<string>('전체보기');

  // 심리검사 카테고리 데이터
  const testCategories = [
    {
      id: 'personality',
      title: '성격 및 기질 검사',
      description: '개인의 성격 특성과 기질을 파악하는 검사',
      icon: '🧠',
      color: 'from-blue-500 to-cyan-500',
      stats: { total: 45, popular: 12, new: 3 },
      tests: [
        { name: 'MBTI 성격유형검사', description: '16가지 성격유형 분석', href: '/tests/mbti', difficulty: '쉬움', time: '15분', icon: '🎭' },
        { name: '에니어그램 검사', description: '9가지 성격유형과 동기 분석', href: '/tests/enneagram', difficulty: '보통', time: '20분', icon: '⭐' },
        { name: '빅파이브 성격검사', description: '5가지 성격 차원 측정', href: '/tests/big-five', difficulty: '보통', time: '25분', icon: '📊' },
        { name: '기질검사 (TCI)', description: '기질과 성격 차원 분석', href: '/tests/tci', difficulty: '어려움', time: '30분', icon: '🎨' }
      ]
    },
    {
      id: 'emotion',
      title: '감정 및 스트레스 검사',
      description: '감정 상태와 스트레스 수준을 측정하는 검사',
      icon: '💭',
      color: 'from-purple-500 to-pink-500',
      stats: { total: 38, popular: 15, new: 5 },
      tests: [
        { name: '우울증 자가진단 (PHQ-9)', description: '우울 증상 심각도 측정', href: '/tests/depression', difficulty: '쉬움', time: '10분', icon: '😔' },
        { name: '불안장애 검사 (GAD-7)', description: '불안 수준과 증상 평가', href: '/tests/anxiety', difficulty: '쉬움', time: '10분', icon: '😰' },
        { name: '스트레스 반응척도', description: '스트레스 반응 정도 측정', href: '/tests/stress', difficulty: '보통', time: '15분', icon: '😤' },
        { name: '감정조절곤란척도', description: '감정조절 능력 평가', href: '/tests/emotion-regulation', difficulty: '보통', time: '20분', icon: '🎭' }
      ]
    },
    {
      id: 'relationship',
      title: '대인관계 및 사회성 검사',
      description: '인간관계와 사회적 기능을 평가하는 검사',
      icon: '👥',
      color: 'from-green-500 to-emerald-500',
      stats: { total: 28, popular: 8, new: 2 },
      tests: [
        { name: '애착유형검사', description: '성인 애착 스타일 분석', href: '/tests/attachment', difficulty: '보통', time: '20분', icon: '💕' },
        { name: '의사소통 유형검사', description: '의사소통 스타일 분석', href: '/tests/communication', difficulty: '쉬움', time: '15분', icon: '💬' },
        { name: '사회적 지지척도', description: '사회적 지지 수준 측정', href: '/tests/social-support', difficulty: '쉬움', time: '12분', icon: '🤝' },
        { name: '대인관계 만족도', description: '인간관계 만족도 평가', href: '/tests/relationship-satisfaction', difficulty: '보통', time: '18분', icon: '😊' }
      ]
    },
    {
      id: 'career',
      title: '진로 및 적성 검사',
      description: '진로 방향성과 적성을 탐색하는 검사',
      icon: '🎯',
      color: 'from-orange-500 to-red-500',
      stats: { total: 35, popular: 10, new: 4 },
      tests: [
        { name: '홀랜드 적성검사', description: '6가지 직업적 성격유형 분석', href: '/tests/holland', difficulty: '보통', time: '25분', icon: '🔧' },
        { name: '진로성숙도검사', description: '진로 준비도와 성숙도 측정', href: '/tests/career-maturity', difficulty: '보통', time: '20분', icon: '📈' },
        { name: '직업가치관검사', description: '직업에 대한 가치관 분석', href: '/tests/work-values', difficulty: '쉬움', time: '15분', icon: '💼' },
        { name: '학습유형검사', description: '개인의 학습 스타일 분석', href: '/tests/learning-style', difficulty: '쉬움', time: '18분', icon: '📚' }
      ]
    },
    {
      id: 'family',
      title: '가족 및 부부관계 검사',
      description: '가족 역동과 부부관계를 평가하는 검사',
      icon: '👨‍👩‍👧‍👦',
      color: 'from-indigo-500 to-purple-500',
      stats: { total: 22, popular: 6, new: 1 },
      tests: [
        { name: '가족기능평가척도', description: '가족 기능과 역동 분석', href: '/tests/family-function', difficulty: '보통', time: '25분', icon: '🏠' },
        { name: '부부관계 만족도', description: '부부관계 질과 만족도 측정', href: '/tests/marital-satisfaction', difficulty: '보통', time: '20분', icon: '💑' },
        { name: '양육스트레스척도', description: '부모의 양육 스트레스 측정', href: '/tests/parenting-stress', difficulty: '보통', time: '22분', icon: '👶' },
        { name: '가족응집성검사', description: '가족 구성원 간 결속력 평가', href: '/tests/family-cohesion', difficulty: '보통', time: '18분', icon: '🤗' }
      ]
    },
    {
      id: 'trauma',
      title: '트라우마 및 외상 검사',
      description: '외상 경험과 PTSD 증상을 평가하는 검사',
      icon: '🛡️',
      color: 'from-red-500 to-pink-500',
      stats: { total: 18, popular: 5, new: 2 },
      tests: [
        { name: 'PCL-5 (PTSD 체크리스트)', description: 'PTSD 증상 심각도 측정', href: '/tests/ptsd', difficulty: '보통', time: '15분', icon: '🆘' },
        { name: '외상후 성장척도', description: '외상 후 긍정적 변화 측정', href: '/tests/post-traumatic-growth', difficulty: '보통', time: '20분', icon: '🌱' },
        { name: '해리경험척도', description: '해리 증상과 경험 평가', href: '/tests/dissociation', difficulty: '어려움', time: '25분', icon: '🌀' },
        { name: '복합외상척도', description: '복합 외상 증상 종합 평가', href: '/tests/complex-trauma', difficulty: '어려움', time: '30분', icon: '🔗' }
      ]
    }
  ];

  const filteredCategories = activeCategory === '전체보기' 
    ? testCategories 
    : testCategories.filter(cat => cat.title === activeCategory);

  const totalTests = testCategories.reduce((sum, cat) => sum + cat.stats.total, 0);
  const totalPopular = testCategories.reduce((sum, cat) => sum + cat.stats.popular, 0);
  const totalNew = testCategories.reduce((sum, cat) => sum + cat.stats.new, 0);

  // 좌측 메뉴 아이템들
  const menuItems = ['전체보기', ...testCategories.map(cat => cat.title)];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* 상단 네비게이션 */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navigation />
      </div>
      
      {/* 메인 콘텐츠 영역 */}
      <div className="pt-16">
        <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
          </div>

          <div className="container mx-auto px-4 py-6 relative z-10">
            {/* 심리검사 선택 타이틀 */}
            <div className="mb-8 relative">
              <div className="absolute -left-4 -top-8 w-20 h-20 bg-blue-500 rounded-full opacity-20 blur-2xl"></div>
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-500 rounded-full opacity-20 blur-2xl"></div>
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300 inline-block drop-shadow-lg">
                심리검사 선택
              </h1>
              <div className="h-1.5 w-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full mt-2 shadow-lg"></div>
              <p className="text-gray-300 text-lg mt-4">상담 주제에 맞는 적절한 심리검사를 선택하여 내담자에게 제공하세요</p>
            </div>

            {/* 좌측 메뉴와 우측 내용 레이아웃 */}
            <div className="flex gap-6">
              {/* 좌측 메뉴 */}
              <div className="w-1/4 bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
                <h2 className="text-2xl font-bold text-blue-100 mb-4">검사 카테고리</h2>
                <div className="space-y-2">
                  {menuItems.map((item) => (
                    <button
                      key={item}
                      onClick={() => setActiveCategory(item)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300 flex items-center gap-3 ${
                        activeCategory === item
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-blue-200 hover:bg-blue-800/30 hover:text-white'
                      }`}
                    >
                      <span className="text-lg">
                        {item === '전체보기' ? '📋' : testCategories.find(cat => cat.title === item)?.icon}
                      </span>
                      <span className="font-medium">{item}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 우측 내용 */}
              <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
                {activeCategory === '전체보기' ? (
                  <>
                    {/* 전체 현황 카드 */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-300 text-sm">전체 검사</p>
                            <p className="text-3xl font-bold text-white">{totalTests}</p>
                            <p className="text-blue-400 text-sm">6개 카테고리</p>
                          </div>
                          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">📋</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-300 text-sm">인기 검사</p>
                            <p className="text-3xl font-bold text-white">{totalPopular}</p>
                            <p className="text-green-400 text-sm">자주 사용됨</p>
                          </div>
                          <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">⭐</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-300 text-sm">신규 검사</p>
                            <p className="text-3xl font-bold text-white">{totalNew}</p>
                            <p className="text-purple-400 text-sm">최근 추가</p>
                          </div>
                          <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">🆕</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-300 text-sm">이번 주 실시</p>
                            <p className="text-3xl font-bold text-white">127</p>
                            <p className="text-orange-400 text-sm">+23 증가</p>
                          </div>
                          <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">📊</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 검사 카테고리별 표시 */}
                    <div className="space-y-8">
                      {testCategories.map((category) => (
                        <div key={category.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                              <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center text-2xl`}>
                                {category.icon}
                              </div>
                              <div>
                                <h3 className="text-2xl font-bold text-white">{category.title}</h3>
                                <p className="text-gray-300">{category.description}</p>
                              </div>
                            </div>
                            <div className="flex gap-4 text-center">
                              <div>
                                <p className="text-2xl font-bold text-white">{category.stats.total}</p>
                                <p className="text-gray-400 text-sm">전체</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-green-400">{category.stats.popular}</p>
                                <p className="text-gray-400 text-sm">인기</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-purple-400">{category.stats.new}</p>
                                <p className="text-gray-400 text-sm">신규</p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {category.tests.map((test, index) => (
                              <Link
                                key={index}
                                href={test.href}
                                className="group bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 hover:bg-gray-700/50 hover:border-gray-600/50 transition-all duration-300 transform hover:scale-105"
                              >
                                <div className="flex items-start gap-3 mb-3">
                                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-lg group-hover:scale-110 transition-transform duration-300">
                                    {test.icon}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="text-white font-semibold mb-1 group-hover:text-cyan-300 transition-colors">
                                      {test.name}
                                    </h4>
                                    <p className="text-gray-400 text-sm leading-tight">{test.description}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded-full ${
                                      test.difficulty === '쉬움' ? 'bg-green-500/20 text-green-400' :
                                      test.difficulty === '보통' ? 'bg-yellow-500/20 text-yellow-400' :
                                      'bg-red-500/20 text-red-400'
                                    }`}>
                                      {test.difficulty}
                                    </span>
                                    <span className="text-gray-400">{test.time}</span>
                                  </div>
                                  <div className="flex items-center text-cyan-400">
                                    <span className="text-xs">시작하기</span>
                                    <svg className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  /* 개별 카테고리 상세 보기 */
                  filteredCategories.map((category) => (
                    <div key={category.id} className="space-y-6">
                      <div className="flex items-center gap-4 mb-6">
                        <div className={`w-20 h-20 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center text-3xl`}>
                          {category.icon}
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold text-white">{category.title}</h2>
                          <p className="text-gray-300 text-lg">{category.description}</p>
                          <div className="flex gap-4 mt-2">
                            <span className="text-blue-400">총 {category.stats.total}개</span>
                            <span className="text-green-400">인기 {category.stats.popular}개</span>
                            <span className="text-purple-400">신규 {category.stats.new}개</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {category.tests.map((test, index) => (
                          <Link
                            key={index}
                            href={test.href}
                            className="group bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 transform hover:scale-105"
                          >
                            <div className="flex items-start gap-4 mb-4">
                              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">
                                {test.icon}
                              </div>
                              <div className="flex-1">
                                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                                  {test.name}
                                </h3>
                                <p className="text-gray-300 leading-relaxed">{test.description}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-sm ${
                                  test.difficulty === '쉬움' ? 'bg-green-500/20 text-green-400' :
                                  test.difficulty === '보통' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-red-500/20 text-red-400'
                                }`}>
                                  {test.difficulty}
                                </span>
                                <span className="text-gray-400 text-sm">{test.time}</span>
                              </div>
                              <div className="flex items-center text-cyan-400 group-hover:text-cyan-300 transition-colors">
                                <span className="text-sm font-medium">시작하기</span>
                                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}