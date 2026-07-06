'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  TEST_CATEGORY_SLUGS,
  TEST_SUBCATEGORY_SLUGS,
  type TestCategory,
} from '@/data/psychologyTestMenu';

const DEFAULT_OPEN_SUB = '1a. 성격 및 기질 탐색';

type Props = {
  categories: TestCategory[];
  onCloseMenu: () => void;
};

function subKey(category: TestCategory, subName: string) {
  return `${category.category}::${subName}`;
}

function findDefaultSubKey(categories: TestCategory[]): string | null {
  for (const category of categories) {
    const sub = category.subcategories.find((s) => s.name === DEFAULT_OPEN_SUB && !s.hidden);
    if (sub) return subKey(category, sub.name);
  }
  const first = categories[0];
  const firstSub = first?.subcategories.find((s) => !s.hidden);
  if (first && firstSub) return subKey(first, firstSub.name);
  return null;
}

export default function AiPsychologyMegaMenuSubColumn({ categories, onCloseMenu }: Props) {
  const defaultKey = useMemo(() => findDefaultSubKey(categories), [categories]);
  const [activeSubKey, setActiveSubKey] = useState<string | null>(defaultKey);

  useEffect(() => {
    setActiveSubKey(defaultKey);
  }, [defaultKey]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="mb-3 shrink-0 border-b border-blue-500/25 pb-2">
        <p className="text-base font-bold text-white">🧠 AI 심리검사</p>
        <p className="text-[11px] text-blue-200/80">중분류 호버 시 세부 검사가 아래에 표시됩니다</p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-5 gap-2 overflow-hidden">
        {categories.map((category) => {
          const categorySlug = TEST_CATEGORY_SLUGS[category.category];
          return (
            <div
              key={category.category}
              className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a1020]/90"
            >
              <Link
                href={categorySlug ? `/tests?category=${categorySlug}` : '/tests'}
                onClick={onCloseMenu}
                className="shrink-0 border-b border-sky-500/35 bg-[#101828] px-2 py-2 transition-colors hover:bg-[#141f35]"
              >
                <span className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-sky-400">
                  대분류
                </span>
                <span className="flex items-start gap-1.5">
                  <span className="text-sm leading-none">{category.icon}</span>
                  <span className="text-[11px] font-bold leading-tight text-white">{category.category}</span>
                </span>
              </Link>

              <ul className="min-h-0 flex-1 space-y-1 overflow-hidden p-1.5">
                {category.subcategories
                  .filter((sub) => !sub.hidden)
                  .map((subcategory) => {
                    const key = subKey(category, subcategory.name);
                    const isExpanded = activeSubKey === key;
                    const subSlug = TEST_SUBCATEGORY_SLUGS[subcategory.name];
                    const subHref = subSlug
                      ? `/tests/${subSlug}`
                      : subcategory.items[0]?.href ?? '/tests';
                    const items = subcategory.items.filter((i) => !i.hidden);

                    return (
                      <li key={subcategory.name} onMouseEnter={() => setActiveSubKey(key)}>
                        <Link
                          href={subHref}
                          onClick={onCloseMenu}
                          className={`flex items-center gap-1 rounded-md border-l-2 px-1.5 py-1 transition-colors ${
                            isExpanded
                              ? 'border-l-sky-400 bg-sky-950/45'
                              : 'border-l-slate-600 bg-white/[0.04] hover:border-l-sky-500/50 hover:bg-white/[0.07]'
                          }`}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="mb-0.5 block text-[8px] font-semibold uppercase tracking-wide text-sky-300/75">
                              중분류
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="text-xs leading-none">{subcategory.icon}</span>
                              <span className="text-[10px] font-bold leading-tight text-white">
                                {subcategory.name}
                              </span>
                            </span>
                          </span>
                        </Link>

                        {isExpanded && items.length > 0 && (
                          <div className="mt-1 rounded border border-emerald-500/25 bg-[#070b14] p-1">
                            <p className="mb-0.5 border-b border-emerald-500/20 px-1 pb-0.5 text-[8px] font-bold uppercase tracking-wide text-emerald-400">
                              세부 검사
                            </p>
                            <ul className="space-y-0.5">
                              {items.map((item) => (
                                <li key={item.href}>
                                  <Link
                                    href={item.href}
                                    onClick={onCloseMenu}
                                    className="block rounded px-1 py-0.5 transition-colors hover:bg-emerald-950/35"
                                  >
                                    <span className="block text-[10px] font-bold leading-tight text-white">
                                      {item.icon} {item.name}
                                    </span>
                                    {item.description ? (
                                      <span className="mt-0.5 block text-[9px] leading-snug text-slate-300">
                                        {item.description}
                                      </span>
                                    ) : null}
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
