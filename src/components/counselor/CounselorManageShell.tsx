'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import AuthLink from '@/components/auth/AuthLink';
import { counselorMenuCategories, getCounselorCategoryHubHref } from '@/data/counselorMenu';
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
  const activeCategorySlug = resolveCounselorCategorySlugForPath(pathname);

  const [expandedSlugs, setExpandedSlugs] = useState<Set<string>>(() => {
    const initial = new Set<string>([COUNSELOR_PSYCH_TESTS_SLUG]);
    if (activeCategorySlug) initial.add(activeCategorySlug);
    return initial;
  });

  useEffect(() => {
    if (!activeCategorySlug) return;
    setExpandedSlugs((prev) => {
      if (prev.has(activeCategorySlug)) return prev;
      const next = new Set(prev);
      next.add(activeCategorySlug);
      return next;
    });
  }, [activeCategorySlug]);

  const toggleCategory = (slug: string) => {
    setExpandedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const sidebarCategories = useMemo(() => counselorMenuCategories, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 lg:max-h-[calc(100dvh-5.5rem)] lg:flex-row lg:gap-3">
      <aside
        className={`flex max-h-[34vh] shrink-0 flex-col overflow-hidden rounded-xl border border-sky-400/20 lg:max-h-none lg:w-[15.5rem] lg:shrink-0 xl:w-[17rem] ${counselorHubClasses.subsection} !p-0`}
        aria-label="상담관리 메뉴"
      >
        <div className="shrink-0 border-b border-sky-400/25 bg-gradient-to-r from-sky-600/25 via-sky-500/15 to-transparent px-3 py-2">
          <p className="text-sm font-bold text-white">상담관리</p>
          <p className="text-[11px] leading-tight text-sky-200/60">대분류 · 중분류 · 소분류</p>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1.5 py-1.5">
          {sidebarCategories.map((category) => {
            const expanded = expandedSlugs.has(category.slug);
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
                    className={`min-w-0 flex-1 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-white/[0.06] ${
                      activeCategorySlug === category.slug
                        ? 'bg-sky-500/15 text-sky-100'
                        : 'text-slate-200'
                    }`}
                  >
                    <span className="mr-1" aria-hidden>
                      {category.icon}
                    </span>
                    <span className="text-xs font-semibold leading-tight sm:text-[13px]">
                      {stripCategoryNumber(category.category)}
                    </span>
                  </AuthLink>
                </div>

                {expanded ? (
                  <div className="ml-2 mt-0.5 space-y-1 border-l border-white/10 pl-1.5">
                    {category.subcategories.map((sub) => (
                      <div key={sub.name}>
                        <p className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          {sub.name.replace(/^\d+[a-z]\.\s*/i, '')}
                        </p>
                        <ul className="space-y-0.5 pb-1">
                          {sub.items.map((item) => {
                            const active = isMenuItemActive(pathname, item.href);
                            return (
                              <li key={item.href}>
                                <AuthLink
                                  href={item.href}
                                  className={`block truncate rounded-md px-2 py-1 text-xs leading-snug transition-colors sm:text-[13px] ${
                                    active
                                      ? 'bg-sky-600/30 font-medium text-sky-100'
                                      : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                                  }`}
                                  title={item.description}
                                >
                                  {item.name}
                                </AuthLink>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain">{children}</div>
    </div>
  );
}

function stripCategoryNumber(label: string): string {
  return label.replace(/^\d+\.\s*/, '');
}

function getPsychTestsEntryHref(category: (typeof counselorMenuCategories)[number]): string {
  return category.subcategories[0]?.items[0]?.href || '/counselor/assessments';
}
