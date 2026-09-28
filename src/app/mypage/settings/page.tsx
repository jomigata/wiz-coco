"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import MypagePremiumShell from '@/components/mypage/MypagePremiumShell';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { useMypageUserProfile } from '@/hooks/useMypageUserProfile';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useCounselorApplicationNotificationCount } from '@/hooks/useCounselorApplicationNotificationCount';
import CounselorSwitchPanel from './components/CounselorSwitchPanel';

export default function SettingsPage() {
  const { showLoginRequired } = useAuthResolved();
  const { user, loading } = useMypageUserProfile();
  const { user: firebaseUser } = useFirebaseAuth();
  const counselorResultCount = useCounselorApplicationNotificationCount(
    firebaseUser?.uid || '',
    firebaseUser?.role || user?.role || 'user',
  );
  const [privacy, setPrivacy] = useState({ profileVisibility: 'public' });
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (!savedFlash) return;
    const t = window.setTimeout(() => setSavedFlash(false), 2400);
    return () => window.clearTimeout(t);
  }, [savedFlash]);

  const saveSettings = async () => {
    setSavedFlash(true);
  };

  if (loading) {
    return (
      <MypagePremiumShell title="설정" settingsBadge={counselorResultCount}>
        <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
        </div>
      </MypagePremiumShell>
    );
  }

  if (showLoginRequired && !user) {
    return (
      <MypagePremiumShell title="설정">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <p className="text-slate-300">로그인 후 설정을 변경할 수 있습니다.</p>
          <Link href="/login" className="mt-4 inline-flex rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-500">
            로그인
          </Link>
        </div>
      </MypagePremiumShell>
    );
  }

  return (
    <MypagePremiumShell
      title="설정"
      subtitle="프로필 공개 범위와 상담사·관리자 역할을 안전하게 관리합니다."
      settingsBadge={counselorResultCount}
    >
      <div className="space-y-6">
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
          <h2 className="flex items-center gap-2 text-base font-semibold text-white">
            <span className="text-lg" aria-hidden>
              🔒
            </span>
            개인정보·공개
          </h2>
          <p className="mt-1 text-sm text-slate-400">다른 사용자에게 표시되는 프로필 범위를 선택합니다.</p>
          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-slate-200">프로필 공개 설정</label>
            <select
              value={privacy.profileVisibility}
              onChange={(e) => setPrivacy({ profileVisibility: e.target.value })}
              className="w-full max-w-md rounded-xl border border-white/15 bg-slate-950/60 px-4 py-2.5 text-sm text-white focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            >
              <option value="public">공개</option>
              <option value="friends">친구만</option>
              <option value="private">비공개</option>
            </select>
          </div>
        </section>

        {user ? (
          <section className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/30 to-slate-950/40 p-6 backdrop-blur-sm">
            <h2 className="text-base font-semibold text-white">전문가·역할</h2>
            <p className="mt-1 text-sm text-slate-400">상담사 모드 전환 및 신청 상태를 확인합니다.</p>
            <div className="mt-4">
              <CounselorSwitchPanel uid={user.id} email={user.email} role={user.role} />
            </div>
          </section>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => void saveSettings()}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-600 to-violet-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:from-sky-500 hover:to-violet-500"
          >
            설정 저장
          </button>
          {savedFlash ? (
            <span className="text-sm text-emerald-400/90">저장되었습니다.</span>
          ) : null}
        </div>
      </div>
    </MypagePremiumShell>
  );
}
