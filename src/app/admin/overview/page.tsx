'use client';

import { useState } from 'react';
import Link from 'next/link';
import OverviewNavigation from '@/components/OverviewNavigation';

// 관리자 메뉴 데이터
const adminMenuItems = [
  {
    category: "대시보드 & 모니터링",
    items: [
      { name: "시스템 대시보드", href: "/admin/dashboard", description: "전체 현황 한눈에 보기", icon: "📊" },
      { name: "실시간 모니터링", href: "/admin/realtime-monitoring", description: "실시간 시스템 상태", icon: "⚡" },
      { name: "알림 관리", href: "/admin/notification-management", description: "중요 알림 및 이벤트 관리", icon: "🔔" }
    ]
  },
  {
    category: "사용자 & 상담 관리",
    items: [
      { name: "사용자 관리", href: "/admin/user-management", description: "상담사/내담자 통합 관리", icon: "👥" },
      { name: "상담 관리", href: "/admin/counseling-management", description: "상담 일정, 진행 상황", icon: "💬" },
      { name: "심리검사 관리", href: "/admin/psychological-tests", description: "검사 생성, 배포", icon: "🧠" },
      { name: "콘텐츠 관리", href: "/admin/content-management", description: "상담 프로그램, 공지사항 부분", icon: "📝" }
    ]
  },
  {
    category: "시스템 & 보안 관리",
    items: [
      { name: "시스템 설정", href: "/admin/system-settings", description: "서버, 데이터베이스 관리", icon: "⚙️" },
      { name: "보안 관리", href: "/admin/security-management", description: "접근 권한, 보안 정책", icon: "🔒" },
      { name: "데이터 관리", href: "/admin/data-management", description: "백업, 복구, 분석", icon: "🗄️" }
    ]
  }
];

export default function AdminOverviewPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredCategories = selectedCategory 
    ? adminMenuItems.filter(category => category.category === selectedCategory)
    : adminMenuItems;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-violet-900">
      {/* 네비게이션 */}
      <OverviewNavigation currentPage="admin" />

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">관리자 도구 전체보기</h1>
          <p className="text-purple-200 text-lg">시스템 관리 및 운영을 위한 종합 관리 도구</p>
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
          {adminMenuItems.map((category) => (
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
        <div className="max-w-5xl mx-auto">
          {filteredCategories.map((category) => (
            <div key={category.category} className="mb-8">
              <h2 className="text-2xl font-bold text-purple-300 mb-6">
                {category.category}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
