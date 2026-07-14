'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AuthLink from '@/components/auth/AuthLink';
import type { CounselorMainCategory } from '@/data/counselorMenu';
import { counselorHubClasses } from '@/components/layout/appChromeTheme';

type CounselorCategoryHubProps = {
  category: CounselorMainCategory;
};

type HubNavItem = {
  key: string;
  subcategoryName: string;
  name: string;
  description: string;
  href: string;
  icon: string;
  index: number;
};

function buildNavItems(category: CounselorMainCategory): HubNavItem[] {
  const items: HubNavItem[] = [];
  let index = 0;
  for (const sub of category.subcategories) {
    for (const item of sub.items) {
      items.push({
        key: item.href,
        subcategoryName: sub.name,
        name: item.name,
        description: item.description,
        href: item.href,
        icon: item.icon,
        index,
      });
      index += 1;
    }
  }
  return items;
}

export default function CounselorCategoryHub({ category }: CounselorCategoryHubProps) {
  const navItems = useMemo(() => buildNavItems(category), [category]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selected = navItems[selectedIndex] ?? navItems[0];
  const hasPrev = selectedIndex > 0;
  const hasNext = selectedIndex < navItems.length - 1;

  const goPrev = useCallback(() => {
    setSelectedIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setSelectedIndex((i) => Math.min(navItems.length - 1, i + 1));
  }, [navItems.length]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goPrev, goNext]);

  if (!selected) {
    return null;
  }

  const subcategoryGroups = category.subcategories.map((sub) => ({
    ...sub,
    items: navItems.filter((item) => item.subcategoryName === sub.name),
  }));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 lg:gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <AuthLink
          href="/counselor"
          className="inline-flex items-center gap-1 text-sm text-sky-300/70 transition-colors hover:text-sky-200"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          상담관리 홈
        </AuthLink>
        <span className="text-xs text-sky-200/45">
          {selectedIndex + 1} / {navItems.length}
        </span>
      </header>

      <div className="flex items-center gap-2.5">
        <span className="text-2xl leading-none" aria-hidden>
          {category.icon}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-white sm:text-xl">{category.category}</h1>
          <p className="truncate text-xs text-sky-200/55 sm:text-sm">{category.description}</p>
        </div>
      </div>

      <div className="grid min-h-[min(520px,70vh)] grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
        {/* 좌측: 메뉴 네비게이션 */}
        <nav
          aria-label={`${category.category} 메뉴`}
          className={`flex flex-col overflow-hidden rounded-xl border border-sky-400/12 ${counselorHubClasses.subsection} !p-0`}
        >
          <div className="border-b border-sky-400/10 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-sky-200/50">메뉴 선택</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {subcategoryGroups.map((sub) => (
              <div key={sub.name} className="mb-2 last:mb-0">
                <p className="px-2 py-1.5 text-[11px] font-medium text-sky-200/45">{sub.name}</p>
                <ul className="space-y-0.5">
                  {sub.items.map((item) => {
                    const isActive = item.index === selectedIndex;
                    return (
                      <li key={item.key}>
                        <button
                          type="button"
                          onClick={() => setSelectedIndex(item.index)}
                          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                            isActive
                              ? 'bg-sky-500/20 text-white ring-1 ring-sky-400/35'
                              : 'text-sky-100/80 hover:bg-white/[0.05] hover:text-white'
                          }`}
                          aria-current={isActive ? 'true' : undefined}
                        >
                          <span className="w-6 shrink-0 text-center text-base" aria-hidden>
                            {item.icon}
                          </span>
                          <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* 우측: 선택 항목 상세 + 이동 */}
        <section
          className={`flex flex-col rounded-xl border border-sky-400/12 ${counselorHubClasses.subsection}`}
          aria-live="polite"
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-sky-200/45">
            {selected.subcategoryName}
          </p>
          <div className="mt-3 flex items-start gap-3">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center text-xl ${counselorHubClasses.itemIcon}`}
              aria-hidden
            >
              {selected.icon}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-white sm:text-xl">{selected.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-sky-100/65">{selected.description}</p>
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-3 pt-8">
            <AuthLink
              href={selected.href}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-sky-500"
            >
              {selected.name}으로 이동
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </AuthLink>

            <div className="flex items-center justify-between gap-2 border-t border-sky-400/10 pt-4">
              <button
                type="button"
                onClick={goPrev}
                disabled={!hasPrev}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-sky-400/15 px-3 py-2 text-xs font-medium text-sky-200/80 transition-colors hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-35 sm:text-sm"
              >
                ← 이전
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={!hasNext}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-sky-400/15 px-3 py-2 text-xs font-medium text-sky-200/80 transition-colors hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-35 sm:text-sm"
              >
                다음 →
              </button>
            </div>
            <p className="text-center text-[10px] text-sky-200/35">키보드 ← → 로 메뉴 이동</p>
          </div>
        </section>
      </div>
    </div>
  );
}
