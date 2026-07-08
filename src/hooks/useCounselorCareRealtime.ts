'use client';

import { useEffect, useMemo, useState } from 'react';
import { initializeFirebase } from '@/lib/firebase';
import type { CounselorCareAssignmentListItem } from '@/types/careAssignment';
import {
  applyRealtimeToCareAssignments,
  type RealtimeCareAssignmentDoc,
  type RealtimeCareProgressDoc,
} from '@/lib/careMonitoringRealtime';

type UseCounselorCareRealtimeResult = {
  data: CounselorCareAssignmentListItem[] | null;
  isLive: boolean;
  liveError: string;
  lastUpdatedAt: Date | null;
};

export function useCounselorCareRealtime(
  counselorUid: string | undefined,
  baseItems: CounselorCareAssignmentListItem[] | null,
  enabled: boolean,
): UseCounselorCareRealtimeResult {
  const [progressDocs, setProgressDocs] = useState<RealtimeCareProgressDoc[]>([]);
  const [assignmentDocs, setAssignmentDocs] = useState<RealtimeCareAssignmentDoc[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [liveError, setLiveError] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    const uid = (counselorUid || '').trim();
    if (!enabled || !uid || !baseItems) {
      setProgressDocs([]);
      setAssignmentDocs([]);
      setIsLive(false);
      setLiveError('');
      return;
    }

    const unsubs: Array<() => void> = [];
    let cancelled = false;
    const progressMerged = new Map<string, RealtimeCareProgressDoc>();
    const assignmentMerged = new Map<string, RealtimeCareAssignmentDoc>();

    const publish = () => {
      if (cancelled) return;
      setProgressDocs(Array.from(progressMerged.values()));
      setAssignmentDocs(Array.from(assignmentMerged.values()));
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

        const progressQuery = query(
          collection(db, 'careProgress'),
          where('counselorId', '==', uid),
        );
        const progressUnsub = onSnapshot(
          progressQuery,
          (snapshot) => {
            if (cancelled) return;
            for (const doc of snapshot.docs) {
              progressMerged.set(doc.id, {
                id: doc.id,
                ...(doc.data() as Omit<RealtimeCareProgressDoc, 'id'>),
              });
            }
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'removed') progressMerged.delete(change.doc.id);
            });
            publish();
          },
          (err) => {
            if (cancelled) return;
            setIsLive(false);
            setLiveError(err instanceof Error ? err.message : '실시간 연결 오류');
          },
        );
        unsubs.push(progressUnsub);

        const assignmentQuery = query(
          collection(db, 'careAssignments'),
          where('counselorId', '==', uid),
        );
        const assignmentUnsub = onSnapshot(
          assignmentQuery,
          (snapshot) => {
            if (cancelled) return;
            for (const doc of snapshot.docs) {
              assignmentMerged.set(doc.id, {
                id: doc.id,
                ...(doc.data() as Omit<RealtimeCareAssignmentDoc, 'id'>),
              });
            }
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'removed') assignmentMerged.delete(change.doc.id);
            });
            publish();
          },
          (err) => {
            if (cancelled) return;
            setIsLive(false);
            setLiveError(err instanceof Error ? err.message : '실시간 연결 오류');
          },
        );
        unsubs.push(assignmentUnsub);
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
  }, [enabled, counselorUid, baseItems]);

  const data = useMemo(() => {
    if (!baseItems) return null;
    if (!isLive && progressDocs.length === 0 && assignmentDocs.length === 0) return baseItems;
    return applyRealtimeToCareAssignments(baseItems, progressDocs, assignmentDocs);
  }, [baseItems, isLive, progressDocs, assignmentDocs]);

  return { data, isLive, liveError, lastUpdatedAt };
}
