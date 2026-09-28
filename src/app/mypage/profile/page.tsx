'use client';

import React from 'react';
import Link from 'next/link';
import MypagePremiumShell from '@/components/mypage/MypagePremiumShell';
import { useMypageUserProfile } from '@/hooks/useMypageUserProfile';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import InlineProfileBlocks from '@/app/mypage/components/InlineProfileBlocks';

export default function MypageProfilePage() {
  const { showLoginRequired } = useAuthResolved();
  const { user, firebaseUser, loading, reload } = useMypageUserProfile();

  if (loading) {
    return (
      <MypagePremiumShell title="기본 정보" subtitle="프로필을 불러오는 중입니다.">
        <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
        </div>
      </MypagePremiumShell>
    );
  }

  if (showLoginRequired && !user) {
    return (
      <MypagePremiumShell title="기본 정보">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <p className="text-slate-300">로그인 후 프로필을 수정할 수 있습니다.</p>
          <Link
            href="/login"
            className="mt-4 inline-flex rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-500"
          >
            로그인
          </Link>
        </div>
      </MypagePremiumShell>
    );
  }

  if (!user) return null;

  return (
    <MypagePremiumShell
      title="기본 정보"
      subtitle="연락처·전문 분야·기관 정보를 한곳에서 관리합니다. 각 섹션의 수정으로 바로 저장할 수 있습니다."
    >
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 shadow-[0_32px_80px_-48px_rgba(0,0,0,0.9)] backdrop-blur-sm sm:p-7">
        <InlineProfileBlocks
          user={user}
          firebaseUserRole={firebaseUser?.role}
          onUpdate={() => {
            void reload();
          }}
        />
      </div>
    </MypagePremiumShell>
  );
}
