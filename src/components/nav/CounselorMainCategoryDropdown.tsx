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
  userName?: string;
  userEmail?: string;
  onCloseMenu: () => void;
};

export default function CounselorMainCategoryDropdown({
  panelRef,
  dropdownAlign,
  menuDataAttribute,
  categories,
  userName,
  userEmail,
  onCloseMenu,
}: CounselorMainCategoryDropdownProps) {
  const displayName = userName || '상담사';
  const displayEmail = userEmail || '전문가 계정';

  return (
    <div
      ref={panelRef}
      data-dropdown-menu={menuDataAttribute}
      className={`absolute top-full z-[60] -mt-px w-96 min-w-[24rem] max-w-[28rem] rounded-2xl border border-sky-400/15 pt-3 pb-6 shadow-2xl animate-fadeIn ${dropdownAlign}`}
      style={{ backgroundColor: NAV_MEGA_MENU_BG }}
    >
      <div className="px-6 py-4 space-y-2">
        <div className="mb-4 rounded-xl border border-sky-400/25 bg-gradient-to-r from-sky-500/20 to-blue-500/20 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-lg font-bold text-white">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate font-semibold text-white">{displayName}</div>
              <div className="truncate text-sm text-sky-300">{displayEmail}</div>
            </div>
          </div>
        </div>

        <div className="mb-2 text-base font-semibold tracking-tight text-slate-300">👨‍⚕️ 상담관리</div>

        <div className="space-y-1">
          {categories.map((category, index) => (
            <Link
              key={category.slug}
              href={getCounselorCategoryHubHref(category.slug)}
              className={`group flex items-center gap-4 rounded-xl border-2 px-4 py-3 transition-all duration-300 ${
                index === 0 ? 'border-white' : 'border-white/20 hover:border-white'
              }`}
              onClick={onCloseMenu}
            >
              <div className="text-2xl transition-transform duration-300 group-hover:scale-110">
                {category.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-white">{category.category}</div>
                <div className="truncate text-xs text-sky-300">{category.description}</div>
              </div>
              <svg
                className="h-4 w-4 shrink-0 text-sky-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white"
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
