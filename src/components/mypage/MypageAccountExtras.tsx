'use client';

import React, { useEffect, useState } from 'react';
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

export function MypageProfileVisibilityPanel() {
  const [profileVisibility, setProfileVisibility] = useState('public');
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (!savedFlash) return;
    const t = window.setTimeout(() => setSavedFlash(false), 2400);
    return () => window.clearTimeout(t);
  }, [savedFlash]);

  return (
    <div className={`mt-6 border-t border-sky-400/15 pt-6 ${counselorHubClasses.subsection} !p-4 sm:!p-5`}>
      <h3 className="mb-1 text-sm font-semibold text-white">프로필 공개</h3>
      <p className="mb-4 text-xs text-slate-400">다른 사용자에게 표시되는 프로필 범위입니다.</p>
      <label className="mb-2 block text-xs font-medium text-slate-300">공개 설정</label>
      <select
        value={profileVisibility}
        onChange={(e) => setProfileVisibility(e.target.value)}
        className="w-full max-w-md rounded-lg border border-sky-400/20 bg-[#101f38] px-3 py-2.5 text-sm text-white focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-500/25"
      >
        <option value="public">공개</option>
        <option value="friends">친구만</option>
        <option value="private">비공개</option>
      </select>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setSavedFlash(true)}
          className="rounded-md bg-sky-600/90 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
        >
          저장
        </button>
        {savedFlash ? <span className="text-sm text-emerald-400/90">저장되었습니다.</span> : null}
      </div>
    </div>
  );
}
