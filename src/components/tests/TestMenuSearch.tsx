'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { TestCategory } from '@/data/psychologyTestMenu';
import { buildTestSearchIndex, searchTests, type TestSearchResult } from '@/utils/testSearch';
import {
  ensureTestSearchKeywordsSeeded,
  fetchPopularSearchKeywords,
  recordTestSearchQuery,
} from '@/lib/firestore/testSearchStore';
import { pushWithAuthSession } from '@/utils/authSessionLifecycle';
import { logSearch } from '@/utils/firebaseAnalytics';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

type TestMenuSearchProps = {
  categories: TestCategory[];
  variant?: 'desktop' | 'mobile';
  onNavigate?: () => void;
  className?: string;
};

export default function TestMenuSearch({
  categories,
  variant = 'desktop',
  onNavigate,
  className = '',
}: TestMenuSearchProps) {
  const router = useRouter();
  const { user } = useFirebaseAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TestSearchResult[]>([]);
  const [focused, setFocused] = useState(false);
  const [popularity, setPopularity] = useState<Map<string, number>>(new Map());
  const index = useMemo(() => buildTestSearchIndex(categories), [categories]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLoggedRef = useRef('');

  useEffect(() => {
    void ensureTestSearchKeywordsSeeded();
    void fetchPopularSearchKeywords().then(setPopularity);
  }, []);

  const runSearch = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) {
        setResults([]);
        return;
      }
      const found = searchTests(trimmed, index, { limit: 8, popularity });
      setResults(found);

      if (trimmed.length >= 2 && trimmed !== lastLoggedRef.current) {
        lastLoggedRef.current = trimmed;
        logSearch(trimmed, 'psychology_test_menu');
        void recordTestSearchQuery(trimmed, found.length, found[0]?.href, user?.uid ?? null);
      }
    },
    [index, popularity, user?.uid],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 180);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  const handleSelect = (href: string) => {
    pushWithAuthSession(router, href);
    setQuery('');
    setResults([]);
    setFocused(false);
    onNavigate?.();
  };

  const showResults = focused && query.trim().length > 0;
  const isMobile = variant === 'mobile';

  return (
    <div className={`relative ${className}`}>
      <label className="sr-only" htmlFor={`test-menu-search-${variant}`}>
        검사 찾기
      </label>
      <div
        className={`flex items-center gap-2 rounded-xl border bg-white ${
          focused ? 'border-sky-400/60 ring-1 ring-sky-400/30' : 'border-blue-400/25'
        } ${isMobile ? 'px-3 py-2' : 'px-4 py-2.5'}`}
      >
        <span className="text-sky-300/90 shrink-0" aria-hidden>
          🔍
        </span>
        <input
          id={`test-menu-search-${variant}`}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 180)}
          placeholder="검사 찾기 (예: MBTI, 우울, 부부, 진로)"
          className={`w-full bg-transparent text-white placeholder:text-blue-300/50 outline-none ${
            isMobile ? 'text-sm' : 'text-sm'
          }`}
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="text-blue-300/70 hover:text-white text-xs shrink-0"
            aria-label="검색어 지우기"
          >
            ✕
          </button>
        )}
      </div>

      {showResults && (
        <div
          className={`absolute left-0 right-0 z-[60] mt-1 overflow-hidden rounded-xl border border-blue-400/30 bg-white shadow-2xl backdrop-blur-xl ${
            isMobile ? 'max-h-64' : 'max-h-72'
          } overflow-y-auto`}
        >
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-blue-300/80">
              &quot;{query}&quot;에 맞는 검사를 찾지 못했습니다. 다른 키워드를 입력해 보세요.
            </p>
          ) : (
            <ul className="py-1">
              {results.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-blue-900/40 transition-colors"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(item.href)}
                  >
                    <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-white truncate">{item.name}</span>
                      <span className="block text-xs text-blue-300/80 truncate">{item.description}</span>
                      <span className="block text-[10px] text-purple-300/70 mt-0.5 truncate">
                        {item.category} · {item.subcategory}
                        {item.matchReason ? ` · ${item.matchReason}` : ''}
                      </span>
                    </span>
                    <span className="text-blue-400 text-xs shrink-0 mt-1">→</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-blue-500/20 px-4 py-2">
            <Link
              href="/tests"
              className="text-xs text-blue-600 hover:text-blue-700"
              onClick={() => onNavigate?.()}
            >
              전체 검사 목록 보기 →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
