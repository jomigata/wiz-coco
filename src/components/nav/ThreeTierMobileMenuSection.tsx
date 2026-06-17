'use client';

import Link from 'next/link';
import type { TestCategory, TestSubcategory } from '@/data/psychologyTestMenu';

type ThreeTierMobileMenuSectionProps = {
  sectionTitle: string;
  categories: TestCategory[];
  selectedMainCategory: string | null;
  selectedSubcategory: string | null;
  onToggleMainCategory: (category: string) => void;
  onSelectSubcategory: (name: string) => void;
  onSubcategoryPress?: (subcategory: TestSubcategory) => void;
  onCloseMenu: () => void;
  searchSlot?: React.ReactNode;
  mainToneClass?: string;
  subToneClass?: string;
};

export default function ThreeTierMobileMenuSection({
  sectionTitle,
  categories,
  selectedMainCategory,
  selectedSubcategory,
  onToggleMainCategory,
  onSelectSubcategory,
  onSubcategoryPress,
  onCloseMenu,
  searchSlot,
  mainToneClass = 'text-blue-200 bg-blue-500/20 hover:bg-blue-500/30',
  subToneClass = 'text-purple-300 bg-purple-500/20 hover:bg-purple-500/30',
}: ThreeTierMobileMenuSectionProps) {
  return (
    <div className="space-y-3">
      <div className="px-4 py-2 text-sm font-semibold text-blue-300 uppercase tracking-wide border-b border-blue-500/30">
        {sectionTitle}
      </div>
      {searchSlot && <div className="px-2">{searchSlot}</div>}
      <div className="space-y-2">
        {categories.map((mainCategory) => (
          <div key={mainCategory.category} className="space-y-2">
            <div
              className={`flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-lg cursor-pointer transition-all duration-300 ${
                selectedMainCategory === mainCategory.category ? 'bg-blue-600 text-white' : mainToneClass
              }`}
              onClick={() => onToggleMainCategory(mainCategory.category)}
            >
              <span className="w-8 shrink-0 inline-flex items-center justify-center text-lg">{mainCategory.icon}</span>
              <span className="flex-1">{mainCategory.category}</span>
              <svg
                className={`w-4 h-4 transition-transform duration-300 ${
                  selectedMainCategory === mainCategory.category ? 'rotate-90' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>

            {selectedMainCategory === mainCategory.category && (
              <div className="ml-4 space-y-2 animate-fadeIn">
                {mainCategory.subcategories.map((subcategory) => (
                  <div key={subcategory.name} className="space-y-1">
                    <div
                      className={`flex items-center gap-2 px-2 py-1 text-base font-bold rounded cursor-pointer transition-all duration-300 ${
                        selectedSubcategory === subcategory.name ? 'bg-purple-500/30' : subToneClass
                      }`}
                      onClick={() => {
                        if (onSubcategoryPress) {
                          onSubcategoryPress(subcategory);
                          return;
                        }
                        onSelectSubcategory(
                          selectedSubcategory === subcategory.name ? '' : subcategory.name
                        );
                      }}
                    >
                      <span className="w-8 shrink-0 inline-flex items-center justify-center text-lg">
                        {subcategory.icon}
                      </span>
                      <span className="flex-1">{subcategory.name}</span>
                      <svg
                        className={`w-4 h-4 transition-transform duration-300 ${
                          selectedSubcategory === subcategory.name ? 'rotate-90' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    {selectedSubcategory === subcategory.name && (
                      <div className="ml-4 space-y-1 animate-fadeIn-slow">
                        {subcategory.items.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-blue-800/30 rounded-lg transition-all duration-300"
                            onClick={onCloseMenu}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs">{item.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium">{item.name}</div>
                                <div className="text-xs text-gray-400">{item.description}</div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
