'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  TEST_CATEGORY_SLUGS,
  TEST_SUBCATEGORY_SLUGS,
  type TestCategory,
} from '@/data/psychologyTestMenu';

type Props = {
  categories: TestCategory[];
  onCloseMenu: () => void;
};

const DEFAULT_SUB = '1a. 성격 및 기질 탐색';

export default function AiPsychologyTestMegaMenuColumn({ categories, onCloseMenu }: Props) {
  const [selectedMain, setSelectedMain] = useState(categories[0]?.category ?? '');
  const [hoveredSub, setHoveredSub] = useState<string | null>(null);

  const activeMain = categories.find((c) => c.category === selectedMain) ?? categories[0];
  const activeSub =
    activeMain?.subcategories.find((s) => s.name === hoveredSub && !s.hidden) ??
    activeMain?.subcategories.find((s) => !s.hidden);

  useEffect(() => {
    if (!categories.length) return;
    const first = categories[0];
    setSelectedMain(first.category);
    const defaultSub =
      first.subcategories.find((s) => s.name === DEFAULT_SUB && !s.hidden) ??
      first.subcategories.find((s) => !s.hidden);
    setHoveredSub(defaultSub?.name ?? null);
  }, [categories]);

  if (!activeMain) return null;

  return (
    <div className="flex flex-col overflow-visible">
      <div className="mb-3 shrink-0">
        <p className="text-lg font-bold text-blue-200">🧠 AI 심리검사</p>
        <p className="text-xs text-blue-300/80">중분류에 마우스를 올리면 세부 검사가 표시됩니다</p>
      </div>

      <div className="flex gap-0 overflow-visible">
        {/* 대분류 */}
        <div className="w-[11.5rem] shrink-0 overflow-visible border-r border-blue-500/25 pr-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-sky-400">대분류</p>
          <ul className="space-y-1 overflow-visible">
            {categories.map((category) => {
              const slug = TEST_CATEGORY_SLUGS[category.category];
              const isActive = selectedMain === category.category;
              return (
                <li key={category.category}>
                  <button
                    type="button"
                    onMouseEnter={() => {
                      setSelectedMain(category.category);
                      const firstSub = category.subcategories.find((s) => !s.hidden);
                      setHoveredSub(firstSub?.name ?? null);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-all ${
                      isActive
                        ? 'border-white bg-white/10 text-white'
                        : 'border-white/15 text-blue-200 hover:border-white/40 hover:text-white'
                    }`}
                  >
                    <span className="shrink-0 text-base">{category.icon}</span>
                    <span className="min-w-0 flex-1 text-xs font-semibold leading-snug">{category.category}</span>
                  </button>
                  {isActive && slug && (
                    <Link
                      href={`/tests?category=${slug}`}
                      onClick={onCloseMenu}
                      className="mt-0.5 block px-1 text-[10px] text-sky-300/80 hover:text-sky-200"
                    >
                      영역 페이지 →
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* 중분류 — 스크롤 없음 */}
        <div className="w-[11.5rem] shrink-0 overflow-visible border-r border-blue-500/25 px-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-violet-300">중분류</p>
          <ul className="space-y-1 overflow-visible">
            {activeMain.subcategories
              .filter((sub) => !sub.hidden)
              .map((sub) => {
                const subSlug = TEST_SUBCATEGORY_SLUGS[sub.name];
                const isHovered = hoveredSub === sub.name;
                return (
                  <li key={sub.name}>
                    <Link
                      href={subSlug ? `/tests/${subSlug}` : sub.items[0]?.href ?? '/tests'}
                      onClick={onCloseMenu}
                      onMouseEnter={() => setHoveredSub(sub.name)}
                      className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 transition-all ${
                        isHovered
                          ? 'border-violet-300/60 bg-violet-500/15 text-white'
                          : 'border-white/10 text-blue-100 hover:border-white/30 hover:bg-white/5'
                      }`}
                    >
                      <span className="shrink-0 text-sm">{sub.icon}</span>
                      <span className="min-w-0 flex-1 text-xs font-medium leading-snug">{sub.name}</span>
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>

        {/* 소분류 — 중분류 아래 펼침, 스크롤 없음 */}
        <div className="min-w-[14rem] flex-1 overflow-visible pl-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">세부 검사</p>
          {activeSub ? (
            <div className="overflow-visible rounded-xl border border-white/15 bg-[#0a1020]/90 p-2">
              <p className="mb-1.5 flex items-center gap-1.5 px-1 text-xs font-semibold text-violet-100">
                <span>{activeSub.icon}</span>
                {activeSub.name}
              </p>
              <ul className="space-y-0.5 overflow-visible">
                {activeSub.items
                  .filter((item) => !item.hidden)
                  .map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onCloseMenu}
                        className="group block rounded-lg px-2 py-2 transition-colors hover:bg-white/10"
                      >
                        <span className="flex items-center gap-1.5 text-sm font-medium text-white group-hover:text-sky-100">
                          <span className="text-sm">{item.icon}</span>
                          {item.name}
                        </span>
                        {item.description ? (
                          <span className="mt-0.5 block text-xs leading-relaxed text-slate-300 group-hover:text-slate-200">
                            {item.description}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-blue-300/70">중분류를 선택해 주세요</p>
          )}
        </div>
      </div>
    </div>
  );
}
