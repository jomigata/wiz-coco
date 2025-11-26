"use client";
import React from "react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { removeItem } from '@/utils/localStorageManager';
import { shouldShowCounselorMenu, shouldShowAdminMenu } from '@/utils/roleUtils';
import { testSubMenuItems, TestCategory } from '@/data/psychologyTestMenu';
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
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedAiAssistantMainCategory, setSelectedAiAssistantMainCategory] = useState<string | null>(null);
  const [selectedAiAssistantSubcategory, setSelectedAiAssistantSubcategory] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [maxButtonWidth, setMaxButtonWidth] = useState<number>(0);
  const [maxContentWidth, setMaxContentWidth] = useState<number>(0);
  const [leftColumnWidth, setLeftColumnWidth] = useState<number>(0);
  const [parentContainerWidth, setParentContainerWidth] = useState<number>(0);
  const buttonRefs = useRef<Map<string, HTMLElement>>(new Map());
  const contentRefs = useRef<Map<string, HTMLElement>>(new Map());
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const parentContainerRef = useRef<HTMLDivElement>(null);
  
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

  // 중분류 버튼 중 가장 큰 버튼의 너비 계산 및 부모 컨테이너 너비 계산
  useEffect(() => {
    if (selectedAiAssistantMainCategory && isAiMindAssistantOpen) {
      // 버튼이 렌더링된 후 계산하기 위해 약간의 지연 추가
      const timer = setTimeout(() => {
        let maxContentW = 0;
        
        // 1단계: 텍스트 영역의 실제 너비 측정 (width 제한 없이 자연스러운 너비 측정)
        // 텍스트 영역은 아직 width가 설정되지 않은 상태(auto)이므로 실제 텍스트 너비를 측정할 수 있음
        contentRefs.current.forEach((ref) => {
          if (ref) {
            // scrollWidth를 사용하여 텍스트의 실제 내용 너비 측정
            const width = ref.scrollWidth;
            if (width > maxContentW) {
              maxContentW = width;
            }
          }
        });
        
        // 2단계: 텍스트 너비를 기준으로 버튼 너비 정확히 계산
        if (maxContentW > 0) {
          setMaxContentWidth(maxContentW);
          
          // 버튼 전체 너비 계산: 텍스트 너비 + 아이콘(32px) + gap(16px) + 화살표(16px) + gap(16px) + 좌우 패딩(32px)
          // 아이콘: text-2xl ≈ 32px, 화살표: w-4 h-4 = 16px, gap-4 = 16px, px-4 = 16px (좌우 각각)
          // border-2 = 2px * 2 = 4px (좌우 각각)
          const calculatedButtonWidth = maxContentW + 32 + 16 + 16 + 16 + 32 + 4; // 텍스트 + 아이콘 + gap + 화살표 + gap + padding + border
          setMaxButtonWidth(calculatedButtonWidth);
        }
        
        // 3단계: 왼쪽 컬럼 너비 측정 및 부모 컨테이너 너비 계산
        if (leftColumnRef.current) {
          const leftWidth = leftColumnRef.current.offsetWidth;
          setLeftColumnWidth(leftWidth);
          
          // 4단계: 부모 컨테이너 너비 계산 (왼쪽 컬럼 + 오른쪽 컬럼)
          const rightColumnWidth = maxContentW > 0 ? (maxContentW + 32 + 16 + 16 + 16 + 32 + 4 + 24) : 0; // 버튼 너비 + 좌측 패딩(16px) + 우측 패딩(8px)
          const totalWidth = leftWidth + rightColumnWidth;
          if (totalWidth > 0) {
            setParentContainerWidth(totalWidth);
          }
        }
      }, 350); // 렌더링 완료를 보장하기 위한 충분한 지연
      
      return () => clearTimeout(timer);
    } else {
      setMaxButtonWidth(0);
      setMaxContentWidth(0);
      setLeftColumnWidth(0);
      setParentContainerWidth(0);
    }
  }, [selectedAiAssistantMainCategory, isAiMindAssistantOpen]);

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
        { name: "AI 종합 분석", href: "/tests/ai-analysis", description: "AI 기반 맞춤형 리포트", icon: "🤖" },
        { name: "목표 관리", href: "/goals", description: "개인 목표 설정 및 추적", icon: "🎯" }
      ]
    },
    {
      category: "상담 & 소통",
      items: [
        { name: "1:1 채팅", href: "/chat", description: "상담사와 실시간 채팅", icon: "💬" },
        { name: "상담 예약", href: "/counseling/appointments", description: "개인/가족/커플 상담 예약", icon: "📅" },
        { name: "상담사 연결", href: "/mypage/connect-counselor", description: "상담사 인증코드 입력", icon: "🔗" }
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
      category: "계정 관리",
      items: [
        { name: "상담사 지원", href: "/counselor-application", description: "상담사 지원 신청", icon: "👨‍⚕️" }
      ]
    },
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

  // '나의 AI 비서' 메뉴 데이터 - 3단계 구조 (대분류-중분류-소분류)
  // 구조: 그룹(나의마음/AI기록분석/AI상담사) > 대분류 > 중분류 > 소분류
  const aiMindAssistantSubMenuItems: TestCategory[] = [
    // <나의마음> 그룹
    { 
      category: "일일 체크",
      icon: "📊",
      subcategories: [
        {
          name: "오늘의 컨디션 체크",
          icon: "📊",
      items: [
            { name: "오늘의 컨디션 체크", href: "/ai-mind-assistant/daily-mood", description: "수면/스트레스/우울/불안 등 통합 체크", icon: "📊" }
          ]
        },
        {
          name: "오늘의 감정일기",
          icon: "📝",
          items: [
            { name: "오늘의 감정일기", href: "/ai-mind-assistant/daily-thought", description: "AI가 분석하는 감정 변화", icon: "📝" }
          ]
        },
        {
          name: "나의 목표 관리",
          icon: "🎯",
          items: [
            { name: "나의 목표 관리", href: "/goals", description: "개인 목표 설정 및 추적", icon: "🎯" }
          ]
        },
        {
          name: "일정 관리",
          icon: "📅",
          items: [
            { name: "일정 관리", href: "/calendar", description: "상담 예약 및 일정 관리", icon: "📅" }
          ]
        }
      ]
    },
    { 
      category: "마음 SOS",
      icon: "🚨",
      subcategories: [
        {
          name: "나의 긴급 마음진단",
          icon: "🚨",
      items: [
            { name: "나의 긴급 마음진단", href: "/ai-mind-assistant/emergency-diagnosis", description: "1분 AI 솔루션", icon: "🚨", badge: "긴급" }
      ]
    },
    { 
          name: "나의 번아웃 체크",
          icon: "🔥",
      items: [
            { name: "나의 번아웃 체크", href: "/ai-mind-assistant/burnout-check", description: "번아웃 신호등 확인", icon: "🔥" }
          ]
        }
      ]
    },
    // <AI기록분석> 그룹
    {
      category: "AI 리포트",
      icon: "📋",
      subcategories: [
        {
          name: "일상 추적",
          icon: "📝",
          items: [
            { name: "일상 추적", href: "/mypage/daily-tracking", description: "매일의 마음 상태 기록", icon: "📝" }
          ]
        },
        {
          name: "AI 감정/스트레스 분석",
          icon: "📊",
          items: [
            { name: "AI 감정/스트레스 분석", href: "/ai-mind-assistant/emotion-report", description: "종합 감정 및 스트레스 분석 결과", icon: "📊" }
          ]
        },
        {
          name: "AI 종합 분석 리포트",
          icon: "🏆",
          items: [
            { name: "AI 종합 분석 리포트", href: "/tests/ai-analysis", description: "현재 마음 상태 종합 점검", icon: "🏆" }
          ]
        },
        {
          name: "K-MBTI 궁합",
          icon: "💕",
          items: [
            { name: "K-MBTI 궁합", href: "/mbti-compatibility", description: "AI 기반 MBTI 궁합 분석", icon: "💕" }
          ]
        },
        {
          name: "성장 리포트",
          icon: "📈",
          items: [
            { name: "성장 리포트", href: "/progress", description: "개인 성장 분석 리포트", icon: "📈" }
          ]
        },
        {
          name: "AI 프로파일링",
          icon: "🔍",
          items: [
            { name: "AI 프로파일링", href: "/tests/ai-profiling", description: "캠퍼스 라이프 시크릿 리포트", icon: "🔍" }
          ]
        }
      ]
    },
    {
      category: "검사 기록",
      icon: "📋",
      subcategories: [
        {
          name: "나의 검사결과",
          icon: "📊",
          items: [
            { name: "나의 검사결과", href: "/mypage?tab=records", description: "나의 심리검사 결과 모음", icon: "📊" }
          ]
        },
        {
          name: "상담사 할당검사",
          icon: "📋",
          items: [
            { name: "상담사 할당검사", href: "/mypage/assigned-tests", description: "상담사가 할당한 검사", icon: "📋" }
          ]
        }
      ]
    },
    // <AI상담사> 그룹
    {
      category: "도와줘요 상담사님",
      icon: "💬",
      subcategories: [
        {
          name: "1:1 채팅",
          icon: "💬",
          items: [
            { name: "1:1 채팅", href: "/chat", description: "상담사와 실시간 채팅", icon: "💬" }
          ]
        },
        {
          name: "상담 예약",
          icon: "📅",
          items: [
            { name: "상담 예약", href: "/counseling/appointments", description: "개인/가족/커플 상담 예약", icon: "📅" }
          ]
        },
        {
          name: "상담사 연결",
          icon: "🔗",
          items: [
            { name: "상담사 연결", href: "/mypage/connect-counselor", description: "상담사 인증코드 입력", icon: "🔗" }
          ]
        }
      ]
    },
    {
      category: "셀프 치료",
      icon: "🧘",
      subcategories: [
        {
          name: "학습 치료",
          icon: "📚",
          items: [
            { name: "학습 치료", href: "/learning", description: "심리학 교육 콘텐츠", icon: "📚" }
          ]
        },
        {
          name: "AI 맞춤 치료",
          icon: "🤖",
          items: [
            { name: "AI 맞춤 치료", href: "/recommendations", description: "AI 기반 상담 추천", icon: "🤖" }
          ]
        },
        {
          name: "상담사 할당 치료",
          icon: "👨‍⚕️",
          items: [
            { name: "상담사 할당 치료", href: "/counselor/treatment-plans", description: "상담사가 할당한 치료 프로그램", icon: "👨‍⚕️" }
          ]
        }
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
                  className={`px-4 py-2.5 rounded-lg font-medium text-base transition-all duration-300 flex items-center whitespace-nowrap border-2 ${
                    activeItem === "/tests" || activeItem.startsWith("/tests/")
                      ? "text-white bg-blue-600 border-white"
                      : isPsychologyTestsOpen
                      ? "text-gray-300 border-white"
                      : "text-gray-300 hover:text-white hover:bg-blue-800/50 border-transparent hover:border-white"
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
                    onMouseEnter={() => {
                      setActiveMenu('psychology-tests');
                      // 첫 번째 대분류 자동 선택 (항상 실행)
                      const firstCategory = testSubMenuItems[0];
                      if (firstCategory) {
                        setSelectedMainCategory(firstCategory.category);
                        if (firstCategory.subcategories && firstCategory.subcategories.length > 0) {
                          setSelectedSubcategory(firstCategory.subcategories[0].name);
                        }
                      }
                    }}
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
                                selectedMainCategory === mainCategory.category || (index === 0 && isPsychologyTestsOpen)
                                  ? 'text-white border-white shadow-lg'
                                  : 'text-blue-300 border-white/20 hover:text-white hover:border-white hover:shadow-md'
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
                                ?.subcategories.map((subcategory, index) => {
                                  const isFirstSubcategory = index === 0;
                                  const isSelected = selectedSubcategory === subcategory.name;
                                  const shouldShowWhiteBorder = isSelected || (isFirstSubcategory && isPsychologyTestsOpen && selectedMainCategory === testSubMenuItems[0]?.category);
                                  
                                  return (
                                <div 
                                  key={subcategory.name} 
                                  className="relative"
                                  style={{
                                    animation: 'fadeIn 0.3s ease-out',
                                    animationDelay: `${index * 0.1}s`,
                                    animationFillMode: 'both'
                                  }}
                                >
                                  <div
                                    className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer ${
                                      shouldShowWhiteBorder
                                        ? 'border-2 border-white' 
                                        : 'border-2 border-white/20 hover:border-white'
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
                                    <div className="text-2xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                                      {subcategory.icon}
                                    </div>
                                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                                      <div className="text-base font-medium text-white truncate">{subcategory.name}</div>
                                    </div>
                                    <svg 
                                      className="w-4 h-4 text-blue-300 group-hover:text-white group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 ml-auto"
                                      fill="none" 
                                      stroke="currentColor" 
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </div>
                                  
                                  {/* 소분류 메뉴 */}
                                  {shouldShowWhiteBorder && subcategory.items && (
                                    <div className="mt-2 ml-4 space-y-1 animate-fadeIn-slow">
                                      {subcategory.items.map((item, itemIndex) => {
                                        const isFirstItem = itemIndex === 0;
                                        const shouldShowItemWhiteBorder = isFirstItem && shouldShowWhiteBorder;
                                        
                                        return (
                                        <Link
                                          key={item.name}
                                          href={item.href}
                                          className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 border-2 ml-8 shadow-sm hover:shadow-md ${
                                            shouldShowItemWhiteBorder
                                              ? 'border-white'
                                              : 'border-white/20 hover:border-white'
                                          }`}
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
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                              })}
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
                  className={`px-4 py-2.5 rounded-lg font-medium text-base transition-all duration-300 flex items-center whitespace-nowrap border-2 ${
                    activeItem === "/counseling" || activeItem.startsWith("/counseling/")
                      ? "text-white bg-blue-600 border-white"
                      : isCounselingDropdownOpen
                      ? "text-gray-300 border-white"
                      : "text-gray-300 hover:text-white hover:bg-blue-800/50 border-transparent hover:border-white"
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
                    onMouseEnter={() => {
                      setActiveMenu('counseling');
                      // 첫 번째 카테고리의 첫 번째 아이템이 자동으로 선택되도록 (이미 렌더링되므로 별도 상태 불필요)
                    }}
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
                                  className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 border-2 ${
                                    category === counselingMenuItems[0] && item === category.items[0]
                                      ? 'border-white'
                                      : 'border-white/20 hover:border-white'
                                  }`}
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
                  className={`px-4 py-2.5 rounded-lg font-medium text-base transition-all duration-300 flex items-center whitespace-nowrap border-2 ${
                    activeItem === "/ai-mind-assistant" || activeItem.startsWith("/ai-mind-assistant/")
                      ? "text-white bg-blue-600 border-white"
                      : isAiMindAssistantOpen
                      ? "text-gray-300 border-white"
                      : "text-gray-300 hover:text-white hover:bg-blue-800/50 border-transparent hover:border-white"
                  }`}
                  onClick={(e) => handleNavLinkClick("/ai-mind-assistant", e)}
                  onMouseEnter={() => {
                    setActiveMenu('ai-mind-assistant');
                    // 첫 번째 대분류 자동 선택
                    if (!selectedAiAssistantMainCategory) {
                      const firstCategory = aiMindAssistantSubMenuItems[0];
                      if (firstCategory) {
                        setSelectedAiAssistantMainCategory(firstCategory.category);
                        if (firstCategory.subcategories && firstCategory.subcategories.length > 0) {
                          setSelectedAiAssistantSubcategory(firstCategory.subcategories[0].name);
                        }
                      }
                    }
                  }}
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

                {/* AI 마음 비서 메가 메뉴 - 중분류가 옆으로 펼쳐지는 구조 */}
                {isAiMindAssistantOpen && (
                  <div
                    ref={parentContainerRef}
                    data-dropdown-menu="ai-mind-assistant"
                    className="absolute left-0 mt-0 pt-4 pb-8 bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-indigo-900/95 rounded-2xl shadow-2xl border border-blue-500/30 z-50 animate-fadeIn backdrop-blur-xl"
                    style={{
                      width: parentContainerWidth > 0 ? `${parentContainerWidth}px` : 'auto',
                      minWidth: 'fit-content',
                      maxWidth: 'none'
                    }}
                    onMouseEnter={() => {
                      setActiveMenu('ai-mind-assistant');
                      // 첫 번째 대분류 자동 선택
                      if (!selectedAiAssistantMainCategory) {
                        const firstCategory = aiMindAssistantSubMenuItems[0];
                        if (firstCategory) {
                          setSelectedAiAssistantMainCategory(firstCategory.category);
                          if (firstCategory.subcategories && firstCategory.subcategories.length > 0) {
                            setSelectedAiAssistantSubcategory(firstCategory.subcategories[0].name);
                          }
                        }
                      }
                    }}
                    onMouseLeave={() => setActiveMenu(null)}
                  >
                    <div className="relative flex h-[70vh]">
                      {/* 왼쪽: 그룹 및 대분류 */}
                      <div 
                        ref={leftColumnRef}
                        className="flex-shrink-0 p-4 border-r border-blue-500/30 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-900"
                        style={{
                          width: 'auto',
                          minWidth: 'fit-content'
                        }}
                      >
                      <div 
                        ref={aiAssistantScroll.scrollRef}
                          className="space-y-2"
                        onMouseMove={aiAssistantScroll.handleMouseMove}
                        onMouseLeave={aiAssistantScroll.handleMouseLeave}
                      >
                        {/* 나의마음 그룹 */}
                        <div className="mb-4 last:mb-0">
                          <div className="px-2 py-1 text-base font-bold text-purple-300 uppercase tracking-wide mb-2">
                            나의 마음
                            </div>
                            <div className="space-y-1">
                            {/* 일일 체크 */}
                            <div className="relative">
                              <div
                                className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer ${
                                  selectedAiAssistantMainCategory === "일일 체크" 
                                    ? 'border-2 border-white' 
                                    : 'border-2 border-white/20 hover:border-white'
                                }`}
                                onMouseEnter={() => {
                                  setSelectedAiAssistantMainCategory("일일 체크");
                                  const category = aiMindAssistantSubMenuItems.find(c => c.category === "일일 체크");
                                  if (category?.subcategories && category.subcategories.length > 0) {
                                    setSelectedAiAssistantSubcategory(category.subcategories[0].name);
                                  }
                                }}
                                onClick={() => {
                                  const category = aiMindAssistantSubMenuItems.find(c => c.category === "일일 체크");
                                  if (category?.subcategories && category.subcategories.length > 0) {
                                    const firstSubcategory = category.subcategories[0];
                                    if (firstSubcategory.items && firstSubcategory.items.length > 0) {
                                      router.push(firstSubcategory.items[0].href);
                                      setActiveMenu(null);
                                    } else {
                                      setSelectedAiAssistantMainCategory("일일 체크");
                                      setSelectedAiAssistantSubcategory(firstSubcategory.name);
                                    }
                                  }
                                }}
                                >
                                  <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                  📊
                                  </div>
                                  <div className="flex-1 min-w-0">
                                  <div className="text-base font-medium text-white truncate">일일 체크</div>
                                  <div className="text-sm text-blue-300 truncate">매일의 컨디션과 감정을 기록</div>
                                  </div>
                                  <svg 
                                  className="w-4 h-4 text-blue-300 group-hover:text-white transition-all duration-300"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                            </div>
                          </div>
                            {/* 마음 SOS */}
                            <div className="relative">
                              <div
                                className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer ${
                                  selectedAiAssistantMainCategory === "마음 SOS" 
                                    ? 'border-2 border-white' 
                                    : 'border-2 border-white/20 hover:border-white'
                                }`}
                                onMouseEnter={() => {
                                  setSelectedAiAssistantMainCategory("마음 SOS");
                                  const category = aiMindAssistantSubMenuItems.find(c => c.category === "마음 SOS");
                                  if (category?.subcategories && category.subcategories.length > 0) {
                                    setSelectedAiAssistantSubcategory(category.subcategories[0].name);
                                  }
                                }}
                                onClick={() => {
                                  const category = aiMindAssistantSubMenuItems.find(c => c.category === "마음 SOS");
                                  if (category?.subcategories && category.subcategories.length > 0) {
                                    const firstSubcategory = category.subcategories[0];
                                    if (firstSubcategory.items && firstSubcategory.items.length > 0) {
                                      router.push(firstSubcategory.items[0].href);
                                      setActiveMenu(null);
                                    } else {
                                      setSelectedAiAssistantMainCategory("마음 SOS");
                                      setSelectedAiAssistantSubcategory(firstSubcategory.name);
                                    }
                                  }
                                }}
                              >
                                <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                  🚨
                      </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-base font-medium text-white truncate">마음 SOS</div>
                                  <div className="text-sm text-blue-300 truncate">긴급한 마음 상태 진단</div>
                    </div>
                                <svg 
                                  className="w-4 h-4 text-blue-300 group-hover:text-white transition-all duration-300"
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                  </div>
                            </div>
                          </div>
              </div>

                        {/* AI기록분석 그룹 */}
                        <div className="mb-4 last:mb-0">
                          <div className="px-2 py-1 text-base font-bold text-purple-300 uppercase tracking-wide mb-2">
                            AI 기록 분석
                          </div>
                          <div className="space-y-1">
                            {/* AI 리포트 */}
              <div className="relative">
                              <div
                                className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer ${
                                  selectedAiAssistantMainCategory === "AI 리포트" 
                                    ? 'border-2 border-white' 
                                    : 'border-2 border-white/20 hover:border-white'
                                }`}
                                onMouseEnter={() => {
                                  setSelectedAiAssistantMainCategory("AI 리포트");
                                  const category = aiMindAssistantSubMenuItems.find(c => c.category === "AI 리포트");
                                  if (category?.subcategories && category.subcategories.length > 0) {
                                    setSelectedAiAssistantSubcategory(category.subcategories[0].name);
                                  }
                                }}
                                onClick={() => {
                                  const category = aiMindAssistantSubMenuItems.find(c => c.category === "AI 리포트");
                                  if (category?.subcategories && category.subcategories.length > 0) {
                                    const firstSubcategory = category.subcategories[0];
                                    if (firstSubcategory.items && firstSubcategory.items.length > 0) {
                                      router.push(firstSubcategory.items[0].href);
                                      setActiveMenu(null);
                                    } else {
                                      setSelectedAiAssistantMainCategory("AI 리포트");
                                      setSelectedAiAssistantSubcategory(firstSubcategory.name);
                                    }
                                  }
                                }}
                              >
                                <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                  📋
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-base font-medium text-white truncate">AI 리포트</div>
                                  <div className="text-sm text-blue-300 truncate">AI가 분석하는 종합 리포트</div>
                                </div>
                                <svg 
                                  className="w-4 h-4 text-blue-300 group-hover:text-white transition-all duration-300"
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                              </div>
                            </div>
                            {/* 검사 기록 */}
                            <div className="relative">
                              <div
                                className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer ${
                                  selectedAiAssistantMainCategory === "검사 기록" 
                                    ? 'border-2 border-white' 
                                    : 'border-2 border-white/20 hover:border-white'
                                }`}
                                onMouseEnter={() => {
                                  setSelectedAiAssistantMainCategory("검사 기록");
                                  const category = aiMindAssistantSubMenuItems.find(c => c.category === "검사 기록");
                                  if (category?.subcategories && category.subcategories.length > 0) {
                                    setSelectedAiAssistantSubcategory(category.subcategories[0].name);
                                  }
                                }}
                                onClick={() => {
                                  const category = aiMindAssistantSubMenuItems.find(c => c.category === "검사 기록");
                                  if (category?.subcategories && category.subcategories.length > 0) {
                                    const firstSubcategory = category.subcategories[0];
                                    if (firstSubcategory.items && firstSubcategory.items.length > 0) {
                                      router.push(firstSubcategory.items[0].href);
                                      setActiveMenu(null);
                                    } else {
                                      setSelectedAiAssistantMainCategory("검사 기록");
                                      setSelectedAiAssistantSubcategory(firstSubcategory.name);
                                    }
                                  }
                                }}
                              >
                                <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                  📋
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-base font-medium text-white truncate">검사 기록</div>
                                  <div className="text-sm text-blue-300 truncate">나의 심리검사 결과 모음</div>
                                </div>
                                <svg 
                                  className="w-4 h-4 text-blue-300 group-hover:text-white transition-all duration-300"
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* AI상담사 그룹 */}
                        <div className="mb-4 last:mb-0">
                          <div className="px-2 py-1 text-base font-bold text-purple-300 uppercase tracking-wide mb-2">
                            AI 상담사
                          </div>
                          <div className="space-y-1">
                            {/* 도와줘요 상담사님 */}
                            <div className="relative">
                              <div
                                className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer ${
                                  selectedAiAssistantMainCategory === "도와줘요 상담사님" 
                                    ? 'border-2 border-white' 
                                    : 'border-2 border-white/20 hover:border-white'
                                }`}
                                onMouseEnter={() => {
                                  setSelectedAiAssistantMainCategory("도와줘요 상담사님");
                                  const category = aiMindAssistantSubMenuItems.find(c => c.category === "도와줘요 상담사님");
                                  if (category?.subcategories && category.subcategories.length > 0) {
                                    setSelectedAiAssistantSubcategory(category.subcategories[0].name);
                                  }
                                }}
                                onClick={() => {
                                  const category = aiMindAssistantSubMenuItems.find(c => c.category === "도와줘요 상담사님");
                                  if (category?.subcategories && category.subcategories.length > 0) {
                                    const firstSubcategory = category.subcategories[0];
                                    if (firstSubcategory.items && firstSubcategory.items.length > 0) {
                                      router.push(firstSubcategory.items[0].href);
                      setActiveMenu(null);
                                    } else {
                                      setSelectedAiAssistantMainCategory("도와줘요 상담사님");
                                      setSelectedAiAssistantSubcategory(firstSubcategory.name);
                                    }
                                  }
                                }}
                              >
                                <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                  💬
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-base font-medium text-white truncate">도와줘요 상담사님</div>
                                  <div className="text-sm text-blue-300 truncate">전문 상담사와의 소통</div>
                                </div>
                                <svg 
                                  className="w-4 h-4 text-blue-300 group-hover:text-white transition-all duration-300"
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                            {/* 셀프 치료 */}
                    <div className="relative">
                              <div
                                className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer ${
                                  selectedAiAssistantMainCategory === "셀프 치료" 
                                    ? 'border-2 border-white' 
                                    : 'border-2 border-white/20 hover:border-white'
                                }`}
                                onMouseEnter={() => {
                                  setSelectedAiAssistantMainCategory("셀프 치료");
                                  const category = aiMindAssistantSubMenuItems.find(c => c.category === "셀프 치료");
                                  if (category?.subcategories && category.subcategories.length > 0) {
                                    setSelectedAiAssistantSubcategory(category.subcategories[0].name);
                                  }
                                }}
                                onClick={() => {
                                  const category = aiMindAssistantSubMenuItems.find(c => c.category === "셀프 치료");
                                  if (category?.subcategories && category.subcategories.length > 0) {
                                    const firstSubcategory = category.subcategories[0];
                                    if (firstSubcategory.items && firstSubcategory.items.length > 0) {
                                      router.push(firstSubcategory.items[0].href);
                                      setActiveMenu(null);
                                    } else {
                                      setSelectedAiAssistantMainCategory("셀프 치료");
                                      setSelectedAiAssistantSubcategory(firstSubcategory.name);
                                    }
                                  }
                                }}
                              >
                                <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                  🧘
                        </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-base font-medium text-white truncate">셀프 치료</div>
                                  <div className="text-sm text-blue-300 truncate">스스로 실천하는 치료 프로그램</div>
                                </div>
                                <svg 
                                  className="w-4 h-4 text-blue-300 group-hover:text-white transition-all duration-300"
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                        </div>
                      </div>

                      {/* 오른쪽: 선택된 대분류의 중분류 */}
                      <div 
                        className="overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-900"
                        style={{
                          width: maxButtonWidth > 0 ? `${maxButtonWidth + 24}px` : 'auto', // 버튼 너비 + 좌측 패딩(16px) + 우측 패딩(8px) = 좌측보다 작은 우측 공백
                          minWidth: maxButtonWidth > 0 ? `${maxButtonWidth + 24}px` : 'auto', // 최소 너비 설정으로 일관성 유지
                          maxWidth: maxButtonWidth > 0 ? `${maxButtonWidth + 24}px` : 'none', // 최대 너비 설정으로 컨테이너 크기 고정
                          paddingLeft: '16px', // 좌측 패딩
                          paddingRight: '8px', // 우측 패딩 (좌측보다 작게 설정)
                          paddingTop: '16px',
                          paddingBottom: '16px',
                          boxSizing: 'content-box' // 패딩을 포함하지 않은 너비 계산 (width에 패딩이 포함되지 않음)
                        }}
                      >
                        {selectedAiAssistantMainCategory ? (
                          <div>
                            <div className="text-lg font-bold text-purple-300 mb-4">
                              {selectedAiAssistantMainCategory}
                            </div>
                            <div className="space-y-1">
                              {aiMindAssistantSubMenuItems
                                .find(category => category.category === selectedAiAssistantMainCategory)
                                ?.subcategories.map((subcategory, index) => (
                                <div 
                                  key={`${selectedAiAssistantMainCategory}-${subcategory.name}-${index}`}
                                  className="relative"
                                  style={{
                                    animation: 'fadeIn 0.3s ease-out',
                                    animationDelay: `${index * 0.1}s`,
                                    animationFillMode: 'both'
                                  }}
                                >
                                  <div
                                    ref={(el) => {
                                      if (el) {
                                        buttonRefs.current.set(`${selectedAiAssistantMainCategory}-${subcategory.name}`, el);
                                      }
                                    }}
                                    className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer ${
                                      selectedAiAssistantSubcategory === subcategory.name 
                                        ? 'border-2 border-white' 
                                        : 'border-2 border-white/20 hover:border-white'
                                    }`}
                                    style={{
                                      width: maxButtonWidth > 0 ? `${maxButtonWidth}px` : 'auto', // 가장 긴 텍스트를 기준으로 계산된 고정 너비
                                      minWidth: maxButtonWidth > 0 ? `${maxButtonWidth}px` : 'auto', // 최소 너비 설정으로 일관성 유지
                                      maxWidth: maxButtonWidth > 0 ? `${maxButtonWidth}px` : 'none', // 최대 너비 설정으로 버튼 크기 고정
                                      flexShrink: 0, // flex 아이템이 축소되지 않도록 설정
                                      boxSizing: 'border-box' // 패딩과 보더를 포함한 너비 계산
                                    }}
                                    onMouseEnter={() => {
                                      setHoveredCategory(subcategory.name);
                                      setSelectedAiAssistantSubcategory(subcategory.name);
                                    }}
                                    onClick={() => {
                                      if (subcategory.items && subcategory.items.length > 0) {
                                        router.push(subcategory.items[0].href);
                                        setActiveMenu(null);
                                      }
                                    }}
                                >
                                    <div className="text-2xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                                      {subcategory.icon}
                                  </div>
                                    <div 
                                      ref={(el) => {
                                        if (el) {
                                          contentRefs.current.set(`${selectedAiAssistantMainCategory}-${subcategory.name}`, el);
                                        }
                                      }}
                                      className="flex flex-col gap-1 flex-1 min-w-0"
                                      style={{
                                        width: maxContentWidth > 0 ? `${maxContentWidth}px` : 'auto',
                                        maxWidth: maxContentWidth > 0 ? `${maxContentWidth}px` : 'none'
                                      }}
                                    >
                                    <div className="flex items-center gap-2">
                                        <div className="text-base font-medium text-white whitespace-nowrap">{subcategory.name}</div>
                                        {subcategory.items && subcategory.items.length > 0 && 'badge' in subcategory.items[0] && (subcategory.items[0] as any).badge && (
                                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full flex-shrink-0 ${
                                            (subcategory.items[0] as any).badge === '긴급' ? 'bg-red-500 text-white' :
                                            (subcategory.items[0] as any).badge === '신규' ? 'bg-green-500 text-white' :
                                          'bg-orange-500 text-white'
                                        }`}>
                                            {(subcategory.items[0] as any).badge}
                                        </span>
                                      )}
                                    </div>
                                      {subcategory.items && subcategory.items.length > 0 && (
                                        <div className="text-sm text-blue-300 whitespace-nowrap">{subcategory.items[0].description}</div>
                                      )}
                                  </div>
                                  <svg 
                                      className="w-4 h-4 text-blue-300 group-hover:text-white group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 ml-auto"
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


              {/* 마이페이지 메가 메뉴 및 사용자 인증 */}
              <div className="flex items-center space-x-2">
                {isLoggedIn ? (
                  <>
                    {/* 상담사 메뉴 - 인증된 상담사만 표시 */}
                    {shouldShowCounselorMenu(userEmail) && (
                      <div className="relative">
                        <Link
                          href="/counselor"
                          className={`px-4 py-2.5 rounded-lg font-medium text-base transition-all duration-300 flex items-center whitespace-nowrap border-2 ${
                            activeItem === "/counselor" || activeItem.startsWith("/counselor/")
                              ? "text-white bg-blue-600 border-white"
                              : isCounselorOpen
                              ? "text-gray-300 border-white"
                              : "text-gray-300 hover:text-white hover:bg-blue-800/50 border-transparent hover:border-white"
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
                            onMouseEnter={() => {
                              setActiveMenu('counselor');
                              // 첫 번째 카테고리의 첫 번째 아이템이 자동으로 선택되도록 (이미 렌더링되므로 별도 상태 불필요)
                            }}
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
                                          className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 border-2 ${
                                            category === counselorMenuItems[0] && item === category.items[0]
                                              ? 'border-white'
                                              : 'border-white/20 hover:border-white'
                                          }`}
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
                          className={`px-4 py-2.5 rounded-lg font-medium text-base transition-all duration-300 flex items-center whitespace-nowrap border-2 ${
                            activeItem === "/admin" || activeItem.startsWith("/admin/")
                              ? "text-white bg-blue-600 border-white"
                              : isAdminOpen
                              ? "text-gray-300 border-white"
                              : "text-gray-300 hover:text-white hover:bg-blue-800/50 border-transparent hover:border-white"
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
                            onMouseEnter={() => {
                              setActiveMenu('admin');
                              // 첫 번째 카테고리의 첫 번째 아이템이 자동으로 선택되도록 (이미 렌더링되므로 별도 상태 불필요)
                            }}
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
                                          className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 border-2 ${
                                            category === adminMenuItems[0] && item === category.items[0]
                                              ? 'border-white'
                                              : 'border-white/20 hover:border-white'
                                          }`}
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
                        className={`px-4 py-2.5 rounded-lg font-medium text-base transition-all duration-300 flex items-center whitespace-nowrap border-2 ${
                          activeItem === "/mypage" || activeItem.startsWith("/mypage/")
                            ? "text-white bg-blue-600 border-white"
                            : isDropdownOpen
                            ? "text-gray-300 border-white"
                            : "text-gray-300 hover:text-white hover:bg-blue-800/50 border-transparent hover:border-white"
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
                          onMouseEnter={() => {
                            setActiveMenu('user');
                            // 첫 번째 아이템이 자동으로 선택되도록 (이미 렌더링되므로 별도 상태 불필요)
                          }}
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
              <div className="space-y-3">
                <div className="px-4 py-2 text-sm font-semibold text-green-300 uppercase tracking-wide border-b border-green-500/30">
                  🤖 나의 AI 비서
                </div>
                
                {/* 나의마음 그룹 */}
              <div className="space-y-2">
                <div className="px-4 py-2 text-sm font-semibold text-green-300 uppercase tracking-wide">
                    나의 마음
                </div>
                  {aiMindAssistantSubMenuItems.filter(c => c.category === "일일 체크" || c.category === "마음 SOS").map((mainCategory) => (
                    <div key={mainCategory.category} className="space-y-2 ml-4">
                      {/* 대분류 */}
                      <div 
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-bold text-green-200 bg-green-500/20 rounded-lg cursor-pointer transition-all duration-300 ${
                          selectedAiAssistantMainCategory === mainCategory.category ? 'bg-green-600 text-white' : 'hover:bg-green-500/30'
                        }`}
                        onClick={() => setSelectedAiAssistantMainCategory(selectedAiAssistantMainCategory === mainCategory.category ? null : mainCategory.category)}
                      >
                        <span className="text-lg">{mainCategory.icon}</span>
                        <span className="flex-1">{mainCategory.category}</span>
                        <svg 
                          className={`w-4 h-4 transition-transform duration-300 ${
                            selectedAiAssistantMainCategory === mainCategory.category ? 'rotate-90' : ''
                          }`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                    
                      {/* 선택된 대분류의 중분류 */}
                      {selectedAiAssistantMainCategory === mainCategory.category && (
                        <div className="ml-4 space-y-2 animate-fadeIn">
                          {mainCategory.subcategories.map((subcategory) => (
                            <div key={subcategory.name} className="space-y-1">
                              <div 
                                className={`flex items-center gap-2 px-2 py-1 text-base font-bold text-green-300 bg-green-500/20 rounded cursor-pointer transition-all duration-300 ${
                                  selectedAiAssistantSubcategory === subcategory.name ? 'bg-green-500/30' : 'hover:bg-green-500/30'
                                }`}
                                onClick={() => {
                                  if (subcategory.items && subcategory.items.length > 0) {
                                    router.push(subcategory.items[0].href);
                                    setIsMobileMenuOpen(false);
                                  }
                                  setSelectedAiAssistantSubcategory(selectedAiAssistantSubcategory === subcategory.name ? null : subcategory.name);
                                }}
                              >
                                <span className="text-lg">{subcategory.icon}</span>
                                <span className="flex-1">{subcategory.name}</span>
                                <svg 
                                  className={`w-4 h-4 transition-transform duration-300 ${
                                    selectedAiAssistantSubcategory === subcategory.name ? 'rotate-90' : ''
                                  }`}
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                              
                              {/* 소분류 */}
                              {selectedAiAssistantSubcategory === subcategory.name && (
                                <div className="ml-4 space-y-1 animate-fadeIn-slow">
                                  {subcategory.items.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                                      className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-green-800/30 rounded-lg transition-all duration-300"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <div className="flex items-center gap-2">
                                        <span className="text-xs">{item.icon}</span>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <div className="font-medium">{item.name}</div>
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

                {/* AI기록분석 그룹 */}
              <div className="space-y-2">
                <div className="px-4 py-2 text-sm font-semibold text-green-300 uppercase tracking-wide">
                    AI 기록 분석
                </div>
                  {aiMindAssistantSubMenuItems.filter(c => c.category === "AI 리포트" || c.category === "검사 기록").map((mainCategory) => (
                    <div key={mainCategory.category} className="space-y-2 ml-4">
                      {/* 대분류 */}
                      <div 
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-bold text-green-200 bg-green-500/20 rounded-lg cursor-pointer transition-all duration-300 ${
                          selectedAiAssistantMainCategory === mainCategory.category ? 'bg-green-600 text-white' : 'hover:bg-green-500/30'
                        }`}
                        onClick={() => setSelectedAiAssistantMainCategory(selectedAiAssistantMainCategory === mainCategory.category ? null : mainCategory.category)}
                      >
                        <span className="text-lg">{mainCategory.icon}</span>
                        <span className="flex-1">{mainCategory.category}</span>
                        <svg 
                          className={`w-4 h-4 transition-transform duration-300 ${
                            selectedAiAssistantMainCategory === mainCategory.category ? 'rotate-90' : ''
                          }`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                    
                      {/* 선택된 대분류의 중분류 */}
                      {selectedAiAssistantMainCategory === mainCategory.category && (
                        <div className="ml-4 space-y-2 animate-fadeIn">
                          {mainCategory.subcategories.map((subcategory) => (
                            <div key={subcategory.name} className="space-y-1">
                              <div 
                                className={`flex items-center gap-2 px-2 py-1 text-base font-bold text-green-300 bg-green-500/20 rounded cursor-pointer transition-all duration-300 ${
                                  selectedAiAssistantSubcategory === subcategory.name ? 'bg-green-500/30' : 'hover:bg-green-500/30'
                                }`}
                                onClick={() => {
                                  if (subcategory.items && subcategory.items.length > 0) {
                                    router.push(subcategory.items[0].href);
                                    setIsMobileMenuOpen(false);
                                  }
                                  setSelectedAiAssistantSubcategory(selectedAiAssistantSubcategory === subcategory.name ? null : subcategory.name);
                                }}
                              >
                                <span className="text-lg">{subcategory.icon}</span>
                                <span className="flex-1">{subcategory.name}</span>
                                <svg 
                                  className={`w-4 h-4 transition-transform duration-300 ${
                                    selectedAiAssistantSubcategory === subcategory.name ? 'rotate-90' : ''
                                  }`}
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                              
                              {/* 소분류 */}
                              {selectedAiAssistantSubcategory === subcategory.name && (
                                <div className="ml-4 space-y-1 animate-fadeIn-slow">
                                  {subcategory.items.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                                      className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-green-800/30 rounded-lg transition-all duration-300"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <div className="flex items-center gap-2">
                                        <span className="text-xs">{item.icon}</span>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <div className="font-medium">{item.name}</div>
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

                {/* AI상담사 그룹 */}
                <div className="space-y-2">
                  <div className="px-4 py-2 text-sm font-semibold text-green-300 uppercase tracking-wide">
                    AI 상담사
                  </div>
                  {aiMindAssistantSubMenuItems.filter(c => c.category === "도와줘요 상담사님" || c.category === "셀프 치료").map((mainCategory) => (
                    <div key={mainCategory.category} className="space-y-2 ml-4">
                      {/* 대분류 */}
                      <div 
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-bold text-green-200 bg-green-500/20 rounded-lg cursor-pointer transition-all duration-300 ${
                          selectedAiAssistantMainCategory === mainCategory.category ? 'bg-green-600 text-white' : 'hover:bg-green-500/30'
                        }`}
                        onClick={() => setSelectedAiAssistantMainCategory(selectedAiAssistantMainCategory === mainCategory.category ? null : mainCategory.category)}
                      >
                        <span className="text-lg">{mainCategory.icon}</span>
                        <span className="flex-1">{mainCategory.category}</span>
                        <svg 
                          className={`w-4 h-4 transition-transform duration-300 ${
                            selectedAiAssistantMainCategory === mainCategory.category ? 'rotate-90' : ''
                          }`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    
                      {/* 선택된 대분류의 중분류 */}
                      {selectedAiAssistantMainCategory === mainCategory.category && (
                        <div className="ml-4 space-y-2 animate-fadeIn">
                          {mainCategory.subcategories.map((subcategory) => (
                            <div key={subcategory.name} className="space-y-1">
                              <div 
                                className={`flex items-center gap-2 px-2 py-1 text-base font-bold text-green-300 bg-green-500/20 rounded cursor-pointer transition-all duration-300 ${
                                  selectedAiAssistantSubcategory === subcategory.name ? 'bg-green-500/30' : 'hover:bg-green-500/30'
                                }`}
                                onClick={() => {
                                  if (subcategory.items && subcategory.items.length > 0) {
                                    router.push(subcategory.items[0].href);
                                    setIsMobileMenuOpen(false);
                                  }
                                  setSelectedAiAssistantSubcategory(selectedAiAssistantSubcategory === subcategory.name ? null : subcategory.name);
                                }}
                              >
                                <span className="text-lg">{subcategory.icon}</span>
                                <span className="flex-1">{subcategory.name}</span>
                                <svg 
                                  className={`w-4 h-4 transition-transform duration-300 ${
                                    selectedAiAssistantSubcategory === subcategory.name ? 'rotate-90' : ''
                                  }`}
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                              
                              {/* 소분류 */}
                              {selectedAiAssistantSubcategory === subcategory.name && (
                                <div className="ml-4 space-y-1 animate-fadeIn-slow">
                                  {subcategory.items.map((item) => (
                                    <Link
                                      key={item.name}
                                      href={item.href}
                                      className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-green-800/30 rounded-lg transition-all duration-300"
                                      onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs">{item.icon}</span>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <div className="font-medium">{item.name}</div>
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
