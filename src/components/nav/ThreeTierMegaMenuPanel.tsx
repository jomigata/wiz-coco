'use client';

import Link from 'next/link';
import type { RefObject } from 'react';
import type { TestCategory, TestMenuItem, TestSubcategory } from '@/data/psychologyTestMenu';

type ThreeTierMegaMenuPanelProps = {
  panelRef: RefObject<HTMLDivElement | null>;
  leftColRef: RefObject<HTMLDivElement | null>;
  subColRef: RefObject<HTMLDivElement | null>;
  dropdownAlign: string;
  menuDataAttribute: string;
  panelTitle: string;
  categories: TestCategory[];
  selectedMainCategory: string | null;
  selectedSubcategory: string | null;
  isMenuOpen: boolean;
  onSelectMainCategory: (category: string) => void;
  onSelectSubcategory: (name: string) => void;
  onHoverSubcategory?: (name: string) => void;
  onMainCategoryClick?: (category: TestCategory) => void;
  onSubcategoryClick?: (subcategory: TestSubcategory, parent: TestCategory) => void;
  navigateTo?: (href: string) => void;
  onCloseMenu: () => void;
  onPanelMouseEnter: () => void;
  onPanelMouseLeave: () => void;
  searchSlot?: React.ReactNode;
  /** 지정 시 기본 중분류 열 대신 커스텀 UI 렌더 (예: AI 심리검사 안내) */
  renderSubColumn?: (activeMain: TestCategory) => React.ReactNode | null;
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

export default function ThreeTierMegaMenuPanel({
  panelRef,
  leftColRef,
  subColRef,
  dropdownAlign,
  menuDataAttribute,
  panelTitle,
  categories,
  selectedMainCategory,
  selectedSubcategory,
  isMenuOpen,
  onSelectMainCategory,
  onSelectSubcategory,
  onHoverSubcategory,
  onMainCategoryClick,
  onSubcategoryClick,
  navigateTo,
  onCloseMenu,
  onPanelMouseEnter,
  onPanelMouseLeave,
  searchSlot,
  renderSubColumn,
}: ThreeTierMegaMenuPanelProps) {
  const activeMain =
    categories.find((category) => category.category === selectedMainCategory) ?? categories[0];

  const customSubColumn = activeMain ? renderSubColumn?.(activeMain) : null;

  const handleSubcategoryClick = (subcategory: TestSubcategory, parent: TestCategory) => {
    if (onSubcategoryClick) {
      onSubcategoryClick(subcategory, parent);
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
      data-dropdown-menu={menuDataAttribute}
      className={`absolute top-full mt-0 pt-4 pb-8 w-auto min-w-[48rem] max-w-[56rem] bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-indigo-900/95 rounded-2xl shadow-2xl border border-blue-500/30 z-[60] animate-fadeIn backdrop-blur-xl ${dropdownAlign}`}
      onMouseEnter={onPanelMouseEnter}
      onMouseLeave={onPanelMouseLeave}
    >
      {searchSlot && <div className="px-4 pt-2 pb-3 border-b border-blue-500/20">{searchSlot}</div>}
      <div className="relative flex flex-row h-[62vh]">
        <div
          ref={leftColRef}
          className="w-96 min-w-[24rem] max-w-[28rem] px-6 py-4 border-r border-blue-500/30 shrink-0"
        >
          <div className="text-lg font-bold text-blue-300 mb-4">{panelTitle}</div>
          <div className="space-y-2">
            {categories.map((mainCategory, index) => (
              <div
                key={mainCategory.category}
                className={`p-4 rounded-lg cursor-pointer transition-all duration-300 border-2 ${
                  selectedMainCategory === mainCategory.category || (index === 0 && isMenuOpen && !selectedMainCategory)
                    ? 'text-white border-white shadow-lg'
                    : 'text-blue-300 border-white/20 hover:text-white hover:border-white hover:shadow-md'
                }`}
                onClick={() => {
                  onSelectMainCategory(mainCategory.category);
                  onMainCategoryClick?.(mainCategory);
                }}
                onMouseEnter={() => {
                  onSelectMainCategory(mainCategory.category);
                  if (mainCategory.subcategories.length > 0) {
                    onSelectSubcategory(mainCategory.subcategories[0].name);
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

        <div ref={subColRef} className="w-96 min-w-[24rem] max-w-[28rem] px-6 py-4 shrink-0">
          {customSubColumn ?? (activeMain ? (
            <div>
              <div className="text-lg font-bold text-blue-300 mb-4">{activeMain.category}</div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-900">
                {activeMain.subcategories.map((subcategory, index) => {
                  const isSelected = selectedSubcategory === subcategory.name;

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
                          onHoverSubcategory?.(subcategory.name);
                          onSelectSubcategory(subcategory.name);
                        }}
                        onClick={() => handleSubcategoryClick(subcategory, activeMain)}
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
            <div className="flex items-center justify-center h-full text-blue-300">대분류를 선택해주세요</div>
          ))}
        </div>
      </div>
    </div>
  );
}
