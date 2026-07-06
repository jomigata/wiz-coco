'use client';

import Link from 'next/link';
import { useCallback, useEffect } from 'react';
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

export default function AiPsychologyTestCatalogOverlay({ open, onClose, categories }: Props) {
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

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-x-0 top-16 bottom-11 z-[55] flex flex-col bg-[#070b14]/96 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-label="AI 심리검사 전체 목록"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(56,100,180,0.15),transparent)]" />

      <header className="relative flex shrink-0 items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-3 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-xl ring-1 ring-violet-400/25">
            🧠
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold tracking-tight text-white sm:text-lg">
              AI 심리검사
            </h2>
            <p className="text-[11px] text-slate-400 sm:text-xs">
              대분류 · 중분류 · 세부 검사를 한 화면에서 선택하세요
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/tests"
            onClick={onClose}
            className="hidden rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-white/30 hover:text-white sm:inline-flex"
          >
            검사 대시보드
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-slate-300 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white"
            aria-label="닫기"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden px-3 py-3 sm:px-5 sm:py-4">
        <div className="grid h-full min-h-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 xl:gap-2.5">
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
                  className="group flex shrink-0 items-center gap-2 border-b border-white/[0.06] px-3 py-2.5 transition-colors hover:bg-white/[0.04]"
                >
                  <span className="text-lg leading-none">{category.icon}</span>
                  <span className="min-w-0 flex-1 text-[11px] font-semibold leading-snug text-white group-hover:text-sky-100 sm:text-xs">
                    {category.category}
                  </span>
                </Link>

                <div className="min-h-0 flex-1 space-y-2 overflow-hidden px-2.5 py-2">
                  {category.subcategories
                    .filter((sub) => !sub.hidden)
                    .map((subcategory) => {
                      const subSlug = TEST_SUBCATEGORY_SLUGS[subcategory.name];
                      return (
                        <div key={subcategory.name} className="min-w-0">
                          <Link
                            href={subSlug ? `/tests/${subSlug}` : subcategory.items[0]?.href ?? '/tests'}
                            onClick={onClose}
                            className="group/sub flex items-center gap-1.5 rounded-md px-1 py-0.5 transition-colors hover:bg-white/[0.05]"
                          >
                            <span className="shrink-0 text-sm leading-none">{subcategory.icon}</span>
                            <span className="truncate text-[10px] font-medium text-violet-200/90 group-hover/sub:text-white sm:text-[11px]">
                              {subcategory.name}
                            </span>
                          </Link>
                          <div className="mt-0.5 flex flex-wrap gap-1 pl-5">
                            {subcategory.items
                              .filter((item) => !item.hidden)
                              .map((item) => (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  onClick={onClose}
                                  title={item.description}
                                  className="inline-flex max-w-full items-center rounded-full border border-white/10 bg-slate-900/50 px-2 py-0.5 text-[9px] leading-tight text-slate-300 transition-all hover:border-sky-400/40 hover:bg-sky-500/10 hover:text-white sm:text-[10px]"
                                >
                                  <span className="truncate">{item.name}</span>
                                </Link>
                              ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
