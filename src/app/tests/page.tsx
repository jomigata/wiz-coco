'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function PsychologyTestsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // 상담 주제별 심리검사 분류
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

  const filteredCategories = selectedCategory 
    ? testCategories.filter(cat => cat.id === selectedCategory)
    : testCategories;

  const totalTests = testCategories.reduce((sum, cat) => sum + cat.stats.total, 0);
  const totalPopular = testCategories.reduce((sum, cat) => sum + cat.stats.popular, 0);
  const totalNew = testCategories.reduce((sum, cat) => sum + cat.stats.new, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">심리검사 선택</h1>
          <p className="text-gray-300 text-lg">상담 주제에 맞는 적절한 심리검사를 선택하여 내담자에게 제공하세요</p>
        </div>

        {/* 전체 현황 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
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

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
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

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
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

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
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

        {/* 카테고리 필터 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">검사 카테고리</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                selectedCategory === null
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
              }`}
            >
              전체보기
            </button>
            {testCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                }`}
              >
                <span>{category.icon}</span>
                {category.title}
              </button>
            ))}
          </div>
        </div>

        {/* 검사 카테고리별 표시 */}
        <div className="space-y-8">
          {filteredCategories.map((category) => (
            <div key={category.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* 추천 검사 섹션 */}
        <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h3 className="text-2xl font-bold text-white mb-4">상담사 추천 검사</h3>
          <p className="text-gray-300 mb-6">경험이 풍부한 상담사들이 자주 사용하는 효과적인 검사들입니다</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-500/30">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🎭</span>
                <div>
                  <h4 className="text-white font-semibold">MBTI 성격유형검사</h4>
                  <p className="text-blue-300 text-sm">초기 상담 필수 검사</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm">내담자의 기본적인 성격 특성을 파악하여 상담 방향을 설정하는 데 매우 유용합니다.</p>
            </div>

            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">😔</span>
                <div>
                  <h4 className="text-white font-semibold">우울증 자가진단</h4>
                  <p className="text-purple-300 text-sm">감정 상태 평가</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm">우울 증상의 정도를 객관적으로 측정하여 치료 계획 수립에 도움이 됩니다.</p>
            </div>

            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/30">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">💕</span>
                <div>
                  <h4 className="text-white font-semibold">애착유형검사</h4>
                  <p className="text-green-300 text-sm">관계 패턴 분석</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm">대인관계 문제의 근본 원인을 파악하고 건강한 관계 형성을 돕습니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}