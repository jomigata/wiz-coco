'use client';

import AuthLink from '@/components/auth/AuthLink';
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
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-blue-950/40 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-3xl">
              {category.icon}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-sky-300/80">Counselor Hub</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {category.category}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">{category.description}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center">
              <p className="text-lg font-semibold text-white">{sectionCount}</p>
              <p className="text-[11px] text-slate-500">중분류</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center">
              <p className="text-lg font-semibold text-white">{actionCount}</p>
              <p className="text-[11px] text-slate-500">바로가기</p>
            </div>
          </div>
        </div>
        <div className="relative mt-5">
          <AuthLink
            href="/counselor"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-sky-300"
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
          <section
            key={subcategory.name}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
          >
            <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-xl">
                {subcategory.icon}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{subcategory.name}</h2>
                <p className="text-xs text-slate-500">{subcategory.items.length}개 메뉴</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-1">
              {subcategory.items.map((item) => (
                <AuthLink
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-4 rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3.5 transition-all duration-300 hover:border-sky-400/35 hover:bg-sky-500/[0.06] hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-lg transition-transform duration-300 group-hover:scale-110">
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-white group-hover:text-sky-100">{item.name}</div>
                    <div className="truncate text-xs text-slate-500 group-hover:text-slate-400">
                      {item.description}
                    </div>
                  </div>
                  <svg
                    className="h-4 w-4 shrink-0 text-slate-500 transition-all duration-300 group-hover:translate-x-1 group-hover:text-sky-300"
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

      <section className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5">
        <p className="text-sm text-slate-500">
          자주 쓰는 메뉴는 상단 네비게이션 <span className="text-slate-300">상담관리</span>에서 대분류를
          선택해 다시 열 수 있습니다.
        </p>
      </section>
    </div>
  );
}
