'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  TEST_CATEGORY_SLUGS,
  TEST_SUBCATEGORY_SLUGS,
  type TestCategory,
} from '@/data/psychologyTestMenu';

type Props = {
  open: boolean;
  onClose: () => void;
  categories: TestCategory[];
};

const DEFAULT_OPEN_SUBCATEGORY = '1a. 성격 및 기질 탐색';

function subKey(category: TestCategory, subName: string) {
  return `${category.category}::${subName}`;
}

function findDefaultSubKey(categories: TestCategory[]): string | null {
  for (const category of categories) {
    const sub = category.subcategories.find((s) => s.name === DEFAULT_OPEN_SUBCATEGORY && !s.hidden);
    if (sub) return subKey(category, sub.name);
  }
  const firstCategory = categories[0];
  const firstSub = firstCategory?.subcategories.find((s) => !s.hidden);
  if (firstCategory && firstSub) return subKey(firstCategory, firstSub.name);
  return null;
}

export default function AiPsychologyTestCatalogOverlay({ open, onClose, categories }: Props) {
  const defaultSubKey = useMemo(() => findDefaultSubKey(categories), [categories]);
  const [activeSubKey, setActiveSubKey] = useState<string | null>(null);

  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleEscape);
    document.documentElement.classList.add('overflow-hidden');
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.documentElement.classList.remove('overflow-hidden');
    };
  }, [open, handleEscape]);

  useEffect(() => {
    if (open) setActiveSubKey(defaultSubKey);
    else setActiveSubKey(null);
  }, [open, defaultSubKey]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-x-0 top-16 bottom-11 z-40 flex flex-col bg-[#070b14]/96 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-label="AI 심리검사 전체 목록"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(56,100,180,0.15),transparent)]" />

      <header className="relative flex shrink-0 items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-2xl ring-1 ring-violet-400/25">
            🧠
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold tracking-tight text-white sm:text-xl">
              AI 심리검사
            </h2>
            <p className="text-xs text-slate-400 sm:text-sm">
              중분류에 마우스를 올리면 아래에 세부 검사가 표시됩니다
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/tests"
            onClick={onClose}
            className="hidden rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-white/30 hover:text-white sm:inline-flex"
          >
            검사 대시보드
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-slate-300 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white"
            aria-label="닫기"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden px-4 py-4 sm:px-6 sm:py-5">
        <div className="grid h-full min-h-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 xl:gap-3">
          {categories.map((category) => {
            const categorySlug = TEST_CATEGORY_SLUGS[category.category];
            return (
              <section
                key={category.category}
                className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              >
                <Link
                  href={categorySlug ? `/tests?category=${categorySlug}` : '/tests'}
                  onClick={onClose}
                  className="group flex shrink-0 items-start gap-2.5 border-b border-white/[0.06] px-4 py-3.5 transition-colors hover:bg-white/[0.04]"
                >
                  <span className="text-2xl leading-none">{category.icon}</span>
                  <span className="min-w-0 flex-1 text-sm font-bold leading-snug text-white group-hover:text-sky-100 sm:text-base">
                    {category.category}
                  </span>
                </Link>

                <ul className="min-h-0 flex-1 space-y-1 overflow-hidden px-2 py-2 sm:px-3 sm:py-3">
                  {category.subcategories
                    .filter((sub) => !sub.hidden)
                    .map((subcategory) => {
                      const key = subKey(category, subcategory.name);
                      const isExpanded = activeSubKey === key;
                      const subSlug = TEST_SUBCATEGORY_SLUGS[subcategory.name];
                      const subHref = subSlug
                        ? `/tests/${subSlug}`
                        : subcategory.items[0]?.href ?? '/tests';
                      const visibleItems = subcategory.items.filter((item) => !item.hidden);

                      return (
                        <li
                          key={subcategory.name}
                          onMouseEnter={() => setActiveSubKey(key)}
                        >
                          <Link
                            href={subHref}
                            onClick={onClose}
                            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all ${
                              isExpanded
                                ? 'bg-violet-500/15 ring-1 ring-violet-400/35'
                                : 'hover:bg-white/[0.05]'
                            }`}
                          >
                            <span className="shrink-0 text-xl leading-none">{subcategory.icon}</span>
                            <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-violet-100 sm:text-[15px]">
                              {subcategory.name}
                            </span>
                          </Link>

                          {isExpanded && visibleItems.length > 0 && (
                            <ul className="mt-1 mb-1 ml-4 space-y-0.5 border-l border-violet-400/20 pl-3">
                              {visibleItems.map((item) => (
                                <li key={item.href}>
                                  <Link
                                    href={item.href}
                                    onClick={onClose}
                                    className="group flex items-start gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-white/[0.06]"
                                  >
                                    <span className="mt-0.5 shrink-0 text-base leading-none">{item.icon}</span>
                                    <span className="min-w-0 flex-1">
                                      <span className="block text-sm font-medium leading-snug text-slate-200 group-hover:text-white">
                                        {item.name}
                                      </span>
                                      {item.description ? (
                                        <span className="mt-0.5 block text-xs leading-relaxed text-slate-500 group-hover:text-slate-400">
                                          {item.description}
                                        </span>
                                      ) : null}
                                    </span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
