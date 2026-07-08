'use client';

import Link from 'next/link';
import type { RefObject } from 'react';
import type { TestCategory, TestMenuItem, TestSubcategory } from '@/data/psychologyTestMenu';
import { navMegaMenuClasses } from '@/components/layout/appChromeTheme';

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
};

function badgeClass(badge: string) {
  if (badge === '24시간' || badge === '긴급') return 'bg-red-500/90 text-white';
  if (badge === '신규') return 'bg-emerald-500/90 text-white';
  return 'bg-amber-500/90 text-white';
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
      className={`group ml-8 flex items-center gap-3 rounded-lg border px-3 py-2 shadow-sm transition-all duration-300 hover:shadow-md ${
        highlightBorder ? navMegaMenuClasses.leafItemActive : navMegaMenuClasses.leafItemIdle
      }`}
      onClick={onCloseMenu}
    >
      <div className="flex w-6 shrink-0 items-center justify-center text-base transition-transform duration-300 group-hover:scale-110">
        {item.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className={`truncate text-sm font-medium ${navMegaMenuClasses.textAccent}`}>{item.name}</div>
          {item.badge && (
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${badgeClass(item.badge)}`}>
              {item.badge}
            </span>
          )}
        </div>
        <div className={`truncate text-xs ${navMegaMenuClasses.textMuted}`}>{item.description}</div>
      </div>
      <svg
        className="h-3 w-3 shrink-0 text-slate-500 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white"
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
}: ThreeTierMegaMenuPanelProps) {
  const activeMain =
    categories.find((category) => category.category === selectedMainCategory) ?? categories[0];

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
      className={`${navMegaMenuClasses.panel} ${dropdownAlign}`}
      onMouseEnter={onPanelMouseEnter}
      onMouseLeave={onPanelMouseLeave}
    >
      <div className="pointer-events-none absolute inset-0 bg-[#0a1020]" aria-hidden />
      <div className={navMegaMenuClasses.panelGlow} aria-hidden />
      {searchSlot && <div className="relative z-[1] border-b border-white/[0.06] px-4 pb-3 pt-2">{searchSlot}</div>}
      <div className="relative z-[1] flex h-[62vh] flex-row">
        <div ref={leftColRef} className={navMegaMenuClasses.leftCol}>
          <div className={navMegaMenuClasses.panelTitle}>{panelTitle}</div>
          <div className="space-y-2">
            {categories.map((mainCategory, index) => (
              <div
                key={mainCategory.category}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 ${
                  selectedMainCategory === mainCategory.category || (index === 0 && isMenuOpen && !selectedMainCategory)
                    ? navMegaMenuClasses.mainItemActive
                    : navMegaMenuClasses.mainItemIdle
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
                  <span className="flex w-8 shrink-0 items-center justify-center text-xl">{mainCategory.icon}</span>
                  <span className="font-medium">{mainCategory.category}</span>
                  <svg className="ml-auto h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div ref={subColRef} className={navMegaMenuClasses.rightCol}>
          {activeMain ? (
            <div>
              <div className={navMegaMenuClasses.panelTitle}>{activeMain.category}</div>
              <div className="scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent max-h-[60vh] space-y-2 overflow-y-auto">
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
                        className={`group flex cursor-pointer items-center gap-4 rounded-xl border-2 px-4 py-3 transition-all duration-300 ${
                          isSelected ? navMegaMenuClasses.subItemActive : navMegaMenuClasses.subItemIdle
                        }`}
                        onMouseEnter={() => {
                          onHoverSubcategory?.(subcategory.name);
                          onSelectSubcategory(subcategory.name);
                        }}
                        onClick={() => handleSubcategoryClick(subcategory, activeMain)}
                      >
                        <div className="flex w-8 shrink-0 items-center justify-center text-2xl transition-transform duration-300 group-hover:scale-110">
                          {subcategory.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-base font-medium text-white">{subcategory.name}</div>
                        </div>
                        <svg
                          className="ml-auto h-4 w-4 shrink-0 text-slate-500 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>

                      {isSelected && subcategory.items.length > 0 && (
                        <div className="animate-fadeIn-slow ml-4 mt-2 space-y-1">
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
            <div className="flex h-full items-center justify-center text-slate-500">대분류를 선택해주세요</div>
          )}
        </div>
      </div>
    </div>
  );
}
