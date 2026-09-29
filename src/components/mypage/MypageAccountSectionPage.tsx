'use client';

import React from 'react';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import { counselorHubClasses } from '@/components/layout/appChromeTheme';
import { useMypageUserProfile } from '@/hooks/useMypageUserProfile';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import InlineProfileBlocks, { type MypageProfileSection } from '@/app/mypage/components/InlineProfileBlocks';
import { MypageAccountRolePanel } from '@/components/mypage/MypageAccountExtras';

type Props = {
  title: string;
  description: string;
  section: MypageProfileSection;
  showAccountExtras?: boolean;
};

export default function MypageAccountSectionPage({
  title,
  description,
  section,
  showAccountExtras = false,
}: Props) {
  const { showLoginRequired } = useAuthResolved();
  const { user, firebaseUser, loading, reload } = useMypageUserProfile();

  if (loading) {
    return (
      <CounselorPageSection title={title} dense>
        <div className="flex min-h-[12rem] items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
        </div>
      </CounselorPageSection>
    );
  }

  if (showLoginRequired && !user) {
    return (
      <CounselorPageSection title={title} dense>
        <p className="p-4 text-sm text-slate-300">로그인이 필요합니다.</p>
      </CounselorPageSection>
    );
  }

  if (!user) return null;

  return (
    <CounselorPageSection title={title} dense relaxed description={description}>
      <div className={`min-h-0 overflow-y-auto ${counselorHubClasses.subsection} !p-4 sm:!p-5`}>
        <InlineProfileBlocks
          section={section}
          user={user}
          firebaseUserRole={firebaseUser?.role}
          onUpdate={() => {
            void reload();
          }}
        />
        {showAccountExtras ? <MypageAccountRolePanel uid={user.id} email={user.email} role={user.role} /> : null}
      </div>
    </CounselorPageSection>
  );
}
