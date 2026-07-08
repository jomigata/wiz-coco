'use client';

import { useEffect, useMemo, useState } from 'react';
import { initializeFirebase } from '@/lib/firebase';
import type { CounselorMonitoringHubResult } from '@/types/clientPortal';
import { applyRealtimeToMonitoringHub } from '@/lib/monitoringRealtime';
import type { RealtimeTestResultDoc } from '@/lib/dispatchRealtime';

type UseCounselorMonitoringRealtimeResult = {
  data: CounselorMonitoringHubResult | null;
  isLive: boolean;
  liveError: string;
  lastUpdatedAt: Date | null;
};

export function useCounselorMonitoringRealtime(
  assessmentIds: string[],
  baseData: CounselorMonitoringHubResult | null,
  enabled: boolean,
): UseCounselorMonitoringRealtimeResult {
  const [liveResults, setLiveResults] = useState<RealtimeTestResultDoc[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [liveError, setLiveError] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const idsKey = assessmentIds.join(',');

  useEffect(() => {
    if (!enabled || !baseData || assessmentIds.length === 0) {
      setLiveResults([]);
      setIsLive(false);
      setLiveError('');
      return;
    }

    const unsubs: Array<() => void> = [];
    let cancelled = false;
    const merged = new Map<string, RealtimeTestResultDoc>();
    merged.clear();

    const publish = () => {
      if (cancelled) return;
      setLiveResults(Array.from(merged.values()));
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
  }, [enabled, baseData, idsKey]);

  const data = useMemo(() => {
    if (!baseData) return null;
    if (!isLive && liveResults.length === 0) return baseData;
    return applyRealtimeToMonitoringHub(baseData, liveResults);
  }, [baseData, isLive, liveResults]);

  return { data, isLive, liveError, lastUpdatedAt };
}
