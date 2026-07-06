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
      className="fixed inset-x-0 top-16 bottom-11 z-40 flex flex-col bg-[#060912]"
      role="dialog"
      aria-modal="true"
      aria-label="AI 심리검사 전체 목록"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(45,80,140,0.12),transparent)]" />

      <header className="relative shrink-0 border-b border-white/10 bg-[#0a1020] px-5 py-4 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600/20 text-2xl ring-1 ring-violet-400/30">
              🧠
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold tracking-tight text-white sm:text-xl">
                AI 심리검사
              </h2>
              <p className="text-xs text-slate-300 sm:text-sm">
                중분류에 마우스를 올리면 아래에 세부 검사가 표시됩니다
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/tests"
              onClick={onClose}
              className="hidden rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-slate-200 transition-colors hover:border-white/35 hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              검사 대시보드
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-slate-200 transition-colors hover:border-white/35 hover:bg-white/10 hover:text-white"
              aria-label="닫기"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden bg-[#060912] px-4 py-4 sm:px-6 sm:py-5">
        <div className="grid h-full min-h-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 xl:gap-3">
          {categories.map((category) => {
            const categorySlug = TEST_CATEGORY_SLUGS[category.category];
            return (
              <section
                key={category.category}
                className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0c1222] shadow-lg shadow-black/30"
              >
                <Link
                  href={categorySlug ? `/tests?category=${categorySlug}` : '/tests'}
                  onClick={onClose}
                  className="group flex shrink-0 items-start gap-3 border-b-2 border-sky-500/40 bg-[#101828] px-4 py-3.5 transition-colors hover:bg-[#141f35]"
                >
                  <span className="text-2xl leading-none">{category.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-sky-400">
                      대분류
                    </span>
                    <span className="block text-base font-bold leading-snug text-white group-hover:text-sky-100 sm:text-[17px]">
                      {category.category}
                    </span>
                  </span>
                </Link>

                <ul className="min-h-0 flex-1 space-y-2 overflow-hidden px-2.5 py-2.5 sm:px-3 sm:py-3">
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
                        <li key={subcategory.name} onMouseEnter={() => setActiveSubKey(key)}>
                          <Link
                            href={subHref}
                            onClick={onClose}
                            className={`flex w-full items-center gap-2.5 rounded-lg border-l-[3px] px-3 py-2.5 transition-all ${
                              isExpanded
                                ? 'border-l-sky-400 bg-sky-950/40 ring-1 ring-sky-500/25'
                                : 'border-l-slate-600 bg-[#111827]/90 hover:border-l-sky-500/60 hover:bg-[#151f33]'
                            }`}
                          >
                            <span className="shrink-0 text-lg leading-none">{subcategory.icon}</span>
                            <span className="min-w-0 flex-1">
                              <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-sky-300/80">
                                중분류
                              </span>
                              <span className="block text-sm font-bold leading-snug text-white">
                                {subcategory.name}
                              </span>
                            </span>
                          </Link>

                          {isExpanded && visibleItems.length > 0 && (
                            <div className="mt-2 rounded-lg border border-emerald-500/25 bg-[#071018] p-2 shadow-inner">
                              <p className="mb-1.5 border-b border-emerald-500/20 pb-1 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
                                세부 검사
                              </p>
                              <ul className="space-y-1">
                                {visibleItems.map((item) => (
                                  <li key={item.href}>
                                    <Link
                                      href={item.href}
                                      onClick={onClose}
                                      className="group block rounded-md border border-transparent px-2 py-2 transition-colors hover:border-emerald-500/20 hover:bg-emerald-950/30"
                                    >
                                      <div className="flex items-start gap-2">
                                        <span className="mt-0.5 shrink-0 text-base leading-none">{item.icon}</span>
                                        <div className="min-w-0 flex-1">
                                          <p className="text-sm font-bold leading-snug text-white group-hover:text-emerald-100">
                                            {item.name}
                                          </p>
                                          {item.description ? (
                                            <p className="mt-1 text-[13px] leading-relaxed text-slate-200 group-hover:text-slate-100">
                                              {item.description}
                                            </p>
                                          ) : null}
                                        </div>
                                      </div>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
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
