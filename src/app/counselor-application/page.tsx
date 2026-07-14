'use client';

import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { buildLoginRedirectUrl } from '@/lib/authRedirect';
import CounselorApplicationForm from '@/components/counselor/CounselorApplicationForm';
import Link from 'next/link';

export default function CounselorApplicationPage() {
  const { user, loading } = useFirebaseAuth();

  if (loading) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] bg-[#f8fafc] pt-20 flex items-center justify-center text-slate-400 text-sm">
        불러오는 중…
      </div>
    );
  }

  if (!user?.uid) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] bg-[#f8fafc] pt-20 flex items-center justify-center px-4">
        <div className="max-w-sm w-full rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-white font-medium mb-2">로그인이 필요합니다</p>
          <p className="text-slate-400 text-sm mb-6">상담사 신청은 로그인한 계정으로만 가능합니다.</p>
          <Link
            href={buildLoginRedirectUrl('/counselor-application/')}
            className="inline-flex w-full justify-center rounded-xl bg-sky-600 py-3 text-sm font-semibold text-white hover:bg-sky-500"
          >
            로그인
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-[#f8fafc] pt-20 pb-8 px-4">
      <CounselorApplicationForm uid={user.uid} email={user.email || ''} role={user.role} />
    </div>
  );
}
