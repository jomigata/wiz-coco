'use client';

import { useState } from 'react';
import Link from 'next/link';
import OverviewNavigation from '@/components/OverviewNavigation';

// 상담 프로그램 메뉴 데이터
const counselingMenuItems = [
  {
    category: "개인 상담",
    items: [
      { name: "심리 상담", href: "/counseling/individual/psychological", description: "전문 심리상담사와 1:1 상담", icon: "💭", badge: "24시간" },
      { name: "성장 코칭", href: "/counseling/individual/growth-coaching", description: "개인 성장을 위한 코칭", icon: "🌱" },
      { name: "관계 상담", href: "/counseling/individual/relationship", description: "인간관계 문제 해결", icon: "💝" }
    ]
  },
  {
    category: "그룹 상담",
    items: [
      { name: "가족 상담", href: "/counseling/group/family", description: "가족 관계 개선 상담", icon: "👨‍👩‍👧‍👦" },
      { name: "커플 상담", href: "/counseling/group/couple", description: "연인/부부 관계 상담", icon: "💕" },
      { name: "직장 상담", href: "/counseling/group/workplace", description: "직장 내 스트레스 관리", icon: "🏢" }
    ]
  }
];

export default function CounselingOverviewPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredCategories = selectedCategory 
    ? counselingMenuItems.filter(category => category.category === selectedCategory)
    : counselingMenuItems;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      {/* 네비게이션 */}
      <OverviewNavigation currentPage="counseling" />

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">상담 프로그램 전체보기</h1>
          <p className="text-purple-200 text-lg">전문 상담사와 함께하는 맞춤형 상담 프로그램</p>
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
          {counselingMenuItems.map((category) => (
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
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold group-hover:text-purple-300">
                          {item.name}
                        </h3>
                        {item.badge && (
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                            item.badge === '24시간' ? 'bg-red-500 text-white' :
                            item.badge === '신규' ? 'bg-green-500 text-white' :
                            'bg-orange-500 text-white'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
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
