import {
  flattenTestMenuItems,
  getVisibleTestMenuItems,
  type FlatTestMenuItem,
  type TestCategory,
} from '@/data/psychologyTestMenu';
import {
  IMPLEMENTED_TEST_HREF,
  TEST_SEARCH_SEED,
  type TestSearchSeedEntry,
} from '@/data/testSearchKeywords';

export interface TestSearchResult {
  id: string;
  name: string;
  href: string;
  description: string;
  icon: string;
  category: string;
  subcategory: string;
  score: number;
  matchReason?: string;
  source: 'menu' | 'seed' | 'server';
}

export interface TestSearchEntry {
  id: string;
  name: string;
  href: string;
  description: string;
  icon: string;
  category: string;
  subcategory: string;
  keywords: string[];
  source: 'menu' | 'seed';
}

function normalizeTerm(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function tokenize(text: string): string[] {
  return normalizeTerm(text)
    .split(/[\s,，.!?·…/]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 1);
}

function resolveHref(href: string, subcategorySlug?: string): string {
  if (IMPLEMENTED_TEST_HREF[href]) return IMPLEMENTED_TEST_HREF[href];
  if (href.startsWith('/tests/') && href.split('/').length === 3) {
    return href;
  }
  if (subcategorySlug) return `/tests/${subcategorySlug}`;
  return href;
}

function menuItemToEntry(item: FlatTestMenuItem): TestSearchEntry {
  const extraKeywords = [
    item.name,
    item.category,
    item.subcategory,
    item.description,
    item.id.replace(/-/g, ' '),
  ];
  return {
    id: item.id,
    name: item.name,
    href: resolveHref(item.href, item.subcategorySlug),
    description: item.description,
    icon: item.icon,
    category: item.category,
    subcategory: item.subcategory,
    keywords: Array.from(new Set(extraKeywords.map(normalizeTerm))),
    source: 'menu',
  };
}

function seedToEntry(seed: TestSearchSeedEntry, index: number): TestSearchEntry {
  return {
    id: `seed-${index}-${normalizeTerm(seed.name).slice(0, 24)}`,
    name: seed.name,
    href: resolveHref(seed.href),
    description: seed.description,
    icon: seed.icon,
    category: seed.category,
    subcategory: seed.subcategory,
    keywords: Array.from(new Set([...seed.keywords, seed.name, seed.description].map(normalizeTerm))),
    source: 'seed',
  };
}

/** 메뉴 + 시드 키워드를 합친 검색 인덱스 (href 기준 중복 시 메뉴 우선) */
export function buildTestSearchIndex(categories?: TestCategory[]): TestSearchEntry[] {
  const menu = flattenTestMenuItems(categories ?? getVisibleTestMenuItems());
  const byHref = new Map<string, TestSearchEntry>();

  for (const item of menu) {
    const entry = menuItemToEntry(item);
    byHref.set(entry.href, entry);
  }

  TEST_SEARCH_SEED.forEach((seed, i) => {
    const entry = seedToEntry(seed, i);
    const key = entry.href;
    const existing = byHref.get(key);
    if (existing) {
      existing.keywords = Array.from(new Set([...existing.keywords, ...entry.keywords]));
      return;
    }
    byHref.set(key, entry);
  });

  return Array.from(byHref.values());
}

function scoreEntry(
  entry: TestSearchEntry,
  query: string,
  tokens: string[],
  popularityBoost: number,
): { score: number; reason?: string } {
  const q = normalizeTerm(query);
  if (!q) return { score: 0 };

  let score = popularityBoost;
  let reason: string | undefined;

  const nameNorm = normalizeTerm(entry.name);
  const descNorm = normalizeTerm(entry.description);
  const catNorm = normalizeTerm(entry.category);
  const subNorm = normalizeTerm(entry.subcategory);

  if (nameNorm.includes(q) || q.includes(nameNorm)) {
    score += 12;
    reason = '검사명 일치';
  }
  if (descNorm.includes(q)) {
    score += 4;
    reason = reason ?? '설명 일치';
  }
  if (catNorm.includes(q) || subNorm.includes(q)) {
    score += 3;
    reason = reason ?? '카테고리 일치';
  }

  for (const kw of entry.keywords) {
    if (kw.length < 2) continue;
    if (q === kw || kw === q) {
      score += 10;
      reason = reason ?? `키워드 "${kw}"`;
    } else if (q.includes(kw) || kw.includes(q)) {
      score += 6;
      reason = reason ?? `키워드 "${kw}"`;
    }
  }

  for (const token of tokens) {
    if (token.length < 2) continue;
    if (nameNorm.includes(token)) score += 3;
    if (entry.keywords.some((k) => k.includes(token) || token.includes(k))) {
      score += 2;
      reason = reason ?? `연관 "${token}"`;
    }
  }

  return { score, reason };
}

/** 검색어에 맞는 검사 추천 (점수 내림차순, 최대 limit개) */
export function searchTests(
  query: string,
  index: TestSearchEntry[],
  options?: { limit?: number; popularity?: Map<string, number> },
): TestSearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const limit = options?.limit ?? 8;
  const popularity = options?.popularity ?? new Map<string, number>();
  const tokens = tokenize(trimmed);

  const ranked = index
    .map((entry) => {
      const normalizedName = normalizeTerm(entry.name);
      const boost =
        popularity.get(normalizedName) ??
        popularity.get(normalizeTerm(trimmed)) ??
        0;
      const { score, reason } = scoreEntry(entry, trimmed, tokens, Math.min(boost, 5));
      return {
        id: entry.id,
        name: entry.name,
        href: entry.href,
        description: entry.description,
        icon: entry.icon,
        category: entry.category,
        subcategory: entry.subcategory,
        score,
        matchReason: reason,
        source: entry.source,
      } satisfies TestSearchResult;
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return ranked;
}

export function normalizeSearchTerm(term: string): string {
  return normalizeTerm(term);
}
