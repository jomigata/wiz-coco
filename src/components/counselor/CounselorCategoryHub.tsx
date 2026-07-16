'use client';

import AuthLink from '@/components/auth/AuthLink';
import type { CounselorMainCategory } from '@/data/counselorMenu';
import { counselorHubClasses } from '@/components/layout/appChromeTheme';

type CounselorCategoryHubProps = {
  category: CounselorMainCategory;
};

export default function CounselorCategoryHub({ category }: CounselorCategoryHubProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <header>
        <AuthLink
          href="/counselor"
          className="inline-flex items-center gap-1 text-sm text-sky-300/70 transition-colors hover:text-sky-200"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          상담관리 홈
        </AuthLink>
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

      <nav
        aria-label={`${category.category} 메뉴`}
        className="flex flex-col gap-4"
      >
        {category.subcategories.map((sub) => (
          <section
            key={sub.name}
            className={`overflow-hidden rounded-xl border border-sky-400/20 ${counselorHubClasses.subsection} !p-0`}
          >
            {/* 중분류 — 강조 헤더 띠 */}
            <div className="flex items-center gap-2.5 border-b border-sky-400/25 bg-gradient-to-r from-sky-600/25 via-sky-500/15 to-transparent px-4 py-3">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-300/30 bg-sky-950/50 text-base"
                aria-hidden
              >
                {sub.icon}
              </span>
              <h2 className="text-sm font-bold tracking-tight text-white sm:text-base">{sub.name}</h2>
            </div>

            {/* 소분류 — 들여쓰기·카드형 행 */}
            <ul className="space-y-1.5 bg-[#0f1d33]/60 p-2.5 sm:p-3">
              {sub.items.map((item) => (
                <li key={item.href}>
                  <AuthLink
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-lg border border-white/[0.06] bg-[#101f38]/90 px-3.5 py-3 transition-all duration-200 hover:border-sky-400/35 hover:bg-sky-500/[0.14] hover:shadow-[0_4px_20px_rgba(56,130,210,0.12)] active:scale-[0.995] sm:px-4 sm:py-3.5 ${counselorHubClasses.item}`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center text-lg transition-transform duration-200 group-hover:scale-105 ${counselorHubClasses.itemIcon}`}
                      aria-hidden
                    >
                      {item.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-white transition-colors group-hover:text-sky-50 sm:text-[15px]">
                        {item.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-400 transition-colors group-hover:text-sky-200/70">
                        {item.description}
                      </span>
                    </span>
                    <svg
                      className="h-4 w-4 shrink-0 text-sky-300/35 transition-all duration-200 group-hover:translate-x-1 group-hover:text-sky-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </AuthLink>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>
    </div>
  );
}
