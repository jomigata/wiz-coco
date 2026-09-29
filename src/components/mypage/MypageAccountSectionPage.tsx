'use client';

import React, { useState } from 'react';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import { mypageAccountClasses } from '@/components/layout/appChromeTheme';
import { useMypageUserProfile } from '@/hooks/useMypageUserProfile';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import InlineProfileBlocks, { type MypageProfileSection } from '@/app/mypage/components/InlineProfileBlocks';
import CounselorSwitchPanel, {
  MYPAGE_COUNSELOR_ACCOUNT_FORM_ID,
} from '@/app/mypage/settings/components/CounselorSwitchPanel';
import { MypagePremiumBlock, MypagePremiumBlockGrid } from '@/components/mypage/MypagePremiumBlock';
import { isCounselor } from '@/utils/roleUtils';

type Props = {
  title: string;
  description: string;
  section: MypageProfileSection;
};

export default function MypageAccountSectionPage({ title, description, section }: Props) {
  const { showLoginRequired } = useAuthResolved();
  const { user, firebaseUser, loading, reload } = useMypageUserProfile();
  const [accountEditing, setAccountEditing] = useState(false);

  if (loading) {
    return (
      <CounselorPageSection title={title} dense elevatedSurface>
        <div className="flex min-h-[12rem] items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
        </div>
      </CounselorPageSection>
    );
  }

  if (showLoginRequired && !user) {
    return (
      <CounselorPageSection title={title} dense elevatedSurface>
        <p className="p-4 text-sm text-slate-300">로그인이 필요합니다.</p>
      </CounselorPageSection>
    );
  }

  if (!user) return null;

  const counselorUser = isCounselor(user.role);

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

  const accountHeaderAction =
    section === 'counselor' && counselorUser ? (
      accountEditing ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAccountEditing(false)}
            className="rounded-md border border-white/15 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-white/10"
          >
            취소
          </button>
          <button
            type="submit"
            form={MYPAGE_COUNSELOR_ACCOUNT_FORM_ID}
            className="rounded-md bg-sky-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-sky-500"
          >
            저장
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAccountEditing(true)}
          className="rounded-md bg-sky-600/90 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-sky-500"
        >
          수정
        </button>
      )
    ) : undefined;

  return (
    <CounselorPageSection title={title} dense relaxed description={description} elevatedSurface>
      <div className={mypageAccountClasses.contentScroll}>
        {section === 'counselor' ? (
          <MypagePremiumBlockGrid>
            <MypagePremiumBlock
              index="01 · 계정"
              title="상담사 계정"
              description="승인·등록·경력·핸드폰·기관명"
              headerAction={accountHeaderAction}
            >
              <CounselorSwitchPanel
                uid={user.id}
                email={user.email}
                role={user.role}
                embedded
                mypageEditing={accountEditing}
                formId={MYPAGE_COUNSELOR_ACCOUNT_FORM_ID}
                onSaved={() => {
                  setAccountEditing(false);
                  void reload();
                }}
              />
            </MypagePremiumBlock>
          </MypagePremiumBlockGrid>
        ) : (
          body
        )}
      </div>
    </CounselorPageSection>
  );
}
