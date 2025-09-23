'use client';

import { useState } from 'react';
import Link from 'next/link';

// AI 마음 비서 메뉴 데이터
const aiMindAssistantSubMenuItems = [
  { 
    category: "일일 체크",
    items: [
      { name: "오늘의 컨디션 체크", href: "/ai-mind-assistant/daily-mood", description: "수면/스트레스/우울/불안 등 통합 체크", icon: "📊" },
      { name: "오늘의 감정일기", href: "/ai-mind-assistant/emotion-diary", description: "AI가 분석하는 감정 변화", icon: "📝" }
    ]
  },
  { 
    category: "마음 SOS",
    items: [
      { name: "AI 긴급 마음진단", href: "/ai-mind-assistant/emergency-diagnosis", description: "1분 AI 솔루션", icon: "🚨", badge: "긴급" },
      { name: "AI 번아웃 체크", href: "/ai-mind-assistant/burnout-check", description: "번아웃 신호등 확인", icon: "🔥" }
    ]
  },
  { 
    category: "감정 분석 & 리포트",
    items: [
      { name: "AI 감정/스트레스 분석", href: "/ai-mind-assistant/emotion-stress-analysis", description: "종합 감정 및 스트레스 분석 결과", icon: "📊" },
      { name: "AI 마음 컨디션 리포트", href: "/ai-mind-assistant/mind-condition-report", description: "현재 마음 상태 종합 점검", icon: "🏆" }
    ]
  },
  {
    category: "개인맞춤 추천",
    items: [
      { name: "인지·학습능력 최적화", href: "/ai-mind-assistant/cognitive-optimization", description: "학습 능력 향상 분석", icon: "🧠" },
      { name: "장체 재능 스카닝", href: "/ai-mind-assistant/talent-scanning", description: "숨겨진 재능 발견", icon: "✨" },
      { name: "커리어 네비게이션", href: "/ai-mind-assistant/career-navigation", description: "AI 기반 진로 가이드", icon: "🧭" },
      { name: "리더십·의사결정 시뮬레이션", href: "/ai-mind-assistant/leadership-simulation", description: "리더십 역량 분석", icon: "👑" }
    ]
  },
  {
    category: "AI 관계 개선 솔루션",
    items: [
      { name: "AI 관계 개선 솔루션", href: "/ai-mind-assistant/relationship-solution", description: "", icon: "🤝" }
    ]
  }
];

export default function AIMindAssistantOverviewPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const allItems = aiMindAssistantSubMenuItems.flatMap(category => 
    category.items.map(item => ({ ...item, category: category.category }))
  );

  const filteredItems = selectedCategory 
    ? allItems.filter(item => item.category === selectedCategory)
    : allItems;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900">
      {/* 네비게이션 */}
      <nav className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 backdrop-blur-xl border-b border-green-500/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-white">
              WizCoCo
            </Link>
            <div className="flex items-center space-x-6">
              <Link href="/tests" className="text-gray-300 hover:text-white transition-colors">
                심리검사
              </Link>
              <Link href="/counseling" className="text-gray-300 hover:text-white transition-colors">
                상담 프로그램
              </Link>
              <Link href="/ai-mind-assistant" className="text-green-300 hover:text-white transition-colors">
                AI 마음 비서
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">AI 마음 비서 전체보기</h1>
          <p className="text-green-200 text-lg">AI 기술로 당신의 마음을 더 깊이 이해하고 관리하세요</p>
        </div>

        {/* 카테고리 네비게이션 */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
              selectedCategory === null
                ? 'bg-green-600 text-white'
                : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
            }`}
          >
            전체보기
          </button>
          {aiMindAssistantSubMenuItems.map((category) => (
            <button
              key={category.category}
              onClick={() => setSelectedCategory(category.category)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                selectedCategory === category.category
                  ? 'bg-green-600 text-white'
                  : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
              }`}
            >
              {category.category}
            </button>
          ))}
        </div>

        {/* AI 도구 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="group bg-gradient-to-br from-slate-800/50 to-green-800/50 backdrop-blur-xl rounded-2xl p-6 border border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:scale-105"
            >
              <div className="text-center">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-300">
                  {item.name}
                </h3>
                {item.description && (
                  <p className="text-green-200 text-sm mb-3">
                    {item.description}
                  </p>
                )}
                <div className="flex justify-center gap-2 mb-3">
                  <span className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded-full">
                    {item.category}
                  </span>
                </div>
                {item.badge && (
                  <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${
                    item.badge === '긴급' ? 'bg-red-500 text-white' :
                    item.badge === '신규' ? 'bg-green-500 text-white' :
                    'bg-orange-500 text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
