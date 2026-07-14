'use client';

import AuthLink from '@/components/auth/AuthLink';
import { counselorHubClasses } from '@/components/layout/appChromeTheme';
import type { CounselorMainCategory } from '@/data/counselorMenu';
import { countCounselorCategoryActions } from '@/data/counselorMenu';

type CounselorCategoryHubProps = {
  category: CounselorMainCategory;
};

export default function CounselorCategoryHub({ category }: CounselorCategoryHubProps) {
  const actionCount = countCounselorCategoryActions(category);
  const sectionCount = category.subcategories.length;

  return (
    <div className="space-y-8">
      <section className={`relative overflow-hidden ${counselorHubClasses.hero}`}>
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-blue-100 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl ${counselorHubClasses.itemIcon}`}
            >
              {category.icon}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-blue-600">Counselor Hub</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                {category.category}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{category.description}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className={counselorHubClasses.statCard}>
              <p className="text-lg font-semibold text-slate-900">{sectionCount}</p>
              <p className="text-[11px] text-slate-500">중분류</p>
            </div>
            <div className={counselorHubClasses.statCard}>
              <p className="text-lg font-semibold text-slate-900">{actionCount}</p>
              <p className="text-[11px] text-slate-500">바로가기</p>
            </div>
          </div>
        </div>
        <div className="relative mt-5">
          <AuthLink
            href="/counselor"
            className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-blue-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            상담사 대시보드로 돌아가기
          </AuthLink>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {category.subcategories.map((subcategory) => (
          <section key={subcategory.name} className={counselorHubClasses.subsection}>
            <div className={`mb-4 flex items-center gap-3 ${counselorHubClasses.subsectionHeader}`}>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${counselorHubClasses.itemIcon}`}
              >
                {subcategory.icon}
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">중분류</p>
                <h2 className="text-lg font-semibold text-slate-900">{subcategory.name}</h2>
                <p className="text-xs text-slate-500">{subcategory.items.length}개 메뉴</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-1">
              {subcategory.items.map((item) => (
                <AuthLink
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-4 ${counselorHubClasses.item}`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center text-lg transition-transform duration-300 group-hover:scale-110 ${counselorHubClasses.itemIcon}`}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-slate-400">소분류</p>
                    <div className="truncate font-medium text-slate-900 group-hover:text-blue-700">{item.name}</div>
                    <div className="truncate text-xs text-slate-500 group-hover:text-slate-600">
                      {item.description}
                    </div>
                  </div>
                  <svg
                    className="h-4 w-4 shrink-0 text-slate-400 transition-all duration-300 group-hover:translate-x-1 group-hover:text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </AuthLink>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className={counselorHubClasses.footerNote}>
        <p className="text-sm text-slate-500">
          자주 쓰는 메뉴는 상단 네비게이션 <span className="text-slate-700 font-medium">상담관리</span>에서 대분류를
          선택해 다시 열 수 있습니다.
        </p>
      </section>
    </div>
  );
}
