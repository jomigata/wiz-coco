'use client';

import AuthLink from '@/components/auth/AuthLink';
import type { CounselorMainCategory } from '@/data/counselorMenu';

type CounselorCategoryHubProps = {
  category: CounselorMainCategory;
};

export default function CounselorCategoryHub({ category }: CounselorCategoryHubProps) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 py-2">
      <header className="space-y-3">
        <AuthLink
          href="/counselor"
          className="inline-flex items-center gap-1.5 text-sm text-sky-300/70 transition-colors hover:text-sky-200"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          상담관리 홈
        </AuthLink>
        <div className="flex items-center gap-3">
          <span className="text-3xl leading-none" aria-hidden>
            {category.icon}
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {category.category}
            </h1>
            <p className="mt-1 text-sm text-sky-200/60">{category.description}</p>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        {category.subcategories.map((subcategory) => (
          <section key={subcategory.name}>
            <h2 className="mb-2 flex items-center gap-2 px-1 text-sm font-medium text-sky-200/80">
              <span aria-hidden>{subcategory.icon}</span>
              {subcategory.name}
            </h2>
            <ul className="overflow-hidden rounded-xl border border-sky-400/12 bg-[#1a3358]/70 divide-y divide-sky-400/10">
              {subcategory.items.map((item) => (
                <li key={item.href}>
                  <AuthLink
                    href={item.href}
                    className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.05]"
                  >
                    <span className="w-7 shrink-0 text-center text-lg" aria-hidden>
                      {item.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-white group-hover:text-sky-50">
                        {item.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-sky-200/50 group-hover:text-sky-200/70">
                        {item.description}
                      </span>
                    </span>
                    <svg
                      className="h-4 w-4 shrink-0 text-sky-300/40 transition-all group-hover:translate-x-0.5 group-hover:text-sky-200/80"
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
      </div>
    </div>
  );
}
