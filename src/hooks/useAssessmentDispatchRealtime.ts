'use client';

import { useEffect, useMemo, useState } from 'react';
import { initializeFirebase } from '@/lib/firebase';
import type { AssessmentDispatchStatus } from '@/lib/clientPortalApi';
import {
  applyRealtimeTestResults,
  type RealtimeTestResultDoc,
} from '@/lib/dispatchRealtime';

type UseAssessmentDispatchRealtimeResult = {
  data: AssessmentDispatchStatus | null;
  isLive: boolean;
  liveError: string;
  lastUpdatedAt: Date | null;
};

export function useAssessmentDispatchRealtime(
  assessmentId: string,
  baseData: AssessmentDispatchStatus | null,
  enabled: boolean,
): UseAssessmentDispatchRealtimeResult {
  const [liveResults, setLiveResults] = useState<RealtimeTestResultDoc[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [liveError, setLiveError] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!enabled || !assessmentId || !baseData) {
      setLiveResults([]);
      setIsLive(false);
      setLiveError('');
      return;
    }

    let unsub: (() => void) | undefined;
    let cancelled = false;

    const setup = async () => {
      try {
        initializeFirebase();
        const { collection, query, where, onSnapshot } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        if (!db || cancelled) return;

        const q = query(
          collection(db, 'testResults'),
          where('assessmentId', '==', assessmentId),
        );

        unsub = onSnapshot(
          q,
          (snapshot) => {
            if (cancelled) return;
            const docs: RealtimeTestResultDoc[] = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...(doc.data() as Omit<RealtimeTestResultDoc, 'id'>),
            }));
            setLiveResults(docs);
            setIsLive(true);
            setLiveError('');
            setLastUpdatedAt(new Date());
          },
          (err) => {
            if (cancelled) return;
            setIsLive(false);
            setLiveError(err instanceof Error ? err.message : '실시간 연결 오류');
          },
        );
      } catch (err) {
        if (cancelled) return;
        setIsLive(false);
        setLiveError(err instanceof Error ? err.message : '실시간 연결 설정 실패');
      }
    };

    void setup();

    return () => {
      cancelled = true;
      unsub?.();
      setIsLive(false);
    };
  }, [assessmentId, enabled, baseData?.assessmentId]);

  const data = useMemo(() => {
    const base = baseData;
    if (!base) return null;
    if (liveResults.length === 0) {
      return {
        ...base,
        recipients: (base.recipients || []).map((row) => ({
          ...row,
          tests: row.tests?.map((t) => ({ ...t })),
        })),
      };
    }
    return applyRealtimeTestResults(base, liveResults);
  }, [baseData, liveResults, lastUpdatedAt]);

  return { data, isLive, liveError, lastUpdatedAt };
}
