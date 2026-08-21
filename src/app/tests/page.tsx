'use client';

import React, { useMemo, useState, useEffect, Suspense } from 'react';
import { LoadingMessage } from '@/components/ui/LoadingMessage';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  flattenTestMenuItems,
  getVisibleTestMenuItems,
  TEST_CATEGORY_SLUGS,
} from '@/data/psychologyTestMenu';

function TestsContent() {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = useMemo(() => getVisibleTestMenuItems(), []);
  const tests = useMemo(() => flattenTestMenuItems(categories), [categories]);

  const categoryFilters = useMemo(
    () => [
      { id: 'all', name: '전체보기' },
      ...categories.map((c) => ({
        id: TEST_CATEGORY_SLUGS[c.category] || c.category,
        name: c.category,
      })),
    ],
    [categories],
  );

  useEffect(() => {
    const category = searchParams.get('category');
    if (category) setSelectedCategory(category);
  }, [searchParams]);

  const filteredTests =
    selectedCategory === 'all'
      ? tests
      : tests.filter((t) => (TEST_CATEGORY_SLUGS[t.category] || t.category) === selectedCategory);

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 min-h-full">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-3xl">
              🧠
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">이용 가능한 심리검사</h1>
              <p className="text-gray-300 text-lg mt-2">
                끝까지 진행할 수 있는 검사만 보여 줍니다. 준비 중인 항목은 메뉴에 두지 않습니다.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {categoryFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setSelectedCategory(filter.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  selectedCategory === filter.id
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                }`}
              >
                <span className="text-sm">{filter.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-gray-400 text-sm">지금 이용 가능</p>
            <p className="text-white text-xl font-bold">{tests.length}개</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTests.map((test) => (
            <Link key={test.href} href={test.href} className="block">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 hover:bg-white/15 hover:scale-[1.02] transition-all duration-300 flex flex-col h-full cursor-pointer">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                    {test.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white leading-tight">{test.name}</h3>
                    <p className="text-xs text-gray-400">{test.category}</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{test.description}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-2">안내</h3>
            <p className="text-gray-300 text-sm">
              검사가 더 준비되면 이 목록에만 추가합니다. 상담사는 상담코드 생성 시에도 같은 목록만
              고를 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PsychologyTestsPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 min-h-full">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <LoadingMessage textClassName="text-gray-300" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <TestsContent />
    </Suspense>
  );
}
