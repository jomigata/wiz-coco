"use client";
import React from "react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { removeItem } from '@/utils/localStorageManager';
import { shouldShowCounselorMenu, shouldShowAdminMenu } from '@/utils/roleUtils';
import { testSubMenuItems } from '@/data/psychologyTestMenu';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { getInProgressTests, loadTestProgress } from '@/utils/testResume';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useFirebaseAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("/");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>("개인 심리 및 성장");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>("성격 및 기질 탐색");
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // 스크롤 상태 관리
  const [scrollStates, setScrollStates] = useState<{[key: string]: {canScrollUp: boolean, canScrollDown: boolean}}>({});
  const [scrollIntervals, setScrollIntervals] = useState<{[key: string]: NodeJS.Timeout | null}>({});
  
  // 자동 스크롤 훅들
  const counselingScroll = useAutoScroll();
  const aiAssistantScroll = useAutoScroll();
  const userMenuScroll = useAutoScroll();
  
  const isDropdownOpen = activeMenu === 'user';
  const isCounselingDropdownOpen = activeMenu === 'counseling';
  const isUserMenuOpen = activeMenu === 'additional';
  const isAiMindAssistantOpen = activeMenu === 'ai-mind-assistant';
  const isPsychologyTestsOpen = activeMenu === 'psychology-tests';
  const isCounselorOpen = activeMenu === 'counselor';
  const isAdminOpen = activeMenu === 'admin';

  const isLoggedIn = !!user && !loading;
  const [inProgressTestsCount, setInProgressTestsCount] = useState(0);
  const [isTestInProgress, setIsTestInProgress] = useState(false);

  // 심리검사 페이지인지 확인 (모든 /tests/ 경로)
  const isTestPage = pathname?.startsWith('/tests/') || pathname === '/tests';

  // 진행중인 검사 수 가져오기 및 실제 검사 진행 중인지 확인
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateCount = () => {
        const tests = getInProgressTests();
        setInProgressTestsCount(tests.length);
      };
      updateCount();
      // 주기적으로 업데이트 (5초마다)
      const interval = setInterval(updateCount, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  // 실제 검사 진행 중인지 확인 (시작 페이지와 질문 답변 페이지에서는 말풍선 숨김)
  // 검사결과 페이지(/results/)에서는 항상 표시
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsTestInProgress(false);
      return;
    }

    // 검사결과 페이지에서는 항상 팝업 표시
    if (pathname?.startsWith('/results/') || (pathname?.startsWith('/tests/') && pathname?.includes('/result'))) {
      setIsTestInProgress(false);
      return;
    }

    // 검사 페이지(/tests/)에서도 기본적으로 말풍선 표시
    // 단, 시작 페이지(코드입력, 정보입력)나 질문 답변 페이지에서는 숨김
    if (isTestPage) {
      // sessionStorage에서 현재 검사 단계 확인
      const currentTestStep = sessionStorage.getItem('currentTestStep');
      
      // 시작 페이지나 질문 답변 페이지인 경우 말풍선 숨김
      // 'code': 코드입력, 'info': 정보입력, 'test': 질문 답변 중
      if (currentTestStep === 'code' || currentTestStep === 'info' || currentTestStep === 'test') {
        setIsTestInProgress(true);
        return;
      }
      
      // 검사 대시보드나 다른 페이지에서는 말풍선 표시
      setIsTestInProgress(false);
      return;
    }

    setIsTestInProgress(false);
  }, [pathname, isTestPage]);

  // 진행중인 검사 팝업 클릭 핸들러
  const handleInProgressTestsClick = () => {
    router.push('/mypage?tab=in-progress');
  };
  const userEmail = user?.email || "";
  const userName = user?.displayName || "";

  // 스크롤 상태 감지 함수
  const checkScrollState = (menuId: string, scrollElement: HTMLElement) => {
    const canScrollUp = scrollElement.scrollTop > 0;
    const canScrollDown = scrollElement.scrollTop < (scrollElement.scrollHeight - scrollElement.clientHeight);
    
    setScrollStates(prev => ({
      ...prev,
      [menuId]: { canScrollUp, canScrollDown }
    }));
  };

  // 스크롤 이벤트 핸들러
  const handleScroll = (menuId: string, event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    checkScrollState(menuId, target);
  };

  // 부드러운 스크롤 함수
  const smoothScroll = (menuId: string, direction: 'up' | 'down', scrollElement: HTMLElement) => {
    const scrollAmount = direction === 'up' ? -8 : 8;
    const targetScrollTop = Math.max(0, Math.min(
      scrollElement.scrollHeight - scrollElement.clientHeight,
      scrollElement.scrollTop + scrollAmount
    ));
    
    scrollElement.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    });
    
    // 스크롤 상태 업데이트를 위한 타이머
    setTimeout(() => {
      checkScrollState(menuId, scrollElement);
    }, 100);
  };

  // 마우스 위치에 따른 동적 스크롤 (개선된 버전)
  const handleMouseMove = (menuId: string, event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const height = rect.height;
    
    const scrollElement = event.currentTarget.querySelector('.scrollable-content') as HTMLElement;
    if (!scrollElement) return;
    
    // 기존 스크롤 인터벌 정리
    if (scrollIntervals[menuId]) {
      clearInterval(scrollIntervals[menuId]);
    }
    
    // 상단 15% 영역에서 위로 스크롤
    if (y < height * 0.15) {
      const interval = setInterval(() => {
        smoothScroll(menuId, 'up', scrollElement);
      }, 50);
      setScrollIntervals(prev => ({ ...prev, [menuId]: interval }));
    }
    // 하단 15% 영역에서 아래로 스크롤
    else if (y > height * 0.85) {
      const interval = setInterval(() => {
        smoothScroll(menuId, 'down', scrollElement);
      }, 50);
      setScrollIntervals(prev => ({ ...prev, [menuId]: interval }));
    }
    // 중간 영역에서는 스크롤 중지
    else {
      if (scrollIntervals[menuId]) {
        clearInterval(scrollIntervals[menuId]);
        setScrollIntervals(prev => ({ ...prev, [menuId]: null }));
      }
    }
  };

  // 마우스가 메뉴를 벗어날 때 스크롤 중지
  const handleMouseLeave = (menuId: string) => {
    if (scrollIntervals[menuId]) {
      clearInterval(scrollIntervals[menuId]);
      setScrollIntervals(prev => ({ ...prev, [menuId]: null }));
    }
  };

  // 기본 useEffect들
  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      setActiveItem(path);
      // 전역 정리는 제거 - getInProgressTests에서만 수행하여 중복 호출 방지
      // 페이지 이동 시마다 실행되면 진행 중인 검사까지 삭제될 수 있음
    }
  }, [user, loading, isLoggedIn, userEmail, userName]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (!activeMenu) return;
      const target = e.target as Element;
      const isInsideDropdown = target.closest('[data-dropdown-menu]');
      if (isInsideDropdown) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!activeMenu) return;
      const target = e.target as Element;
      const isInsideDropdown = target.closest('[data-dropdown-menu]');
      if (isInsideDropdown) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("wheel", handleWheel, { passive: false });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("wheel", handleWheel);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, [activeMenu]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // 핸들러 함수들
  const handleLogout = async () => {
    try {
      const result = await logout();
      if (result.success) {
        removeItem('auth-state');
        removeItem('user');
        removeItem('userToken');
        removeItem('oktest-auth-state');
        document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        router.push('/');
      } else {
        removeItem('auth-state');
        removeItem('user');
        removeItem('userToken');
        router.push('/');
      }
    } catch (error) {
      removeItem('auth-state');
      removeItem('user');
      removeItem('userToken');
      router.push('/');
    }
  };

  const handleNavLinkClick = (href: string, e: React.MouseEvent) => {
    setActiveItem(href);
  };

  const handleAuthLinkClick = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (href === "/register") {
      router.push("/register");
    } else {
      router.push(href);
    }
  };

  // 메뉴 데이터
  const counselingMenuItems = [
    {
      category: "개인 상담",
      items: [
        { name: "심리 상담", href: "/counseling/psychology", description: "전문 심리상담사와 1:1 상담", badge: "24시간", icon: "💭" },
        { name: "성장 코칭", href: "/counseling/growth", description: "개인 성장을 위한 코칭", icon: "🌱" },
        { name: "관계 상담", href: "/counseling/relationship", description: "인간관계 문제 해결", icon: "💔" }
      ]
    },
    {
      category: "그룹 상담",
      items: [
        { name: "가족 상담", href: "/counseling/family", description: "가족 관계 개선 상담", icon: "👨‍👩‍👧‍👦" },
        { name: "커플 상담", href: "/counseling/couple", description: "연인/부부 관계 상담", icon: "💑" },
        { name: "직장 상담", href: "/counseling/workplace", description: "직장 내 스트레스 관리", icon: "🏢" }
      ]
    }
  ];

  const personalFeaturesMenu = [
    {
      category: "개인 관리",
      items: [
        { name: "검사 기록", href: "/mypage?tab=records", description: "나의 심리검사 결과 모음", icon: "📊" },
        { name: "할당된 검사", href: "/mypage/assigned-tests", description: "상담사가 할당한 검사", icon: "📋" },
        { name: "AI 프로파일링", href: "/tests/ai-profiling", description: "캠퍼스 라이프 시크릿 리포트", icon: "🔍" },
        { name: "통합 심리검사", href: "/tests/integrated-assessment", description: "신입생 통합 심리검사", icon: "🎓" },
        { name: "AI 종합 분석", href: "/tests/ai-analysis", description: "AI 기반 맞춤형 리포트", icon: "🤖" },
        { name: "성장 리포트", href: "/progress", description: "개인 성장 분석 리포트", icon: "📈" },
        { name: "목표 관리", href: "/goals", description: "개인 목표 설정 및 추적", icon: "🎯" }
      ]
    },
    {
      category: "상담 & 소통",
      items: [
        { name: "1:1 채팅", href: "/chat", description: "상담사와 실시간 채팅", icon: "💬" },
        { name: "상담 예약", href: "/counseling/appointments", description: "개인/가족/커플 상담 예약", icon: "📅" },
        { name: "상담사 연결", href: "/mypage/connect-counselor", description: "상담사 인증코드 입력", icon: "🔗" },
        { name: "상담사 지원", href: "/counselor-application", description: "상담사 지원 신청", icon: "👨‍⚕️" }
      ]
    },
    {
      category: "일상 관리",
      items: [
        { name: "일상 추적", href: "/mypage/daily-tracking", description: "매일의 마음 상태 기록", icon: "📝" },
        { name: "MBTI 궁합", href: "/mbti-compatibility", description: "AI 기반 MBTI 궁합 분석", icon: "💕" }
      ]
    },
    {
      category: "학습 & 성장",
      items: [
        { name: "학습 자료", href: "/learning", description: "심리학 교육 콘텐츠", icon: "📚" },
        { name: "맞춤 추천", href: "/recommendations", description: "AI 기반 상담 추천", icon: "💡" },
        { name: "일정 관리", href: "/calendar", description: "상담 예약 및 일정 관리", icon: "📅" }
      ]
    }
  ];

  // 상담사 메뉴 데이터
  const counselorMenuItems = [
    {
      category: "내담자 관리",
      items: [
        { name: "내담자 목록", href: "/counselor/clients", description: "담당 내담자 관리", icon: "👥" },
        { name: "검사 할당", href: "/counselor/assign-tests", description: "내담자에게 검사 할당", icon: "📋" },
        { name: "검사 관리", href: "/counselor/test-management", description: "신입생 통합 검사 관리", icon: "🎓" },
        { name: "상담 일정", href: "/counselor/schedule", description: "상담 일정 관리", icon: "📅" },
        { name: "상담 기록", href: "/counselor/sessions", description: "상담 세션 기록", icon: "📝" }
      ]
    },
    {
      category: "심리검사 관리",
      items: [
        { name: "검사 결과 분석", href: "/counselor/test-results", description: "내담자 검사 결과 분석", icon: "📊" },
        { name: "검사 추천", href: "/counselor/test-recommendations", description: "맞춤 검사 추천", icon: "🎯" },
        { name: "인증코드 관리", href: "/counselor/codes", description: "상담사 인증코드 관리", icon: "🔑" }
      ]
    },
    {
      category: "상담 도구",
      items: [
        { name: "1:1 채팅", href: "/chat", description: "내담자와 실시간 채팅", icon: "💬" },
        { name: "상담 노트", href: "/counselor/notes", description: "상담 내용 기록", icon: "📋" },
        { name: "치료 계획", href: "/counselor/treatment-plans", description: "치료 계획 수립", icon: "📋" },
        { name: "진행 상황", href: "/counselor/progress", description: "치료 진행 상황 추적", icon: "📈" }
      ]
    },
    {
      category: "데이터 관리",
      items: [
        { name: "데이터 공유", href: "/counselor/data-sharing", description: "다른 상담사와 데이터 공유", icon: "🤝" },
        { name: "일상 기록 관리", href: "/counselor/daily-records", description: "내담자 일상 기록 관리", icon: "📊" }
      ]
    }
  ];

  // 통합 관리자 메뉴 데이터
  const adminMenuItems = [
    {
      category: "대시보드 & 모니터링",
      items: [
        { name: "시스템 대시보드", href: "/admin/system-dashboard", description: "전체 현황 한눈에 보기", icon: "📊" },
        { name: "실시간 모니터링", href: "/admin/realtime-monitoring", description: "활성 사용자, 상담 진행 상황", icon: "⚡" },
        { name: "알림 관리", href: "/admin/notification-management", description: "중요 알림 및 이벤트 관리", icon: "🔔" }
      ]
    },
    {
      category: "사용자 & 상담 관리",
      items: [
        { name: "사용자 관리", href: "/admin/user-management", description: "상담사/내담자 통합 관리", icon: "👥" },
        { name: "상담사 관리", href: "/admin/counselor-management", description: "상담사 인증, 자격 검증, 프로필 관리", icon: "👨‍⚕️" },
        { name: "상담 관리", href: "/admin/counseling-management", description: "상담 일정, 진행 상황, 결과 관리", icon: "💭" },
        { name: "심리검사 관리", href: "/admin/psychological-tests", description: "검사 생성, 배포, 결과 분석", icon: "🧠" },
        { name: "콘텐츠 관리", href: "/admin/content-management", description: "상담 프로그램, 공지사항, 자료 관리", icon: "📚" }
      ]
    },
    {
      category: "시스템 & 보안 관리",
      items: [
        { name: "시스템 설정", href: "/admin/system-settings", description: "기본 설정, 권한 관리", icon: "⚙️" },
        { name: "데이터 관리", href: "/admin/data-management", description: "백업, 복원, 데이터 분석", icon: "💾" },
        { name: "보안 관리", href: "/admin/security-management", description: "보안 설정, 로그 관리, 접근 제어", icon: "🔐" }
      ]
    }
  ];

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
        { name: "AI 감정/스트레스 분석", href: "/ai-mind-assistant/emotion-report", description: "종합 감정 및 스트레스 분석 결과", icon: "📋" },
        { name: "AI 마음 컨디션 리포트", href: "/ai-mind-assistant/growth-level", description: "현재 마음 상태 종합 점검", icon: "🏆" }
      ]
    }
  ];

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-fadeIn-slow {
          animation: fadeIn 1.2s ease-out;
        }
      `}</style>
      <nav className="fixed top-0 inset-x-0 z-50 bg-indigo-900 border-b border-white h-16 shadow-sm">
        <div className="container max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          {/* 브랜드 텍스트 */}
          <Link href="/" className="flex flex-col items-center group mr-8" onClick={(e) => handleNavLinkClick("/", e)}>
            <span className="font-bold text-2xl tracking-tight text-white transition-colors duration-300 leading-tight group-hover:text-blue-300 whitespace-nowrap">
              AI 심리검사
            </span>
            <span className="text-xs text-blue-200 font-medium whitespace-nowrap group-hover:text-blue-100">
              Psychological Care
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <div className="flex space-x-1">
              
              {/* 심리검사 드롭다운 메뉴 */}
              <div className="relative">
                <Link
                  href="/tests"
                  className={`px-4 py-2.5 rounded-lg font-medium text-base transition-all duration-300 flex items-center whitespace-nowrap ${
                    activeItem === "/tests" || activeItem.startsWith("/tests/")
                      ? "text-white bg-blue-600"
                      : "text-gray-300 hover:text-white hover:bg-blue-800/50"
                  }`}
                  onClick={(e) => handleNavLinkClick("/tests", e)}
                  onMouseEnter={() => setActiveMenu('psychology-tests')}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  🧠 AI 심리검사
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`w-4 h-4 ml-1 transition-transform duration-200 ${isPsychologyTestsOpen ? "rotate-180" : ""}`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>

                {/* 심리검사 메가 메뉴 */}
                {isPsychologyTestsOpen && (
                  <div
                    data-dropdown-menu="psychology-tests"
                    className="absolute left-0 mt-0 pt-4 pb-8 w-[900px] min-w-[48rem] max-w-[60rem] bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-indigo-900/95 rounded-2xl shadow-2xl border border-blue-500/30 z-50 animate-fadeIn backdrop-blur-xl"
                    onMouseEnter={() => setActiveMenu('psychology-tests')}
                    onMouseLeave={() => setActiveMenu(null)}
                  >
                    <div className="relative flex h-[70vh]">
                      {/* 왼쪽: 대분류 5개 */}
                      <div className="w-2/5 p-4 border-r border-blue-500/30">
                        <div className="text-lg font-bold text-blue-300 mb-4">🧠 AI 심리검사</div>
                        <div className="space-y-2">
                          {testSubMenuItems.map((mainCategory, index) => (
                            <div
                              key={mainCategory.category}
                              className={`p-4 rounded-lg cursor-pointer transition-all duration-300 border-2 ${
                                selectedMainCategory === mainCategory.category
                                  ? 'bg-blue-600 text-white border-blue-400 shadow-lg'
                                  : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/40 hover:text-white border-blue-500/30 hover:border-blue-400 hover:shadow-md'
                              }`}
                              onClick={() => {
                                setSelectedMainCategory(mainCategory.category);
                                const categoryMap: { [key: string]: string } = {
                                  "개인 심리 및 성장": "personal-growth",
                                  "대인관계 및 사회적응": "relationships-social", 
                                  "정서 문제 및 정신 건강": "emotional-mental",
                                  "현실 문제 및 생활 관리": "reality-life",
                                  "문화 및 환경 적응": "culture-environment",
                                  "임시 검사": "temporary-tests"
                                };
                                const categoryId = categoryMap[mainCategory.category];
                                router.push(`/tests?category=${categoryId}`);
                                setActiveMenu(null);
                              }}
                              onMouseEnter={() => {
                                setSelectedMainCategory(mainCategory.category);
                                if (mainCategory.subcategories && mainCategory.subcategories.length > 0) {
                                  setSelectedSubcategory(mainCategory.subcategories[0].name);
                                }
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{mainCategory.icon}</span>
                                <span className="font-medium">{mainCategory.category}</span>
                                <svg 
                                  className="w-4 h-4 text-white ml-auto"
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 오른쪽: 선택된 대분류의 중분류 */}
                      <div className="w-3/5 p-4">
                        {selectedMainCategory ? (
                          <div>
                            <div className="text-lg font-bold text-blue-300 mb-4">
                              {selectedMainCategory}
                            </div>
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                              {testSubMenuItems
                                .find(category => category.category === selectedMainCategory)
                                ?.subcategories.map((subcategory) => (
                                <div key={subcategory.name} className="relative">
                                  <div
                                    className={`group flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 border-2 cursor-pointer shadow-md hover:shadow-lg ${
                                      selectedSubcategory === subcategory.name 
                                        ? 'bg-blue-600 text-white border-blue-400 shadow-lg' 
                                        : 'bg-gradient-to-r from-blue-500/25 to-indigo-500/25 hover:bg-gradient-to-r hover:from-white/15 hover:to-white/8 border-blue-500/40 hover:border-white/30'
                                    }`}
                                    onMouseEnter={() => {
                                      setHoveredCategory(subcategory.name);
                                      setSelectedSubcategory(subcategory.name);
                                    }}
                                    onClick={() => {
                                      const categoryMap: { [key: string]: string } = {
                                        "성격 및 기질 탐색": "personality-temperament",
                                        "자아정체감 및 가치관": "identity-values",
                                        "잠재력 및 역량 개발": "potential-development",
                                        "삶의 의미 및 실존적 문제": "life-meaning",
                                        "가족 관계": "family-relationships",
                                        "연인 및 부부 관계": "romantic-marital",
                                        "친구 및 동료 관계": "friends-colleagues",
                                        "사회적 기술 및 소통": "social-skills-communication",
                                        "우울 및 기분 문제": "depression-mood",
                                        "불안 및 스트레스": "anxiety-stress",
                                        "외상 및 위기 개입": "trauma-crisis",
                                        "중독 및 충동 조절": "addiction-impulse",
                                        "진로 및 직업 문제": "career-job",
                                        "경제 및 재정 문제": "financial-economic",
                                        "건강 및 신체 문제": "health-physical",
                                        "일상생활 및 자기 관리": "daily-life-management",
                                        "다문화 적응": "multicultural-adaptation",
                                        "디지털 환경 적응": "digital-environment",
                                        "생애주기별 적응": "lifecycle-adaptation",
                                        "사회 환경 적응": "social-environmental-issues"
                                      };
                                      const categoryId = categoryMap[subcategory.name];
                                      if (categoryId) {
                                        router.push(`/tests/${categoryId}`);
                                        setActiveMenu(null);
                                      }
                                    }}
                                  >
                                    <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                      {subcategory.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-base font-medium text-white truncate">{subcategory.name}</div>
                                    </div>
                                  </div>
                                  
                                  {/* 소분류 메뉴 */}
                                  {selectedSubcategory === subcategory.name && subcategory.items && (
                                    <div className="mt-2 ml-4 space-y-1 animate-fadeIn-slow">
                                      {subcategory.items.map((item) => (
                                        <Link
                                          key={item.name}
                                          href={item.href}
                                          className="group flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-300 border-2 border-blue-400/30 hover:border-blue-400 ml-8 shadow-sm hover:shadow-md"
                                          onClick={() => setActiveMenu(null)}
                                        >
                                          <div className="text-base group-hover:scale-110 transition-transform duration-300">
                                            {item.icon}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-blue-200 group-hover:text-white truncate">{item.name}</div>
                                            <div className="text-xs text-blue-300 group-hover:text-blue-100 truncate">{item.description}</div>
                                          </div>
                                          <svg 
                                            className="w-3 h-3 text-blue-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300"
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                          >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                          </svg>
                                        </Link>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-blue-300">
                            대분류를 선택해주세요
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 상담 프로그램 드롭다운 메뉴 */}
              <div className="relative">
                <Link
                  href="/counseling"
                  className={`px-4 py-2.5 rounded-lg font-medium text-base transition-all duration-300 flex items-center whitespace-nowrap ${
                    activeItem === "/counseling" || activeItem.startsWith("/counseling/")
                      ? "text-white bg-blue-600"
                      : "text-gray-300 hover:text-white hover:bg-blue-800/50"
                  }`}
                  onClick={(e) => handleNavLinkClick("/counseling", e)}
                  onMouseEnter={() => setActiveMenu('counseling')}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  💬 상담 프로그램
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`w-4 h-4 ml-1 transition-transform duration-200 ${isCounselingDropdownOpen ? "rotate-180" : ""}`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>

                {/* 상담 프로그램 메가 메뉴 */}
                {isCounselingDropdownOpen && (
                  <div
                    data-dropdown-menu="counseling"
                    className="absolute left-0 mt-0 pt-4 pb-8 w-96 min-w-[24rem] max-w-[28rem] bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-indigo-900/95 rounded-2xl shadow-2xl border border-blue-500/30 z-50 animate-fadeIn backdrop-blur-xl"
                    onMouseEnter={() => setActiveMenu('counseling')}
                    onMouseLeave={() => setActiveMenu(null)}
                  >
                    <div className="relative">
                      <div 
                        ref={counselingScroll.scrollRef}
                        className="px-6 py-4 space-y-2 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-900"
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
                                  className={`group flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-300 border border-transparent hover:border-white/20`}
                                  onClick={() => setActiveMenu(null)}
                                >
                                  <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                    {item.icon || '💭'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-base font-medium text-white truncate">{item.name}</span>
                                      {'badge' in item && (item as any).badge && (
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                          (item as any).badge === '24시간' ? 'bg-red-500 text-white' :
                                          (item as any).badge === '신규' ? 'bg-green-500 text-white' :
                                          'bg-orange-500 text-white'
                                        }`}>
                                          {(item as any).badge}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-sm text-blue-300 truncate">{item.description}</div>
                                  </div>
                                  <svg 
                                    className="w-4 h-4 text-blue-300 group-hover:text-white group-hover:translate-x-1 transition-all duration-300"
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
                )}
              </div>

              {/* AI 마음 비서 드롭다운 메뉴 */}
              <div className="relative">
                <Link
                  href="/ai-mind-assistant"
                  className={`px-4 py-2.5 rounded-lg font-medium text-base transition-all duration-300 flex items-center whitespace-nowrap ${
                    activeItem === "/ai-mind-assistant" || activeItem.startsWith("/ai-mind-assistant/")
                      ? "text-white bg-blue-600"
                      : "text-gray-300 hover:text-white hover:bg-blue-800/50"
                  }`}
                  onClick={(e) => handleNavLinkClick("/ai-mind-assistant", e)}
                  onMouseEnter={() => setActiveMenu('ai-mind-assistant')}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  🤖 나의 AI 비서
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`w-4 h-4 ml-1 transition-transform duration-200 ${isAiMindAssistantOpen ? "rotate-180" : ""}`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>

                {/* AI 마음 비서 메가 메뉴 */}
                {isAiMindAssistantOpen && (
                  <div
                    data-dropdown-menu="ai-mind-assistant"
                    className="absolute left-0 mt-0 pt-4 pb-8 w-96 min-w-[24rem] max-w-[28rem] bg-gradient-to-br from-slate-900/95 via-green-900/95 to-emerald-900/95 rounded-2xl shadow-2xl border border-green-500/30 z-50 animate-fadeIn backdrop-blur-xl"
                    onMouseEnter={() => setActiveMenu('ai-mind-assistant')}
                    onMouseLeave={() => setActiveMenu(null)}
                  >
                    <div className="relative">
                      <div 
                        ref={aiAssistantScroll.scrollRef}
                        className="px-6 py-4 space-y-2 max-h-[70vh] overflow-y-auto auto-scroll-dropdown"
                        onMouseMove={aiAssistantScroll.handleMouseMove}
                        onMouseLeave={aiAssistantScroll.handleMouseLeave}
                      >
                        {aiMindAssistantSubMenuItems.map((category) => (
                          <div key={category.category} className="mb-4 last:mb-0">
                            <div className="px-2 py-1 text-base font-bold text-green-300 uppercase tracking-wide mb-2">
                              {category.category}
                            </div>
                            <div className="space-y-1">
                              {category.items.map((item) => (
                                <Link
                                  key={item.name}
                                  href={item.href}
                                  className={`group flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-300 border border-transparent hover:border-white/20`}
                                  onClick={() => setActiveMenu(null)}
                                >
                                  <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                    {item.icon || '🤖'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-base font-medium text-white truncate">{item.name}</span>
                                      {'badge' in item && (item as any).badge && (
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
                                  <svg 
                                    className="w-4 h-4 text-green-300 group-hover:text-white group-hover:translate-x-1 transition-all duration-300"
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
                )}
              </div>

              {/* 추가 기능 드롭다운 메뉴 */}
              <div className="relative">
                <Link
                  href="/features"
                  className={`px-4 py-2.5 rounded-lg font-medium text-base transition-all duration-300 flex items-center whitespace-nowrap ${
                    activeItem === "/features" || activeItem.startsWith("/features/")
                      ? "text-white bg-blue-600"
                      : "text-gray-300 hover:text-white hover:bg-blue-800/50"
                  }`}
                  onClick={(e) => handleNavLinkClick("/features", e)}
                  onMouseEnter={() => setActiveMenu('additional')}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  📚 나의 자료실
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`w-4 h-4 ml-1 transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>

                {/* 추가 기능 메가 메뉴 */}
                {isUserMenuOpen && (
                  <div
                    data-dropdown-menu="additional"
                    className="absolute left-0 mt-0 pt-4 pb-8 w-96 min-w-[24rem] max-w-[28rem] bg-gradient-to-br from-slate-900/95 via-green-900/95 to-emerald-900/95 rounded-2xl shadow-2xl border border-green-500/30 z-50 animate-fadeIn backdrop-blur-xl"
                    onMouseEnter={() => setActiveMenu('additional')}
                    onMouseLeave={() => {
                      setActiveMenu(null);
                      handleMouseLeave('additional');
                    }}
                    onMouseMove={(e) => handleMouseMove('additional', e)}
                  >
                    <div className="relative">
                      {/* 상단 화살표 - 스크롤 가능할 때만 표시 */}
                      {scrollStates.additional?.canScrollUp && (
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 z-20">
                          <div className="w-0 h-0 border-l-10 border-r-10 border-b-10 border-transparent border-b-green-400 shadow-lg animate-bounce"></div>
                        </div>
                      )}
                      
                      <div 
                        ref={userMenuScroll.scrollRef}
                        className="scrollable-content px-6 py-4 space-y-2 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-green-600 scrollbar-track-green-900"
                        onScroll={(e) => handleScroll('additional', e)}
                        onMouseMove={userMenuScroll.handleMouseMove}
                        onMouseLeave={userMenuScroll.handleMouseLeave}
                      >
                        {personalFeaturesMenu.map((category) => (
                          <div key={category.category} className="mb-4 last:mb-0">
                            <div className="px-2 py-1 text-base font-bold text-green-300 uppercase tracking-wide mb-2">
                              {category.category}
                            </div>
                            <div className="space-y-1">
                              {category.items.map((item) => (
                                <Link
                                  key={item.name}
                                  href={item.href}
                                  className={`group flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-300 border border-transparent hover:border-white/20`}
                                  onClick={() => setActiveMenu(null)}
                                >
                                  <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                    {item.icon || '⚡'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-base font-medium text-white truncate">{item.name}</span>
                                      {'badge' in item && (item as any).badge && (
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                          (item as any).badge === '인기' ? 'bg-red-500 text-white' :
                                          (item as any).badge === '신규' ? 'bg-green-500 text-white' :
                                          'bg-orange-500 text-white'
                                        }`}>
                                          {(item as any).badge}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-sm text-green-300 truncate">{item.description}</div>
                                  </div>
                                  <svg 
                                    className="w-4 h-4 text-green-300 group-hover:text-white group-hover:translate-x-1 transition-all duration-300"
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
                      
                      {/* 하단 화살표 - 스크롤 가능할 때만 표시 */}
                      {scrollStates.additional?.canScrollDown && (
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-4 z-20">
                          <div className="w-0 h-0 border-l-10 border-r-10 border-t-10 border-transparent border-t-green-400 shadow-lg animate-bounce"></div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 마이페이지 메가 메뉴 및 사용자 인증 */}
              <div className="flex items-center space-x-2">
                {isLoggedIn ? (
                  <>
                    {/* 상담사 메뉴 - 인증된 상담사만 표시 */}
                    {shouldShowCounselorMenu(userEmail) && (
                      <div className="relative">
                        <Link
                          href="/counselor"
                          className={`px-4 py-2.5 rounded-lg font-medium text-base transition-all duration-300 flex items-center whitespace-nowrap ${
                            activeItem === "/counselor" || activeItem.startsWith("/counselor/")
                              ? "text-white bg-blue-600"
                              : "text-gray-300 hover:text-white hover:bg-blue-800/50"
                          }`}
                          onClick={(e) => handleNavLinkClick("/counselor", e)}
                          onMouseEnter={() => setActiveMenu('counselor')}
                          onMouseLeave={() => setActiveMenu(null)}
                        >
                          👨‍⚕️ 상담사
                          <svg
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className={`w-4 h-4 ml-1 transition-transform duration-200 ${isCounselorOpen ? "rotate-180" : ""}`}
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </Link>

                        {/* 상담사 메가 메뉴 */}
                        {isCounselorOpen && (
                          <div
                            data-dropdown-menu="counselor"
                            className="absolute left-0 mt-0 pt-4 pb-8 w-96 min-w-[24rem] max-w-[28rem] bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-indigo-900/95 rounded-2xl shadow-2xl border border-blue-500/30 z-50 animate-fadeIn backdrop-blur-xl"
                            onMouseEnter={() => setActiveMenu('counselor')}
                            onMouseLeave={() => {
                              setActiveMenu(null);
                              handleMouseLeave('counselor');
                            }}
                            onMouseMove={(e) => handleMouseMove('counselor', e)}
                          >
                            <div className="relative">
                              {/* 상단 화살표 - 스크롤 가능할 때만 표시 */}
                              {scrollStates.counselor?.canScrollUp && (
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 z-20">
                                  <div className="w-0 h-0 border-l-10 border-r-10 border-b-10 border-transparent border-b-blue-400 shadow-lg animate-bounce"></div>
                                </div>
                              )}
                              
                              <div 
                                className="scrollable-content px-6 py-4 space-y-2 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-900"
                                onScroll={(e) => handleScroll('counselor', e)}
                              >
                                {counselorMenuItems.map((category) => (
                                  <div key={category.category} className="mb-4 last:mb-0">
                                    <div className="px-2 py-1 text-base font-bold text-blue-300 uppercase tracking-wide mb-2">
                                      {category.category}
                                    </div>
                                    <div className="space-y-1">
                                      {category.items.map((item) => (
                                        <Link
                                          key={item.name}
                                          href={item.href}
                                          className={`group flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-300 border border-transparent hover:border-white/20`}
                                          onClick={() => setActiveMenu(null)}
                                        >
                                          <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                            {item.icon || '👨‍⚕️'}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                              <span className="text-base font-medium text-white truncate">{item.name}</span>
                                            </div>
                                            <div className="text-sm text-blue-300 truncate">{item.description}</div>
                                          </div>
                                          <svg 
                                            className="w-4 h-4 text-blue-300 group-hover:text-white group-hover:translate-x-1 transition-all duration-300"
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
                              
                              {/* 하단 화살표 */}
                              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2 z-10">
                                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-500/30"></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 관리자 메뉴 - 관리자만 표시 */}
                    {shouldShowAdminMenu(userEmail) && (
                      <div className="relative">
                        <Link
                          href="/admin"
                          className={`px-4 py-2.5 rounded-lg font-medium text-base transition-all duration-300 flex items-center whitespace-nowrap ${
                            activeItem === "/admin" || activeItem.startsWith("/admin/")
                              ? "text-white bg-blue-600"
                              : "text-gray-300 hover:text-white hover:bg-blue-800/50"
                          }`}
                          onClick={(e) => handleNavLinkClick("/admin", e)}
                          onMouseEnter={() => setActiveMenu('admin')}
                          onMouseLeave={() => setActiveMenu(null)}
                        >
                          🔧 관리자
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className={`w-4 h-4 ml-1 transition-transform duration-200 ${isAdminOpen ? "rotate-180" : ""}`}
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </Link>

                        {/* 관리자 메가 메뉴 */}
                        {isAdminOpen && (
                          <div
                            data-dropdown-menu="admin"
                            className="absolute left-0 mt-0 pt-4 pb-8 w-96 min-w-[24rem] max-w-[28rem] bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-indigo-900/95 rounded-2xl shadow-2xl border border-blue-500/30 z-50 animate-fadeIn backdrop-blur-xl"
                            onMouseEnter={() => setActiveMenu('admin')}
                            onMouseLeave={() => {
                              setActiveMenu(null);
                              handleMouseLeave('admin');
                            }}
                            onMouseMove={(e) => handleMouseMove('admin', e)}
                          >
                            <div className="relative">
                              {/* 상단 화살표 - 스크롤 가능할 때만 표시 */}
                              {scrollStates.admin?.canScrollUp && (
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 z-20">
                                  <div className="w-0 h-0 border-l-10 border-r-10 border-b-10 border-transparent border-b-blue-400 shadow-lg animate-bounce"></div>
                                </div>
                              )}
                              
                              <div 
                                className="scrollable-content px-6 py-4 space-y-2 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-900"
                                onScroll={(e) => handleScroll('admin', e)}
                              >
                                {adminMenuItems.map((category) => (
                                  <div key={category.category} className="mb-4 last:mb-0">
                                    <div className="px-2 py-1 text-base font-bold text-blue-300 uppercase tracking-wide mb-2">
                                      {category.category}
                                    </div>
                                    <div className="space-y-1">
                                      {category.items.map((item) => (
                                        <Link
                                          key={item.name}
                                          href={item.href}
                                          className={`group flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-300 border border-transparent hover:border-white/20`}
                                          onClick={() => setActiveMenu(null)}
                                        >
                                          <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                            {item.icon || '🔧'}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                              <span className="text-base font-medium text-white truncate">{item.name}</span>
                                            </div>
                                            <div className="text-sm text-blue-300 truncate">{item.description}</div>
                                          </div>
                                          <svg 
                                            className="w-4 h-4 text-blue-300 group-hover:text-white group-hover:translate-x-1 transition-all duration-300"
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
                              
                              {/* 하단 화살표 - 스크롤 가능할 때만 표시 */}
                              {scrollStates.admin?.canScrollDown && (
                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-4 z-20">
                                  <div className="w-0 h-0 border-l-10 border-r-10 border-t-10 border-transparent border-t-blue-400 shadow-lg animate-bounce"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* 마이페이지 드롭다운 메뉴 */}
                    <div className="relative">
                      <Link
                        href="/mypage"
                        className={`px-4 py-2.5 rounded-lg font-medium text-base transition-all duration-300 flex items-center whitespace-nowrap ${
                          activeItem === "/mypage" || activeItem.startsWith("/mypage/")
                            ? "text-white bg-blue-600"
                            : "text-gray-300 hover:text-white hover:bg-blue-800/50"
                        }`}
                        onClick={(e) => handleNavLinkClick("/mypage", e)}
                        onMouseEnter={() => setActiveMenu('user')}
                        onMouseLeave={() => setActiveMenu(null)}
                      >
                        👤 마이페이지
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className={`w-4 h-4 ml-1 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </Link>

                      {/* 마이페이지 메가 메뉴 */}
                      {isDropdownOpen && (
                        <div
                          data-dropdown-menu="user"
                          className="absolute right-0 mt-0 pt-4 pb-8 w-96 min-w-[24rem] max-w-[28rem] bg-gradient-to-br from-slate-900/95 via-green-900/95 to-emerald-900/95 rounded-2xl shadow-2xl border border-green-500/30 z-50 animate-fadeIn backdrop-blur-xl"
                          onMouseEnter={() => setActiveMenu('user')}
                          onMouseLeave={() => {
                            setActiveMenu(null);
                            handleMouseLeave('user');
                          }}
                          onMouseMove={(e) => handleMouseMove('user', e)}
                        >
                          <div className="relative">
                            {/* 상단 화살표 - 스크롤 가능할 때만 표시 */}
                            {scrollStates.user?.canScrollUp && (
                              <div className="absolute top-0 right-8 transform -translate-y-4 z-20">
                                <div className="w-0 h-0 border-l-10 border-r-10 border-b-10 border-transparent border-b-green-400 shadow-lg animate-bounce"></div>
                              </div>
                            )}
                            
                            <div 
                              className="scrollable-content px-6 py-4 space-y-2 max-h-[70vh] overflow-y-auto auto-scroll-dropdown"
                              onScroll={(e) => handleScroll('user', e)}
                            >
                              {/* 사용자 정보 헤더 */}
                              <div className="mb-4 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                    {userName ? userName.charAt(0).toUpperCase() : userEmail.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-white">{userName || '사용자'}</div>
                                    <div className="text-sm text-green-300">{userEmail}</div>
                                  </div>
                                </div>
                              </div>

                              {/* 마이페이지 메뉴 아이템들 */}
                              <div className="space-y-1">
                                {[
                                  { name: "검사 기록", href: "/mypage?tab=records", description: "나의 심리검사 결과 확인", icon: "📊" },
                                  { name: "기본 정보", href: "/mypage?tab=profile", description: "프로필 정보 수정", icon: "👤" },
                                  { name: "상담 예약", href: "/mypage/counseling", description: "전문가 상담 예약", icon: "💬" },
                                  { name: "삭제된 코드", href: "/mypage/deleted-codes", description: "삭제된 테스트 코드 복구", icon: "📋" },
                                  { name: "설정", href: "/mypage/settings", description: "계정 및 알림 설정", icon: "⚙️" }
                                ].map((item) => (
                                  <Link
                                    key={item.name}
                                    href={item.href}
                                    className="group flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-300 border border-transparent hover:border-white/20"
                                    onClick={() => setActiveMenu(null)}
                                  >
                                    <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                      {item.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-white truncate">{item.name}</div>
                                      <div className="text-xs text-green-300 truncate">{item.description}</div>
                                    </div>
                                    <svg 
                                      className="w-4 h-4 text-green-300 group-hover:text-white group-hover:translate-x-1 transition-all duration-300"
                                      fill="none" 
                                      stroke="currentColor" 
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </Link>
                                ))}

                                {/* 로그아웃 버튼 */}
                                <div className="mt-4 pt-4 border-t border-green-500/30">
                                  <button
                                    onClick={handleLogout}
                                    className="w-full group flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl hover:bg-gradient-to-r hover:from-red-500/30 hover:to-pink-500/30 transition-all duration-300 border border-transparent hover:border-red-500/30 text-left"
                                  >
                                    <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                      🚪
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-white">로그아웃</div>
                                      <div className="text-xs text-red-300">안전하게 로그아웃</div>
                                    </div>
                                    <svg 
                                      className="w-4 h-4 text-red-300 group-hover:text-white transition-all duration-300"
                                      fill="none" 
                                      stroke="currentColor" 
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            {/* 하단 화살표 - 스크롤 가능할 때만 표시 */}
                            {scrollStates.user?.canScrollDown && (
                              <div className="absolute bottom-0 right-8 transform translate-y-4 z-20">
                                <div className="w-0 h-0 border-l-10 border-r-10 border-t-10 border-transparent border-t-green-400 shadow-lg animate-bounce"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* 로그인/회원가입 버튼 */}
                    <Link
                      href="/login"
                      className="px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 text-gray-300 hover:text-white hover:bg-blue-800/50"
                      onClick={(e) => handleAuthLinkClick("/login", e)}
                    >
                      🔑 로그인
                    </Link>
                    <Link
                      href="/register"
                      className="px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 bg-blue-600 text-white hover:bg-blue-700"
                      onClick={(e) => handleAuthLinkClick("/register", e)}
                    >
                      ✨ 회원가입
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 모바일 메뉴 버튼 */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-300 hover:text-white hover:bg-blue-800/50 rounded-lg transition-all duration-300"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* 모바일 메뉴 오버레이 */}
      {isMobileMenuOpen && (
        <>
          {/* 배경 오버레이 */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* 모바일 메뉴 */}
          <div className="fixed inset-x-0 top-16 z-50 md:hidden bg-gradient-to-b from-indigo-900 to-indigo-800 border-b border-white/20 shadow-2xl">
            <div className="px-6 py-4 space-y-2 max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-900">

              {/* 심리검사 */}
              <div className="space-y-3">
                <div className="px-4 py-2 text-sm font-semibold text-blue-300 uppercase tracking-wide border-b border-blue-500/30">
                  🧠 AI 심리검사
                </div>
                
                {/* 대분류 5개 */}
                <div className="space-y-2">
                  {testSubMenuItems.map((mainCategory, index) => (
                    <div key={mainCategory.category} className="space-y-2">
                      {/* 대분류 */}
                      <div 
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-bold text-blue-200 bg-blue-500/20 rounded-lg cursor-pointer transition-all duration-300 ${
                          selectedMainCategory === mainCategory.category ? 'bg-blue-600 text-white' : 'hover:bg-blue-500/30'
                        }`}
                        onClick={() => setSelectedMainCategory(selectedMainCategory === mainCategory.category ? null : mainCategory.category)}
                      >
                        <span className="text-lg">{mainCategory.icon}</span>
                        <span className="flex-1">{mainCategory.category}</span>
                        <svg 
                          className={`w-4 h-4 transition-transform duration-300 ${
                            selectedMainCategory === mainCategory.category ? 'rotate-90' : ''
                          }`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    
                      {/* 선택된 대분류의 중분류 */}
                      {selectedMainCategory === mainCategory.category && (
                        <div className="ml-4 space-y-2 animate-fadeIn">
                          {mainCategory.subcategories.map((subcategory) => (
                            <div key={subcategory.name} className="space-y-1">
                              <div 
                                className={`flex items-center gap-2 px-2 py-1 text-base font-bold text-purple-300 bg-purple-500/20 rounded cursor-pointer transition-all duration-300 ${
                                  selectedSubcategory === subcategory.name ? 'bg-purple-500/30' : 'hover:bg-purple-500/30'
                                }`}
                                onClick={() => {
                                  const categoryMap: { [key: string]: string } = {
                                    "성격 및 기질 탐색": "personality-temperament",
                                    "자아정체감 및 가치관": "identity-values",
                                    "잠재력 및 역량 개발": "potential-development",
                                    "삶의 의미 및 실존적 문제": "life-meaning",
                                    "가족 관계": "family-relationships",
                                    "연인 및 부부 관계": "romantic-marital",
                                    "친구 및 동료 관계": "friends-colleagues",
                                    "사회적 기술 및 소통": "social-skills-communication",
                                    "우울 및 기분 문제": "depression-mood",
                                    "불안 및 스트레스": "anxiety-stress",
                                    "외상 및 위기 개입": "trauma-crisis",
                                    "중독 및 충동 조절": "addiction-impulse",
                                    "진로 및 직업 문제": "career-job",
                                    "경제 및 재정 문제": "financial-economic",
                                    "건강 및 신체 문제": "health-physical",
                                    "일상생활 및 자기 관리": "daily-life-management",
                                    "다문화 적응": "multicultural-adaptation",
                                    "디지털 환경 적응": "digital-environment",
                                    "생애주기별 적응": "lifecycle-adaptation",
                                    "사회 환경 적응": "social-environmental-issues"
                                  };
                                  const categoryId = categoryMap[subcategory.name];
                                  if (categoryId) {
                                    router.push(`/tests/${categoryId}`);
                                    setActiveMenu(null);
                                  }
                                }}
                              >
                                <span className="text-lg">{subcategory.icon}</span>
                                <span className="flex-1">{subcategory.name}</span>
                                <svg 
                                  className={`w-4 h-4 transition-transform duration-300 ${
                                    selectedSubcategory === subcategory.name ? 'rotate-90' : ''
                                  }`}
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                              
                              {/* 소분류 */}
                              {selectedSubcategory === subcategory.name && (
                                <div className="ml-4 space-y-1 animate-fadeIn-slow">
                                  {subcategory.items.map((item) => (
                                    <Link
                                      key={item.name}
                                      href={item.href}
                                      className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-blue-800/30 rounded-lg transition-all duration-300"
                                      onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs">{item.icon}</span>
                                        <div className="flex-1 min-w-0">
                                          <div className="font-medium">{item.name}</div>
                                          <div className="text-xs text-gray-400">{item.description}</div>
                                        </div>
                                      </div>
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 상담 프로그램 */}
              <div className="space-y-2">
                <div className="px-4 py-2 text-sm font-semibold text-purple-300 uppercase tracking-wide">
                  💬 상담 프로그램
                </div>
                {counselingMenuItems.map((category) => (
                  <div key={category.category} className="ml-4 space-y-1">
                    <div className="px-2 py-1 text-base font-bold text-purple-400 uppercase tracking-wide">
                      {category.category}
                    </div>
                    {category.items.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block px-4 py-2 text-base text-gray-300 hover:text-white hover:bg-purple-800/30 rounded-lg transition-all duration-300"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <div className="flex items-center gap-2">
                          <span>{item.icon}</span>
                          <span>{item.name}</span>
                          {'badge' in item && (item as any).badge && (
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                              (item as any).badge === '24시간' ? 'bg-red-500 text-white' :
                              (item as any).badge === '신규' ? 'bg-green-500 text-white' :
                              'bg-orange-500 text-white'
                            }`}>
                              {(item as any).badge}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-purple-300 ml-6 mt-1">{item.description}</div>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>

              {/* AI 마음 비서 */}
              <div className="space-y-2">
                <div className="px-4 py-2 text-sm font-semibold text-green-300 uppercase tracking-wide">
                  🤖 나의 AI 비서
                </div>
                {aiMindAssistantSubMenuItems.map((category) => (
                  <div key={category.category} className="ml-4 space-y-1">
                    <div className="px-2 py-1 text-base font-bold text-green-400 uppercase tracking-wide">
                      {category.category}
                    </div>
                    {category.items.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block px-4 py-2 text-base text-gray-300 hover:text-white hover:bg-green-800/30 rounded-lg transition-all duration-300"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <div className="flex items-center gap-2">
                          <span>{item.icon}</span>
                          <span>{item.name}</span>
                          {'badge' in item && (item as any).badge && (
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                              (item as any).badge === '긴급' ? 'bg-red-500 text-white' :
                              (item as any).badge === '신규' ? 'bg-green-500 text-white' :
                              'bg-orange-500 text-white'
                            }`}>
                              {(item as any).badge}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-green-300 ml-6 mt-1">{item.description}</div>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>

              {/* 추가 기능 */}
              <div className="space-y-2">
                <div className="px-4 py-2 text-sm font-semibold text-green-300 uppercase tracking-wide">
                  📚 나의 자료실
                </div>
                {personalFeaturesMenu.map((category) => (
                  <div key={category.category} className="ml-4 space-y-1">
                    <div className="px-2 py-1 text-base font-bold text-green-400 uppercase tracking-wide">
                      {category.category}
                    </div>
                    {category.items.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block px-4 py-2 text-base text-gray-300 hover:text-white hover:bg-green-800/30 rounded-lg transition-all duration-300"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <div className="flex items-center gap-2">
                          <span>{item.icon}</span>
                          <span>{item.name}</span>
                        </div>
                        <div className="text-xs text-green-300 ml-6 mt-1">{item.description}</div>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>

              {/* 사용자 메뉴 */}
              {isLoggedIn ? (
                <div className="space-y-2 pt-4 border-t border-white/20">
                  <div className="px-4 py-2 text-sm font-semibold text-indigo-300 uppercase tracking-wide">
                    👤 마이페이지
                  </div>
                  <Link
                    href="/mypage"
                    className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-indigo-800/30 rounded-lg transition-all duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    📊 검사 기록
                  </Link>
                  <Link
                    href="/mypage?tab=profile"
                    className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-indigo-800/30 rounded-lg transition-all duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    👤 기본 정보
                  </Link>
                  <Link
                    href="/mypage/counseling"
                    className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-indigo-800/30 rounded-lg transition-all duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    💬 상담 예약
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-300 hover:text-red-100 hover:bg-red-800/30 rounded-lg transition-all duration-300"
                  >
                    🚪 로그아웃
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pt-4 border-t border-white/20">
                  <Link
                    href="/login"
                    className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-blue-800/30 rounded-lg transition-all duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    🔑 로그인
                  </Link>
                  <Link
                    href="/register"
                    className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-blue-800/30 rounded-lg transition-all duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    ✨ 회원가입
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* 진행중인 검사 팝업 - 말풍선 형태 (상단 우측, 모든 페이지 표시, 실제 질문 진행 중일 때만 숨김) */}
      {inProgressTestsCount > 0 && !isTestInProgress && (
        <div 
          className="fixed top-20 right-6 z-[9999]"
          onClick={handleInProgressTestsClick}
          style={{ cursor: 'pointer' }}
        >
          {/* 상단 우측 말풍선 형태 (300px 고정) */}
          <div className="relative bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 rounded-2xl shadow-2xl w-[300px] px-5 py-4 border-2 border-purple-400/50 backdrop-blur-sm animate-pulse hover:animate-none hover:shadow-purple-500/50 transition-all duration-300">
            <div className="flex items-center space-x-3">
              <div className="text-3xl flex-shrink-0">📋</div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-bold text-white text-base leading-tight">
                  진행중인 검사
                </span>
                <span className="text-purple-100 text-sm mt-1">
                  {inProgressTestsCount}개 검사 대기중
                </span>
                <span className="text-purple-200 text-xs mt-1 italic">
                  클릭하여 확인 →
                </span>
              </div>
            </div>
            {/* 말풍선 꼬리 (우측 하단) */}
            <div className="absolute -bottom-2 right-12 w-4 h-4 bg-gradient-to-br from-purple-600 to-indigo-600 transform rotate-45 border-r-2 border-b-2 border-purple-400/50"></div>
          </div>
        </div>
      )}
    </>
  );
}
