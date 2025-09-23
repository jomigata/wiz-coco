'use client';

import { useState } from 'react';
import Link from 'next/link';
import { testSubMenuItems } from '@/data/psychologyTestMenu';
import OverviewNavigation from '@/components/OverviewNavigation';

export default function TestsOverviewPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* 네비게이션 */}
      <OverviewNavigation currentPage="tests" />

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">심리검사 전체보기</h1>
          <p className="text-blue-200 text-lg">모든 심리검사를 한눈에 확인하고 선택하세요</p>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
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
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                selectedCategory === category.category
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
              }`}
            >
              {category.category}
            </button>
          ))}
        </div>

        {/* 심플한 텍스트 위주 리스트 */}
        <div className="max-w-6xl mx-auto">
          {testSubMenuItems
            .filter((category) => !selectedCategory || category.category === selectedCategory)
            .map((category) => (
              <div key={category.category} className="mb-8">
                <h2 className="text-2xl font-bold text-blue-300 mb-4 flex items-center">
                  <span className="mr-3 text-3xl">{category.icon}</span>
                  {category.category}
                </h2>
                
                {category.subcategories.map((subcategory) => (
                  <div key={subcategory.name} className="mb-6 ml-6">
                    <h3 className="text-xl font-semibold text-indigo-300 mb-3 flex items-center">
                      <span className="mr-2 text-2xl">{subcategory.icon}</span>
                      {subcategory.name}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ml-8">
                      {subcategory.items.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="group flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg hover:bg-slate-700/50 transition-all duration-300 border border-transparent hover:border-blue-500/30"
                        >
                          <span className="text-xl group-hover:scale-110 transition-transform duration-300">
                            {item.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-white font-medium truncate group-hover:text-blue-300">
                                {item.name}
                              </h4>
                              {item.badge && (
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                  item.badge === '인기' ? 'bg-red-500 text-white' :
                                  item.badge === '신규' ? 'bg-green-500 text-white' :
                                  item.badge === '추천' ? 'bg-orange-500 text-white' :
                                  'bg-blue-500 text-white'
                                }`}>
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-blue-200 text-sm truncate">
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
