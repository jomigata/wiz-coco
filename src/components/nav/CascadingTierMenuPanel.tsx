'use client';

import Link from 'next/link';
import type { RefObject } from 'react';
import type { TestCategory, TestMenuItem, TestSubcategory } from '@/data/psychologyTestMenu';
import { navMegaMenuClasses } from '@/components/layout/appChromeTheme';

type CascadingTierMenuPanelProps = {
  panelRef: RefObject<HTMLDivElement | null>;
  leftColRef: RefObject<HTMLDivElement | null>;
  subColRef: RefObject<HTMLDivElement | null>;
  dropdownAlign: string;
  menuDataAttribute: string;
  panelTitle: string;
  categories: TestCategory[];
  selectedMainCategory: string | null;
  selectedSubcategory: string | null;
  onSelectMainCategory: (category: string | null) => void;
  onSelectSubcategory: (name: string | null) => void;
  onMainCategoryClick?: (category: TestCategory) => void;
  onSubcategoryClick?: (subcategory: TestSubcategory, parent: TestCategory) => void;
  navigateTo?: (href: string) => void;
  onCloseMenu: () => void;
  onPanelMouseEnter?: () => void;
  onPanelMouseLeave?: () => void;
};

function badgeClass(badge: string) {
  if (badge === '24시간' || badge === '긴급') return 'bg-red-500/90 text-white';
  if (badge === '신규') return 'bg-emerald-500/90 text-white';
  return 'bg-amber-500/90 text-white';
}

function LeafItem({
  item,
  onCloseMenu,
  navigateTo,
}: {
  item: TestMenuItem;
  onCloseMenu: () => void;
  navigateTo?: (href: string) => void;
}) {
  return (
    <Link
      href={item.href}
      className={`group flex items-center gap-3 rounded-lg border px-3 py-2 shadow-sm transition-all duration-300 hover:shadow-md ${navMegaMenuClasses.leafItemIdle}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (navigateTo) {
          navigateTo(item.href);
        }
        onCloseMenu();
      }}
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

export default function CascadingTierMenuPanel({
  panelRef,
  leftColRef,
  subColRef,
  dropdownAlign,
  menuDataAttribute,
  panelTitle,
  categories,
  selectedMainCategory,
  selectedSubcategory,
  onSelectMainCategory,
  onSelectSubcategory,
  onMainCategoryClick,
  onSubcategoryClick,
  navigateTo,
  onCloseMenu,
  onPanelMouseEnter,
  onPanelMouseLeave,
}: CascadingTierMenuPanelProps) {
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
      className={`${navMegaMenuClasses.cascadingPanel} ${navMegaMenuClasses.panelSizeMainOnly} ${dropdownAlign}`}
      onMouseEnter={onPanelMouseEnter}
      onMouseLeave={onPanelMouseLeave}
    >
      <div className={navMegaMenuClasses.panelGlow} aria-hidden />
      <div ref={leftColRef} className={`relative z-[1] ${navMegaMenuClasses.cascadingCol}`}>
        <div className={navMegaMenuClasses.panelTitle}>{panelTitle}</div>
        <div className="space-y-2">
          {categories.map((mainCategory) => {
            const isMainActive = selectedMainCategory === mainCategory.category;

            return (
              <div key={mainCategory.category} className="relative">
                <div
                  className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 ${
                    isMainActive ? navMegaMenuClasses.mainItemActive : navMegaMenuClasses.mainItemIdle
                  }`}
                  onMouseEnter={() => {
                    onSelectMainCategory(mainCategory.category);
                    onSelectSubcategory(null);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMainCategory(mainCategory.category);
                    onMainCategoryClick?.(mainCategory);
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

                {isMainActive && mainCategory.subcategories.length > 0 && (
                  <div className="mt-2 space-y-1.5 pl-3 animate-fadeIn">
                    {mainCategory.subcategories.map((subcategory) => {
                      const isSubActive = selectedSubcategory === subcategory.name;

                      return (
                        <div
                          key={subcategory.name}
                          className="relative"
                          onMouseEnter={() => onSelectSubcategory(subcategory.name)}
                        >
                          <div
                            className={`group flex cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-2.5 transition-all duration-300 ${
                              isSubActive ? navMegaMenuClasses.subItemActive : navMegaMenuClasses.subItemIdle
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSubcategoryClick(subcategory, mainCategory);
                            }}
                          >
                            <div className="flex w-7 shrink-0 items-center justify-center text-xl transition-transform duration-300 group-hover:scale-110">
                              {subcategory.icon}
                            </div>
                            <div className="min-w-0 flex-1 truncate text-sm font-medium text-white">
                              {subcategory.name}
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

                          {isSubActive && subcategory.items.length > 0 && (
                            <div
                              ref={subColRef}
                              className={navMegaMenuClasses.cascadingLeafFlyout}
                              role="menu"
                            >
                              <div className={`${navMegaMenuClasses.cascadingLeafFlyoutInner} space-y-1.5`}>
                                {subcategory.items.map((item) => (
                                  <LeafItem
                                    key={item.name}
                                    item={item}
                                    onCloseMenu={onCloseMenu}
                                    navigateTo={navigateTo}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
