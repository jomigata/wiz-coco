'use client';

import AuthLink from '@/components/auth/AuthLink';
import type { CounselorMainCategory } from '@/data/counselorMenu';
import { counselorHubClasses } from '@/components/layout/appChromeTheme';

type CounselorCategoryHubProps = {
  category: CounselorMainCategory;
};

export default function CounselorCategoryHub({ category }: CounselorCategoryHubProps) {
  const itemCount = category.subcategories.reduce((sum, sub) => sum + sub.items.length, 0);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
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
        <span className="text-xs text-sky-200/45">{itemCount}개 메뉴</span>
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
        className={`overflow-hidden rounded-xl border border-sky-400/12 ${counselorHubClasses.subsection} !p-0`}
      >
        {category.subcategories.map((sub, subIdx) => (
          <section
            key={sub.name}
            className={subIdx > 0 ? 'border-t border-sky-400/10' : undefined}
          >
            {/* 중분류 */}
            <div className="flex items-center gap-2 border-l-[3px] border-sky-400/50 bg-sky-500/[0.08] px-4 py-2.5">
              <span className="text-base leading-none" aria-hidden>
                {sub.icon}
              </span>
              <h2 className="text-xs font-semibold tracking-wide text-sky-100/90 sm:text-sm">
                {sub.name}
              </h2>
            </div>

            {/* 소분류 — 클릭 시 바로 이동 */}
            <ul className="divide-y divide-sky-400/[0.07]">
              {sub.items.map((item) => (
                <li key={item.href}>
                  <AuthLink
                    href={item.href}
                    className="group flex items-center gap-3 px-4 py-3.5 transition-all duration-200 hover:bg-sky-400/[0.12] hover:pl-5 active:bg-sky-400/[0.16]"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center text-lg transition-transform duration-200 group-hover:scale-105 ${counselorHubClasses.itemIcon}`}
                      aria-hidden
                    >
                      {item.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-white transition-colors group-hover:text-sky-50 sm:text-[15px]">
                        {item.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-sky-200/45 transition-colors group-hover:text-sky-200/65">
                        {item.description}
                      </span>
                    </span>
                    <svg
                      className="h-4 w-4 shrink-0 text-sky-300/30 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-sky-200/80"
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
