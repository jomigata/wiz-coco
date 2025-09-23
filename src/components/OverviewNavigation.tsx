'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { testSubMenuItems } from '@/data/psychologyTestMenu';

interface OverviewNavigationProps {
  currentPage: 'tests' | 'counseling' | 'ai-mind-assistant' | 'counselor' | 'admin';
}

export default function OverviewNavigation({ currentPage }: OverviewNavigationProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const testScroll = useAutoScroll();
  const counselingScroll = useAutoScroll();
  const aiAssistantScroll = useAutoScroll();
  const counselorScroll = useAutoScroll();
  const adminScroll = useAutoScroll();

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
    }
  ];

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
    }
  ];

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
        { name: "심리검사 관리", href: "/admin/psychological-tests", description: "검사 생성, 배포", icon: "🧠" }
      ]
    }
  ];

  return (
    <nav className="bg-gradient-to-r from-slate-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-xl border-b border-blue-500/30 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">
            WizCoCo
          </Link>
          
          <div className="flex items-center space-x-8">
            {/* 심리검사 메뉴 */}
            <div className="relative">
              <button
                onMouseEnter={() => setActiveMenu('tests')}
                onMouseLeave={() => setActiveMenu(null)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  currentPage === 'tests' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-blue-300 hover:text-white hover:bg-blue-500/20'
                }`}
              >
                <span>심리검사</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {activeMenu === 'tests' && (
                <div
                  className="absolute left-0 mt-2 pt-4 pb-8 w-96 min-w-[24rem] max-w-[28rem] bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-indigo-900/95 rounded-2xl shadow-2xl border border-blue-500/30 z-50 animate-fadeIn backdrop-blur-xl"
                  onMouseEnter={() => setActiveMenu('tests')}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  <div className="relative">
                    <div className="absolute top-2 right-2 z-20">
                      <Link
                        href="/tests/overview"
                        className="flex items-center justify-center w-8 h-8 bg-blue-600/90 hover:bg-blue-500 text-white rounded-full shadow-lg border border-blue-400/50 transition-all duration-300 hover:scale-110"
                        title="전체보기"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      </Link>
                    </div>
                    
                    <div
                      ref={testScroll.scrollRef}
                      className="px-6 py-4 space-y-2 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-900"
                      onMouseMove={testScroll.handleMouseMove}
                      onMouseLeave={testScroll.handleMouseLeave}
                    >
                      {testSubMenuItems.map((category) => (
                        <div key={category.category} className="mb-4 last:mb-0">
                          <div className="px-2 py-1 text-base font-bold text-blue-300 uppercase tracking-wide mb-2">
                            {category.category}
                          </div>
                          <div className="space-y-1">
                            {category.subcategories.map((subcategory) => (
                              <div key={subcategory.name} className="mb-3">
                                <div className="px-2 py-1 text-base font-bold text-indigo-300 mb-1">
                                  {subcategory.name}
                                </div>
                                <div className="space-y-1">
                                  {subcategory.items.map((item) => (
                                    <Link
                                      key={item.name}
                                      href={item.href}
                                      className="group flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-300 border border-transparent hover:border-white/20"
                                    >
                                      <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                        {item.icon}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="text-base font-medium text-white truncate">{item.name}</span>
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
                                        <div className="text-sm text-blue-300 truncate">{item.description}</div>
                                      </div>
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 상담 프로그램 메뉴 */}
            <div className="relative">
              <button
                onMouseEnter={() => setActiveMenu('counseling')}
                onMouseLeave={() => setActiveMenu(null)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  currentPage === 'counseling' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-purple-300 hover:text-white hover:bg-purple-500/20'
                }`}
              >
                <span>상담 프로그램</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {activeMenu === 'counseling' && (
                <div
                  className="absolute left-0 mt-2 pt-4 pb-8 w-96 min-w-[24rem] max-w-[28rem] bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-violet-900/95 rounded-2xl shadow-2xl border border-purple-500/30 z-50 animate-fadeIn backdrop-blur-xl"
                  onMouseEnter={() => setActiveMenu('counseling')}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  <div className="relative">
                    <div className="absolute top-2 right-2 z-20">
                      <Link
                        href="/counseling/overview"
                        className="flex items-center justify-center w-8 h-8 bg-purple-600/90 hover:bg-purple-500 text-white rounded-full shadow-lg border border-purple-400/50 transition-all duration-300 hover:scale-110"
                        title="전체보기"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      </Link>
                    </div>
                    
                    <div
                      ref={counselingScroll.scrollRef}
                      className="px-6 py-4 space-y-2 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-purple-900"
                      onMouseMove={counselingScroll.handleMouseMove}
                      onMouseLeave={counselingScroll.handleMouseLeave}
                    >
                      {counselingMenuItems.map((category) => (
                        <div key={category.category} className="mb-4 last:mb-0">
                          <div className="px-2 py-1 text-base font-bold text-purple-300 uppercase tracking-wide mb-2">
                            {category.category}
                          </div>
                          <div className="space-y-1">
                            {category.items.map((item) => (
                              <Link
                                key={item.name}
                                href={item.href}
                                className="group flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-purple-500/20 to-violet-500/20 rounded-xl hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-300 border border-transparent hover:border-white/20"
                              >
                                <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                  {item.icon || '💭'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base font-medium text-white truncate">{item.name}</span>
                                    {(item as any).badge && (
                                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                        (item as any).badge === '24시간' ? 'bg-red-500 text-white' :
                                        (item as any).badge === '신규' ? 'bg-green-500 text-white' :
                                        'bg-orange-500 text-white'
                                      }`}>
                                        {(item as any).badge}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-purple-300 truncate">{item.description}</div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* AI 마음 비서 메뉴 */}
            <div className="relative">
              <button
                onMouseEnter={() => setActiveMenu('ai-mind-assistant')}
                onMouseLeave={() => setActiveMenu(null)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  currentPage === 'ai-mind-assistant' 
                    ? 'bg-green-600 text-white' 
                    : 'text-green-300 hover:text-white hover:bg-green-500/20'
                }`}
              >
                <span>AI 마음 비서</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {activeMenu === 'ai-mind-assistant' && (
                <div
                  className="absolute left-0 mt-2 pt-4 pb-8 w-96 min-w-[24rem] max-w-[28rem] bg-gradient-to-br from-slate-900/95 via-green-900/95 to-emerald-900/95 rounded-2xl shadow-2xl border border-green-500/30 z-50 animate-fadeIn backdrop-blur-xl"
                  onMouseEnter={() => setActiveMenu('ai-mind-assistant')}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  <div className="relative">
                    <div className="absolute top-2 right-2 z-20">
                      <Link
                        href="/ai-mind-assistant/overview"
                        className="flex items-center justify-center w-8 h-8 bg-green-600/90 hover:bg-green-500 text-white rounded-full shadow-lg border border-green-400/50 transition-all duration-300 hover:scale-110"
                        title="전체보기"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      </Link>
                    </div>
                    
                    <div
                      ref={aiAssistantScroll.scrollRef}
                      className="px-6 py-4 space-y-2 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-green-600 scrollbar-track-green-900"
                      onMouseMove={aiAssistantScroll.handleMouseMove}
                      onMouseLeave={aiAssistantScroll.handleMouseLeave}
                    >
                      {aiAssistantMenuItems.map((category) => (
                        <div key={category.category} className="mb-4 last:mb-0">
                          <div className="px-2 py-1 text-base font-bold text-green-300 uppercase tracking-wide mb-2">
                            {category.category}
                          </div>
                          <div className="space-y-1">
                            {category.items.map((item) => (
                              <Link
                                key={item.name}
                                href={item.href}
                                className="group flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-300 border border-transparent hover:border-white/20"
                              >
                                <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                  {item.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base font-medium text-white truncate">{item.name}</span>
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
                                  <div className="text-sm text-green-300 truncate">{item.description}</div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 상담사 메뉴 */}
            <div className="relative">
              <button
                onMouseEnter={() => setActiveMenu('counselor')}
                onMouseLeave={() => setActiveMenu(null)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  currentPage === 'counselor' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-purple-300 hover:text-white hover:bg-purple-500/20'
                }`}
              >
                <span>상담사</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {activeMenu === 'counselor' && (
                <div
                  className="absolute left-0 mt-2 pt-4 pb-8 w-96 min-w-[24rem] max-w-[28rem] bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-violet-900/95 rounded-2xl shadow-2xl border border-purple-500/30 z-50 animate-fadeIn backdrop-blur-xl"
                  onMouseEnter={() => setActiveMenu('counselor')}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  <div className="relative">
                    <div className="absolute top-2 right-2 z-20">
                      <Link
                        href="/counselor/overview"
                        className="flex items-center justify-center w-8 h-8 bg-purple-600/90 hover:bg-purple-500 text-white rounded-full shadow-lg border border-purple-400/50 transition-all duration-300 hover:scale-110"
                        title="전체보기"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      </Link>
                    </div>
                    
                    <div
                      ref={counselorScroll.scrollRef}
                      className="px-6 py-4 space-y-2 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-purple-900"
                      onMouseMove={counselorScroll.handleMouseMove}
                      onMouseLeave={counselorScroll.handleMouseLeave}
                    >
                      {counselorMenuItems.map((category) => (
                        <div key={category.category} className="mb-4 last:mb-0">
                          <div className="px-2 py-1 text-base font-bold text-purple-300 uppercase tracking-wide mb-2">
                            {category.category}
                          </div>
                          <div className="space-y-1">
                            {category.items.map((item) => (
                              <Link
                                key={item.name}
                                href={item.href}
                                className="group flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-purple-500/20 to-violet-500/20 rounded-xl hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-300 border border-transparent hover:border-white/20"
                              >
                                <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                  {item.icon || '👨‍⚕️'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base font-medium text-white truncate">{item.name}</span>
                                  </div>
                                  <div className="text-sm text-purple-300 truncate">{item.description}</div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 관리자 메뉴 */}
            <div className="relative">
              <button
                onMouseEnter={() => setActiveMenu('admin')}
                onMouseLeave={() => setActiveMenu(null)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  currentPage === 'admin' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-purple-300 hover:text-white hover:bg-purple-500/20'
                }`}
              >
                <span>관리자</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {activeMenu === 'admin' && (
                <div
                  className="absolute right-0 mt-2 pt-4 pb-8 w-96 min-w-[24rem] max-w-[28rem] bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-violet-900/95 rounded-2xl shadow-2xl border border-purple-500/30 z-50 animate-fadeIn backdrop-blur-xl"
                  onMouseEnter={() => setActiveMenu('admin')}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  <div className="relative">
                    <div className="absolute top-2 right-2 z-20">
                      <Link
                        href="/admin/overview"
                        className="flex items-center justify-center w-8 h-8 bg-purple-600/90 hover:bg-purple-500 text-white rounded-full shadow-lg border border-purple-400/50 transition-all duration-300 hover:scale-110"
                        title="전체보기"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      </Link>
                    </div>
                    
                    <div
                      ref={adminScroll.scrollRef}
                      className="px-6 py-4 space-y-2 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-purple-900"
                      onMouseMove={adminScroll.handleMouseMove}
                      onMouseLeave={adminScroll.handleMouseLeave}
                    >
                      {adminMenuItems.map((category) => (
                        <div key={category.category} className="mb-4 last:mb-0">
                          <div className="px-2 py-1 text-base font-bold text-purple-300 uppercase tracking-wide mb-2">
                            {category.category}
                          </div>
                          <div className="space-y-1">
                            {category.items.map((item) => (
                              <Link
                                key={item.name}
                                href={item.href}
                                className="group flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-purple-500/20 to-violet-500/20 rounded-xl hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-300 border border-transparent hover:border-white/20"
                              >
                                <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                  {item.icon || '🔧'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base font-medium text-white truncate">{item.name}</span>
                                  </div>
                                  <div className="text-sm text-purple-300 truncate">{item.description}</div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
