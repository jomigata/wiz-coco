'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  TEST_CATEGORY_SLUGS,
  TEST_SUBCATEGORY_SLUGS,
  type TestCategory,
  type TestSubcategory,
} from '@/data/psychologyTestMenu';

type Props = {
  open: boolean;
  onClose: () => void;
  categories: TestCategory[];
};

type HoveredSub = {
  category: TestCategory;
  subcategory: TestSubcategory;
};

export default function AiPsychologyTestCatalogOverlay({ open, onClose, categories }: Props) {
  const [hoveredSub, setHoveredSub] = useState<HoveredSub | null>(null);

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
    if (!open) setHoveredSub(null);
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const activeSub = hoveredSub;

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
              중분류에 마우스를 올리면 세부 검사가 표시됩니다
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

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <div className="min-h-0 flex-1 overflow-hidden px-4 py-4 sm:px-6 sm:py-5 xl:pr-[22rem]">
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
                        const subSlug = TEST_SUBCATEGORY_SLUGS[subcategory.name];
                        const subHref = subSlug
                          ? `/tests/${subSlug}`
                          : subcategory.items[0]?.href ?? '/tests';
                        const isActive =
                          activeSub?.category.category === category.category &&
                          activeSub?.subcategory.name === subcategory.name;
                        return (
                          <li key={subcategory.name}>
                            <Link
                              href={subHref}
                              onClick={onClose}
                              onMouseEnter={() => setHoveredSub({ category, subcategory })}
                              onFocus={() => setHoveredSub({ category, subcategory })}
                              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all ${
                                isActive
                                  ? 'bg-violet-500/15 ring-1 ring-violet-400/35'
                                  : 'hover:bg-white/[0.05]'
                              }`}
                            >
                              <span className="shrink-0 text-xl leading-none">{subcategory.icon}</span>
                              <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-violet-100 sm:text-[15px]">
                                {subcategory.name}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>

        <aside
          className={`absolute inset-y-0 right-0 hidden w-80 flex-col border-l border-white/[0.08] bg-[#0a1020]/95 backdrop-blur-md transition-opacity xl:flex ${
            activeSub ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          onMouseLeave={() => setHoveredSub(null)}
        >
          {activeSub && (
            <>
              <div className="border-b border-white/[0.06] px-5 py-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">세부 검사</p>
                <h3 className="mt-1 flex items-center gap-2 text-base font-bold text-white">
                  <span className="text-xl">{activeSub.subcategory.icon}</span>
                  {activeSub.subcategory.name}
                </h3>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
                <ul className="space-y-1">
                  {activeSub.subcategory.items
                    .filter((item) => !item.hidden)
                    .map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className="group flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-white/[0.06]"
                        >
                          <span className="mt-0.5 text-lg leading-none">{item.icon}</span>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-white group-hover:text-sky-100 sm:text-[15px]">
                              {item.name}
                            </div>
                            <div className="mt-0.5 text-xs leading-relaxed text-slate-400 group-hover:text-slate-300">
                              {item.description}
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            </>
          )}
        </aside>

        {activeSub && (
          <div className="absolute inset-x-4 bottom-4 max-h-[40vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0a1020]/98 p-4 shadow-2xl backdrop-blur-md xl:hidden">
            <p className="mb-2 text-xs font-medium text-slate-500">{activeSub.subcategory.name} · 세부 검사</p>
            <ul className="space-y-1">
              {activeSub.subcategory.items
                .filter((item) => !item.hidden)
                .map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm font-medium text-white hover:bg-white/10"
                    >
                      <span>{item.icon}</span>
                      {item.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
