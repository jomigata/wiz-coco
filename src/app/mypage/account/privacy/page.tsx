'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import { counselorHubClasses } from '@/components/layout/appChromeTheme';
import { useAuthResolved } from '@/hooks/useAuthResolved';

export default function MypageAccountPrivacyPage() {
  const { showLoginRequired } = useAuthResolved();
  const [privacy, setPrivacy] = useState({ profileVisibility: 'public' });
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (!savedFlash) return;
    const t = window.setTimeout(() => setSavedFlash(false), 2400);
    return () => window.clearTimeout(t);
  }, [savedFlash]);

  if (showLoginRequired) {
    return (
      <CounselorPageSection title="공개·개인정보" dense headerAction={<BackLink />}>
        <p className="p-4 text-sm text-slate-300">로그인이 필요합니다.</p>
      </CounselorPageSection>
    );
  }

  return (
    <CounselorPageSection
      title="공개·개인정보"
      dense
      relaxed
      headerAction={<BackLink />}
      description="다른 사용자에게 표시되는 프로필 범위를 선택합니다."
    >
      <div className={`space-y-4 ${counselorHubClasses.subsection} !p-4 sm:!p-5`}>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">프로필 공개 설정</label>
          <select
            value={privacy.profileVisibility}
            onChange={(e) => setPrivacy({ profileVisibility: e.target.value })}
            className="w-full max-w-md rounded-lg border border-sky-400/20 bg-[#101f38] px-3 py-2.5 text-sm text-white focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-500/25"
          >
            <option value="public">공개</option>
            <option value="friends">친구만</option>
            <option value="private">비공개</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setSavedFlash(true)}
            className="rounded-md bg-sky-600/90 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500"
          >
            저장
          </button>
          {savedFlash ? <span className="text-sm text-emerald-400/90">저장되었습니다.</span> : null}
        </div>
      </div>
    </CounselorPageSection>
  );
}

function BackLink() {
  return (
    <Link href="/mypage" className="text-xs font-medium text-sky-300 hover:text-sky-200">
      ← 내 계정
    </Link>
  );
}
