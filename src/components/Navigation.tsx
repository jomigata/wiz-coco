"use client";
import React from "react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { removeItem } from '@/utils/localStorageManager';
import { shouldShowCounselorMenu, shouldShowAdminMenu } from '@/utils/roleUtils';
import { testSubMenuItems } from '@/data/psychologyTestMenu';

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
  
  const isDropdownOpen = activeMenu === 'user';
  const isCounselingDropdownOpen = activeMenu === 'counseling';
  const isUserMenuOpen = activeMenu === 'additional';
  const isAiMindAssistantOpen = activeMenu === 'ai-mind-assistant';
  const isPsychologyTestsOpen = activeMenu === 'psychology-tests';
  const isCounselorOpen = activeMenu === 'counselor';
  const isAdminOpen = activeMenu === 'admin';

  const isLoggedIn = !!user && !loading;
  const userEmail = user?.email || "";
  const userName = user?.displayName || "";

  // 기본 useEffect들
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      setActiveItem(path);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNavLinkClick = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveItem(path);
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      removeItem('userRole');
      removeItem('userEmail');
      router.push('/');
    } catch (error) {
      console.error('로그아웃 오류:', error);
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
                       // 각 대분류의 첫 번째 중분류와 소분류 자동 펼침
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
                       // 마우스가 떠나도 선택된 상태 유지
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
                              {testSubMenuItems
                                .filter(category => {
                                  const categoryMap: { [key: string]: string } = {
                                    "personal": "개인 심리 및 성장",
                                    "social": "대인관계 및 사회적응", 
                                    "emotional": "정서 문제 및 정신 건강",
                                    "practical": "현실 문제 및 생활 관리",
                                    "cultural": "문화 및 환경 적응"
                                  };
                                  return category.category === categoryMap[selectedMainCategory];
                                })
                                .flatMap(category => category.subcategories)
                                .map((item) => (
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
                                      // 마우스가 떠나도 선택된 상태 유지
                                    }}
                                    onClick={() => {
                                      // 중분류 클릭 시 해당 중분류의 대시보드로 이동
                                      const categoryMap: { [key: string]: string } = {
                                        "성격 및 기질 탐색": "personality-temperament",
                                        "자아정체감 및 가치관": "identity-values",
                                        "잠재력 및 역량 개발": "potential-development",
                                        "삶의 의미 및 실존적 문제": "life-meaning",
                                        "가족 관계": "family-relations",
                                        "연인 및 부부 관계": "romantic-relations",
                                        "친구 및 동료 관계": "friend-colleague",
                                        "사회적 기술 및 소통": "social-communication",
                                        "우울 및 기분 문제": "depression-mood",
                                        "불안 및 스트레스": "anxiety-stress",
                                        "외상 및 위기 개입": "trauma-crisis",
                                        "중독 및 충동 조절 문제": "addiction-impulse",
                                        "진로 및 직업 문제": "career-work",
                                        "경제 및 재정 문제": "economic-financial",
                                        "건강 및 신체 문제": "health-physical",
                                        "일상생활 및 자기 관리": "daily-life",
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
                                   {selectedSubcategory === item.name && item.items && (
                                     <div className="mt-2 ml-4 space-y-1 animate-fadeIn-slow">
                                       {item.items.map((subItem) => (
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
               
               {/* 기타 메뉴들... */}
               <Link
                 href="/about"
                 className={`px-4 py-2.5 rounded-lg font-medium text-base transition-all duration-300 whitespace-nowrap ${
                   activeItem === "/about" ? "text-white bg-blue-600" : "text-gray-300 hover:text-white hover:bg-blue-800/50"
                 }`}
                 onClick={(e) => handleNavLinkClick("/about", e)}
               >
                 ℹ️ 소개
               </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:text-blue-300 transition-colors duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-indigo-900 border-t border-white">
            <div className="px-6 py-4 space-y-2">
              <Link
                href="/tests"
                className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50 rounded-lg transition-all duration-300"
                onClick={(e) => handleNavLinkClick("/tests", e)}
              >
                🧠 AI 심리검사
              </Link>
              <Link
                href="/about"
                className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-800/50 rounded-lg transition-all duration-300"
                onClick={(e) => handleNavLinkClick("/about", e)}
              >
                ℹ️ 소개
              </Link>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
