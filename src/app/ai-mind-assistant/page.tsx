"use client";

import { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function AIMindAssistantPage() {
  const [activeCategory, setActiveCategory] = useState('일일 체크');

  const categories = [
    {
      id: '일일 체크',
      title: '일일 체크',
      description: '매일 마음을 점검하고 기록하세요',
      icon: '📅',
      color: 'from-green-500 to-green-600'
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
      color: 'from-emerald-500 to-emerald-600'
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
      { name: '오늘의 마음 상태 기록 (5점 척도)', href: '/ai-mind-assistant/daily-mood', icon: '📊', description: '수면/스트레스/우울/불안 등 통합 체크' },
      { name: '오늘의 감정일기 쓰기', href: '/ai-mind-assistant/emotion-diary', icon: '📝', description: 'AI가 분석하는 감정 변화' },
      { name: '월별검사 및 분기별 검사', href: '/ai-mind-assistant/periodic-tests', icon: '📅', description: '정기적인 심리 상태 점검' }
    ],
    '마음 SOS': [
      { name: 'AI 긴급 마음진단', href: '/ai-mind-assistant/emergency-diagnosis', icon: '🚨', description: '1분 AI 솔루션', badge: '긴급' },
      { name: 'AI 번아웃 체크', href: '/ai-mind-assistant/burnout-check', icon: '🔥', description: '번아웃 신호등 확인' },
      { name: 'AI 자존감 온도계', href: '/ai-mind-assistant/self-esteem', icon: '🌡️', description: '현재 자존감 수준 측정' }
    ],
    '감정 분석 & 리포트': [
      { name: 'AI 감정 분석 리포트', href: '/ai-mind-assistant/emotion-report', icon: '📋', description: '종합 감정 분석 결과 (감정 변화 그래프 포함)' },
      { name: 'AI 스트레스 분석 리포트', href: '/ai-mind-assistant/stress-graph', icon: '📊', description: '스트레스 지수 변화 추이' },
      { name: '마음 컨디션 체크', href: '/ai-mind-assistant/growth-level', icon: '🏆', description: '현재 마음 상태 종합 점검' }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* 상단 네비게이션 */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navigation />
      </div>
      
      {/* 메인 콘텐츠 영역 */}
      <div className="pt-16">
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white py-16 pt-24">
            <div className="container mx-auto px-6 text-center">
              <div className="text-6xl mb-4">🤖</div>
              <h1 className="text-4xl font-bold mb-4">AI 마음 비서</h1>
              <p className="text-xl text-green-100 max-w-2xl mx-auto">
                AI와 함께하는 개인 맞춤형 마음 건강 관리 시스템
              </p>
            </div>
          </div>

          <div className="container mx-auto px-6 py-12">
            {/* 카테고리 선택 */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">카테고리 선택</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <div className={`text-sm ${activeCategory === category.id ? 'text-green-100' : 'text-gray-500'}`}>
                      {category.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 선택된 카테고리의 메뉴 아이템들 */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                {categories.find(cat => cat.id === activeCategory)?.title} 메뉴
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems[activeCategory]?.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className="group block p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="text-3xl">{item.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                            {item.name}
                          </h4>
                          {item.badge && (
                            <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {item.description}
                        </p>
                      </div>
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
      </div>
    </div>
  );
}