'use client';

import { useState } from 'react';
import Link from 'next/link';
import OverviewNavigation from '@/components/OverviewNavigation';

// 상담사 메뉴 데이터
const counselorMenuItems = [
  {
    category: "내담자 관리",
    items: [
      { name: "내담자 목록", href: "/counselor/clients", description: "담당 내담자 관리", icon: "👥" },
      { name: "상담 일정", href: "/counselor/schedule", description: "상담 일정 관리", icon: "📅" },
      { name: "상담 기록", href: "/counselor/sessions", description: "상담 세션 기록", icon: "📝" }
    ]
  },
  {
    category: "검사 관리",
    items: [
      { name: "검사 코드", href: "/counselor/test-codes", description: "검사 코드 발급 및 관리", icon: "🔑" },
      { name: "검사 결과", href: "/counselor/test-results", description: "내담자 검사 결과 조회", icon: "📊" },
      { name: "검사 추천", href: "/counselor/test-recommendations", description: "맞춤 검사 추천", icon: "🎯" }
    ]
  },
  {
    category: "상담 도구",
    items: [
      { name: "치료 계획", href: "/counselor/treatment-plans", description: "개인별 치료 계획 수립", icon: "📋" },
      { name: "진행 상황", href: "/counselor/progress", description: "상담 진행 상황 추적", icon: "📈" },
      { name: "상담 노트", href: "/counselor/notes", description: "상담 메모 및 기록", icon: "📄" },
      { name: "리소스", href: "/counselor/resources", description: "상담 자료 및 도구", icon: "📚" }
    ]
  }
];

export default function CounselorOverviewPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredCategories = selectedCategory 
    ? counselorMenuItems.filter(category => category.category === selectedCategory)
    : counselorMenuItems;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-violet-900">
      {/* 네비게이션 */}
      <OverviewNavigation currentPage="counselor" />

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">상담사 도구 전체보기</h1>
          <p className="text-purple-200 text-lg">전문 상담사를 위한 종합 관리 도구</p>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              selectedCategory === null
                ? 'bg-purple-600 text-white'
                : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
            }`}
          >
            전체보기
          </button>
          {counselorMenuItems.map((category) => (
            <button
              key={category.category}
              onClick={() => setSelectedCategory(category.category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                selectedCategory === category.category
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
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
              <h2 className="text-2xl font-bold text-purple-300 mb-6">
                {category.category}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.items.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="group flex items-center gap-4 p-4 bg-slate-800/30 rounded-lg hover:bg-slate-700/50 transition-all duration-300 border border-transparent hover:border-purple-500/30"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform duration-300">
                      {item.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold mb-1 group-hover:text-purple-300">
                        {item.name}
                      </h3>
                      <p className="text-purple-200 text-sm">
                        {item.description}
                      </p>
                    </div>
                    <svg 
                      className="w-5 h-5 text-purple-300 group-hover:text-white group-hover:translate-x-1 transition-all duration-300"
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
