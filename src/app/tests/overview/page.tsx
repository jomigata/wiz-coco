'use client';

import { useState } from 'react';
import Link from 'next/link';
import { testSubMenuItems } from '@/data/psychologyTestMenu';

export default function TestsOverviewPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* 상단 네비게이션 */}
      <nav className="bg-gradient-to-r from-blue-900/50 to-indigo-900/50 backdrop-blur-xl border-b border-blue-500/30 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-white">
              WizCoCo
            </Link>
            <div className="flex items-center space-x-6">
              <Link href="/tests" className="text-blue-300 hover:text-white transition-colors">
                심리검사
              </Link>
              <Link href="/counseling" className="text-gray-300 hover:text-white transition-colors">
                상담 프로그램
              </Link>
              <Link href="/ai-mind-assistant" className="text-gray-300 hover:text-white transition-colors">
                AI 마음 비서
              </Link>
              <Link href="/counselor" className="text-gray-300 hover:text-white transition-colors">
                상담사
              </Link>
              <Link href="/admin" className="text-gray-300 hover:text-white transition-colors">
                관리자
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-8 max-h-[calc(100vh-120px)] overflow-y-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">심리검사 전체보기</h1>
          <p className="text-blue-200 text-lg">다양한 심리검사를 통해 자신을 더 깊이 이해해보세요</p>
        </div>

        {/* 카테고리 네비게이션 */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
              selectedCategory === null
                ? 'bg-blue-600 text-white'
                : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
            }`}
          >
            전체보기
          </button>
          {testSubMenuItems.map((category) => (
            <button
              key={category.category}
              onClick={() => setSelectedCategory(category.category)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                selectedCategory === category.category
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.category}
            </button>
          ))}
        </div>

        {/* 테스트 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {testSubMenuItems
            .filter((category) => !selectedCategory || category.category === selectedCategory)
            .map((category) =>
              category.subcategories.map((subcategory) =>
                subcategory.items.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="group bg-gradient-to-br from-slate-800/50 to-blue-800/50 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:scale-105"
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                        {item.icon}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300">
                        {item.name}
                      </h3>
                      <p className="text-blue-200 text-sm mb-3">
                        {item.description}
                      </p>
                      <div className="flex justify-center gap-2 mb-3">
                        <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                          {category.category}
                        </span>
                        <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full">
                          {subcategory.name}
                        </span>
                      </div>
                      {item.badge && (
                        <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${
                          item.badge === '인기' ? 'bg-red-500 text-white' :
                          item.badge === '신규' ? 'bg-green-500 text-white' :
                          item.badge === '추천' ? 'bg-orange-500 text-white' :
                          'bg-blue-500 text-white'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                ))
              )
            )}
        </div>
      </div>
    </div>
  );
}
