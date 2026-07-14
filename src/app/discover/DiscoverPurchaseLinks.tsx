'use client';

import Link from 'next/link';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { useCounselorProfessionalAccess } from '@/hooks/useCounselorProfessionalAccess';

export default function DiscoverPurchaseLinks() {
  const { isAuthenticated, authPending } = useAuthResolved();
  const { loading, isApprovedCounselor } = useCounselorProfessionalAccess();

  if (authPending || (isAuthenticated && loading)) {
    return null;
  }

  if (isAuthenticated && !isApprovedCounselor) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
      <Link
        href="/discover/mini-check/"
        className="px-8 py-4 rounded-xl bg-violet-600 font-semibold hover:bg-violet-500 transition-colors"
      >
        무료 미니 검사 시작
      </Link>
      <Link
        href="/discover/shop/"
        className="px-8 py-4 rounded-xl border border-white/25 font-semibold hover:bg-slate-50 transition-colors"
      >
        Basic · Premium · Pro
      </Link>
    </div>
  );
}
