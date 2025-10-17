"use client";
import React from "react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { removeItem } from '@/utils/localStorageManager';
import { shouldShowCounselorMenu, shouldShowAdminMenu } from '@/utils/roleUtils';
import { testSubMenuItems } from '@/data/psychologyTestMenu';
import { useAutoScroll } from '@/hooks/useAutoScroll';

export default function Navigation() {
  const router = useRouter();
  const { user, loading, logout } = useFirebaseAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("/");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>("personal");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>("성격 및 기질 탐색");
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // 자동 스크롤 훅들
  const counselingScroll = useAutoScroll();
  const aiAssistantScroll = useAutoScroll();
  const userMenuScroll = useAutoScroll();
  
  const isDropdownOpen = activeMenu === 'user';
  const isCounselingDropdownOpen = activeMenu === 'counseling';
  const isUserMenuOpen = activeMenu === 'additional';
  const isAiMindAssistantOpen = activeMenu === 'ai-mind-assistant';
  const isAiCounselingSystemOpen = activeMenu === 'ai-counseling-system';
  const isPsychologyTestsOpen = activeMenu === 'psychology-tests';
  const isCounselorOpen = activeMenu === 'counselor';
  const isAdminOpen = activeMenu === 'admin';

  const isLoggedIn = !!user && !loading;
  const userEmail = user?.email || "";
  const userName = user?.displayName || "";

  // 기본 useEffect들
  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      setActiveItem(path);
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

  // 메뉴 데이터는 별도 파일에서 import

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

  // 통합 관리자 메뉴 데이터 (탑메뉴와 사이드메뉴 일치)
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

  // AI 심리상담 시스템 메뉴 데이터
  const aiCounselingSystemMenuData = [
    { 
      category: "4단계 심리검사 프로그램",
      items: [
        { name: "통합 자기 점검", href: "/ai-counseling-system/holistic-self-check", description: "5개 대분류 영역 전반적인 삶의 상태 스크리닝", icon: "🧠" },
        { name: "집중 탐색 모듈", href: "/ai-counseling-system/focused-exploration", description: "선택된 핵심 영역에 대한 심층 분석", icon: "🎯" },
        { name: "강점 및 자원 탐색", href: "/ai-counseling-system/strength-discovery", description: "내담자의 잠재력과 강점 발견", icon: "⭐" },
        { name: "상담 청사진", href: "/ai-counseling-system/counseling-blueprint", description: "통합 보고서 및 상담 목표 설정", icon: "📋" }
      ]
    },
    { 
      category: "상담사 관리 시스템",
      items: [
        { name: "상담사 대시보드", href: "/ai-counseling-system/counselor-dashboard", description: "내담자 현황 및 상담 진행 상황 관리", icon: "📊" },
        { name: "내담자 관리", href: "/ai-counseling-system/client-management", description: "내담자 프로필 및 상담 기록 관리", icon: "👥" },
        { name: "위험신호 모니터링", href: "/ai-counseling-system/risk-monitoring", description: "AI 기반 위험신호 감지 및 개입", icon: "⚠️" },
        { name: "AI 채팅 상담", href: "/ai-counseling-system/ai-chat-counseling", description: "AI 상담사와의 실시간 채팅 상담", icon: "💬" }
      ]
    },
    { 
      category: "분석 및 보고",
      items: [
        { name: "진행 상황 분석", href: "/ai-counseling-system/progress-analytics", description: "상담 진행 상황 및 효과 분석", icon: "📈" },
        { name: "시스템 설정", href: "/ai-counseling-system/system-settings", description: "AI 모델 및 시스템 설정 관리", icon: "⚙️" }
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
          {/* 브랜드 텍스트 - 좌측 끝으로 이동 및 홈페이지 링크 연결 */}
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
                           {[
                             { id: "personal", name: "개인 심리 및 성장", icon: "🧬" },
                             { id: "social", name: "대인관계 및 사회적응", icon: "👥" },
                             { id: "emotional", name: "정서 문제 및 정신 건강", icon: "💭" },
                             { id: "practical", name: "현실 문제 및 생활 관리", icon: "📋" },
                             { id: "cultural", name: "문화 및 환경 적응", icon: "🌍" }
                           ].map((mainCategory) => (
                   <div
                     key={mainCategory.id}
                     className={`p-4 rounded-lg cursor-pointer transition-all duration-300 border-2 ${
                       selectedMainCategory === mainCategory.id
                         ? 'bg-blue-600 text-white border-blue-400 shadow-lg'
                         : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/40 hover:text-white border-blue-500/30 hover:border-blue-400 hover:shadow-md'
                     }`}
                     onClick={() => {
                       setSelectedMainCategory(mainCategory.id);
                       // 대분류 클릭 시 대시보드로 이동하면서 카테고리 전달
                       const categoryMap: { [key: string]: string } = {
                         "personal": "personal-growth",
                         "social": "relationships-social", 
                         "emotional": "emotional-mental",
                         "practical": "reality-life",
                         "cultural": "culture-environment"
                       };
                       const categoryId = categoryMap[mainCategory.id];
                       router.push(`/tests?category=${categoryId}`);
                       setActiveMenu(null);
                     }}
                     onMouseEnter={() => {
                       setSelectedMainCategory(mainCategory.id);
                       // 각 대분류의 첫 번째 중분류와 소분류 자동 펼침 (T02처럼)
                       if (mainCategory.id === "personal") {
                         setSelectedSubcategory("성격 및 기질 탐색");
                       } else if (mainCategory.id === "social") {
                         setSelectedSubcategory("가족 관계");
                       } else if (mainCategory.id === "emotional") {
                         setSelectedSubcategory("우울 및 기분 문제");
                       } else if (mainCategory.id === "practical") {
                         setSelectedSubcategory("진로 및 직업 문제");
                       } else if (mainCategory.id === "cultural") {
                         setSelectedSubcategory("다문화 적응");
                       }
                     }}
                     onMouseLeave={() => {
                       // 마우스가 떠나도 선택된 상태 유지 (T02처럼 항상 펼쳐진 상태)
                     }}
                   >
                               <div className="flex items-center gap-3">
                                 <span className="text-xl">{mainCategory.icon}</span>
                                 <span className="font-medium">{mainCategory.name}</span>
                                 {/* 대분류 화살표 항상 표시 */}
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
                               {selectedMainCategory === "personal" && "개인 심리 및 성장"}
                               {selectedMainCategory === "social" && "대인관계 및 사회적응"}
                               {selectedMainCategory === "emotional" && "정서 문제 및 정신 건강"}
                               {selectedMainCategory === "practical" && "현실 문제 및 생활 관리"}
                               {selectedMainCategory === "cultural" && "문화 및 환경 적응"}
                             </div>
                             <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                              {selectedMainCategory === "personal" && [
                                { name: "성격 및 기질 탐색", description: "개인 성격 특성 분석", icon: "🧬", subcategories: [
                                  { name: "MBTI 성격 유형", href: "/tests/mbti", description: "16가지 성격 유형 분석" },
                                  { name: "빅5 성격 특성", href: "/tests/big5", description: "5대 성격 특성 분석" },
                                  { name: "기질 및 성향", href: "/tests/temperament", description: "선천적 기질 분석" }
                                ]},
                                { name: "자아정체감 및 가치관", description: "자아 인식 및 가치 체계", icon: "🎯", subcategories: [
                                  { name: "자아정체감", href: "/tests/self-identity", description: "자아 정체감 탐구" },
                                  { name: "가치관 및 신념", href: "/tests/values-beliefs", description: "개인 가치관 분석" },
                                  { name: "자존감 측정", href: "/tests/self-esteem", description: "자존감 수준 평가" }
                                ]},
                                { name: "잠재력 및 역량 개발", description: "개인 역량 및 성장 가능성", icon: "🚀", subcategories: [
                                  { name: "지능 및 능력", href: "/tests/intelligence", description: "다중지능 분석" },
                                  { name: "창의성 측정", href: "/tests/creativity", description: "창의적 사고 능력" },
                                  { name: "리더십 역량", href: "/tests/leadership", description: "리더십 특성 분석" }
                                ]},
                                { name: "삶의 의미 및 실존적 문제", description: "삶의 목적과 의미 탐구", icon: "🌟", subcategories: [
                                  { name: "삶의 목적", href: "/tests/life-purpose", description: "삶의 목적 탐구" },
                                  { name: "실존적 불안", href: "/tests/existential-anxiety", description: "실존적 고민 분석" },
                                  { name: "삶의 만족도", href: "/tests/life-satisfaction", description: "삶의 만족도 측정" }
                                ]}
                              ].map((item) => (
                                <div key={item.name} className="relative">
                                  <div
                                    className={`group flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 border-2 cursor-pointer shadow-md hover:shadow-lg ${
                                      selectedSubcategory === item.name 
                                        ? 'bg-blue-600 text-white border-blue-400 shadow-lg' 
                                        : 'bg-gradient-to-r from-blue-500/25 to-indigo-500/25 hover:bg-gradient-to-r hover:from-white/15 hover:to-white/8 border-blue-500/40 hover:border-white/30'
                                    }`}
                                    onMouseEnter={() => {
                                      setHoveredCategory(item.name);
                                      setSelectedSubcategory(item.name);
                                    }}
                                    onMouseLeave={() => {
                                      setHoveredCategory(null);
                                      // 마우스가 떠나도 선택된 상태 유지 (T02처럼 항상 펼쳐진 상태)
                                    }}
                                    onClick={() => {
                                      // 중분류 클릭 시 해당 중분류의 대시보드로 이동
                                      const categoryMap: { [key: string]: string } = {
                                        "성격 및 기질 탐색": "personality-temperament",
                                        "자아정체감 및 가치관": "identity-values",
                                        "잠재력 및 역량 개발": "potential-development",
                                        "삶의 의미 및 실존적 문제": "life-meaning"
                                      };
                                      const categoryId = categoryMap[item.name];
                                      if (categoryId) {
                                        router.push(`/tests/${categoryId}`);
                                        setActiveMenu(null);
                                      }
                                    }}
                                  >
                                     <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                       {item.icon}
                                     </div>
                                     <div className="flex-1 min-w-0">
                                       <div className="text-base font-medium text-white truncate">{item.name}</div>
                                     </div>
                                   </div>
                                   
                                   {/* 소분류 메뉴 */}
                                   {selectedSubcategory === item.name && item.subcategories && (
                                     <div className="mt-2 ml-4 space-y-1 animate-fadeIn-slow">
                                       {item.subcategories.map((subItem) => (
                 <Link
                                           key={subItem.name}
                                           href={subItem.href}
                                           className="group flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-300 border-2 border-blue-400/30 hover:border-blue-400 ml-8 shadow-sm hover:shadow-md"
                                   onClick={() => setActiveMenu(null)}
                                         >
                                           <div className="text-base group-hover:scale-110 transition-transform duration-300">
                                             📋
                                           </div>
                                           <div className="flex-1 min-w-0">
                                             <div className="text-sm font-medium text-blue-200 group-hover:text-white truncate">{subItem.name}</div>
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

                              {selectedMainCategory === "social" && [
                                { name: "가족 관계", description: "가족 내 관계 패턴 분석", icon: "👨‍👩‍👧‍👦", subcategories: [
                                  { name: "가족 역학", href: "/tests/family-dynamics", description: "가족 내 역할 분석" },
                                  { name: "부모-자녀 관계", href: "/tests/parent-child", description: "부모-자녀 관계 패턴" },
                                  { name: "형제자매 관계", href: "/tests/sibling-relations", description: "형제자매 관계 분석" }
                                ]},
                                { name: "연인 및 부부 관계", description: "로맨틱 관계 및 결혼 생활", icon: "💕", subcategories: [
                                  { name: "연애 스타일", href: "/tests/love-style", description: "연애 스타일 분석" },
                                  { name: "부부 관계", href: "/tests/marital-relations", description: "부부 관계 만족도" },
                                  { name: "이별 및 상실", href: "/tests/breakup-loss", description: "이별 후 회복 과정" }
                                ]},
                                { name: "친구 및 동료 관계", description: "사회적 관계 및 소통", icon: "👥", subcategories: [
                                  { name: "친구 관계", href: "/tests/friendship", description: "우정 관계 분석" },
                                  { name: "직장 내 관계", href: "/tests/workplace-relations", description: "직장 내 인간관계" },
                                  { name: "사회적 기술", href: "/tests/social-skills", description: "사회적 기술 평가" }
                                ]},
                                { name: "사회적 기술 및 소통", description: "대인관계 기술 및 소통 능력", icon: "💬", subcategories: [
                                  { name: "소통 스타일", href: "/tests/communication-style", description: "소통 방식 분석" },
                                  { name: "갈등 해결", href: "/tests/conflict-resolution", description: "갈등 해결 능력" },
                                  { name: "공감 능력", href: "/tests/empathy", description: "공감 능력 측정" }
                                ]}
                              ].map((item) => (
                                <div key={item.name} className="relative">
                                  <div
                                    className={`group flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 border-2 cursor-pointer shadow-md hover:shadow-lg ${
                                      selectedSubcategory === item.name 
                                        ? 'bg-blue-600 text-white border-blue-400 shadow-lg' 
                                        : 'bg-gradient-to-r from-blue-500/25 to-indigo-500/25 hover:bg-gradient-to-r hover:from-white/15 hover:to-white/8 border-blue-500/40 hover:border-white/30'
                                    }`}
                                    onMouseEnter={() => {
                                      setHoveredCategory(item.name);
                                      setSelectedSubcategory(item.name);
                                    }}
                                    onMouseLeave={() => {
                                      setHoveredCategory(null);
                                      // 마우스가 떠나도 선택된 상태 유지 (T02처럼 항상 펼쳐진 상태)
                                    }}
                                    onClick={() => {
                                      // 중분류 클릭 시 해당 중분류의 대시보드로 이동
                                      const categoryMap: { [key: string]: string } = {
                                        "가족 관계": "family-relations",
                                        "연인 및 부부 관계": "romantic-relations",
                                        "친구 및 동료 관계": "friend-colleague",
                                        "사회적 기술 및 소통": "social-communication"
                                      };
                                      const categoryId = categoryMap[item.name];
                                      if (categoryId) {
                                        router.push(`/tests/${categoryId}`);
                                        setActiveMenu(null);
                                      }
                                    }}
                                >
                                   <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                       {item.icon}
                                   </div>
                                   <div className="flex-1 min-w-0">
                                       <div className="text-base font-medium text-white truncate">{item.name}</div>
                                     </div>
                                   </div>
                                   
                                   {/* 소분류 메뉴 */}
                                   {selectedSubcategory === item.name && item.subcategories && (
                                     <div className="mt-2 ml-4 space-y-1 animate-fadeIn-slow">
                                       {item.subcategories.map((subItem) => (
                                         <Link
                                           key={subItem.name}
                                           href={subItem.href}
                                           className="group flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-300 border-2 border-blue-400/30 hover:border-blue-400 ml-8 shadow-sm hover:shadow-md"
                                           onClick={() => setActiveMenu(null)}
                                         >
                                           <div className="text-base group-hover:scale-110 transition-transform duration-300">
                                             📋
                                           </div>
                                           <div className="flex-1 min-w-0">
                                             <div className="text-sm font-medium text-blue-200 group-hover:text-white truncate">{subItem.name}</div>
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

                              {selectedMainCategory === "emotional" && [
                                { name: "우울 및 기분 문제", description: "우울감 및 기분 장애", icon: "😔", subcategories: [
                                  { name: "우울증 선별", href: "/tests/depression-screening", description: "우울증 위험도 평가" },
                                  { name: "기분 장애", href: "/tests/mood-disorders", description: "기분 장애 분석" },
                                  { name: "절망감 측정", href: "/tests/hopelessness", description: "절망감 수준 평가" }
                                ]},
                                { name: "불안 및 스트레스", description: "불안 증상 및 스트레스 관리", icon: "😰", subcategories: [
                                  { name: "불안 장애", href: "/tests/anxiety-disorders", description: "불안 장애 선별" },
                                  { name: "스트레스 수준", href: "/tests/stress-level", description: "스트레스 수준 측정" },
                                  { name: "공황 장애", href: "/tests/panic-disorder", description: "공황 장애 평가" }
                                ]},
                                { name: "외상 및 위기 개입", description: "트라우마 및 위기 상황", icon: "🆘", subcategories: [
                                  { name: "외상 후 스트레스", href: "/tests/ptsd", description: "PTSD 선별 검사" },
                                  { name: "위기 상황 대처", href: "/tests/crisis-coping", description: "위기 대처 능력" },
                                  { name: "회복력 측정", href: "/tests/resilience", description: "회복력 수준 평가" }
                                ]},
                                { name: "중독 및 충동 조절 문제", description: "중독성 행동 및 충동 조절", icon: "⚠️", subcategories: [
                                  { name: "알코올 중독", href: "/tests/alcohol-addiction", description: "알코올 중독 선별" },
                                  { name: "도박 중독", href: "/tests/gambling-addiction", description: "도박 중독 평가" },
                                  { name: "충동 조절", href: "/tests/impulse-control", description: "충동 조절 능력" }
                                ]},
                                { name: "자존감 및 자기 문제", description: "자존감 및 자기 인식", icon: "🪞", subcategories: [
                                  { name: "자존감 수준", href: "/tests/self-esteem-level", description: "자존감 수준 측정" },
                                  { name: "자기 효능감", href: "/tests/self-efficacy", description: "자기 효능감 평가" },
                                  { name: "완벽주의", href: "/tests/perfectionism", description: "완벽주의 성향" }
                                ]}
                              ].map((item) => (
                                <div key={item.name} className="relative">
                                  <div
                                    className={`group flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 border-2 cursor-pointer shadow-md hover:shadow-lg ${
                                      selectedSubcategory === item.name 
                                        ? 'bg-blue-600 text-white border-blue-400 shadow-lg' 
                                        : 'bg-gradient-to-r from-blue-500/25 to-indigo-500/25 hover:bg-gradient-to-r hover:from-white/15 hover:to-white/8 border-blue-500/40 hover:border-white/30'
                                    }`}
                                    onMouseEnter={() => {
                                      setHoveredCategory(item.name);
                                      setSelectedSubcategory(item.name);
                                    }}
                                    onMouseLeave={() => {
                                      setHoveredCategory(null);
                                      // 마우스가 떠나도 선택된 상태 유지 (T02처럼 항상 펼쳐진 상태)
                                    }}
                                    onClick={() => {
                                      // 중분류 클릭 시 해당 중분류의 대시보드로 이동
                                      const categoryMap: { [key: string]: string } = {
                                        "우울 및 기분 문제": "depression-mood",
                                        "불안 및 스트레스": "anxiety-stress",
                                        "외상 및 위기 개입": "trauma-crisis",
                                        "중독 및 충동 조절 문제": "addiction-impulse",
                                        "자존감 및 자기 문제": "self-esteem"
                                      };
                                      const categoryId = categoryMap[item.name];
                                      if (categoryId) {
                                        router.push(`/tests/${categoryId}`);
                                        setActiveMenu(null);
                                      }
                                    }}
                                  >
                                     <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                       {item.icon}
                       </div>
                                     <div className="flex-1 min-w-0">
                                       <div className="text-base font-medium text-white truncate">{item.name}</div>
                     </div>
                                   </div>
                                   
                                   {/* 소분류 메뉴 */}
                                   {selectedSubcategory === item.name && item.subcategories && (
                                     <div className="mt-2 ml-4 space-y-1 animate-fadeIn-slow">
                                       {item.subcategories.map((subItem) => (
                                         <Link
                                           key={subItem.name}
                                           href={subItem.href}
                                           className="group flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-300 border-2 border-blue-400/30 hover:border-blue-400 ml-8 shadow-sm hover:shadow-md"
                                           onClick={() => setActiveMenu(null)}
                                         >
                                           <div className="text-base group-hover:scale-110 transition-transform duration-300">
                                             📋
                                           </div>
                                           <div className="flex-1 min-w-0">
                                             <div className="text-sm font-medium text-blue-200 group-hover:text-white truncate">{subItem.name}</div>
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

                              {selectedMainCategory === "practical" && [
                                { name: "진로 및 직업 문제", description: "진로 선택 및 직업 적응", icon: "💼", subcategories: [
                                  { name: "진로 적성", href: "/tests/career-aptitude", description: "진로 적성 분석" },
                                  { name: "직업 만족도", href: "/tests/job-satisfaction", description: "직업 만족도 측정" },
                                  { name: "직장 스트레스", href: "/tests/workplace-stress", description: "직장 스트레스 평가" }
                                ]},
                                { name: "경제 및 재정 문제", description: "경제적 스트레스 및 관리", icon: "💰", subcategories: [
                                  { name: "재정 스트레스", href: "/tests/financial-stress", description: "재정 스트레스 측정" },
                                  { name: "소비 패턴", href: "/tests/spending-patterns", description: "소비 패턴 분석" },
                                  { name: "경제 불안", href: "/tests/economic-anxiety", description: "경제적 불안감" }
                                ]},
                                { name: "건강 및 신체 문제", description: "신체 건강 및 관리", icon: "🏥", subcategories: [
                                  { name: "건강 불안", href: "/tests/health-anxiety", description: "건강 불안 수준" },
                                  { name: "신체 이미지", href: "/tests/body-image", description: "신체 이미지 인식" },
                                  { name: "생활 습관", href: "/tests/lifestyle-habits", description: "건강한 생활 습관" }
                                ]},
                                { name: "법률 및 행정 문제", description: "법적 문제 및 행정 절차", icon: "⚖️", subcategories: [
                                  { name: "법적 스트레스", href: "/tests/legal-stress", description: "법적 문제 스트레스" },
                                  { name: "행정 절차", href: "/tests/administrative-procedures", description: "행정 절차 이해도" },
                                  { name: "권리 인식", href: "/tests/rights-awareness", description: "개인 권리 인식" }
                                ]},
                                { name: "일상생활 및 자기 관리", description: "일상 생활 관리 및 습관", icon: "📅", subcategories: [
                                  { name: "시간 관리", href: "/tests/time-management", description: "시간 관리 능력" },
                                  { name: "자기 관리", href: "/tests/self-care", description: "자기 관리 습관" },
                                  { name: "생활 만족도", href: "/tests/life-satisfaction", description: "일상생활 만족도" }
                                ]}
                              ].map((item) => (
                                <div key={item.name} className="relative">
                                  <div
                                    className={`group flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 border-2 cursor-pointer shadow-md hover:shadow-lg ${
                                      selectedSubcategory === item.name 
                                        ? 'bg-blue-600 text-white border-blue-400 shadow-lg' 
                                        : 'bg-gradient-to-r from-blue-500/25 to-indigo-500/25 hover:bg-gradient-to-r hover:from-white/15 hover:to-white/8 border-blue-500/40 hover:border-white/30'
                                    }`}
                                    onMouseEnter={() => {
                                      setHoveredCategory(item.name);
                                      setSelectedSubcategory(item.name);
                                    }}
                                    onMouseLeave={() => {
                                      setHoveredCategory(null);
                                      // 마우스가 떠나도 선택된 상태 유지 (T02처럼 항상 펼쳐진 상태)
                                    }}
                                    onClick={() => {
                                      // 중분류 클릭 시 해당 중분류의 대시보드로 이동
                                      const categoryMap: { [key: string]: string } = {
                                        "진로 및 직업 문제": "career-work",
                                        "경제 및 재정 문제": "economic-financial",
                                        "건강 및 신체 문제": "health-physical",
                                        "법률 및 행정 문제": "legal-administrative",
                                        "일상생활 및 자기 관리": "daily-life"
                                      };
                                      const categoryId = categoryMap[item.name];
                                      if (categoryId) {
                                        router.push(`/tests/${categoryId}`);
                                        setActiveMenu(null);
                                      }
                                    }}
                                  >
                                     <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                       {item.icon}
                                     </div>
                                     <div className="flex-1 min-w-0">
                                       <div className="text-base font-medium text-white truncate">{item.name}</div>
                                     </div>
                                   </div>
                                   
                                   {/* 소분류 메뉴 */}
                                   {selectedSubcategory === item.name && item.subcategories && (
                                     <div className="mt-2 ml-4 space-y-1 animate-fadeIn-slow">
                                       {item.subcategories.map((subItem) => (
                                         <Link
                                           key={subItem.name}
                                           href={subItem.href}
                                           className="group flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-300 border-2 border-blue-400/30 hover:border-blue-400 ml-8 shadow-sm hover:shadow-md"
                                           onClick={() => setActiveMenu(null)}
                                         >
                                           <div className="text-base group-hover:scale-110 transition-transform duration-300">
                                             📋
                                           </div>
                                           <div className="flex-1 min-w-0">
                                             <div className="text-sm font-medium text-blue-200 group-hover:text-white truncate">{subItem.name}</div>
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

                              {selectedMainCategory === "cultural" && [
                                { name: "다문화 적응", description: "다문화 환경 적응", icon: "🌍", subcategories: [
                                  { name: "문화 적응", href: "/tests/cultural-adaptation", description: "문화 적응 능력" },
                                  { name: "문화 충격", href: "/tests/culture-shock", description: "문화 충격 경험" },
                                  { name: "다양성 수용", href: "/tests/diversity-acceptance", description: "다양성 수용도" }
                                ]},
                                { name: "디지털 환경 적응", description: "디지털 시대 적응", icon: "💻", subcategories: [
                                  { name: "디지털 리터러시", href: "/tests/digital-literacy", description: "디지털 활용 능력" },
                                  { name: "온라인 관계", href: "/tests/online-relationships", description: "온라인 인간관계" },
                                  { name: "사이버 불안", href: "/tests/cyber-anxiety", description: "디지털 환경 불안" }
                                ]},
                                { name: "생애주기별 적응", description: "인생 단계별 적응", icon: "🔄", subcategories: [
                                  { name: "청소년기", href: "/tests/adolescence", description: "청소년기 적응" },
                                  { name: "성인기", href: "/tests/adulthood", description: "성인기 적응" },
                                  { name: "중년기", href: "/tests/middle-age", description: "중년기 적응" },
                                  { name: "노년기", href: "/tests/elderly", description: "노년기 적응" }
                                ]},
                                { name: "특정 사회·환경 문제", description: "사회 환경적 문제", icon: "🏘️", subcategories: [
                                  { name: "사회적 고립", href: "/tests/social-isolation", description: "사회적 고립감" },
                                  { name: "환경 스트레스", href: "/tests/environmental-stress", description: "환경적 스트레스" },
                                  { name: "사회적 지지", href: "/tests/social-support", description: "사회적 지지 체계" }
                                ]}
                              ].map((item) => (
                                <div key={item.name} className="relative">
                                  <div
                                    className={`group flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 border-2 cursor-pointer shadow-md hover:shadow-lg ${
                                      selectedSubcategory === item.name 
                                        ? 'bg-blue-600 text-white border-blue-400 shadow-lg' 
                                        : 'bg-gradient-to-r from-blue-500/25 to-indigo-500/25 hover:bg-gradient-to-r hover:from-white/15 hover:to-white/8 border-blue-500/40 hover:border-white/30'
                                    }`}
                                    onMouseEnter={() => {
                                      setHoveredCategory(item.name);
                                      setSelectedSubcategory(item.name);
                                    }}
                                    onMouseLeave={() => {
                                      setHoveredCategory(null);
                                      // 마우스가 떠나도 선택된 상태 유지 (T02처럼 항상 펼쳐진 상태)
                                    }}
                                    onClick={() => {
                                      // 중분류 클릭 시 해당 중분류의 대시보드로 이동
                                      const categoryMap: { [key: string]: string } = {
                                        "다문화 적응": "multicultural-adaptation",
                                        "디지털 환경 적응": "digital-adaptation",
                                        "생애주기별 적응": "lifecycle-adaptation",
                                        "특정 사회·환경 문제": "social-environment"
                                      };
                                      const categoryId = categoryMap[item.name];
                                      if (categoryId) {
                                        router.push(`/tests/${categoryId}`);
                                        setActiveMenu(null);
                                      }
                                    }}
                                  >
                                     <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                       {item.icon}
                                     </div>
                                     <div className="flex-1 min-w-0">
                                       <div className="text-base font-medium text-white truncate">{item.name}</div>
                                     </div>
                                   </div>
                                   
                                   {/* 소분류 메뉴 */}
                                   {selectedSubcategory === item.name && item.subcategories && (
                                     <div className="mt-2 ml-4 space-y-1 animate-fadeIn-slow">
                                       {item.subcategories.map((subItem) => (
                                         <Link
                                           key={subItem.name}
                                           href={subItem.href}
                                           className="group flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-300 border-2 border-blue-400/30 hover:border-blue-400 ml-8 shadow-sm hover:shadow-md"
                                           onClick={() => setActiveMenu(null)}
                                         >
                                           <div className="text-base group-hover:scale-110 transition-transform duration-300">
                                             📋
                                           </div>
                                           <div className="flex-1 min-w-0">
                                             <div className="text-sm font-medium text-blue-200 group-hover:text-white truncate">{subItem.name}</div>
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
                             <div className="text-center">
                               <div className="text-4xl mb-4">🧠</div>
                               <div className="text-lg font-medium">대분류를 선택해주세요</div>
                               <div className="text-sm mt-2">왼쪽에서 원하는 카테고리를 클릭하세요</div>
                             </div>
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

                       {/* 상단 화살표 가이드 */}
                       <div
                         className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none"
                         style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
                         ref={(el) => {
                           if (el) {
                             const checkScroll = () => {
                               const scrollableDiv = el.parentElement?.querySelector('.counseling-scrollable') as HTMLElement;
                               if (scrollableDiv) {
                                 const shouldShow = scrollableDiv.scrollTop > 0;
                                 el.style.opacity = shouldShow ? '1' : '0';
                               }
                             };
                             
                             const scrollableDiv = el.parentElement?.querySelector('.counseling-scrollable') as HTMLElement;
                             if (scrollableDiv) {
                               scrollableDiv.addEventListener('scroll', checkScroll);
                               checkScroll();
                               
                               return () => scrollableDiv.removeEventListener('scroll', checkScroll);
                             }
                           }
                         }}
                       >
                         <div className="bg-gradient-to-b from-purple-600/90 to-purple-800/90 text-white px-3 py-1 rounded-full shadow-lg border border-purple-400/50">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                           </svg>
                         </div>
                       </div>

                       {/* 하단 화살표 가이드 */}
                       <div
                         className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none"
                         style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
                         ref={(el) => {
                           if (el) {
                             const checkScroll = () => {
                               const scrollableDiv = el.parentElement?.querySelector('.counseling-scrollable') as HTMLElement;
                               if (scrollableDiv) {
                                 const shouldShow = scrollableDiv.scrollTop + scrollableDiv.clientHeight < scrollableDiv.scrollHeight;
                                 el.style.opacity = shouldShow ? '1' : '0';
                               }
                             };
                             
                             const scrollableDiv = el.parentElement?.querySelector('.counseling-scrollable') as HTMLElement;
                             if (scrollableDiv) {
                               scrollableDiv.addEventListener('scroll', checkScroll);
                               checkScroll();
                               
                               return () => scrollableDiv.removeEventListener('scroll', checkScroll);
                             }
                           }
                         }}
                       >
                         <div className="bg-gradient-to-b from-purple-600/90 to-purple-800/90 text-white px-3 py-1 rounded-full shadow-lg border border-purple-400/50">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                           </svg>
                         </div>
                       </div>

                       {/* 스크롤 가능한 콘텐츠 */}
                      <div 
                        ref={counselingScroll.scrollRef}
                        className="counseling-scrollable px-6 py-4 space-y-2 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-900"
                        onMouseMove={counselingScroll.handleMouseMove}
                        onMouseLeave={counselingScroll.handleMouseLeave}
                       onWheel={(e) => {
                         e.stopPropagation();
                         const target = e.currentTarget;
                         const scrollTop = target.scrollTop;
                         const scrollHeight = target.scrollHeight;
                         const clientHeight = target.clientHeight;
                         
                         if ((scrollTop === 0 && e.deltaY < 0) || 
                             (scrollTop + clientHeight >= scrollHeight && e.deltaY > 0)) {
                           e.preventDefault();
                         }
                       }}
                       style={{
                         overscrollBehavior: 'contain',
                         scrollbarGutter: 'stable'
                       }}
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

                     {/* AI 심리상담 시스템 */}
                     <Link
                       href="/ai-counseling-system"
                       className={`px-4 py-2.5 rounded-lg font-medium text-base transition-all duration-300 flex items-center whitespace-nowrap ${
                         activeItem === "/ai-counseling-system" || activeItem.startsWith("/ai-counseling-system/")
                           ? "text-white bg-purple-600"
                           : "text-gray-300 hover:text-white hover:bg-purple-800/50"
                       }`}
                       onClick={(e) => handleNavLinkClick("/ai-counseling-system", e)}
                       onMouseEnter={() => setActiveMenu('ai-counseling-system')}
                       onMouseLeave={() => setActiveMenu(null)}
                     >
                       🧠 AI 심리상담 시스템
                       <svg
                         xmlns="http://www.w3.org/2000/svg"
                         viewBox="0 0 20 20"
                         fill="currentColor"
                         className={`w-4 h-4 ml-1 transition-transform duration-200 ${isAiCounselingSystemOpen ? "rotate-180" : ""}`}
                       >
                         <path
                           fillRule="evenodd"
                           d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                           clipRule="evenodd"
                         />
                       </svg>
                     </Link>

                     {/* AI 심리상담 시스템 메가 메뉴 */}
                     {isAiCounselingSystemOpen && (
                       <div
                         data-dropdown-menu="ai-counseling-system"
                         className="absolute left-0 mt-0 pt-4 pb-8 w-96 min-w-[24rem] max-w-[28rem] bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-indigo-900/95 rounded-2xl shadow-2xl border border-purple-500/30 z-50 animate-fadeIn backdrop-blur-xl"
                         onMouseEnter={() => setActiveMenu('ai-counseling-system')}
                         onMouseLeave={() => setActiveMenu(null)}
                       >
                         <div className="relative">
                           {/* 스크롤 가능한 컨텐츠 */}
                           <div className="px-6 py-4 space-y-6 max-h-96 overflow-y-auto">
                             {aiCounselingSystemMenuData.map((category, categoryIndex) => (
                               <div key={category.category} className="space-y-3">
                                 <div className="flex items-center gap-2">
                                   <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                   <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider">
                                     {category.category}
                                   </h3>
                                 </div>
                                 <div className="space-y-2">
                                   {category.items.map((item, itemIndex) => (
                                     <Link
                                       key={item.name}
                                       href={item.href}
                                       className="group flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-xl hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-300 border border-transparent hover:border-white/20"
                                       onClick={() => setActiveMenu(null)}
                                     >
                                       <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                         {item.icon}
                                       </div>
                                       <div className="flex-1 min-w-0">
                                         <div className="font-medium text-white truncate">{item.name}</div>
                                         <div className="text-xs text-purple-300 truncate">{item.description}</div>
                                       </div>
                                       <svg 
                                         className="w-4 h-4 text-purple-300 group-hover:text-white group-hover:translate-x-1 transition-all duration-300"
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

                                   {/* AI 마음 비서 메가 메뉴 */}
                  {isAiMindAssistantOpen && (
                    <div
                      data-dropdown-menu="ai-mind-assistant"
                      className="absolute left-0 mt-0 pt-4 pb-8 w-96 min-w-[24rem] max-w-[28rem] bg-gradient-to-br from-slate-900/95 via-green-900/95 to-emerald-900/95 rounded-2xl shadow-2xl border border-green-500/30 z-50 animate-fadeIn backdrop-blur-xl"
                      onMouseEnter={() => setActiveMenu('ai-mind-assistant')}
                      onMouseLeave={() => setActiveMenu(null)}
                    >
                     <div className="relative">
                       {/* 상단 화살표 가이드 */}
                       <div
                         className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none"
                         style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
                         ref={(el) => {
                           if (el) {
                             const checkScroll = () => {
                               const scrollableDiv = el.parentElement?.querySelector('.ai-mind-scrollable') as HTMLElement;
                               if (scrollableDiv) {
                                 const shouldShow = scrollableDiv.scrollTop > 0;
                                 el.style.opacity = shouldShow ? '1' : '0';
                               }
                             };
                             
                             const scrollableDiv = el.parentElement?.querySelector('.ai-mind-scrollable') as HTMLElement;
                             if (scrollableDiv) {
                               scrollableDiv.addEventListener('scroll', checkScroll);
                               checkScroll();
                               
                               return () => scrollableDiv.removeEventListener('scroll', checkScroll);
                             }
                           }
                         }}
                       >
                         <div className="bg-gradient-to-b from-green-600/90 to-green-800/90 text-white px-3 py-1 rounded-full shadow-lg border border-green-400/50">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                           </svg>
               </div>
             </div>

                       {/* 하단 화살표 가이드 */}
                       <div
                         className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none"
                         style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
                         ref={(el) => {
                           if (el) {
                             const checkScroll = () => {
                               const scrollableDiv = el.parentElement?.querySelector('.ai-mind-scrollable') as HTMLElement;
                               if (scrollableDiv) {
                                 const shouldShow = scrollableDiv.scrollTop + scrollableDiv.clientHeight < scrollableDiv.scrollHeight;
                                 el.style.opacity = shouldShow ? '1' : '0';
                               }
                             };
                             
                             const scrollableDiv = el.parentElement?.querySelector('.ai-mind-scrollable') as HTMLElement;
                             if (scrollableDiv) {
                               scrollableDiv.addEventListener('scroll', checkScroll);
                               checkScroll();
                               
                               return () => scrollableDiv.removeEventListener('scroll', checkScroll);
                             }
                           }
                         }}
                       >
                         <div className="bg-gradient-to-b from-green-600/90 to-green-800/90 text-white px-3 py-1 rounded-full shadow-lg border border-green-400/50">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                           </svg>
           </div>
         </div>

                       {/* 스크롤 가능한 콘텐츠 */}
                       <div 
                         ref={aiAssistantScroll.scrollRef}
                         className="ai-mind-scrollable px-6 py-4 space-y-2 max-h-[70vh] overflow-y-auto auto-scroll-dropdown"
                         onMouseMove={aiAssistantScroll.handleMouseMove}
                         onMouseLeave={aiAssistantScroll.handleMouseLeave}
                         onWheel={(e) => {
                           e.stopPropagation();
                           const target = e.currentTarget;
                           const scrollTop = target.scrollTop;
                           const scrollHeight = target.scrollHeight;
                           const clientHeight = target.clientHeight;
                           
                           if ((scrollTop === 0 && e.deltaY < 0) || 
                               (scrollTop + clientHeight >= scrollHeight && e.deltaY > 0)) {
                             e.preventDefault();
                           }
                         }}
                         style={{
                           overscrollBehavior: 'contain',
                           scrollbarGutter: 'stable'
                         }}
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
                      onMouseLeave={() => setActiveMenu(null)}
                    >
                     <div className="relative">
                       {/* 상단 화살표 가이드 */}
                       <div
                         className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none"
                         style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
                         ref={(el) => {
                           if (el) {
                             const checkScroll = () => {
                               const scrollableDiv = el.parentElement?.querySelector('.user-scrollable') as HTMLElement;
                               if (scrollableDiv) {
                                 const shouldShow = scrollableDiv.scrollTop > 0;
                                 el.style.opacity = shouldShow ? '1' : '0';
                               }
                             };
                             
                             const scrollableDiv = el.parentElement?.querySelector('.user-scrollable') as HTMLElement;
                             if (scrollableDiv) {
                               scrollableDiv.addEventListener('scroll', checkScroll);
                               checkScroll();
                               
                               return () => scrollableDiv.removeEventListener('scroll', checkScroll);
                             }
                           }
                         }}
                       >
                         <div className="bg-gradient-to-b from-green-600/90 to-green-800/90 text-white px-3 py-1 rounded-full shadow-lg border border-green-400/50">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                           </svg>
              </div>
            </div>

                       {/* 하단 화살표 가이드 */}
                       <div
                         className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none"
                         style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
                         ref={(el) => {
                           if (el) {
                             const checkScroll = () => {
                               const scrollableDiv = el.parentElement?.querySelector('.user-scrollable') as HTMLElement;
                               if (scrollableDiv) {
                                 const shouldShow = scrollableDiv.scrollTop + scrollableDiv.clientHeight < scrollableDiv.scrollHeight;
                                 el.style.opacity = shouldShow ? '1' : '0';
                               }
                             };
                             
                             const scrollableDiv = el.parentElement?.querySelector('.user-scrollable') as HTMLElement;
                             if (scrollableDiv) {
                               scrollableDiv.addEventListener('scroll', checkScroll);
                               checkScroll();
                               
                               return () => scrollableDiv.removeEventListener('scroll', checkScroll);
                             }
                           }
                         }}
                       >
                         <div className="bg-gradient-to-b from-green-600/90 to-green-800/90 text-white px-3 py-1 rounded-full shadow-lg border border-green-400/50">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                           </svg>
                         </div>
                       </div>

                       {/* 스크롤 가능한 콘텐츠 */}
                     <div 
                       ref={userMenuScroll.scrollRef}
                       className="user-scrollable px-6 py-4 space-y-2 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-green-600 scrollbar-track-green-900"
                       onMouseMove={userMenuScroll.handleMouseMove}
                       onMouseLeave={userMenuScroll.handleMouseLeave}
                       onWheel={(e) => {
                         e.stopPropagation();
                         const target = e.currentTarget;
                         const scrollTop = target.scrollTop;
                         const scrollHeight = target.scrollHeight;
                         const clientHeight = target.clientHeight;
                         
                         if ((scrollTop === 0 && e.deltaY < 0) || 
                             (scrollTop + clientHeight >= scrollHeight && e.deltaY > 0)) {
                           e.preventDefault();
                         }
                       }}
                       style={{
                         overscrollBehavior: 'contain',
                         scrollbarGutter: 'stable'
                       }}
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
                             onMouseLeave={() => setActiveMenu(null)}
                           >
                             <div className="relative">
                               {/* 스크롤 가능한 콘텐츠 */}
                               <div className="px-6 py-4 space-y-2 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-900">
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
                             onMouseLeave={() => setActiveMenu(null)}
                           >
                             <div className="relative">
                               {/* 스크롤 가능한 콘텐츠 */}
                               <div className="px-6 py-4 space-y-2 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-900">
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
                             onMouseLeave={() => setActiveMenu(null)}
                           >
                           <div className="relative">
                             {/* 상단 화살표 가이드 */}
                             <div
                               className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none"
                               style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
                               ref={(el) => {
                                 if (el) {
                                   const checkScroll = () => {
                                     const scrollableDiv = el.parentElement?.querySelector('.mypage-scrollable') as HTMLElement;
                                     if (scrollableDiv) {
                                       const shouldShow = scrollableDiv.scrollTop > 0;
                                       el.style.opacity = shouldShow ? '1' : '0';
                                     }
                                   };
                                   
                                   const scrollableDiv = el.parentElement?.querySelector('.mypage-scrollable') as HTMLElement;
                                   if (scrollableDiv) {
                                     scrollableDiv.addEventListener('scroll', checkScroll);
                                     checkScroll();
                                     
                                     return () => scrollableDiv.removeEventListener('scroll', checkScroll);
                                   }
                                 }
                               }}
                             >
                               <div className="bg-gradient-to-b from-green-600/90 to-green-800/90 text-white px-3 py-1 rounded-full shadow-lg border border-green-400/50">
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                 </svg>
                          </div>
                            </div>

                             {/* 하단 화살표 가이드 */}
                             <div
                               className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none"
                               style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
                               ref={(el) => {
                                 if (el) {
                                   const checkScroll = () => {
                                     const scrollableDiv = el.parentElement?.querySelector('.mypage-scrollable') as HTMLElement;
                                     if (scrollableDiv) {
                                       const shouldShow = scrollableDiv.scrollTop + scrollableDiv.clientHeight < scrollableDiv.scrollHeight;
                                       el.style.opacity = shouldShow ? '1' : '0';
                                     }
                                   };
                                   
                                   const scrollableDiv = el.parentElement?.querySelector('.mypage-scrollable') as HTMLElement;
                                   if (scrollableDiv) {
                                     scrollableDiv.addEventListener('scroll', checkScroll);
                                     checkScroll();
                                     
                                     return () => scrollableDiv.removeEventListener('scroll', checkScroll);
                                   }
                                 }
                               }}
                             >
                               <div className="bg-gradient-to-b from-green-600/90 to-green-800/90 text-white px-3 py-1 rounded-full shadow-lg border border-green-400/50">
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                 </svg>
                               </div>
                             </div>

                             {/* 스크롤 가능한 콘텐츠 */}
                             <div 
                               className="mypage-scrollable px-6 py-4 space-y-2 max-h-[70vh] overflow-y-auto auto-scroll-dropdown"
                               onWheel={(e) => {
                                 e.stopPropagation();
                                 const target = e.currentTarget;
                                 const scrollTop = target.scrollTop;
                                 const scrollHeight = target.scrollHeight;
                                 const clientHeight = target.clientHeight;
                                 
                                 if ((scrollTop === 0 && e.deltaY < 0) || 
                                     (scrollTop + clientHeight >= scrollHeight && e.deltaY > 0)) {
                                   e.preventDefault();
                                 }
                               }}
                               onMouseMove={(e) => {
                                 const target = e.currentTarget;
                                 const rect = target.getBoundingClientRect();
                                 const mouseY = e.clientY - rect.top;
                                 const height = rect.height;
                                 
                                 // 상단 20% 영역에서 자동 스크롤 다운
                                 if (mouseY < height * 0.2) {
                                   target.scrollTo({
                                     top: target.scrollTop - 30,
                                     behavior: 'smooth'
                                   });
                                 }
                                 // 하단 20% 영역에서 자동 스크롤 업
                                 else if (mouseY > height * 0.8) {
                                   target.scrollTo({
                                     top: target.scrollTop + 30,
                                     behavior: 'smooth'
                                   });
                                 }
                               }}
                               style={{
                                 overscrollBehavior: 'contain',
                                 scrollbarGutter: 'stable'
                               }}
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
                   {[
                     { id: "personal", name: "개인 심리 및 성장", icon: "🧬" },
                     { id: "social", name: "대인관계 및 사회적응", icon: "👥" },
                     { id: "emotional", name: "정서 문제 및 정신 건강", icon: "💭" },
                     { id: "practical", name: "현실 문제 및 생활 관리", icon: "📋" },
                     { id: "cultural", name: "문화 및 환경 적응", icon: "🌍" }
                   ].map((mainCategory) => (
                     <div key={mainCategory.id} className="space-y-2">
                     {/* 대분류 */}
                       <div 
                         className={`flex items-center gap-2 px-3 py-2 text-sm font-bold text-blue-200 bg-blue-500/20 rounded-lg cursor-pointer transition-all duration-300 ${
                           selectedMainCategory === mainCategory.id ? 'bg-blue-600 text-white' : 'hover:bg-blue-500/30'
                         }`}
                         onClick={() => setSelectedMainCategory(selectedMainCategory === mainCategory.id ? null : mainCategory.id)}
                       >
                         <span className="text-lg">{mainCategory.icon}</span>
                         <span className="flex-1">{mainCategory.name}</span>
                         <svg 
                           className={`w-4 h-4 transition-transform duration-300 ${
                             selectedMainCategory === mainCategory.id ? 'rotate-90' : ''
                           }`}
                           fill="none" 
                           stroke="currentColor" 
                           viewBox="0 0 24 24"
                         >
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                         </svg>
                       </div>
                     
                       {/* 선택된 대분류의 중분류 */}
                       {selectedMainCategory === mainCategory.id && (
                         <div className="ml-4 space-y-2 animate-fadeIn">
                           {mainCategory.id === "personal" && [
                             { name: "성격 및 기질 탐색", description: "개인 성격 특성 분석", icon: "🧬", subcategories: [
                               { name: "MBTI 성격 유형", href: "/tests/mbti", description: "16가지 성격 유형 분석" },
                               { name: "빅5 성격 특성", href: "/tests/big5", description: "5대 성격 특성 분석" },
                               { name: "기질 및 성향", href: "/tests/temperament", description: "선천적 기질 분석" }
                             ]},
                             { name: "자아정체감 및 가치관", description: "자아 인식 및 가치 체계", icon: "🎯", subcategories: [
                               { name: "자아정체감", href: "/tests/self-identity", description: "자아 정체감 탐구" },
                               { name: "가치관 및 신념", href: "/tests/values-beliefs", description: "개인 가치관 분석" },
                               { name: "자존감 측정", href: "/tests/self-esteem", description: "자존감 수준 평가" }
                             ]},
                             { name: "잠재력 및 역량 개발", description: "개인 역량 및 성장 가능성", icon: "🚀", subcategories: [
                               { name: "지능 및 능력", href: "/tests/intelligence", description: "다중지능 분석" },
                               { name: "창의성 측정", href: "/tests/creativity", description: "창의적 사고 능력" },
                               { name: "리더십 역량", href: "/tests/leadership", description: "리더십 특성 분석" }
                             ]},
                             { name: "삶의 의미 및 실존적 문제", description: "삶의 목적과 의미 탐구", icon: "🌟", subcategories: [
                               { name: "삶의 목적", href: "/tests/life-purpose", description: "삶의 목적 탐구" },
                               { name: "실존적 불안", href: "/tests/existential-anxiety", description: "실존적 고민 분석" },
                               { name: "삶의 만족도", href: "/tests/life-satisfaction", description: "삶의 만족도 측정" }
                             ]}
                           ].map((item) => (
                             <div key={item.name} className="space-y-1">
                               <div 
                                 className={`flex items-center gap-2 px-2 py-1 text-base font-bold text-purple-300 bg-purple-500/20 rounded cursor-pointer transition-all duration-300 ${
                                   selectedSubcategory === item.name ? 'bg-purple-500/30' : 'hover:bg-purple-500/30'
                                 }`}
                                 onClick={() => {
                                  // 중분류 클릭 시 해당 중분류의 대시보드로 이동
                                  const categoryMap: { [key: string]: string } = {
                                    "성격 및 기질 탐색": "personal-growth",
                                    "자아정체감 및 가치관": "personal-growth",
                                    "잠재력 및 역량 개발": "personal-growth",
                                    "삶의 의미 및 실존적 문제": "personal-growth",
                                    "가족 관계": "relationships-social",
                                    "연인 및 부부 관계": "relationships-social",
                                    "친구 및 동료 관계": "relationships-social",
                                    "사회적 기술 및 소통": "relationships-social",
                                    "우울 및 기분 문제": "emotional-mental",
                                    "불안 및 스트레스": "emotional-mental",
                                    "외상 및 위기 개입": "emotional-mental",
                                    "중독 및 충동 조절 문제": "emotional-mental",
                                    "자존감 및 자기 문제": "emotional-mental",
                                    "진로 및 직업 문제": "reality-life",
                                    "경제 및 재정 문제": "reality-life",
                                    "건강 및 신체 문제": "reality-life",
                                    "법률 및 행정 문제": "reality-life",
                                    "일상생활 및 자기 관리": "reality-life",
                                    "다문화 적응": "culture-environment",
                                    "디지털 환경 적응": "culture-environment",
                                    "생애주기별 적응": "culture-environment",
                                    "특정 사회·환경 문제": "culture-environment"
                                  };
                                  const categoryId = categoryMap[item.name];
                                  if (categoryId) {
                                    router.push(`/tests?category=${categoryId}`);
                                    setActiveMenu(null);
                                  }
                                }}
                               >
                                 <span className="text-sm">{item.icon}</span>
                                 <span className="flex-1">{item.name}</span>
                                 <svg 
                                   className={`w-4 h-4 transition-transform duration-300 ${
                                     selectedSubcategory === item.name ? 'rotate-90' : ''
                                   }`}
                                   fill="none" 
                                   stroke="currentColor" 
                                   viewBox="0 0 24 24"
                                 >
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                 </svg>
                           </div>
                           
                               {selectedSubcategory === item.name && item.subcategories && (
                                 <div className="ml-4 space-y-1 animate-fadeIn-slow">
                                   {item.subcategories.map((subItem) => (
                             <Link
                                       key={subItem.name}
                                       href={subItem.href}
                                       className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-blue-800/30 rounded-lg transition-all duration-300"
                               onClick={() => setIsMobileMenuOpen(false)}
                             >
                               <div className="flex items-center gap-2">
                                         <span className="text-xs">📋</span>
                                         <span className="font-medium">{subItem.name}</span>
                                       </div>
                                     </Link>
                                   ))}
                                 </div>
                               )}
                             </div>
                           ))}

                           {mainCategory.id === "social" && [
                             { name: "가족 관계", description: "가족 내 관계 패턴 분석", icon: "👨‍👩‍👧‍👦", subcategories: [
                               { name: "가족 역학", href: "/tests/family-dynamics", description: "가족 내 역할 분석" },
                               { name: "부모-자녀 관계", href: "/tests/parent-child", description: "부모-자녀 관계 패턴" },
                               { name: "형제자매 관계", href: "/tests/sibling-relations", description: "형제자매 관계 분석" }
                             ]},
                             { name: "연인 및 부부 관계", description: "로맨틱 관계 및 결혼 생활", icon: "💕", subcategories: [
                               { name: "연애 스타일", href: "/tests/love-style", description: "연애 스타일 분석" },
                               { name: "부부 관계", href: "/tests/marital-relations", description: "부부 관계 만족도" },
                               { name: "이별 및 상실", href: "/tests/breakup-loss", description: "이별 후 회복 과정" }
                             ]},
                             { name: "친구 및 동료 관계", description: "사회적 관계 및 소통", icon: "👥", subcategories: [
                               { name: "친구 관계", href: "/tests/friendship", description: "우정 관계 분석" },
                               { name: "직장 내 관계", href: "/tests/workplace-relations", description: "직장 내 인간관계" },
                               { name: "사회적 기술", href: "/tests/social-skills", description: "사회적 기술 평가" }
                             ]},
                             { name: "사회적 기술 및 소통", description: "대인관계 기술 및 소통 능력", icon: "💬", subcategories: [
                               { name: "소통 스타일", href: "/tests/communication-style", description: "소통 방식 분석" },
                               { name: "갈등 해결", href: "/tests/conflict-resolution", description: "갈등 해결 능력" },
                               { name: "공감 능력", href: "/tests/empathy", description: "공감 능력 측정" }
                             ]}
                           ].map((item) => (
                             <div key={item.name} className="space-y-1">
                               <div 
                                 className={`flex items-center gap-2 px-2 py-1 text-base font-bold text-purple-300 bg-purple-500/20 rounded cursor-pointer transition-all duration-300 ${
                                   selectedSubcategory === item.name ? 'bg-purple-500/30' : 'hover:bg-purple-500/30'
                                 }`}
                                 onClick={() => {
                                  // 중분류 클릭 시 해당 중분류의 대시보드로 이동
                                  const categoryMap: { [key: string]: string } = {
                                    "성격 및 기질 탐색": "personal-growth",
                                    "자아정체감 및 가치관": "personal-growth",
                                    "잠재력 및 역량 개발": "personal-growth",
                                    "삶의 의미 및 실존적 문제": "personal-growth",
                                    "가족 관계": "relationships-social",
                                    "연인 및 부부 관계": "relationships-social",
                                    "친구 및 동료 관계": "relationships-social",
                                    "사회적 기술 및 소통": "relationships-social",
                                    "우울 및 기분 문제": "emotional-mental",
                                    "불안 및 스트레스": "emotional-mental",
                                    "외상 및 위기 개입": "emotional-mental",
                                    "중독 및 충동 조절 문제": "emotional-mental",
                                    "자존감 및 자기 문제": "emotional-mental",
                                    "진로 및 직업 문제": "reality-life",
                                    "경제 및 재정 문제": "reality-life",
                                    "건강 및 신체 문제": "reality-life",
                                    "법률 및 행정 문제": "reality-life",
                                    "일상생활 및 자기 관리": "reality-life",
                                    "다문화 적응": "culture-environment",
                                    "디지털 환경 적응": "culture-environment",
                                    "생애주기별 적응": "culture-environment",
                                    "특정 사회·환경 문제": "culture-environment"
                                  };
                                  const categoryId = categoryMap[item.name];
                                  if (categoryId) {
                                    router.push(`/tests?category=${categoryId}`);
                                    setActiveMenu(null);
                                  }
                                }}
                               >
                                   <span className="text-sm">{item.icon}</span>
                                 <span className="flex-1">{item.name}</span>
                                 <svg 
                                   className={`w-4 h-4 transition-transform duration-300 ${
                                     selectedSubcategory === item.name ? 'rotate-90' : ''
                                   }`}
                                   fill="none" 
                                   stroke="currentColor" 
                                   viewBox="0 0 24 24"
                                 >
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                 </svg>
                               </div>
                               
                               {selectedSubcategory === item.name && item.subcategories && (
                                 <div className="ml-4 space-y-1 animate-fadeIn-slow">
                                   {item.subcategories.map((subItem) => (
                                     <Link
                                       key={subItem.name}
                                       href={subItem.href}
                                       className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-blue-800/30 rounded-lg transition-all duration-300"
                                       onClick={() => setIsMobileMenuOpen(false)}
                                     >
                                       <div className="flex items-center gap-2">
                                         <span className="text-xs">📋</span>
                                         <span className="font-medium">{subItem.name}</span>
                                       </div>
                                     </Link>
                                   ))}
                                 </div>
                           )}
                               </div>
                           ))}

                           {mainCategory.id === "emotional" && [
                             { name: "우울 및 기분 문제", description: "우울감 및 기분 장애", icon: "😔", subcategories: [
                               { name: "우울증 선별", href: "/tests/depression-screening", description: "우울증 위험도 평가" },
                               { name: "기분 장애", href: "/tests/mood-disorders", description: "기분 장애 분석" },
                               { name: "절망감 측정", href: "/tests/hopelessness", description: "절망감 수준 평가" }
                             ]},
                             { name: "불안 및 스트레스", description: "불안 증상 및 스트레스 관리", icon: "😰", subcategories: [
                               { name: "불안 장애", href: "/tests/anxiety-disorders", description: "불안 장애 선별" },
                               { name: "스트레스 수준", href: "/tests/stress-level", description: "스트레스 수준 측정" },
                               { name: "공황 장애", href: "/tests/panic-disorder", description: "공황 장애 평가" }
                             ]},
                             { name: "외상 및 위기 개입", description: "트라우마 및 위기 상황", icon: "🆘", subcategories: [
                               { name: "외상 후 스트레스", href: "/tests/ptsd", description: "PTSD 선별 검사" },
                               { name: "위기 상황 대처", href: "/tests/crisis-coping", description: "위기 대처 능력" },
                               { name: "회복력 측정", href: "/tests/resilience", description: "회복력 수준 평가" }
                             ]},
                             { name: "중독 및 충동 조절 문제", description: "중독성 행동 및 충동 조절", icon: "⚠️", subcategories: [
                               { name: "알코올 중독", href: "/tests/alcohol-addiction", description: "알코올 중독 선별" },
                               { name: "도박 중독", href: "/tests/gambling-addiction", description: "도박 중독 평가" },
                               { name: "충동 조절", href: "/tests/impulse-control", description: "충동 조절 능력" }
                             ]},
                             { name: "자존감 및 자기 문제", description: "자존감 및 자기 인식", icon: "🪞", subcategories: [
                               { name: "자존감 수준", href: "/tests/self-esteem-level", description: "자존감 수준 측정" },
                               { name: "자기 효능감", href: "/tests/self-efficacy", description: "자기 효능감 평가" },
                               { name: "완벽주의", href: "/tests/perfectionism", description: "완벽주의 성향" }
                             ]}
                           ].map((item) => (
                             <div key={item.name} className="space-y-1">
                               <div 
                                 className={`flex items-center gap-2 px-2 py-1 text-base font-bold text-purple-300 bg-purple-500/20 rounded cursor-pointer transition-all duration-300 ${
                                   selectedSubcategory === item.name ? 'bg-purple-500/30' : 'hover:bg-purple-500/30'
                                 }`}
                                 onClick={() => {
                                  // 중분류 클릭 시 해당 중분류의 대시보드로 이동
                                  const categoryMap: { [key: string]: string } = {
                                    "성격 및 기질 탐색": "personal-growth",
                                    "자아정체감 및 가치관": "personal-growth",
                                    "잠재력 및 역량 개발": "personal-growth",
                                    "삶의 의미 및 실존적 문제": "personal-growth",
                                    "가족 관계": "relationships-social",
                                    "연인 및 부부 관계": "relationships-social",
                                    "친구 및 동료 관계": "relationships-social",
                                    "사회적 기술 및 소통": "relationships-social",
                                    "우울 및 기분 문제": "emotional-mental",
                                    "불안 및 스트레스": "emotional-mental",
                                    "외상 및 위기 개입": "emotional-mental",
                                    "중독 및 충동 조절 문제": "emotional-mental",
                                    "자존감 및 자기 문제": "emotional-mental",
                                    "진로 및 직업 문제": "reality-life",
                                    "경제 및 재정 문제": "reality-life",
                                    "건강 및 신체 문제": "reality-life",
                                    "법률 및 행정 문제": "reality-life",
                                    "일상생활 및 자기 관리": "reality-life",
                                    "다문화 적응": "culture-environment",
                                    "디지털 환경 적응": "culture-environment",
                                    "생애주기별 적응": "culture-environment",
                                    "특정 사회·환경 문제": "culture-environment"
                                  };
                                  const categoryId = categoryMap[item.name];
                                  if (categoryId) {
                                    router.push(`/tests?category=${categoryId}`);
                                    setActiveMenu(null);
                                  }
                                }}
                               >
                                 <span className="text-sm">{item.icon}</span>
                                 <span className="flex-1">{item.name}</span>
                                 <svg 
                                   className={`w-4 h-4 transition-transform duration-300 ${
                                     selectedSubcategory === item.name ? 'rotate-90' : ''
                                   }`}
                                   fill="none" 
                                   stroke="currentColor" 
                                   viewBox="0 0 24 24"
                                 >
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                 </svg>
                               </div>
                               
                               {selectedSubcategory === item.name && item.subcategories && (
                                 <div className="ml-4 space-y-1 animate-fadeIn-slow">
                                   {item.subcategories.map((subItem) => (
                                     <Link
                                       key={subItem.name}
                                       href={subItem.href}
                                       className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-blue-800/30 rounded-lg transition-all duration-300"
                                       onClick={() => setIsMobileMenuOpen(false)}
                                     >
                                       <div className="flex items-center gap-2">
                                         <span className="text-xs">📋</span>
                                         <span className="font-medium">{subItem.name}</span>
                                       </div>
                             </Link>
                           ))}
                         </div>
                               )}
                     </div>
                   ))}

                           {mainCategory.id === "practical" && [
                             { name: "진로 및 직업 문제", description: "진로 선택 및 직업 적응", icon: "💼", subcategories: [
                               { name: "진로 적성", href: "/tests/career-aptitude", description: "진로 적성 분석" },
                               { name: "직업 만족도", href: "/tests/job-satisfaction", description: "직업 만족도 측정" },
                               { name: "직장 스트레스", href: "/tests/workplace-stress", description: "직장 스트레스 평가" }
                             ]},
                             { name: "경제 및 재정 문제", description: "경제적 스트레스 및 관리", icon: "💰", subcategories: [
                               { name: "재정 스트레스", href: "/tests/financial-stress", description: "재정 스트레스 측정" },
                               { name: "소비 패턴", href: "/tests/spending-patterns", description: "소비 패턴 분석" },
                               { name: "경제 불안", href: "/tests/economic-anxiety", description: "경제적 불안감" }
                             ]},
                             { name: "건강 및 신체 문제", description: "신체 건강 및 관리", icon: "🏥", subcategories: [
                               { name: "건강 불안", href: "/tests/health-anxiety", description: "건강 불안 수준" },
                               { name: "신체 이미지", href: "/tests/body-image", description: "신체 이미지 인식" },
                               { name: "생활 습관", href: "/tests/lifestyle-habits", description: "건강한 생활 습관" }
                             ]},
                             { name: "법률 및 행정 문제", description: "법적 문제 및 행정 절차", icon: "⚖️", subcategories: [
                               { name: "법적 스트레스", href: "/tests/legal-stress", description: "법적 문제 스트레스" },
                               { name: "행정 절차", href: "/tests/administrative-procedures", description: "행정 절차 이해도" },
                               { name: "권리 인식", href: "/tests/rights-awareness", description: "개인 권리 인식" }
                             ]},
                             { name: "일상생활 및 자기 관리", description: "일상 생활 관리 및 습관", icon: "📅", subcategories: [
                               { name: "시간 관리", href: "/tests/time-management", description: "시간 관리 능력" },
                               { name: "자기 관리", href: "/tests/self-care", description: "자기 관리 습관" },
                               { name: "생활 만족도", href: "/tests/life-satisfaction", description: "일상생활 만족도" }
                             ]}
                           ].map((item) => (
                             <div key={item.name} className="space-y-1">
                               <div 
                                 className={`flex items-center gap-2 px-2 py-1 text-base font-bold text-purple-300 bg-purple-500/20 rounded cursor-pointer transition-all duration-300 ${
                                   selectedSubcategory === item.name ? 'bg-purple-500/30' : 'hover:bg-purple-500/30'
                                 }`}
                                 onClick={() => {
                                  // 중분류 클릭 시 해당 중분류의 대시보드로 이동
                                  const categoryMap: { [key: string]: string } = {
                                    "성격 및 기질 탐색": "personal-growth",
                                    "자아정체감 및 가치관": "personal-growth",
                                    "잠재력 및 역량 개발": "personal-growth",
                                    "삶의 의미 및 실존적 문제": "personal-growth",
                                    "가족 관계": "relationships-social",
                                    "연인 및 부부 관계": "relationships-social",
                                    "친구 및 동료 관계": "relationships-social",
                                    "사회적 기술 및 소통": "relationships-social",
                                    "우울 및 기분 문제": "emotional-mental",
                                    "불안 및 스트레스": "emotional-mental",
                                    "외상 및 위기 개입": "emotional-mental",
                                    "중독 및 충동 조절 문제": "emotional-mental",
                                    "자존감 및 자기 문제": "emotional-mental",
                                    "진로 및 직업 문제": "reality-life",
                                    "경제 및 재정 문제": "reality-life",
                                    "건강 및 신체 문제": "reality-life",
                                    "법률 및 행정 문제": "reality-life",
                                    "일상생활 및 자기 관리": "reality-life",
                                    "다문화 적응": "culture-environment",
                                    "디지털 환경 적응": "culture-environment",
                                    "생애주기별 적응": "culture-environment",
                                    "특정 사회·환경 문제": "culture-environment"
                                  };
                                  const categoryId = categoryMap[item.name];
                                  if (categoryId) {
                                    router.push(`/tests?category=${categoryId}`);
                                    setActiveMenu(null);
                                  }
                                }}
                               >
                                 <span className="text-sm">{item.icon}</span>
                                 <span className="flex-1">{item.name}</span>
                                 <svg 
                                   className={`w-4 h-4 transition-transform duration-300 ${
                                     selectedSubcategory === item.name ? 'rotate-90' : ''
                                   }`}
                                   fill="none" 
                                   stroke="currentColor" 
                                   viewBox="0 0 24 24"
                                 >
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                 </svg>
                 </div>
                               
                               {selectedSubcategory === item.name && item.subcategories && (
                                 <div className="ml-4 space-y-1 animate-fadeIn-slow">
                                   {item.subcategories.map((subItem) => (
                                     <Link
                                       key={subItem.name}
                                       href={subItem.href}
                                       className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-blue-800/30 rounded-lg transition-all duration-300"
                                       onClick={() => setIsMobileMenuOpen(false)}
                                     >
                                       <div className="flex items-center gap-2">
                                         <span className="text-xs">📋</span>
                                         <span className="font-medium">{subItem.name}</span>
                   </div>
                                     </Link>
                                   ))}
                                 </div>
                               )}
                             </div>
                           ))}

                           {mainCategory.id === "cultural" && [
                             { name: "다문화 적응", description: "다문화 환경 적응", icon: "🌍", subcategories: [
                               { name: "문화 적응", href: "/tests/cultural-adaptation", description: "문화 적응 능력" },
                               { name: "문화 충격", href: "/tests/culture-shock", description: "문화 충격 경험" },
                               { name: "다양성 수용", href: "/tests/diversity-acceptance", description: "다양성 수용도" }
                             ]},
                             { name: "디지털 환경 적응", description: "디지털 시대 적응", icon: "💻", subcategories: [
                               { name: "디지털 리터러시", href: "/tests/digital-literacy", description: "디지털 활용 능력" },
                               { name: "온라인 관계", href: "/tests/online-relationships", description: "온라인 인간관계" },
                               { name: "사이버 불안", href: "/tests/cyber-anxiety", description: "디지털 환경 불안" }
                             ]},
                             { name: "생애주기별 적응", description: "인생 단계별 적응", icon: "🔄", subcategories: [
                               { name: "청소년기", href: "/tests/adolescence", description: "청소년기 적응" },
                               { name: "성인기", href: "/tests/adulthood", description: "성인기 적응" },
                               { name: "중년기", href: "/tests/middle-age", description: "중년기 적응" },
                               { name: "노년기", href: "/tests/elderly", description: "노년기 적응" }
                             ]},
                             { name: "특정 사회·환경 문제", description: "사회 환경적 문제", icon: "🏘️", subcategories: [
                               { name: "사회적 고립", href: "/tests/social-isolation", description: "사회적 고립감" },
                               { name: "환경 스트레스", href: "/tests/environmental-stress", description: "환경적 스트레스" },
                               { name: "사회적 지지", href: "/tests/social-support", description: "사회적 지지 체계" }
                             ]}
                           ].map((item) => (
                             <div key={item.name} className="space-y-1">
                               <div 
                                 className={`flex items-center gap-2 px-2 py-1 text-base font-bold text-purple-300 bg-purple-500/20 rounded cursor-pointer transition-all duration-300 ${
                                   selectedSubcategory === item.name ? 'bg-purple-500/30' : 'hover:bg-purple-500/30'
                                 }`}
                                 onClick={() => {
                                  // 중분류 클릭 시 해당 중분류의 대시보드로 이동
                                  const categoryMap: { [key: string]: string } = {
                                    "성격 및 기질 탐색": "personal-growth",
                                    "자아정체감 및 가치관": "personal-growth",
                                    "잠재력 및 역량 개발": "personal-growth",
                                    "삶의 의미 및 실존적 문제": "personal-growth",
                                    "가족 관계": "relationships-social",
                                    "연인 및 부부 관계": "relationships-social",
                                    "친구 및 동료 관계": "relationships-social",
                                    "사회적 기술 및 소통": "relationships-social",
                                    "우울 및 기분 문제": "emotional-mental",
                                    "불안 및 스트레스": "emotional-mental",
                                    "외상 및 위기 개입": "emotional-mental",
                                    "중독 및 충동 조절 문제": "emotional-mental",
                                    "자존감 및 자기 문제": "emotional-mental",
                                    "진로 및 직업 문제": "reality-life",
                                    "경제 및 재정 문제": "reality-life",
                                    "건강 및 신체 문제": "reality-life",
                                    "법률 및 행정 문제": "reality-life",
                                    "일상생활 및 자기 관리": "reality-life",
                                    "다문화 적응": "culture-environment",
                                    "디지털 환경 적응": "culture-environment",
                                    "생애주기별 적응": "culture-environment",
                                    "특정 사회·환경 문제": "culture-environment"
                                  };
                                  const categoryId = categoryMap[item.name];
                                  if (categoryId) {
                                    router.push(`/tests?category=${categoryId}`);
                                    setActiveMenu(null);
                                  }
                                }}
                               >
                                 <span className="text-sm">{item.icon}</span>
                                 <span className="flex-1">{item.name}</span>
                                 <svg 
                                   className={`w-4 h-4 transition-transform duration-300 ${
                                     selectedSubcategory === item.name ? 'rotate-90' : ''
                                   }`}
                                   fill="none" 
                                   stroke="currentColor" 
                                   viewBox="0 0 24 24"
                                 >
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                 </svg>
                               </div>
                               
                               {selectedSubcategory === item.name && item.subcategories && (
                                 <div className="ml-4 space-y-1 animate-fadeIn-slow">
                                   {item.subcategories.map((subItem) => (
                                     <Link
                                       key={subItem.name}
                                       href={subItem.href}
                                       className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-blue-800/30 rounded-lg transition-all duration-300"
                                       onClick={() => setIsMobileMenuOpen(false)}
                                     >
                                       <div className="flex items-center gap-2">
                                         <span className="text-xs">📋</span>
                                         <span className="font-medium">{subItem.name}</span>
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

               {/* AI 심리상담 시스템 */}
               <div className="space-y-2">
                 <div className="px-4 py-2 text-sm font-semibold text-purple-300 uppercase tracking-wide">
                   🧠 AI 심리상담 시스템
                 </div>
                 {aiCounselingSystemMenuData.map((category) => (
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
                         </div>
                         <div className="text-xs text-purple-300 mt-1 ml-6">
                           {item.description}
                         </div>
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
     </>
   );
 }
