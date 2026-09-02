'use client';

import React from 'react';
import AuthLink from '@/components/auth/AuthLink';

type Props = {
  creditBalance: number | null;
  orgLiaisonCount?: number;
};

/** 7단계 — 수익·충전 링크 (오늘 화면 하단, 업무 중앙 아님) */
export default function CounselorRevenueLinksFooter({ creditBalance, orgLiaisonCount = 0 }: Props) {
  const lowCredits = creditBalance !== null && creditBalance < 20;

  return (
    <div className="border-t border-white/[0.06] px-2.5 py-3 sm:px-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">충전 · 협회</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <AuthLink
          href="/counselor/credits"
          className={lowCredits ? 'font-medium text-amber-300 hover:text-amber-200' : 'text-slate-400 hover:text-slate-200'}
        >
          {lowCredits ? '검사 포인트 충전 (잔액 부족)' : '검사·AI 포인트 충전'}
        </AuthLink>
        {orgLiaisonCount > 0 ? (
          <AuthLink href="/counselor/assessments/new" className="text-slate-400 hover:text-slate-200">
            기관·연수 발송 ({orgLiaisonCount})
          </AuthLink>
        ) : null}
        <AuthLink href="/counselor/treatment-plans" className="text-slate-400 hover:text-slate-200">
          치료·숙제 프로그램
        </AuthLink>
      </div>
    </div>
  );
}
