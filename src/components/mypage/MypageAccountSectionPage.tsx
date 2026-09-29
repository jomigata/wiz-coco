'use client';

import React from 'react';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import { counselorHubClasses } from '@/components/layout/appChromeTheme';
import { useMypageUserProfile } from '@/hooks/useMypageUserProfile';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import InlineProfileBlocks, { type MypageProfileSection } from '@/app/mypage/components/InlineProfileBlocks';
import CounselorSwitchPanel from '@/app/mypage/settings/components/CounselorSwitchPanel';
import { MypagePremiumBlock, MypagePremiumBlockGrid } from '@/components/mypage/MypagePremiumBlock';

type Props = {
  title: string;
  description: string;
  section: MypageProfileSection;
};

export default function MypageAccountSectionPage({ title, description, section }: Props) {
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

  const body = (
    <InlineProfileBlocks
      section={section}
      user={user}
      firebaseUserRole={firebaseUser?.role}
      onUpdate={() => {
        void reload();
      }}
    />
  );

  return (
    <CounselorPageSection title={title} dense relaxed description={description}>
      <div className={`min-h-0 overflow-y-auto ${counselorHubClasses.subsection} !p-3 sm:!p-4`}>
        {section === 'organization' ? (
          <MypagePremiumBlockGrid>
            <MypagePremiumBlock
              index="01 · 계정"
              title="상담사 계정"
              description="승인·전환 및 상담사 등록 정보"
            >
              <CounselorSwitchPanel uid={user.id} email={user.email} role={user.role} embedded />
            </MypagePremiumBlock>
            {body}
          </MypagePremiumBlockGrid>
        ) : (
          body
        )}
      </div>
    </CounselorPageSection>
  );
}
