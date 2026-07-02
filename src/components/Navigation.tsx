"use client";
import React from "react";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { initializeFirebase } from '@/lib/firebase';
import { shouldShowCounselorMenu, shouldShowAdminMenu, shouldShowPsychologyTestsMenu, shouldShowOrgMenu } from '@/utils/roleUtils';
import { usePendingCounselorApplicationsCount } from '@/hooks/usePendingCounselorApplicationsCount';
import { useCounselorApplicationNotificationCount } from '@/hooks/useCounselorApplicationNotificationCount';
import { getVisibleTestMenuItems, TestCategory, TestSubcategory, TEST_CATEGORY_SLUGS, TEST_SUBCATEGORY_SLUGS } from '@/data/psychologyTestMenu';
import { counselingMenuCategories, COUNSELING_MAIN_HREF } from '@/data/counselingMenu';
import { aiMindAssistantMenuCategories, AI_MIND_ASSISTANT_MAIN_HREF } from '@/data/aiMindAssistantMenu';
import { counselorMenuCategories, COUNSELOR_MAIN_HREF } from '@/data/counselorMenu';
import { adminMenuCategories, ADMIN_MAIN_HREF, withAdminMenuBadges } from '@/data/adminMenu';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { useHorizontalMenuPlacement } from '@/hooks/useHorizontalMenuPlacement';
import { getInProgressTests, loadTestProgress } from '@/utils/testResume';
import WizcocoLogo from '@/components/WizcocoLogo';
import { pushWithAuthSession, markInternalNavigation } from '@/utils/authSessionLifecycle';
import TestMenuSearch from '@/components/tests/TestMenuSearch';
import ThreeTierMegaMenuPanel from '@/components/nav/ThreeTierMegaMenuPanel';
import ThreeTierMobileMenuSection from '@/components/nav/ThreeTierMobileMenuSection';
import { readClientPortalSession } from '@/lib/clientPortalSession';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const navigateTo = (href: string) => pushWithAuthSession(router, href);
  const { user, logout } = useFirebaseAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("/");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedAiAssistantMainCategory, setSelectedAiAssistantMainCategory] = useState<string | null>(null);
  const [selectedAiAssistantSubcategory, setSelectedAiAssistantSubcategory] = useState<string | null>(null);
  const [selectedCounselingMainCategory, setSelectedCounselingMainCategory] = useState<string | null>(null);
  const [selectedCounselingSubcategory, setSelectedCounselingSubcategory] = useState<string | null>(null);
  const [selectedCounselorMainCategory, setSelectedCounselorMainCategory] = useState<string | null>(null);
  const [selectedCounselorSubcategory, setSelectedCounselorSubcategory] = useState<string | null>(null);
  const [selectedAdminMainCategory, setSelectedAdminMainCategory] = useState<string | null>(null);
  const [selectedAdminSubcategory, setSelectedAdminSubcategory] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const counselingTriggerRef = useRef<HTMLDivElement>(null);
  const counselingPanelRef = useRef<HTMLDivElement>(null);
  const counselingLeftColRef = useRef<HTMLDivElement>(null);
  const counselingSubColRef = useRef<HTMLDivElement>(null);
  const aiAssistantPanelRef = useRef<HTMLDivElement>(null);
  const aiAssistantLeftColRef = useRef<HTMLDivElement>(null);
  const aiAssistantSubColRef = useRef<HTMLDivElement>(null);
  const aiAssistantTriggerRef = useRef<HTMLDivElement>(null);
  const psychologyTestsTriggerRef = useRef<HTMLDivElement>(null);
  const psychologyTestsPanelRef = useRef<HTMLDivElement>(null);
  const psychologyTestsLeftColRef = useRef<HTMLDivElement>(null);
  const psychologyTestsSubColRef = useRef<HTMLDivElement>(null);
  const counselorTriggerRef = useRef<HTMLDivElement>(null);
  const counselorPanelRef = useRef<HTMLDivElement>(null);
  const counselorLeftColRef = useRef<HTMLDivElement>(null);
  const counselorSubColRef = useRef<HTMLDivElement>(null);
  const adminTriggerRef = useRef<HTMLDivElement>(null);
  const adminPanelRef = useRef<HTMLDivElement>(null);
  const adminLeftColRef = useRef<HTMLDivElement>(null);
  const adminSubColRef = useRef<HTMLDivElement>(null);
  // 드롭다운 닫기 지연 타이머 (grace period: 150ms)
  // onPointerLeave 즉시 닫으면 메뉴 이동/아래서 접근 시 깜빡임 발생
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // 스크롤 상태 관리
  const [scrollStates, setScrollStates] = useState<{[key: string]: {canScrollUp: boolean, canScrollDown: boolean}}>({});
  const [scrollIntervals, setScrollIntervals] = useState<{[key: string]: NodeJS.Timeout | null}>({});
  
  // 자동 스크롤 훅
  const userMenuScroll = useAutoScroll();
  
  const isDropdownOpen = activeMenu === 'user';
  const isCounselingDropdownOpen = activeMenu === 'counseling';
  const isUserMenuOpen = activeMenu === 'additional';
  const isAiMindAssistantOpen = activeMenu === 'ai-mind-assistant';
  const isPsychologyTestsOpen = activeMenu === 'psychology-tests';
  const isCounselorOpen = activeMenu === 'counselor';
  const isAdminOpen = activeMenu === 'admin';

  const psychologyPlacement = useHorizontalMenuPlacement(
    isPsychologyTestsOpen,
    psychologyTestsTriggerRef,
    psychologyTestsPanelRef,
    psychologyTestsLeftColRef,
    psychologyTestsSubColRef,
    [selectedMainCategory, selectedSubcategory]
  );

  const counselingPlacement = useHorizontalMenuPlacement(
    isCounselingDropdownOpen,
    counselingTriggerRef,
    counselingPanelRef,
    counselingLeftColRef,
    counselingSubColRef,
    [selectedCounselingMainCategory, selectedCounselingSubcategory]
  );

  const aiAssistantPlacement = useHorizontalMenuPlacement(
    isAiMindAssistantOpen,
    aiAssistantTriggerRef,
    aiAssistantPanelRef,
    aiAssistantLeftColRef,
    aiAssistantSubColRef,
    [selectedAiAssistantMainCategory, selectedAiAssistantSubcategory]
  );

  const counselorPlacement = useHorizontalMenuPlacement(
    isCounselorOpen,
    counselorTriggerRef,
    counselorPanelRef,
    counselorLeftColRef,
    counselorSubColRef,
    [selectedCounselorMainCategory, selectedCounselorSubcategory]
  );

  const adminPlacement = useHorizontalMenuPlacement(
    isAdminOpen,
    adminTriggerRef,
    adminPanelRef,
    adminLeftColRef,
    adminSubColRef,
    [selectedAdminMainCategory, selectedAdminSubcategory]
  );

  const openMenu = useCallback((menuId: string) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setActiveMenu(menuId);
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimerRef.current = setTimeout(() => {
      setActiveMenu(null);
      closeTimerRef.current = null;
    }, 150);
  }, []);

  const { auth: firebaseAuth } = initializeFirebase();
  const sessionFirebaseUser = firebaseAuth?.currentUser ?? null;
  const isLoggedIn = Boolean(sessionFirebaseUser) || Boolean(user);
  const [inProgressTestsCount, setInProgressTestsCount] = useState(0);
  const [isTestInProgress, setIsTestInProgress] = useState(false);
  const [hasClientPortalSession, setHasClientPortalSession] = useState(false);

  // 기존 완료 기능은 hidden으로 네비에서 숨김. NEXT_PUBLIC_SHOW_LEGACY_TESTS=true 시 복원
  const visibleTestMenuItems = getVisibleTestMenuItems();

  // 심리검사 페이지인지 확인 (모든 /tests/ 경로)
  const isTestPage = pathname?.startsWith('/tests/') || pathname === '/tests';

  useEffect(() => {
    const checkPortal = () => setHasClientPortalSession(Boolean(readClientPortalSession()?.portalToken));
    checkPortal();
    window.addEventListener('storage', checkPortal);
    return () => window.removeEventListener('storage', checkPortal);
  }, [pathname]);

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
    navigateTo('/mypage?tab=in-progress');
  };
  const userEmail = user?.email || sessionFirebaseUser?.email || '';
  const userUid = user?.uid || sessionFirebaseUser?.uid || '';
  const userRole = user?.role || 'user';
  const pendingCounselorCount = usePendingCounselorApplicationsCount(userRole);
  const counselorResultCount = useCounselorApplicationNotificationCount(userUid, userRole);
  const userName = user?.displayName || sessionFirebaseUser?.displayName || '';
  const showPsychologyTestsMenu = shouldShowPsychologyTestsMenu(userRole);
  const showCounselorMenu = shouldShowCounselorMenu(userRole);
  const showAdminMenu = shouldShowAdminMenu(userRole);
  const showOrgMenu = shouldShowOrgMenu(userRole) && userRole === 'org_admin';
  const visibleAdminMenuItems = useMemo(
    () => withAdminMenuBadges(adminMenuCategories, pendingCounselorCount),
    [pendingCounselorCount]
  );

  useEffect(() => {
    if (!showPsychologyTestsMenu && activeMenu === 'psychology-tests') {
      setActiveMenu(null);
    }
  }, [showPsychologyTestsMenu, activeMenu]);

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

  // 현재 URL과 활성 메뉴 하이라이트 동기화 (Link 이동·replaceState 탭·뒤로가기)
  const syncActiveItemFromLocation = useCallback(() => {
    if (typeof window === 'undefined') return;
    const p = window.location.pathname || '/';
    if (p === '/mypage') {
      setActiveItem(`/mypage${window.location.search || ''}`);
    } else {
      setActiveItem(p);
    }
  }, []);

  useEffect(() => {
    syncActiveItemFromLocation();
  }, [pathname, syncActiveItemFromLocation]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener('popstate', syncActiveItemFromLocation);
    window.addEventListener('wizcoco:mypage-tab', syncActiveItemFromLocation as EventListener);
    return () => {
      window.removeEventListener('popstate', syncActiveItemFromLocation);
      window.removeEventListener('wizcoco:mypage-tab', syncActiveItemFromLocation as EventListener);
    };
  }, [syncActiveItemFromLocation]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
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
      await logout();
      router.push('/login/');
    } catch (error) {
      console.error('[Navigation] 로그아웃 오류:', error);
      router.push('/login/');
    }
  };

  const handleNavLinkClick = (href: string, e: React.MouseEvent) => {
    markInternalNavigation();
    setActiveItem(href);
  };

  const handleAuthLinkClick = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    pushWithAuthSession(router, href);
  };

  const initTierMenuSelection = (
    categories: TestCategory[],
    setMain: (value: string) => void,
    setSub: (value: string) => void
  ) => {
    const first = categories[0];
    if (!first) return;
    setMain(first.category);
    const firstSub = first.subcategories[0];
    if (firstSub) setSub(firstSub.name);
  };

  const handleTierSubcategoryNav = (
    subcategory: TestSubcategory,
    slugMap?: Record<string, string>
  ) => {
    const slug = slugMap?.[subcategory.name];
    if (slug) {
      navigateTo(`/tests/${slug}`);
      setActiveMenu(null);
      return;
    }
    const href = subcategory.items[0]?.href;
    if (href) {
      navigateTo(href);
      setActiveMenu(null);
    }
  };

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
      <nav
        className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-gradient-to-r from-indigo-950 via-indigo-900 to-indigo-950 shadow-md backdrop-blur-sm"
        style={{ contain: 'layout' }}
      >
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 h-16 min-h-[4rem] flex items-center justify-between gap-2 sm:gap-3">
          {/* 브랜드 */}
          <Link
            href="/"
            className="flex items-center gap-3 group shrink-0 min-w-0"
            onClick={(e) => handleNavLinkClick("/", e)}
          >
            <span className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white/90 w-12 h-12 sm:w-14 sm:h-14 overflow-hidden ring-1 ring-white/20">
              <WizcocoLogo className="block w-full h-full object-contain" alt="Wizcoco 로고" />
            </span>
            <span className="flex flex-col items-start justify-center min-h-[2.75rem] sm:min-h-[3.25rem]">
              <span className="font-semibold text-xl sm:text-2xl tracking-tight text-white transition-colors duration-300 leading-none group-hover:text-sky-200 whitespace-nowrap">
                Wizcoco
              </span>
              <span className="mt-0.5 text-[11px] sm:text-xs text-indigo-200/90 font-medium tracking-wide whitespace-nowrap group-hover:text-indigo-100">
                Psychological Care
              </span>
            </span>
          </Link>

          {/* Desktop Navigation
               ★ overflow-x-auto/hidden 을 이 계층 어디에도 쓰면 안 됨 ★
               CSS 명세: 한 축이 auto/scroll/hidden 이면 다른 축의 visible 이 auto 로 강제됨
               → absolute 드롭다운이 clip 되어 호버 메뉴가 보이지 않는 현상 발생
               해결: 모든 래퍼에 overflow: visible(기본값) 유지 */}
          <div className="hidden min-h-0 md:flex min-w-0 flex-1 items-center justify-end gap-3 xl:gap-5">
            <div className="flex min-w-0 flex-1 flex-nowrap items-center justify-end gap-0.5 sm:gap-1 lg:gap-1.5">
              {/* 검사시작 — 나의코드 로그인 또는 내 검사실 */}
              <Link
                href={hasClientPortalSession ? '/portal/' : '/portal/login/'}
                className={`h-10 px-2.5 lg:px-3.5 inline-flex items-center justify-center gap-1 rounded-lg text-sm lg:text-[15px] font-semibold tracking-tight transition-all duration-300 whitespace-nowrap border-2 ${
                  activeItem === '/portal/login' ||
                  activeItem === '/portal' ||
                  activeItem.startsWith('/portal/') ||
                  activeItem.startsWith('/join/')
                    ? 'text-white bg-blue-600 border-white'
                    : 'text-gray-300 hover:text-white hover:bg-blue-800/50 border-transparent hover:border-white'
                }`}
                onClick={(e) =>
                  handleNavLinkClick(hasClientPortalSession ? '/portal/' : '/portal/login/', e)
                }
              >
                <span aria-hidden>⭐</span>
                검사시작
              </Link>
              {isLoggedIn && (
              <>
              {/* 심리검사 드롭다운 메뉴 — 상담사·관리자 전용 */}
              {showPsychologyTestsMenu && (
              <div ref={psychologyTestsTriggerRef} className="relative">
                <Link
                  href="/tests"
                  className={`h-10 px-2.5 lg:px-3.5 inline-flex items-center justify-center gap-1 rounded-lg text-sm lg:text-[15px] font-semibold tracking-tight transition-all duration-300 whitespace-nowrap border-2 ${
                    activeItem === "/tests" || activeItem.startsWith("/tests/")
                      ? "text-white bg-blue-600 border-white"
                      : isPsychologyTestsOpen
                      ? "text-gray-300 border-white"
                      : "text-gray-300 hover:text-white hover:bg-blue-800/50 border-transparent hover:border-white"
                  }`}
                  onClick={(e) => handleNavLinkClick("/tests", e)}
                  onMouseEnter={() => openMenu('psychology-tests')}
                  onMouseLeave={scheduleClose}
                >
                  🧠 AI 심리검사
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isPsychologyTestsOpen ? "rotate-180" : ""}`}
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
                  <ThreeTierMegaMenuPanel
                    panelRef={psychologyTestsPanelRef}
                    leftColRef={psychologyTestsLeftColRef}
                    subColRef={psychologyTestsSubColRef}
                    dropdownAlign={psychologyPlacement.dropdownAlign}
                    menuDataAttribute="psychology-tests"
                    panelTitle="🧠 AI 심리검사"
                    categories={visibleTestMenuItems}
                    selectedMainCategory={selectedMainCategory}
                    selectedSubcategory={selectedSubcategory}
                    isMenuOpen={isPsychologyTestsOpen}
                    onSelectMainCategory={setSelectedMainCategory}
                    onSelectSubcategory={setSelectedSubcategory}
                    onHoverSubcategory={setHoveredCategory}
                    navigateTo={navigateTo}
                    onMainCategoryClick={(category) => {
                      const categoryId = TEST_CATEGORY_SLUGS[category.category];
                      if (categoryId) {
                        navigateTo(`/tests?category=${categoryId}`);
                        setActiveMenu(null);
                      }
                    }}
                    onSubcategoryClick={(subcategory) => handleTierSubcategoryNav(subcategory, TEST_SUBCATEGORY_SLUGS)}
                    onCloseMenu={() => setActiveMenu(null)}
                    onPanelMouseEnter={() => {
                      openMenu('psychology-tests');
                      initTierMenuSelection(visibleTestMenuItems, setSelectedMainCategory, setSelectedSubcategory);
                    }}
                    onPanelMouseLeave={scheduleClose}
                    searchSlot={
                      <TestMenuSearch
                        categories={visibleTestMenuItems}
                        variant="desktop"
                        onNavigate={() => setActiveMenu(null)}
                      />
                    }
                  />
                )}
              </div>
              )}

              {/* 상담 프로그램 드롭다운 메뉴 */}
              <div ref={counselingTriggerRef} className="relative">
                <Link
                  href="/counseling"
                  className={`h-10 px-2.5 lg:px-3.5 inline-flex items-center justify-center gap-1 rounded-lg text-sm lg:text-[15px] font-semibold tracking-tight transition-all duration-300 whitespace-nowrap border-2 ${
                    activeItem === "/counseling" || activeItem.startsWith("/counseling/")
                      ? "text-white bg-blue-600 border-white"
                      : isCounselingDropdownOpen
                      ? "text-gray-300 border-white"
                      : "text-gray-300 hover:text-white hover:bg-blue-800/50 border-transparent hover:border-white"
                  }`}
                  onClick={(e) => handleNavLinkClick("/counseling", e)}
                  onMouseEnter={() => {
                    openMenu('counseling');
                    initTierMenuSelection(counselingMenuCategories, setSelectedCounselingMainCategory, setSelectedCounselingSubcategory);
                  }}
                  onMouseLeave={scheduleClose}
                >
                  💬 상담 프로그램
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isCounselingDropdownOpen ? "rotate-180" : ""}`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>

                {isCounselingDropdownOpen && (
                  <ThreeTierMegaMenuPanel
                    panelRef={counselingPanelRef}
                    leftColRef={counselingLeftColRef}
                    subColRef={counselingSubColRef}
                    dropdownAlign={counselingPlacement.dropdownAlign}
                    menuDataAttribute="counseling"
                    panelTitle="💬 상담 프로그램"
                    categories={counselingMenuCategories}
                    selectedMainCategory={selectedCounselingMainCategory}
                    selectedSubcategory={selectedCounselingSubcategory}
                    isMenuOpen={isCounselingDropdownOpen}
                    onSelectMainCategory={setSelectedCounselingMainCategory}
                    onSelectSubcategory={setSelectedCounselingSubcategory}
                    navigateTo={navigateTo}
                    onMainCategoryClick={() => {
                      navigateTo(COUNSELING_MAIN_HREF);
                      setActiveMenu(null);
                    }}
                    onSubcategoryClick={(subcategory) => handleTierSubcategoryNav(subcategory)}
                    onCloseMenu={() => setActiveMenu(null)}
                    onPanelMouseEnter={() => {
                      openMenu('counseling');
                      initTierMenuSelection(counselingMenuCategories, setSelectedCounselingMainCategory, setSelectedCounselingSubcategory);
                    }}
                    onPanelMouseLeave={scheduleClose}
                  />
                )}
              </div>

              {/* 나만의 공간 드롭다운 메뉴 */}
              <div ref={aiAssistantTriggerRef} className="relative">
                <Link
                  href="/ai-mind-assistant"
                  className={`h-10 px-2.5 lg:px-3.5 inline-flex items-center justify-center gap-1 rounded-lg text-sm lg:text-[15px] font-semibold tracking-tight transition-all duration-300 whitespace-nowrap border-2 ${
                    activeItem === "/ai-mind-assistant" || activeItem.startsWith("/ai-mind-assistant/")
                      ? "text-white bg-blue-600 border-white"
                      : isAiMindAssistantOpen
                      ? "text-gray-300 border-white"
                      : "text-gray-300 hover:text-white hover:bg-blue-800/50 border-transparent hover:border-white"
                  }`}
                  onClick={(e) => handleNavLinkClick("/ai-mind-assistant", e)}
                  onMouseEnter={() => {
                    openMenu('ai-mind-assistant');
                    initTierMenuSelection(aiMindAssistantMenuCategories, setSelectedAiAssistantMainCategory, setSelectedAiAssistantSubcategory);
                  }}
                  onMouseLeave={scheduleClose}
                >
                  🏠 나만의 공간
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isAiMindAssistantOpen ? "rotate-180" : ""}`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>

                {isAiMindAssistantOpen && (
                  <ThreeTierMegaMenuPanel
                    panelRef={aiAssistantPanelRef}
                    leftColRef={aiAssistantLeftColRef}
                    subColRef={aiAssistantSubColRef}
                    dropdownAlign={aiAssistantPlacement.dropdownAlign}
                    menuDataAttribute="ai-mind-assistant"
                    panelTitle="🏠 나만의 공간"
                    categories={aiMindAssistantMenuCategories}
                    selectedMainCategory={selectedAiAssistantMainCategory}
                    selectedSubcategory={selectedAiAssistantSubcategory}
                    isMenuOpen={isAiMindAssistantOpen}
                    onSelectMainCategory={setSelectedAiAssistantMainCategory}
                    onSelectSubcategory={setSelectedAiAssistantSubcategory}
                    navigateTo={navigateTo}
                    onMainCategoryClick={() => {
                      navigateTo(AI_MIND_ASSISTANT_MAIN_HREF);
                      setActiveMenu(null);
                    }}
                    onSubcategoryClick={(subcategory) => handleTierSubcategoryNav(subcategory)}
                    onCloseMenu={() => setActiveMenu(null)}
                    onPanelMouseEnter={() => {
                      openMenu('ai-mind-assistant');
                      initTierMenuSelection(aiMindAssistantMenuCategories, setSelectedAiAssistantMainCategory, setSelectedAiAssistantSubcategory);
                    }}
                    onPanelMouseLeave={scheduleClose}
                  />
                )}
              </div>
              </>
              )}
            </div>

            {/* 로그인 등 — 줄바꿈 방지용 우측 고정 그룹 (로그인 전후 폭 차로 상단 전체가 밀리지 않게 최소 폭 확보) */}
            <div className="ml-1 flex min-w-[14rem] shrink-0 flex-nowrap items-center gap-2 border-l border-white/15 pl-3 md:min-w-[15rem] lg:gap-2.5 lg:pl-5 lg:min-w-[16rem]">
              {/* 마이페이지 메가 메뉴 및 사용자 인증 */}
              <div className="flex shrink-0 items-center gap-2.5 pl-0.5 lg:gap-3">
                {isLoggedIn ? (
                  <>
                    {/* 기관(B2B) 메뉴 — org_admin */}
                    {showOrgMenu && (
                      <Link
                        href="/org/dashboard/"
                        className={`h-10 px-2.5 lg:px-3.5 inline-flex items-center justify-center rounded-lg text-sm lg:text-[15px] font-semibold border-2 whitespace-nowrap ${
                          activeItem.startsWith('/org/')
                            ? 'text-white bg-emerald-700 border-white'
                            : 'text-gray-300 hover:text-white border-transparent hover:border-white hover:bg-emerald-900/40'
                        }`}
                        onClick={(e) => handleNavLinkClick('/org/dashboard/', e)}
                      >
                        🏫 기관
                      </Link>
                    )}
                    {/* 상담사 메뉴 - 인증된 상담사만 표시 */}
                    {showCounselorMenu && (
                      <div ref={counselorTriggerRef} className="relative">
                        <Link
                          href="/counselor"
                          className={`h-10 px-2.5 lg:px-3.5 inline-flex items-center justify-center gap-1 rounded-lg text-sm lg:text-[15px] font-semibold tracking-tight transition-all duration-300 whitespace-nowrap border-2 ${
                            activeItem === "/counselor" || activeItem.startsWith("/counselor/")
                              ? "text-white bg-blue-600 border-white"
                              : isCounselorOpen
                              ? "text-gray-300 border-white"
                              : "text-gray-300 hover:text-white hover:bg-blue-800/50 border-transparent hover:border-white"
                          }`}
                          onClick={(e) => handleNavLinkClick("/counselor", e)}
                          onMouseEnter={() => {
                            openMenu('counselor');
                            initTierMenuSelection(counselorMenuCategories, setSelectedCounselorMainCategory, setSelectedCounselorSubcategory);
                          }}
                          onMouseLeave={scheduleClose}
                        >
                          👨‍⚕️ 상담사
                          <svg
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isCounselorOpen ? "rotate-180" : ""}`}
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </Link>

                        {isCounselorOpen && (
                          <ThreeTierMegaMenuPanel
                            panelRef={counselorPanelRef}
                            leftColRef={counselorLeftColRef}
                            subColRef={counselorSubColRef}
                            dropdownAlign={counselorPlacement.dropdownAlign}
                            menuDataAttribute="counselor"
                            panelTitle="👨‍⚕️ 상담사"
                            categories={counselorMenuCategories}
                            selectedMainCategory={selectedCounselorMainCategory}
                            selectedSubcategory={selectedCounselorSubcategory}
                            isMenuOpen={isCounselorOpen}
                            onSelectMainCategory={setSelectedCounselorMainCategory}
                            onSelectSubcategory={setSelectedCounselorSubcategory}
                            navigateTo={navigateTo}
                            onMainCategoryClick={() => {
                              navigateTo(COUNSELOR_MAIN_HREF);
                              setActiveMenu(null);
                            }}
                            onSubcategoryClick={(subcategory) => handleTierSubcategoryNav(subcategory)}
                            onCloseMenu={() => setActiveMenu(null)}
                            onPanelMouseEnter={() => {
                              openMenu('counselor');
                              initTierMenuSelection(counselorMenuCategories, setSelectedCounselorMainCategory, setSelectedCounselorSubcategory);
                            }}
                            onPanelMouseLeave={scheduleClose}
                          />
                        )}
                      </div>
                    )}

                    {showAdminMenu && (
                      <div ref={adminTriggerRef} className="relative">
                        <Link
                          href="/admin"
                          className={`relative h-10 px-2.5 lg:px-3.5 inline-flex items-center justify-center gap-1 rounded-lg text-sm lg:text-[15px] font-semibold tracking-tight transition-all duration-300 whitespace-nowrap border-2 ${
                            activeItem === "/admin" || activeItem.startsWith("/admin/")
                              ? "text-white bg-blue-600 border-white"
                              : isAdminOpen
                              ? "text-gray-300 border-white"
                              : "text-gray-300 hover:text-white hover:bg-blue-800/50 border-transparent hover:border-white"
                          }`}
                          onClick={(e) => handleNavLinkClick("/admin", e)}
                          onMouseEnter={() => {
                            openMenu('admin');
                            initTierMenuSelection(visibleAdminMenuItems, setSelectedAdminMainCategory, setSelectedAdminSubcategory);
                          }}
                          onMouseLeave={scheduleClose}
                        >
                          🔧 관리자
                          {pendingCounselorCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                              {pendingCounselorCount > 99 ? '99+' : pendingCounselorCount}
                            </span>
                          )}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isAdminOpen ? "rotate-180" : ""}`}
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </Link>

                        {isAdminOpen && (
                          <ThreeTierMegaMenuPanel
                            panelRef={adminPanelRef}
                            leftColRef={adminLeftColRef}
                            subColRef={adminSubColRef}
                            dropdownAlign={adminPlacement.dropdownAlign}
                            menuDataAttribute="admin"
                            panelTitle="🔧 관리자"
                            categories={visibleAdminMenuItems}
                            selectedMainCategory={selectedAdminMainCategory}
                            selectedSubcategory={selectedAdminSubcategory}
                            isMenuOpen={isAdminOpen}
                            onSelectMainCategory={setSelectedAdminMainCategory}
                            onSelectSubcategory={setSelectedAdminSubcategory}
                            navigateTo={navigateTo}
                            onMainCategoryClick={() => {
                              navigateTo(ADMIN_MAIN_HREF);
                              setActiveMenu(null);
                            }}
                            onSubcategoryClick={(subcategory) => handleTierSubcategoryNav(subcategory)}
                            onCloseMenu={() => setActiveMenu(null)}
                            onPanelMouseEnter={() => {
                              openMenu('admin');
                              initTierMenuSelection(visibleAdminMenuItems, setSelectedAdminMainCategory, setSelectedAdminSubcategory);
                            }}
                            onPanelMouseLeave={scheduleClose}
                          />
                        )}
                      </div>
                    )}
                    
                    {/* 마이페이지 드롭다운 메뉴 */}
                    <div className="relative">
                      <Link
                        href="/mypage"
                        className={`relative h-10 px-2.5 lg:px-3.5 inline-flex items-center justify-center gap-1 rounded-lg text-sm lg:text-[15px] font-semibold tracking-tight transition-all duration-300 whitespace-nowrap border-2 ${
                          activeItem === "/mypage" || activeItem.startsWith("/mypage/") || activeItem.startsWith("/mypage?")
                            ? "text-white bg-blue-600 border-white"
                            : isDropdownOpen
                            ? "text-gray-300 border-white"
                            : "text-gray-300 hover:text-white hover:bg-blue-800/50 border-transparent hover:border-white"
                        }`}
                        onClick={(e) => handleNavLinkClick("/mypage", e)}
                        onMouseEnter={() => openMenu('user')}
                        onMouseLeave={scheduleClose}
                      >
                        👤 마이페이지
                        {counselorResultCount > 0 && (
                          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                            {counselorResultCount > 99 ? '99+' : counselorResultCount}
                          </span>
                        )}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
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
                          className="absolute right-0 top-full mt-0 pt-4 pb-8 w-96 min-w-[24rem] max-w-[28rem] bg-gradient-to-br from-slate-900/95 via-green-900/95 to-emerald-900/95 rounded-2xl shadow-2xl border border-green-500/30 z-50 animate-fadeIn backdrop-blur-xl"
                          onMouseEnter={() => {
                            openMenu('user');
                          }}
                          onMouseLeave={() => {
                            scheduleClose();
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
                                  { name: "삭제된 코드", href: "/mypage?tab=deleted", description: "삭제된 테스트 코드 복구", icon: "📋" },
                                  { name: "설정", href: "/mypage/settings", description: "계정 설정", icon: "⚙️", badge: counselorResultCount }
                                ].map((item, index) => (
                                  <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 border-2 ${
                                      index === 0
                                        ? 'border-white'
                                        : 'border-white/20 hover:border-white'
                                    }`}
                                    onClick={() => setActiveMenu(null)}
                                  >
                                    <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                      {item.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-white truncate flex items-center gap-2">
                                        {item.name}
                                        {'badge' in item && typeof item.badge === 'number' && item.badge > 0 && (
                                          <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none shrink-0">
                                            {item.badge > 99 ? '99+' : item.badge}
                                          </span>
                                        )}
                                      </div>
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
                    <Link
                      href="/login"
                      className="inline-flex h-10 min-w-[6.5rem] shrink-0 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-semibold tracking-wide text-slate-100 shadow-sm transition-all duration-300 hover:border-white/25 hover:bg-white/10 hover:text-white whitespace-nowrap"
                      onClick={(e) => handleAuthLinkClick("/login", e)}
                    >
                      <span className="text-base leading-none" aria-hidden>
                        🔑
                      </span>
                      <span>전문가 로그인</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 모바일 햄버거 — 브랜드와 같은 행 정렬 */}
          <div className="flex md:hidden shrink-0 items-center">
            <button
              type="button"
              aria-label={isMobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-100 hover:bg-white/10 hover:text-white transition-all duration-300"
            >
              <svg
                className="h-6 w-6"
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

              <Link
                href={hasClientPortalSession ? '/portal/' : '/portal/login/'}
                className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-white bg-blue-600/80 hover:bg-blue-600 border border-blue-500/50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span aria-hidden>⭐</span>
                검사시작
              </Link>

              {isLoggedIn && showPsychologyTestsMenu && (
                <ThreeTierMobileMenuSection
                  sectionTitle="🧠 AI 심리검사"
                  categories={visibleTestMenuItems}
                  selectedMainCategory={selectedMainCategory}
                  selectedSubcategory={selectedSubcategory}
                  onToggleMainCategory={(category) =>
                    setSelectedMainCategory(selectedMainCategory === category ? null : category)
                  }
                  onSelectSubcategory={setSelectedSubcategory}
                  onSubcategoryPress={(subcategory) => handleTierSubcategoryNav(subcategory, TEST_SUBCATEGORY_SLUGS)}
                  onCloseMenu={() => setIsMobileMenuOpen(false)}
                  searchSlot={
                    <TestMenuSearch
                      categories={visibleTestMenuItems}
                      variant="mobile"
                      onNavigate={() => setIsMobileMenuOpen(false)}
                    />
                  }
                />
              )}

              {isLoggedIn && (
              <>
              <ThreeTierMobileMenuSection
                sectionTitle="💬 상담 프로그램"
                categories={counselingMenuCategories}
                selectedMainCategory={selectedCounselingMainCategory}
                selectedSubcategory={selectedCounselingSubcategory}
                onToggleMainCategory={(category) =>
                  setSelectedCounselingMainCategory(selectedCounselingMainCategory === category ? null : category)
                }
                onSelectSubcategory={setSelectedCounselingSubcategory}
                onSubcategoryPress={(subcategory) => handleTierSubcategoryNav(subcategory)}
                onCloseMenu={() => setIsMobileMenuOpen(false)}
              />

              <ThreeTierMobileMenuSection
                sectionTitle="🏠 나만의 공간"
                categories={aiMindAssistantMenuCategories}
                selectedMainCategory={selectedAiAssistantMainCategory}
                selectedSubcategory={selectedAiAssistantSubcategory}
                onToggleMainCategory={(category) =>
                  setSelectedAiAssistantMainCategory(selectedAiAssistantMainCategory === category ? null : category)
                }
                onSelectSubcategory={setSelectedAiAssistantSubcategory}
                onSubcategoryPress={(subcategory) => handleTierSubcategoryNav(subcategory)}
                onCloseMenu={() => setIsMobileMenuOpen(false)}
              />

              {showCounselorMenu && (
                <ThreeTierMobileMenuSection
                  sectionTitle="👨‍⚕️ 상담사"
                  categories={counselorMenuCategories}
                  selectedMainCategory={selectedCounselorMainCategory}
                  selectedSubcategory={selectedCounselorSubcategory}
                  onToggleMainCategory={(category) =>
                    setSelectedCounselorMainCategory(selectedCounselorMainCategory === category ? null : category)
                  }
                  onSelectSubcategory={setSelectedCounselorSubcategory}
                  onSubcategoryPress={(subcategory) => handleTierSubcategoryNav(subcategory)}
                  onCloseMenu={() => setIsMobileMenuOpen(false)}
                />
              )}

              {showAdminMenu && (
                <ThreeTierMobileMenuSection
                  sectionTitle="🔧 관리자"
                  categories={visibleAdminMenuItems}
                  selectedMainCategory={selectedAdminMainCategory}
                  selectedSubcategory={selectedAdminSubcategory}
                  onToggleMainCategory={(category) =>
                    setSelectedAdminMainCategory(selectedAdminMainCategory === category ? null : category)
                  }
                  onSelectSubcategory={setSelectedAdminSubcategory}
                  onSubcategoryPress={(subcategory) => handleTierSubcategoryNav(subcategory)}
                  onCloseMenu={() => setIsMobileMenuOpen(false)}
                />
              )}

              </>
              )}

              {/* 사용자 메뉴 */}
              {isLoggedIn ? (
                <div className="space-y-2 pt-4 border-t border-white/20">
                  <div className="px-4 py-2 text-sm font-semibold text-indigo-300 uppercase tracking-wide flex items-center gap-2">
                    👤 마이페이지
                    {counselorResultCount > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                        {counselorResultCount > 99 ? '99+' : counselorResultCount}
                      </span>
                    )}
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
                    🔑 전문가 로그인
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
