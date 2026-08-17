'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import AuthLink from '@/components/auth/AuthLink';
import { counselorMenuCategories, getCounselorCategoryHubHref } from '@/data/counselorMenu';
import {
  getAssessmentListContextNestedItems,
  getAssessmentsParentSubmenuItems,
  getClientsListContextNestedItems,
  getClientsParentSubmenuItems,
  nestedNavItemsAfter,
  rememberCounselorAssessmentContext,
  resolveActiveNestedNavItem,
} from '@/lib/counselorNestedNav';
import { clearAssessmentListSearch } from '@/lib/counselorAssessmentListSearch';
import {
  COUNSELOR_PSYCH_TESTS_SLUG,
  isMenuItemActive,
  resolveCounselorCategorySlugForPath,
} from '@/lib/counselorManageShell';
import { counselorHubClasses } from '@/components/layout/appChromeTheme';

type Props = {
  children: React.ReactNode;
};

export default function CounselorManageShell({ children }: Props) {
  const pathname = usePathname() || '';
  const searchParams = useSearchParams();
  const search = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const activeCategorySlug = resolveCounselorCategorySlugForPath(pathname);
  const activeNested = resolveActiveNestedNavItem(pathname, search);

  const [expandedSlug, setExpandedSlug] = useState<string>(() =>
    activeCategorySlug || COUNSELOR_PSYCH_TESTS_SLUG,
  );
  const [hoveredMenuHref, setHoveredMenuHref] = useState<string | null>(null);

  useEffect(() => {
    if (activeCategorySlug) {
      setExpandedSlug(activeCategorySlug);
    }
  }, [activeCategorySlug]);

  const toggleCategory = (slug: string) => {
    setExpandedSlug(slug);
  };

  const sidebarCategories = useMemo(() => counselorMenuCategories, []);

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:gap-3">
      <aside
        className={`flex max-h-[34vh] shrink-0 flex-col overflow-hidden rounded-xl border border-sky-400/20 lg:sticky lg:top-[4.25rem] lg:max-h-[calc(100dvh-5.5rem)] lg:w-[15.5rem] lg:shrink-0 xl:w-[17rem] ${counselorHubClasses.subsection} !p-0`}
        aria-label="상담관리 메뉴"
      >
        <div className="shrink-0 border-b border-sky-400/25 bg-gradient-to-r from-sky-600/25 via-sky-500/15 to-transparent px-3 py-2">
          <p className="text-sm font-bold text-white">상담관리</p>
          <p className="text-[11px] leading-tight text-sky-200/60">대분류 · 중분류 · 소분류</p>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1.5 py-1.5">
          {sidebarCategories.map((category) => {
            const expanded = expandedSlug === category.slug;
            const hubHref = getCounselorCategoryHubHref(category.slug);
            const isPsych = category.slug === COUNSELOR_PSYCH_TESTS_SLUG;

            return (
              <div key={category.slug} className="mb-1">
                <div className="flex items-stretch gap-0.5">
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.slug)}
                    className="flex w-7 shrink-0 items-center justify-center rounded text-sky-300/80 hover:bg-white/5 hover:text-sky-100"
                    aria-expanded={expanded}
                    aria-label={`${category.category} ${expanded ? '접기' : '펼치기'}`}
                  >
                    <span className="text-[10px]">{expanded ? '▼' : '▶'}</span>
                  </button>
                  <AuthLink
                    href={isPsych ? getPsychTestsEntryHref(category) : hubHref}
                    onClick={() => setExpandedSlug(category.slug)}
                    className={`min-w-0 flex-1 rounded-md px-2 py-1.5 text-left font-normal transition-colors hover:bg-white/[0.06] ${
                      activeCategorySlug === category.slug && !activeNested
                        ? 'bg-sky-500/15 text-sky-100'
                        : 'text-slate-200'
                    }`}
                  >
                    <span className="mr-1" aria-hidden>
                      {category.icon}
                    </span>
                    <span className="text-xs leading-tight sm:text-[13px]">
                      {stripCategoryNumber(category.category)}
                    </span>
                  </AuthLink>
                </div>

                {expanded ? (
                  <div className="ml-2 mt-0.5 space-y-1 border-l border-white/10 pl-1.5">
                    {category.subcategories.map((sub) => {
                      return (
                        <div key={sub.name}>
                          <p className="px-1.5 py-0.5 text-[10px] font-normal uppercase tracking-wide text-slate-500">
                            {sub.name.replace(/^\d+[a-z]\.\s*/i, '')}
                          </p>
                          <ul className="space-y-0.5 pb-1">
                            {sub.items.flatMap((item) => {
                              const normalizedItemHref = item.href.replace(/\/+$/, '');
                              const pathNorm = (pathname || '').split('?')[0].replace(/\/+$/, '') || '';
                              const nestedAfter = nestedNavItemsAfter(
                                sub.name,
                                item.href,
                                pathname,
                              );
                              const contextNested =
                                normalizedItemHref === '/counselor/assessments'
                                  ? getAssessmentListContextNestedItems(pathname, search)
                                  : normalizedItemHref === '/counselor/clients'
                                    ? getClientsListContextNestedItems(pathname, search)
                                    : [];
                              const parentSubmenu =
                                normalizedItemHref === '/counselor/assessments'
                                  ? getAssessmentsParentSubmenuItems()
                                  : normalizedItemHref === '/counselor/clients'
                                    ? getClientsParentSubmenuItems()
                                    : [];
                              const seenNestedLabels = new Set<string>();
                              const assessmentNested = [...parentSubmenu, ...contextNested]
                                .filter((nested) => {
                                  if (seenNestedLabels.has(nested.label)) return false;
                                  seenNestedLabels.add(nested.label);
                                  return true;
                                })
                                .sort((a, b) => a.order - b.order);
                              const hasActiveNested = assessmentNested.some((n) => n.isActive(pathNorm));
                              const parentExactActive =
                                normalizedItemHref === '/counselor/assessments'
                                  ? pathNorm === '/counselor/assessments'
                                  : normalizedItemHref === '/counselor/clients'
                                    ? pathNorm === '/counselor/clients'
                                    : isMenuItemActive(pathname, item.href);
                              const active = !activeNested && !hasActiveNested && parentExactActive;
                              const rows: React.ReactNode[] = [
                                <li
                                  key={item.href}
                                  onMouseEnter={() => setHoveredMenuHref(item.href)}
                                  onMouseLeave={() =>
                                    setHoveredMenuHref((prev) => (prev === item.href ? null : prev))
                                  }
                                >
                                  <AuthLink
                                    href={item.href}
                                    onClick={() => {
                                      if (item.href.replace(/\/+$/, '') === '/counselor/assessments') {
                                        clearAssessmentListSearch();
                                      }
                                    }}
                                    className={`block truncate rounded-md px-2 py-1 text-xs font-normal leading-snug transition-colors sm:text-[13px] ${
                                      active
                                        ? 'bg-sky-600/30 font-semibold text-sky-100'
                                        : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                                    }`}
                                    title={item.description}
                                  >
                                    {item.name}
                                  </AuthLink>
                                </li>,
                              ];
                              for (const nested of assessmentNested) {
                                const nestedActive = nested.isActive(
                                  (pathname || '').split('?')[0].replace(/\/+$/, '') || '',
                                );
                                rows.push(
                                  <li
                                    key={`${item.href}-${nested.label}`}
                                    onMouseEnter={() => setHoveredMenuHref(item.href)}
                                    onMouseLeave={() =>
                                      setHoveredMenuHref((prev) =>
                                        prev === item.href ? null : prev,
                                      )
                                    }
                                  >
                                    <AuthLink
                                      href={nested.href}
                                      onClick={() => {
                                        const idMatch =
                                          nested.href.match(/assessmentId=([^&]+)/) ||
                                          nested.href.match(/[?&]id=([^&]+)/);
                                        if (idMatch?.[1]) {
                                          rememberCounselorAssessmentContext(
                                            decodeURIComponent(idMatch[1]),
                                          );
                                        }
                                      }}
                                      className={`block truncate rounded-md py-1 pl-3 pr-2 text-xs font-normal leading-snug transition-colors sm:text-[13px] ${
                                        nestedActive
                                          ? 'bg-sky-600/30 font-semibold text-sky-100'
                                          : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                                      }`}
                                    >
                                      {'\u00A0- '}
                                      {nested.label}
                                    </AuthLink>
                                  </li>,
                                );
                              }
                              for (const nested of nestedAfter) {
                                const href = nested.buildHref(
                                  pathname.split('?')[0],
                                  search,
                                );
                                const nestedActive =
                                  activeNested?.item.label === nested.label;
                                rows.push(
                                  <li key={`${item.href}-${nested.label}`}>
                                    <AuthLink
                                      href={href}
                                      className={`block truncate rounded-md py-1 pl-3 pr-2 text-xs font-normal leading-snug transition-colors sm:text-[13px] ${
                                        nestedActive
                                          ? 'bg-sky-600/30 font-semibold text-sky-100'
                                          : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                                      }`}
                                    >
                                      {'\u00A0- '}
                                      {nested.label}
                                    </AuthLink>
                                  </li>,
                                );
                              }
                              return rows;
                            })}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function stripCategoryNumber(label: string): string {
  return label.replace(/^\d+\.\s*/, '');
}

function getPsychTestsEntryHref(category: (typeof counselorMenuCategories)[number]): string {
  return category.subcategories[0]?.items[0]?.href || '/counselor/assessments';
}
