'use client';

import React from 'react';
import Link from 'next/link';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import { counselorHubClasses } from '@/components/layout/appChromeTheme';
import { useMypageUserProfile } from '@/hooks/useMypageUserProfile';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import InlineProfileBlocks from '@/app/mypage/components/InlineProfileBlocks';

export default function MypageAccountProfilePage() {
  const { showLoginRequired } = useAuthResolved();
  const { user, firebaseUser, loading, reload } = useMypageUserProfile();

  if (loading) {
    return (
      <CounselorPageSection title="프로필·연락처" dense headerAction={<BackLink />}>
        <div className="flex min-h-[12rem] items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
        </div>
      </CounselorPageSection>
    );
  }

  if (showLoginRequired && !user) {
    return (
      <CounselorPageSection title="프로필·연락처" dense headerAction={<BackLink />}>
        <p className="p-4 text-sm text-slate-300">로그인이 필요합니다.</p>
      </CounselorPageSection>
    );
  }

  if (!user) return null;

  return (
    <CounselorPageSection
      title="프로필·연락처"
      dense
      relaxed
      headerAction={<BackLink />}
      description="섹션별 수정 버튼으로 저장합니다."
    >
      <div className={`min-h-0 overflow-y-auto ${counselorHubClasses.subsection} !p-4 sm:!p-5`}>
        <InlineProfileBlocks
          user={user}
          firebaseUserRole={firebaseUser?.role}
          onUpdate={() => {
            void reload();
          }}
        />
      </div>
    </CounselorPageSection>
  );
}

function BackLink() {
  return (
    <Link
      href="/mypage"
      className="text-xs font-medium text-sky-300 hover:text-sky-200"
    >
      ← 내 계정
    </Link>
  );
}
