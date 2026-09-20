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

const FIRESTORE_IN_CHUNK = 10;

/** When set, only subscribe to testResults for these portals (TASK-022). */
export function useAssessmentDispatchRealtime(
  assessmentId: string,
  baseData: AssessmentDispatchStatus | null,
  enabled: boolean,
  portalIds?: string[] | null,
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

        const ids = (portalIds || [])
          .map((id) => id.trim())
          .filter(Boolean)
          .slice(0, 200);
        if (ids.length === 0) {
          setLiveResults([]);
          setIsLive(false);
          return;
        }
        const chunks: string[][] = [];
        for (let i = 0; i < ids.length; i += FIRESTORE_IN_CHUNK) {
          chunks.push(ids.slice(i, i + FIRESTORE_IN_CHUNK));
        }

        const mergedById = new Map<string, RealtimeTestResultDoc>();
        const unsubs: (() => void)[] = [];

        const publishMerged = () => {
          if (cancelled) return;
          setLiveResults(Array.from(mergedById.values()));
          setIsLive(true);
          setLiveError('');
          setLastUpdatedAt(new Date());
        };

        for (const chunk of chunks) {
          const q = query(
            collection(db, 'testResults'),
            where('assessmentId', '==', assessmentId),
            where('portalId', 'in', chunk),
          );
          const off = onSnapshot(
            q,
            (snapshot) => {
              if (cancelled) return;
              for (const change of snapshot.docChanges()) {
                const id = change.doc.id;
                if (change.type === 'removed') {
                  mergedById.delete(id);
                } else {
                  mergedById.set(id, {
                    id,
                    ...(change.doc.data() as Omit<RealtimeTestResultDoc, 'id'>),
                  });
                }
              }
              publishMerged();
            },
            (err) => {
              if (cancelled) return;
              setIsLive(false);
              setLiveError(err instanceof Error ? err.message : '실시간 연결 오류');
            },
          );
          unsubs.push(off);
        }
        unsub = () => unsubs.forEach((fn) => fn());
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
  }, [assessmentId, enabled, baseData?.assessmentId, portalIds?.join('|')]);

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
