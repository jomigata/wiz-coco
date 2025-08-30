"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function AIMindAssistantPage() {
  const [activeCategory, setActiveCategory] = useState('일일 체크');

  const categories = [
    {
      id: '일일 체크',
      title: '일일 체크',
      description: '매일 마음을 점검하고 기록하세요',
      icon: '📅',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: '정기적 마음 검진',
      title: '정기적 마음 검진',
      description: 'AI가 분석하는 심층 마음 검진',
      icon: '🔍',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: '마음 SOS',
      title: '마음 SOS',
      description: '긴급 상황을 위한 빠른 마음 진단',
      icon: '🚨',
      color: 'from-red-500 to-red-600'
    },
    {
      id: '감정 분석 & 리포트',
      title: '감정 분석 & 리포트',
      description: '체계적인 감정 변화 분석',
      icon: '📊',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'AI 퀵스캔',
      title: 'AI 퀵스캔',
      description: '빠른 AI 마음 상태 체크',
      icon: '⚡',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  interface MenuItem {
    name: string;
    href: string;
    icon: string;
    description: string;
    badge?: string;
  }

  const menuItems: { [key: string]: MenuItem[] } = {
    '일일 체크': [
      { name: '한 줄 생각 남기기', href: '/ai-mind-assistant/daily-thought', icon: '💭', description: '오늘의 마음을 한 줄로 표현' },
      { name: '오늘의 마음 상태', href: '/ai-mind-assistant/daily-mood', icon: '📊', description: '5점 척도로 마음 상태 기록' },
      { name: '수면 & 에너지 체크', href: '/ai-mind-assistant/sleep-energy', icon: '😴', description: '수면의 질과 에너지 레벨 체크' },
      { name: '스트레스 지수 체크', href: '/ai-mind-assistant/stress-index', icon: '😰', description: '현재 스트레스 수준 측정' },
      { name: '우울/불안 자가 체크', href: '/ai-mind-assistant/depression-anxiety', icon: '😔', description: '정신 건강 상태 자가 진단' },
      { name: '맞춤 힐링 메시지', href: '/ai-mind-assistant/healing-message', icon: '💝', description: 'AI가 전하는 오늘의 위로' }
    ],
    '정기적 마음 검진': [
      { name: '감정일기 분석', href: '/ai-mind-assistant/emotion-diary', icon: '📝', description: 'AI가 분석하는 감정 변화' },
      { name: '텍스트 감정 분석', href: '/ai-mind-assistant/text-analysis', icon: '🔍', description: '글에서 찾는 무의식과 숨은 감정' },
      { name: '음성 감정 분석', href: '/ai-mind-assistant/voice-analysis', icon: '🎤', description: '목소리에 담긴 진짜 마음 분석' },
      { name: '마음 이미지 생성', href: '/ai-mind-assistant/mind-image', icon: '🎨', description: 'AI가 그려주는 내 마음의 이미지' },
      { name: 'AI 위로 문장', href: '/ai-mind-assistant/ai-comfort', icon: '🤖', description: '개인 맞춤 위로 메시지' }
    ],
    '마음 SOS': [
      { name: '긴급 마음진단', href: '/ai-mind-assistant/emergency-diagnosis', icon: '🚨', description: '1분 AI 솔루션', badge: '긴급' },
      { name: '번아웃 체크', href: '/ai-mind-assistant/burnout-check', icon: '🔥', description: '번아웃 신호등 확인' },
      { name: '자존감 온도계', href: '/ai-mind-assistant/self-esteem', icon: '🌡️', description: '현재 자존감 수준 측정' }
    ],
    '감정 분석 & 리포트': [
      { name: '감정 변화 그래프', href: '/ai-mind-assistant/emotion-graph', icon: '📈', description: '주간/월간 감정 변화 추이' },
      { name: 'AI 감정 분석 리포트', href: '/ai-mind-assistant/emotion-report', icon: '📋', description: '종합 감정 분석 결과' },
      { name: '마음 성장 레벨', href: '/ai-mind-assistant/growth-level', icon: '🏆', description: '성장 배지와 레벨 확인' },
      { name: '스트레스 변화 그래프', href: '/ai-mind-assistant/stress-graph', icon: '📊', description: '스트레스 지수 변화 추이' }
    ],
    'AI 퀵스캔': [
      { name: '마음 컨디션 체크', href: '/ai-mind-assistant/mind-condition', icon: '🔮', description: 'AI가 알려주는 오늘의 마음 상태' },
      { name: '마음 온도 측정', href: '/ai-mind-assistant/mind-temperature', icon: '🌡️', description: '오늘의 내 마음 온도는?' },
      { name: '감정 날씨 확인', href: '/ai-mind-assistant/emotion-weather', icon: '🌤️', description: '내 감정의 날씨 알아보기' },
      { name: '자존감 글쓰기', href: '/ai-mind-assistant/self-esteem-writing', icon: '✍️', description: '자존감을 채우는 글쓰기' }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <div className="text-6xl mb-4">🤖</div>
          <h1 className="text-4xl font-bold mb-4">AI 마음 비서</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            AI와 함께하는 개인 맞춤형 마음 건강 관리 시스템
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* 카테고리 선택 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">서비스 카테고리</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-6 py-4 rounded-xl text-left transition-all duration-300 transform hover:scale-105 ${
                  activeCategory === category.id
                    ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
                }`}
              >
                <div className="text-3xl mb-2">{category.icon}</div>
                <div className="font-semibold text-lg mb-1">{category.title}</div>
                <div className={`text-sm ${activeCategory === category.id ? 'text-blue-100' : 'text-gray-500'}`}>
                  {category.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 선택된 카테고리의 메뉴 항목들 */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {activeCategory} 서비스
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems[activeCategory as keyof typeof menuItems]?.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100 hover:border-blue-200"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-lg text-gray-800 group-hover:text-blue-600 transition-colors">
                        {item.name}
                      </h4>
                      {item.badge && (
                        <span className="px-2 py-1 text-xs font-bold bg-red-500 text-white rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-blue-500 text-sm font-medium group-hover:text-blue-600">
                  시작하기
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* AI 마음 비서 소개 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">AI 마음 비서란?</h3>
            <p className="text-gray-600 text-lg leading-relaxed max-w-3xl mx-auto">
              AI 마음 비서는 30년 이상의 심리상담 경험을 바탕으로 설계된 개인 맞춤형 마음 건강 관리 시스템입니다. 
              일일 체크부터 정기적인 마음 검진, 긴급 상황 대응까지 모든 마음 건강 관리 요구를 AI와 함께 해결할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
