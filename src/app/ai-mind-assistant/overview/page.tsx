'use client';

import { useState } from 'react';
import Link from 'next/link';
import OverviewNavigation from '@/components/OverviewNavigation';

// AI 마음 비서 메뉴 데이터
const aiAssistantMenuItems = [
  {
    category: "일일 체크",
    items: [
      { name: "오늘의 컨디션 체크", href: "/ai-mind-assistant/daily-condition", description: "수면/스트레스/우울/불안 등 통합 체크", icon: "📊" },
      { name: "오늘의 감정일기", href: "/ai-mind-assistant/daily-mood", description: "AI가 분석하는 감정 편화", icon: "📝" }
    ]
  },
  {
    category: "마음 SOS",
    items: [
      { name: "AI 긴급 마음진단", href: "/ai-mind-assistant/emergency-diagnosis", description: "1분 AI 응급상담", icon: "🚨", badge: "긴급" },
      { name: "AI 빠른 체크", href: "/ai-mind-assistant/quick-check", description: "빠른 상황 진단", icon: "🔥" }
    ]
  },
  {
    category: "감정 분석 & 리포트",
    items: [
      { name: "AI 감정/스트레스 분석", href: "/ai-mind-assistant/emotion-stress-analysis", description: "종합 감정 및 스트레스 분석 결과", icon: "📈" },
      { name: "AI 마음 컨디션 리포트", href: "/ai-mind-assistant/mind-condition-report", description: "정신 마음 상태 종합 분석 결과", icon: "🎯" }
    ]
  }
];

export default function AIMindAssistantOverviewPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredCategories = selectedCategory 
    ? aiAssistantMenuItems.filter(category => category.category === selectedCategory)
    : aiAssistantMenuItems;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900">
      {/* 네비게이션 */}
      <OverviewNavigation currentPage="ai-mind-assistant" />

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">AI 마음 비서 전체보기</h1>
          <p className="text-green-200 text-lg">AI 기술로 당신의 마음 건강을 돌봅니다</p>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              selectedCategory === null
                ? 'bg-green-600 text-white'
                : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
            }`}
          >
            전체보기
          </button>
          {aiAssistantMenuItems.map((category) => (
            <button
              key={category.category}
              onClick={() => setSelectedCategory(category.category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                selectedCategory === category.category
                  ? 'bg-green-600 text-white'
                  : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
              }`}
            >
              {category.category}
            </button>
          ))}
        </div>

        {/* 심플한 텍스트 위주 리스트 */}
        <div className="max-w-4xl mx-auto">
          {filteredCategories.map((category) => (
            <div key={category.category} className="mb-8">
              <h2 className="text-2xl font-bold text-green-300 mb-6">
                {category.category}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.items.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="group flex items-center gap-4 p-4 bg-slate-800/30 rounded-lg hover:bg-slate-700/50 transition-all duration-300 border border-transparent hover:border-green-500/30"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform duration-300">
                      {item.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold group-hover:text-green-300">
                          {item.name}
                        </h3>
                        {(item as any).badge && (
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                            (item as any).badge === '긴급' ? 'bg-red-500 text-white' :
                            (item as any).badge === '신규' ? 'bg-green-500 text-white' :
                            'bg-orange-500 text-white'
                          }`}>
                            {(item as any).badge}
                          </span>
                        )}
                      </div>
                      <p className="text-green-200 text-sm">
                        {item.description}
                      </p>
                    </div>
                    <svg 
                      className="w-5 h-5 text-green-300 group-hover:text-white group-hover:translate-x-1 transition-all duration-300"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
