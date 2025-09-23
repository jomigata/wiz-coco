'use client';

import { useState } from 'react';
import Link from 'next/link';

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

  const allItems = counselingMenuItems.flatMap(category => 
    category.items.map(item => ({ ...item, category: category.category }))
  );

  const filteredItems = selectedCategory 
    ? allItems.filter(item => item.category === selectedCategory)
    : allItems;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      {/* 네비게이션 */}
      <nav className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 backdrop-blur-xl border-b border-purple-500/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-white">
              WizCoCo
            </Link>
            <div className="flex items-center space-x-6">
              <Link href="/tests" className="text-gray-300 hover:text-white transition-colors">
                심리검사
              </Link>
              <Link href="/counseling" className="text-purple-300 hover:text-white transition-colors">
                상담 프로그램
              </Link>
              <Link href="/ai-mind-assistant" className="text-gray-300 hover:text-white transition-colors">
                AI 마음 비서
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">상담 프로그램 전체보기</h1>
          <p className="text-purple-200 text-lg">전문 상담사와 함께하는 맞춤형 상담 프로그램</p>
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
          {counselingMenuItems.map((category) => (
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

        {/* 상담 프로그램 그리드 */}
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
                {item.badge && (
                  <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${
                    item.badge === '24시간' ? 'bg-red-500 text-white' :
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
