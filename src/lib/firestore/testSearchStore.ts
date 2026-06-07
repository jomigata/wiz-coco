import {
  collection,
  doc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import { normalizeSearchTerm } from '@/utils/testSearch';
import { TEST_SEARCH_SEED } from '@/data/testSearchKeywords';

const KEYWORDS_COLLECTION = 'testSearchKeywords';
const QUERIES_COLLECTION = 'testSearchQueries';

export type TestSearchKeywordDoc = {
  term: string;
  normalizedTerm: string;
  href: string;
  testName: string;
  aliases: string[];
  searchCount: number;
  source: 'seed' | 'user';
  lastSearchedAt?: ReturnType<typeof serverTimestamp>;
  updatedAt?: ReturnType<typeof serverTimestamp>;
};

let seedPromise: Promise<void> | null = null;

function getDb() {
  const { db } = initializeFirebase();
  if (!db) throw new Error('Firestore가 초기화되지 않았습니다.');
  return db;
}

/** 시드 키워드를 Firestore에 1회 동기화 */
export async function ensureTestSearchKeywordsSeeded(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    try {
      const db = getDb();
      const existing = await getDocs(query(collection(db, KEYWORDS_COLLECTION), limit(1)));
      if (!existing.empty) return;

      const batch = writeBatch(db);
      for (const seed of TEST_SEARCH_SEED) {
        for (const kw of seed.keywords) {
          const normalizedTerm = normalizeSearchTerm(kw);
          if (!normalizedTerm || normalizedTerm.length < 2) continue;
          const ref = doc(db, KEYWORDS_COLLECTION, normalizedTerm.replace(/[/\\]/g, '_'));
          batch.set(
            ref,
            {
              term: kw,
              normalizedTerm,
              href: seed.href,
              testName: seed.name,
              aliases: seed.keywords.slice(0, 12),
              searchCount: 0,
              source: 'seed',
              updatedAt: serverTimestamp(),
            } satisfies TestSearchKeywordDoc,
            { merge: true },
          );
        }
      }
      await batch.commit();
    } catch (err) {
      console.warn('[TestSearchStore] 시드 동기화 생략:', err);
    }
  })();

  return seedPromise;
}

/** 인기 검색어 부스트 맵 */
export async function fetchPopularSearchKeywords(max = 40): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (typeof window === 'undefined') return map;

  try {
    const db = getDb();
    const q = query(
      collection(db, KEYWORDS_COLLECTION),
      orderBy('searchCount', 'desc'),
      limit(max),
    );
    const snap = await getDocs(q);
    snap.forEach((d) => {
      const data = d.data() as TestSearchKeywordDoc;
      if (data.normalizedTerm && data.searchCount > 0) {
        map.set(data.normalizedTerm, data.searchCount);
      }
      if (data.testName) {
        map.set(normalizeSearchTerm(data.testName), data.searchCount);
      }
    });
  } catch (err) {
    console.warn('[TestSearchStore] 인기 검색어 로드 실패:', err);
  }

  return map;
}

/** 사용자 검색어·매칭 결과 서버 저장 */
export async function recordTestSearchQuery(
  term: string,
  resultCount: number,
  topHref?: string,
  uid?: string | null,
): Promise<void> {
  if (typeof window === 'undefined') return;
  const normalizedTerm = normalizeSearchTerm(term);
  if (!normalizedTerm || normalizedTerm.length < 1) return;

  try {
    const db = getDb();
    const queryRef = doc(collection(db, QUERIES_COLLECTION));
    await setDoc(queryRef, {
      term: term.slice(0, 100),
      normalizedTerm,
      resultCount,
      topHref: topHref ?? null,
      uid: uid ?? null,
      createdAt: serverTimestamp(),
    });

    const kwRef = doc(db, KEYWORDS_COLLECTION, normalizedTerm.replace(/[/\\]/g, '_'));
    await setDoc(
      kwRef,
      {
        term: term.slice(0, 100),
        normalizedTerm,
        href: topHref ?? '',
        testName: term.slice(0, 100),
        aliases: [normalizedTerm],
        searchCount: increment(1),
        source: 'user',
        lastSearchedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (err) {
    console.warn('[TestSearchStore] 검색 기록 저장 실패:', err);
  }
}
