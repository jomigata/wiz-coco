'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import { isAdmin } from '@/utils/roleUtils';

/** 관리자 — 검토 대기(pending) 상담사 신청 건수 */
export function usePendingCounselorApplicationsCount(role: unknown): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isAdmin(role)) {
      setCount(0);
      return;
    }

    const { db } = initializeFirebase();
    if (!db) return;

    const q = query(collection(db, 'counselorApplications'), where('status', '==', 'pending'));
    const unsub = onSnapshot(
      q,
      (snap) => setCount(snap.size),
      () => setCount(0),
    );
    return () => unsub();
  }, [role]);

  return count;
}
