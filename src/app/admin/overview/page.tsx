'use client';

import { useState } from 'react';
import Link from 'next/link';

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

  const allItems = adminMenuItems.flatMap(category => 
    category.items.map(item => ({ ...item, category: category.category }))
  );

  const filteredItems = selectedCategory 
    ? allItems.filter(item => item.category === selectedCategory)
    : allItems;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-stone-900">
      {/* 네비게이션 */}
      <nav className="bg-gradient-to-r from-gray-900/50 to-stone-900/50 backdrop-blur-xl border-b border-gray-500/30">
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
              <Link href="/admin" className="text-gray-300 hover:text-white transition-colors">
                관리자
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">관리자 도구 전체보기</h1>
          <p className="text-gray-200 text-lg">시스템 관리 및 운영을 위한 종합 관리 도구</p>
        </div>

        {/* 카테고리 네비게이션 */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
              selectedCategory === null
                ? 'bg-gray-600 text-white'
                : 'bg-gray-500/20 text-gray-300 hover:bg-gray-500/30'
            }`}
          >
            전체보기
          </button>
          {adminMenuItems.map((category) => (
            <button
              key={category.category}
              onClick={() => setSelectedCategory(category.category)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                selectedCategory === category.category
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-500/20 text-gray-300 hover:bg-gray-500/30'
              }`}
            >
              {category.category}
            </button>
          ))}
        </div>

        {/* 관리자 도구 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="group bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-500/30 hover:border-gray-400/50 transition-all duration-300 hover:scale-105"
            >
              <div className="text-center">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-gray-300">
                  {item.name}
                </h3>
                <p className="text-gray-200 text-sm mb-3">
                  {item.description}
                </p>
                <div className="flex justify-center gap-2 mb-3">
                  <span className="text-xs px-2 py-1 bg-gray-500/20 text-gray-300 rounded-full">
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
