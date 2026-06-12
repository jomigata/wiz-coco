'use client';

import { useCallback, useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import { isAdmin, isCounselor } from '@/utils/roleUtils';
import {
  isCounselorResultSeen,
  markCounselorResultSeen,
  shouldNotifyCounselorResult,
} from '@/utils/counselorApplicationNotification';

function reviewedAtToKey(value: unknown): string {
  if (!value) return '';
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return String((value as { toDate: () => Date }).toDate().getTime());
  }
  if (value instanceof Date) return String(value.getTime());
  if (typeof value === 'string') return value;
  return '';
}

/** 마이페이지 — 미확인 상담사 전환 결과(승인/거부) 건수 (0 또는 1) */
export function useCounselorApplicationNotificationCount(
  uid: string | undefined,
  role: unknown,
): number {
  const [count, setCount] = useState(0);
  const [seenTick, setSeenTick] = useState(0);

  useEffect(() => {
    const onSeen = () => setSeenTick((n) => n + 1);
    window.addEventListener('wizcoco:counselor-result-seen', onSeen);
    return () => window.removeEventListener('wizcoco:counselor-result-seen', onSeen);
  }, []);

  const recompute = useCallback(
    (status: string, reviewedAt: string, applicationId: string) => {
      const notify = shouldNotifyCounselorResult(status, reviewedAt, applicationId);
      setCount(notify ? 1 : 0);
    },
    [],
  );

  useEffect(() => {
    if (!uid || isCounselor(role) || isAdmin(role)) {
      setCount(0);
      return;
    }

    const { db } = initializeFirebase();
    if (!db) return;

    const q = query(
      collection(db, 'counselorApplications'),
      where('applicantUid', '==', uid),
      where('status', 'in', ['pending', 'under_review', 'approved', 'rejected']),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setCount(0);
          return;
        }
        const sorted = [...snap.docs].sort((a, b) => {
          const ta = a.data().submittedAt?.toMillis?.() ?? 0;
          const tb = b.data().submittedAt?.toMillis?.() ?? 0;
          return tb - ta;
        });
        const docSnap = sorted[0];
        const data = docSnap.data();
        recompute(String(data.status || ''), reviewedAtToKey(data.reviewedAt), docSnap.id);
      },
      () => setCount(0),
    );

    return () => unsub();
  }, [uid, role, seenTick, recompute]);

  return count;
}

export { markCounselorResultSeen, isCounselorResultSeen };
