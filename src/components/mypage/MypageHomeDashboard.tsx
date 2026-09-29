'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import { counselorHubClasses } from '@/components/layout/appChromeTheme';
import { useMypageUserProfile } from '@/hooks/useMypageUserProfile';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { formatPhoneDisplayOr } from '@/lib/phoneFormat';
import { mypageAccountDetailNav } from '@/lib/mypageAccountNav';
import { isCounselor, isAdmin } from '@/utils/roleUtils';

function roleLabel(role?: string) {
  if (role === 'admin') return '관리자';
  if (role === 'counselor') return '상담사';
  return '일반 회원';
}

function SummaryTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className={`flex flex-col rounded-xl border border-sky-400/20 ${counselorHubClasses.statCard} !py-4 text-left`}>
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-2 truncate text-lg font-bold text-white">{value || '—'}</p>
      <p className="mt-1 text-[11px] text-slate-500">{hint}</p>
    </div>
  );
}

export default function MypageHomeDashboard() {
  const { showLoginRequired } = useAuthResolved();
  const { user, loading } = useMypageUserProfile();

  if (loading) {
    return (
      <CounselorPageSection title="내 계정" dense>
        <div className="flex min-h-[12rem] items-center justify-center p-6">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
        </div>
      </CounselorPageSection>
    );
  }

  if (showLoginRequired && !user) {
    return (
      <CounselorPageSection title="내 계정" dense>
        <div className={`mx-2.5 mb-2.5 rounded-xl border border-sky-400/15 p-8 text-center ${counselorHubClasses.subsection}`}>
          <p className="text-sm text-slate-300">로그인 후 계정 정보를 확인할 수 있습니다.</p>
          <Link
            href="/login"
            className="mt-4 inline-flex rounded-md bg-sky-600/90 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            로그인
          </Link>
        </div>
      </CounselorPageSection>
    );
  }

  if (!user) return null;

  const displayName = user.name || user.reportDisplayName || user.email.split('@')[0] || '회원';
  const phone = formatPhoneDisplayOr(user.phoneNumber, '미등록');
  const orgLine = user.organizationName?.trim() || (isCounselor(user.role) ? '기관 미입력' : '—');
  const profileComplete = Boolean(user.phoneNumber && user.name);

  return (
    <CounselorPageSection
      title="내 계정"
      dense
      description="기본 정보만 요약합니다. 세부 수정은 아래 메뉴에서 이어서 진행하세요."
    >
      <motion.div
        className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-2.5 sm:p-3 lg:grid-cols-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className={`rounded-xl border border-sky-400/20 p-4 lg:col-span-2 ${counselorHubClasses.hero} !p-4 sm:!p-5`}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/90 to-violet-600/90 text-xl font-semibold text-white shadow-lg shadow-sky-900/30">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-bold text-white">{displayName}</p>
              <p className="truncate text-sm text-sky-200/70">{user.email}</p>
              <p className="mt-1 text-xs text-slate-400">
                {roleLabel(user.role)}
                {isAdmin(user.role) ? ' · 운영 권한' : isCounselor(user.role) ? ' · 상담사 모드' : ''}
              </p>
            </div>
            <Link
              href="/mypage/account/profile"
              className="shrink-0 rounded-md border border-sky-400/30 bg-sky-600/20 px-3 py-1.5 text-xs font-medium text-sky-100 hover:bg-sky-600/35"
            >
              프로필 편집 →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <SummaryTile label="연락처" value={phone} hint="휴대폰 번호" />
          <SummaryTile
            label="프로필"
            value={profileComplete ? '등록됨' : '보완 필요'}
            hint={profileComplete ? '이름·연락처 OK' : '이름 또는 연락처 미입력'}
          />
          <SummaryTile label="공개 설정" value="공개" hint="상세에서 변경" />
          <SummaryTile label="기관" value={orgLine} hint={isCounselor(user.role) ? '보고서·기관 정보' : '상담사 전용'} />
        </div>

        <div className="flex min-h-[14rem] flex-col overflow-hidden rounded-xl border border-sky-400/20 bg-[#0f1d33]/60 lg:min-h-0">
          <div className="flex shrink-0 items-center justify-between border-b border-sky-400/20 px-3 py-2.5">
            <h3 className="text-sm font-bold text-white">계정 관리</h3>
            <span className="text-[11px] text-slate-500">탭하여 상세 화면</span>
          </div>
          <ul className="min-h-0 flex-1 divide-y divide-white/[0.06] overflow-y-auto">
            {mypageAccountDetailNav.map((row) => (
              <li key={row.href}>
                <Link
                  href={row.href}
                  className={`flex items-center justify-between gap-3 px-3 py-3 transition-colors hover:bg-white/[0.04] ${counselorHubClasses.item} !mx-2 !my-1 !border-0 !bg-transparent hover:!bg-white/[0.04]`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{row.label}</p>
                    <p className="truncate text-xs text-slate-400">{row.description}</p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-sky-300">열기 →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </CounselorPageSection>
  );
}
