'use client';

import Link from 'next/link';
import type { RefObject } from 'react';
import type { CounselorMainCategory } from '@/data/counselorMenu';
import { getCounselorCategoryHubHref } from '@/data/counselorMenu';
import { navDropdownClasses } from '@/components/layout/appChromeTheme';

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
      className={`${navDropdownClasses.panel} pb-6 ${dropdownAlign}`}
    >
      <div className="px-6 py-4 space-y-2">
        <div className={navDropdownClasses.title}>👨‍⚕️ 상담관리</div>

        <div className="space-y-1">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={getCounselorCategoryHubHref(category.slug)}
              className={navDropdownClasses.item}
              onClick={onCloseMenu}
            >
              <div className="text-2xl transition-transform duration-300 group-hover:scale-110">
                {category.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className={navDropdownClasses.itemTitle}>{category.category}</div>
                <div className={navDropdownClasses.itemDesc}>{category.description}</div>
              </div>
              <svg
                className={navDropdownClasses.itemArrow}
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
