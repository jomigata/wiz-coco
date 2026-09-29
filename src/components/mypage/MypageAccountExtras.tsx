'use client';

import React from 'react';
import { counselorHubClasses } from '@/components/layout/appChromeTheme';
import CounselorSwitchPanel from '@/app/mypage/settings/components/CounselorSwitchPanel';

type Props = {
  uid: string;
  email: string;
  role?: string;
};

export function MypageAccountRolePanel({ uid, email, role }: Props) {
  return (
    <div className={`mt-6 border-t border-sky-400/15 pt-6 ${counselorHubClasses.subsection} !p-4 sm:!p-5`}>
      <h3 className="mb-1 text-sm font-semibold text-white">역할·상담사</h3>
      <p className="mb-4 text-xs text-slate-400">상담사 모드 전환 및 신청 상태를 관리합니다.</p>
      <CounselorSwitchPanel uid={uid} email={email} role={role} />
    </div>
  );
}
