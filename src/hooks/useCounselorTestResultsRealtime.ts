'use client';

import { useEffect, useState } from 'react';
import { initializeFirebase } from '@/lib/firebase';
import type { RealtimeTestResultDoc } from '@/lib/dispatchRealtime';

export type UseCounselorTestResultsRealtimeResult = {
  results: RealtimeTestResultDoc[];
  isLive: boolean;
  liveError: string;
  lastUpdatedAt: Date | null;
};

/** 상담사 CRM·모니터링 — 검사코드별 testResults 실시간 구독 */
export function useCounselorTestResultsRealtime(
  assessmentIds: string[],
  enabled: boolean,
): UseCounselorTestResultsRealtimeResult {
  const [results, setResults] = useState<RealtimeTestResultDoc[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [liveError, setLiveError] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const idsKey = assessmentIds.join(',');

  useEffect(() => {
    if (!enabled || assessmentIds.length === 0) {
      setResults([]);
      setIsLive(false);
      setLiveError('');
      return;
    }

    const unsubs: Array<() => void> = [];
    let cancelled = false;
    const merged = new Map<string, RealtimeTestResultDoc>();

    const publish = () => {
      if (cancelled) return;
      setResults(Array.from(merged.values()));
      setIsLive(true);
      setLiveError('');
      setLastUpdatedAt(new Date());
    };

    const setup = async () => {
      try {
        initializeFirebase();
        const { collection, query, where, onSnapshot } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        if (!db || cancelled) return;

        for (const assessmentId of assessmentIds) {
          const q = query(
            collection(db, 'testResults'),
            where('assessmentId', '==', assessmentId),
          );
          const unsub = onSnapshot(
            q,
            (snapshot) => {
              if (cancelled) return;
              for (const doc of snapshot.docs) {
                merged.set(doc.id, {
                  id: doc.id,
                  ...(doc.data() as Omit<RealtimeTestResultDoc, 'id'>),
                });
              }
              snapshot.docChanges().forEach((change) => {
                if (change.type === 'removed') merged.delete(change.doc.id);
              });
              publish();
            },
            (err) => {
              if (cancelled) return;
              setIsLive(false);
              setLiveError(err instanceof Error ? err.message : '실시간 연결 오류');
            },
          );
          unsubs.push(unsub);
        }
      } catch (err) {
        if (cancelled) return;
        setIsLive(false);
        setLiveError(err instanceof Error ? err.message : '실시간 연결 설정 실패');
      }
    };

    void setup();

    return () => {
      cancelled = true;
      unsubs.forEach((u) => u());
      setIsLive(false);
    };
  }, [enabled, idsKey]);

  return { results, isLive, liveError, lastUpdatedAt };
}
