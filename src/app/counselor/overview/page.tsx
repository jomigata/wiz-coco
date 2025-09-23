'use client';

import { useState } from 'react';
import Link from 'next/link';

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

  const allItems = counselorMenuItems.flatMap(category => 
    category.items.map(item => ({ ...item, category: category.category }))
  );

  const filteredItems = selectedCategory 
    ? allItems.filter(item => item.category === selectedCategory)
    : allItems;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-violet-900">
      {/* 네비게이션 */}
      <nav className="bg-gradient-to-r from-purple-900/50 to-violet-900/50 backdrop-blur-xl border-b border-purple-500/30">
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
              <Link href="/counselor" className="text-purple-300 hover:text-white transition-colors">
                상담사
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">상담사 도구 전체보기</h1>
          <p className="text-purple-200 text-lg">전문 상담사를 위한 종합 관리 도구</p>
        </div>

        {/* 카테고리 네비게이션 */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
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
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                selectedCategory === category.category
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
              }`}
            >
              {category.category}
            </button>
          ))}
        </div>

        {/* 상담사 도구 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="group bg-gradient-to-br from-slate-800/50 to-purple-800/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-105"
            >
              <div className="text-center">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300">
                  {item.name}
                </h3>
                <p className="text-purple-200 text-sm mb-3">
                  {item.description}
                </p>
                <div className="flex justify-center gap-2 mb-3">
                  <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full">
                    {item.category}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
