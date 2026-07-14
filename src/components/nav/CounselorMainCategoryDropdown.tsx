'use client';

import Link from 'next/link';
import type { RefObject } from 'react';
import type { CounselorMainCategory } from '@/data/counselorMenu';
import { getCounselorCategoryHubHref } from '@/data/counselorMenu';
import { NAV_MEGA_MENU_BG } from '@/components/layout/appChromeTheme';

type CounselorMainCategoryDropdownProps = {
  panelRef: RefObject<HTMLDivElement | null>;
  dropdownAlign: string;
  menuDataAttribute: string;
  categories: CounselorMainCategory[];
  onCloseMenu: () => void;
};

export default function CounselorMainCategoryDropdown({
  panelRef,
  dropdownAlign,
  menuDataAttribute,
  categories,
  onCloseMenu,
}: CounselorMainCategoryDropdownProps) {
  return (
    <div
      ref={panelRef}
      data-dropdown-menu={menuDataAttribute}
      className={`absolute top-full z-[60] -mt-px w-96 min-w-[24rem] max-w-[28rem] rounded-2xl border border-slate-200/70 pt-3 pb-6 shadow-[0_24px_64px_rgba(30,60,100,0.12)] animate-fadeIn ${dropdownAlign}`}
      style={{ backgroundColor: NAV_MEGA_MENU_BG }}
    >
      <div className="px-6 py-4 space-y-2">
        <div className="mb-2 text-base font-semibold tracking-tight text-slate-500">👨‍⚕️ 상담관리</div>

        <div className="space-y-1">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={getCounselorCategoryHubHref(category.slug)}
              className="group flex items-center gap-4 rounded-xl border-2 border-transparent px-4 py-3 transition-all duration-300 hover:border-sky-300/70 hover:bg-sky-50/80"
              onClick={onCloseMenu}
            >
              <div className="text-2xl transition-transform duration-300 group-hover:scale-110">
                {category.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-slate-800">{category.category}</div>
                <div className="truncate text-xs text-slate-500">{category.description}</div>
              </div>
              <svg
                className="h-4 w-4 shrink-0 text-slate-400 transition-all duration-300 group-hover:translate-x-1 group-hover:text-sky-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
