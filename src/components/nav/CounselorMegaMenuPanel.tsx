'use client';

import Link from 'next/link';
import type { RefObject } from 'react';
import type { TestCategory, TestMenuItem, TestSubcategory } from '@/data/psychologyTestMenu';
import { COUNSELOR_AI_TESTS_CATEGORY } from '@/data/counselorMenu';

type CounselorMegaMenuPanelProps = {
  panelRef: RefObject<HTMLDivElement | null>;
  leftColRef: RefObject<HTMLDivElement | null>;
  midColRef: RefObject<HTMLDivElement | null>;
  subColRef: RefObject<HTMLDivElement | null>;
  dropdownAlign: string;
  panelTitle: string;
  counselorCategories: TestCategory[];
  psychologyCategories: TestCategory[];
  selectedCounselorCategory: string | null;
  selectedPsychMainCategory: string | null;
  selectedPsychSubcategory: string | null;
  selectedCounselorSubcategory: string | null;
  isMenuOpen: boolean;
  onSelectCounselorCategory: (category: string) => void;
  onSelectCounselorSubcategory: (name: string) => void;
  onSelectPsychMainCategory: (category: string) => void;
  onSelectPsychSubcategory: (name: string) => void;
  onHoverPsychSubcategory?: (name: string) => void;
  onCounselorMainClick?: (category: TestCategory) => void;
  onPsychMainClick?: (category: TestCategory) => void;
  onPsychSubcategoryClick?: (subcategory: TestSubcategory) => void;
  onCounselorSubcategoryClick?: (subcategory: TestSubcategory) => void;
  navigateTo?: (href: string) => void;
  onCloseMenu: () => void;
  onPanelMouseEnter: () => void;
  onPanelMouseLeave: () => void;
  searchSlot?: React.ReactNode;
};

function badgeClass(badge: string) {
  if (badge === '24시간' || badge === '긴급') return 'bg-red-500 text-white';
  if (badge === '신규') return 'bg-green-500 text-white';
  return 'bg-orange-500 text-white';
}

function LeafItem({
  item,
  highlightBorder,
  onCloseMenu,
}: {
  item: TestMenuItem;
  highlightBorder: boolean;
  onCloseMenu: () => void;
}) {
  return (
    <Link
      href={item.href}
      className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 border-2 ml-8 shadow-sm hover:shadow-md ${
        highlightBorder ? 'border-white' : 'border-white/20 hover:border-white'
      }`}
      onClick={onCloseMenu}
    >
      <div className="w-6 shrink-0 flex items-center justify-center text-base group-hover:scale-110 transition-transform duration-300">
        {item.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-blue-200 group-hover:text-white truncate">{item.name}</div>
          {item.badge && (
            <span className={`px-2 py-0.5 text-xs font-bold rounded-full shrink-0 ${badgeClass(item.badge)}`}>
              {item.badge}
            </span>
          )}
        </div>
        <div className="text-xs text-blue-300 group-hover:text-blue-100 truncate">{item.description}</div>
      </div>
      <svg
        className="w-3 h-3 text-blue-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

export default function CounselorMegaMenuPanel({
  panelRef,
  leftColRef,
  midColRef,
  subColRef,
  dropdownAlign,
  panelTitle,
  counselorCategories,
  psychologyCategories,
  selectedCounselorCategory,
  selectedPsychMainCategory,
  selectedPsychSubcategory,
  selectedCounselorSubcategory,
  isMenuOpen,
  onSelectCounselorCategory,
  onSelectCounselorSubcategory,
  onSelectPsychMainCategory,
  onSelectPsychSubcategory,
  onHoverPsychSubcategory,
  onCounselorMainClick,
  onPsychMainClick,
  onPsychSubcategoryClick,
  onCounselorSubcategoryClick,
  navigateTo,
  onCloseMenu,
  onPanelMouseEnter,
  onPanelMouseLeave,
  searchSlot,
}: CounselorMegaMenuPanelProps) {
  const activeCounselor =
    counselorCategories.find((category) => category.category === selectedCounselorCategory) ??
    counselorCategories[0];

  const isAiTestsSelected = activeCounselor?.category === COUNSELOR_AI_TESTS_CATEGORY;

  const activePsychMain =
    psychologyCategories.find((category) => category.category === selectedPsychMainCategory) ??
    psychologyCategories[0];

  const handleCounselorSubcategoryClick = (subcategory: TestSubcategory) => {
    if (onCounselorSubcategoryClick) {
      onCounselorSubcategoryClick(subcategory);
      return;
    }
    const href = subcategory.items[0]?.href;
    if (href && navigateTo) {
      navigateTo(href);
      onCloseMenu();
    }
  };

  const handlePsychSubcategoryClick = (subcategory: TestSubcategory) => {
    if (onPsychSubcategoryClick) {
      onPsychSubcategoryClick(subcategory);
      return;
    }
    const href = subcategory.items[0]?.href;
    if (href && navigateTo) {
      navigateTo(href);
      onCloseMenu();
    }
  };

  return (
    <div
      ref={panelRef}
      data-dropdown-menu="counselor"
      className={`absolute top-full mt-0 pt-4 pb-8 w-auto ${
        isAiTestsSelected ? 'min-w-[72rem] max-w-[80rem]' : 'min-w-[48rem] max-w-[56rem]'
      } bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-indigo-900/95 rounded-2xl shadow-2xl border border-blue-500/30 z-50 animate-fadeIn backdrop-blur-xl ${dropdownAlign}`}
      onMouseEnter={onPanelMouseEnter}
      onMouseLeave={onPanelMouseLeave}
    >
      {searchSlot && isAiTestsSelected && (
        <div className="px-4 pt-2 pb-3 border-b border-blue-500/20">{searchSlot}</div>
      )}
      <div className="relative flex flex-row h-[62vh]">
        <div
          ref={leftColRef}
          className="w-80 min-w-[20rem] max-w-[22rem] px-5 py-4 border-r border-blue-500/30 shrink-0"
        >
          <div className="text-lg font-bold text-blue-300 mb-4">{panelTitle}</div>
          <div className="space-y-2">
            {counselorCategories.map((mainCategory, index) => (
              <div
                key={mainCategory.category}
                className={`p-4 rounded-lg cursor-pointer transition-all duration-300 border-2 ${
                  selectedCounselorCategory === mainCategory.category ||
                  (index === 0 && isMenuOpen && !selectedCounselorCategory)
                    ? 'text-white border-white shadow-lg'
                    : 'text-blue-300 border-white/20 hover:text-white hover:border-white hover:shadow-md'
                }`}
                onClick={() => {
                  onSelectCounselorCategory(mainCategory.category);
                  onCounselorMainClick?.(mainCategory);
                }}
                onMouseEnter={() => {
                  onSelectCounselorCategory(mainCategory.category);
                  if (mainCategory.category !== COUNSELOR_AI_TESTS_CATEGORY && mainCategory.subcategories.length > 0) {
                    onSelectCounselorSubcategory(mainCategory.subcategories[0].name);
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 shrink-0 flex items-center justify-center text-xl">{mainCategory.icon}</span>
                  <span className="font-medium">{mainCategory.category}</span>
                  <svg className="w-4 h-4 text-white ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>

        {isAiTestsSelected ? (
          <>
            <div
              ref={midColRef}
              className="w-80 min-w-[20rem] max-w-[22rem] px-5 py-4 border-r border-blue-500/30 shrink-0"
            >
              <div className="mb-1 text-lg font-bold text-blue-300">🧠 AI 심리검사</div>
              <p className="mb-4 text-xs text-blue-200/80">
                소분류에 마우스를 올리면 세부 검사가 표시됩니다
              </p>
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-sky-400">중분류</div>
              <div className="space-y-2 max-h-[52vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-900">
                {psychologyCategories.map((psychCategory, index) => (
                  <div
                    key={psychCategory.category}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-300 border-2 ${
                      selectedPsychMainCategory === psychCategory.category ||
                      (index === 0 && !selectedPsychMainCategory)
                        ? 'text-white border-white shadow-lg'
                        : 'text-blue-300 border-white/20 hover:text-white hover:border-white hover:shadow-md'
                    }`}
                    onClick={() => {
                      onSelectPsychMainCategory(psychCategory.category);
                      onPsychMainClick?.(psychCategory);
                    }}
                    onMouseEnter={() => {
                      onSelectPsychMainCategory(psychCategory.category);
                      if (psychCategory.subcategories.length > 0) {
                        onSelectPsychSubcategory(psychCategory.subcategories[0].name);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 shrink-0 flex items-center justify-center text-lg">{psychCategory.icon}</span>
                      <span className="text-sm font-medium leading-snug">{psychCategory.category}</span>
                      <svg className="w-4 h-4 text-white ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div ref={subColRef} className="w-96 min-w-[24rem] max-w-[28rem] px-5 py-4 shrink-0">
              {activePsychMain ? (
                <div>
                  <div className="mb-1 text-lg font-bold text-blue-300">{activePsychMain.category}</div>
                  <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-sky-400">소분류</div>
                  <div className="space-y-2 max-h-[52vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-900">
                    {activePsychMain.subcategories.map((subcategory, index) => {
                      const isSelected = selectedPsychSubcategory === subcategory.name;

                      return (
                        <div
                          key={subcategory.name}
                          className="relative"
                          style={{
                            animation: 'fadeIn 0.3s ease-out',
                            animationDelay: `${index * 0.1}s`,
                            animationFillMode: 'both',
                          }}
                        >
                          <div
                            className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer ${
                              isSelected ? 'border-2 border-white' : 'border-2 border-white/20 hover:border-white'
                            }`}
                            onMouseEnter={() => {
                              onHoverPsychSubcategory?.(subcategory.name);
                              onSelectPsychSubcategory(subcategory.name);
                            }}
                            onClick={() => handlePsychSubcategoryClick(subcategory)}
                          >
                            <div className="w-8 shrink-0 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                              {subcategory.icon}
                            </div>
                            <div className="flex flex-col gap-1 flex-1 min-w-0">
                              <div className="text-base font-medium text-white truncate">{subcategory.name}</div>
                            </div>
                            <svg
                              className="w-4 h-4 text-blue-300 group-hover:text-white group-hover:translate-x-1 transition-all duration-300 shrink-0 ml-auto"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>

                          {isSelected && subcategory.items.length > 0 && (
                            <div className="mt-2 ml-4 space-y-1 animate-fadeIn-slow">
                              {subcategory.items.map((item, itemIndex) => (
                                <LeafItem
                                  key={item.name}
                                  item={item}
                                  highlightBorder={itemIndex === 0 && isSelected}
                                  onCloseMenu={onCloseMenu}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-blue-300">중분류를 선택해주세요</div>
              )}
            </div>
          </>
        ) : (
          <div ref={subColRef} className="w-96 min-w-[24rem] max-w-[28rem] px-6 py-4 shrink-0">
            {activeCounselor ? (
              <div>
                <div className="text-lg font-bold text-blue-300 mb-4">{activeCounselor.category}</div>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-900">
                  {activeCounselor.subcategories.map((subcategory, index) => {
                    const isSelected = selectedCounselorSubcategory === subcategory.name;

                    return (
                      <div
                        key={subcategory.name}
                        className="relative"
                        style={{
                          animation: 'fadeIn 0.3s ease-out',
                          animationDelay: `${index * 0.1}s`,
                          animationFillMode: 'both',
                        }}
                      >
                        <div
                          className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer ${
                            isSelected ? 'border-2 border-white' : 'border-2 border-white/20 hover:border-white'
                          }`}
                          onMouseEnter={() => onSelectCounselorSubcategory(subcategory.name)}
                          onClick={() => handleCounselorSubcategoryClick(subcategory)}
                        >
                          <div className="w-8 shrink-0 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                            {subcategory.icon}
                          </div>
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <div className="text-base font-medium text-white truncate">{subcategory.name}</div>
                          </div>
                          <svg
                            className="w-4 h-4 text-blue-300 group-hover:text-white group-hover:translate-x-1 transition-all duration-300 shrink-0 ml-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>

                        {isSelected && subcategory.items.length > 0 && (
                          <div className="mt-2 ml-4 space-y-1 animate-fadeIn-slow">
                            {subcategory.items.map((item, itemIndex) => (
                              <LeafItem
                                key={item.name}
                                item={item}
                                highlightBorder={itemIndex === 0 && isSelected}
                                onCloseMenu={onCloseMenu}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-blue-300">메뉴를 선택해주세요</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
