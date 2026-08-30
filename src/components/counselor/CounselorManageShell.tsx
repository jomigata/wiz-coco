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
  PERMANENTLY_DELETED_ASSESSMENTS_HREF,
  rememberCounselorAssessmentContext,
  resolveActiveNestedNavItem,
} from '@/lib/counselorNestedNav';
import { clearAssessmentListSearch } from '@/lib/counselorAssessmentListSearch';
import { getAppRoleSync, isAdmin } from '@/utils/roleUtils';
import {
  COUNSELOR_ASSESSMENT_CODE_SLUG,
  getCounselorCategoryDefaultHref,
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
  const activeCategorySlug = resolveCounselorCategorySlugForPath(pathname, search);
  const activeNested = resolveActiveNestedNavItem(pathname, search);
  const adminUser = isAdmin(getAppRoleSync());

  const [expandedSlug, setExpandedSlug] = useState<string>(() =>
    activeCategorySlug || COUNSELOR_ASSESSMENT_CODE_SLUG,
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
    <div
      className={`flex min-h-0 flex-1 flex-col gap-2 lg:h-[calc(100dvh-4.5rem)] lg:flex-row lg:items-stretch lg:gap-3 lg:overflow-hidden`}
    >
      <aside
        className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-sky-400/20 max-h-[38vh] shrink-0 lg:h-full lg:max-h-[calc(100dvh-4.5rem)] lg:w-[15.5rem] lg:shrink-0 xl:w-[17rem] ${counselorHubClasses.subsection} !p-0`}
        aria-label="상담관리 메뉴"
      >
        <div className="shrink-0 border-b border-sky-400/25 bg-gradient-to-r from-sky-600/25 via-sky-500/15 to-transparent px-3 py-2">
          <p className="text-sm font-bold text-white">상담관리</p>
          <p className="text-[11px] leading-tight text-sky-200/60">대분류 · 중분류 · 소분류</p>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1.5 py-1.5">
          {sidebarCategories.map((category) => {
            const expanded = expandedSlug === category.slug;
            const categoryEntryHref = getCategoryEntryHref(category, adminUser);

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
                    href={categoryEntryHref}
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
                      if (sub.adminOnly && !adminUser) return null;
                      const visibleItems = sub.items.filter((item) => !item.adminOnly || adminUser);
                      if (visibleItems.length === 0) return null;
                      const flatMiddleTier = Boolean(sub.flatItems);
                      return (
                        <div key={sub.name || visibleItems[0]?.href}>
                          {!flatMiddleTier ? (
                            <p className="px-1.5 py-0.5 text-[10px] font-normal uppercase tracking-wide text-slate-500">
                              {sub.name.replace(/^\d+[a-z]\.\s*/i, '')}
                            </p>
                          ) : null}
                          <ul className={`space-y-0.5 ${flatMiddleTier ? 'pb-1' : 'pb-1'}`}>
                            {visibleItems.flatMap((item) => {
                              const normalizedItemHref = item.href.replace(/\/+$/, '');
                              const pathNorm = (pathname || '').split('?')[0].replace(/\/+$/, '') || '';
                              const nestedAfter = nestedNavItemsAfter(
                                sub.name,
                                item.href,
                                pathname,
                              );
                              const parentSubmenu =
                                normalizedItemHref === '/counselor/assessments'
                                  ? getAssessmentsParentSubmenuItems({ admin: adminUser })
                                  : normalizedItemHref === '/counselor/clients'
                                    ? getClientsParentSubmenuItems({ admin: adminUser })
                                    : [];
                              const contextNested =
                                normalizedItemHref === '/counselor/assessments'
                                  ? getAssessmentListContextNestedItems(pathname, search, {
                                      admin: adminUser,
                                    })
                                  : normalizedItemHref === '/counselor/clients'
                                    ? getClientsListContextNestedItems(pathname, search, {
                                        admin: adminUser,
                                      })
                                    : [];
                              const contextAnchorHref =
                                normalizedItemHref === '/counselor/assessments'
                                  ? '/counselor/assessments'
                                  : normalizedItemHref === '/counselor/clients'
                                    ? '/counselor/clients'
                                    : '';
                              const hasActiveNested =
                                parentSubmenu.some((n) => n.isActive(pathNorm)) ||
                                contextNested.some((n) => n.isActive(pathNorm));
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
                              for (const nested of parentSubmenu.sort((a, b) => a.order - b.order)) {
                                const nestedActive = nested.isActive(pathNorm);
                                rows.push(
                                  <li
                                    key={`${item.href}-${nested.href}`}
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
                                        if (
                                          nested.href.replace(/\/+$/, '') === '/counselor/assessments'
                                        ) {
                                          clearAssessmentListSearch();
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
                              if (contextAnchorHref && contextNested.length > 0) {
                                for (const ctx of contextNested.sort((a, b) => a.order - b.order)) {
                                  const ctxActive = ctx.isActive(pathNorm);
                                  rows.push(
                                    <li
                                      key={`${item.href}-ctx-${ctx.label}`}
                                      onMouseEnter={() => setHoveredMenuHref(item.href)}
                                      onMouseLeave={() =>
                                        setHoveredMenuHref((prev) =>
                                          prev === item.href ? null : prev,
                                        )
                                      }
                                    >
                                      <AuthLink
                                        href={ctx.href}
                                        onClick={() => {
                                          const idMatch =
                                            ctx.href.match(/assessmentId=([^&]+)/) ||
                                            ctx.href.match(/[?&]id=([^&]+)/);
                                          if (idMatch?.[1]) {
                                            rememberCounselorAssessmentContext(
                                              decodeURIComponent(idMatch[1]),
                                            );
                                          }
                                        }}
                                        className={`block truncate rounded-md py-1 pl-3 pr-2 text-xs font-normal leading-snug transition-colors sm:text-[13px] ${
                                          ctxActive
                                            ? 'bg-sky-600/30 font-semibold text-sky-100'
                                            : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                                        }`}
                                      >
                                        {'\u00A0- '}
                                        {ctx.label}
                                      </AuthLink>
                                    </li>,
                                  );
                                }
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

      <div
        className={`flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:max-h-[calc(100dvh-4.5rem)]`}
      >
        {children}
      </div>
    </div>
  );
}

function stripCategoryNumber(label: string): string {
  return label.replace(/^\d+\.\s*/, '');
}

function getCategoryEntryHref(
  category: (typeof counselorMenuCategories)[number],
  adminUser: boolean,
): string {
  if (category.slug === 'data' && adminUser) {
    return PERMANENTLY_DELETED_ASSESSMENTS_HREF;
  }
  return getCounselorCategoryDefaultHref(category.slug);
}
