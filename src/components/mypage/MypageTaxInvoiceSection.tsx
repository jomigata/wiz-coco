'use client';

import React from 'react';
import { mypageAccountClasses } from '@/components/layout/appChromeTheme';

type Props = {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

/** 수정 화면 — 전자세금계산서 발행용 입력 블록 */
export default function MypageTaxInvoiceFieldsSection({
  title = '전자세금계산서 발행 기본정보',
  description = '세금계산서 발행·국세청 전송에 사용하는 사업자 정보입니다. 사업자등록증과 동일하게 입력해 주세요.',
  children,
  className = '',
}: Props) {
  return (
    <section
      className={`space-y-4 rounded-xl border border-amber-400/25 bg-gradient-to-b from-amber-950/35 via-[#0a0a0a]/80 to-black/90 p-4 shadow-[inset_0_1px_0_rgba(251,191,36,0.12)] sm:p-5 ${className}`}
    >
      <header className="border-b border-amber-400/15 pb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300/70">Tax invoice</p>
        <h4 className="mt-1 text-sm font-semibold text-amber-50/95">{title}</h4>
        <p className="mt-1.5 text-[11px] leading-relaxed text-amber-100/45">{description}</p>
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function MypageContactFieldsSection({
  title = '연락·담당 정보',
  children,
  variant = 'edit',
}: {
  title?: string;
  children: React.ReactNode;
  variant?: 'edit' | 'display';
}) {
  const titleCls =
    variant === 'display'
      ? 'mb-2 block text-xs font-semibold text-slate-300'
      : `${mypageAccountClasses.fieldLabelEdit} text-sm font-semibold text-white/90`;
  return (
    <section className="space-y-4">
      <h4 className={titleCls}>{title}</h4>
      {children}
    </section>
  );
}

export function MypageTaxInvoiceDisplaySection({
  title = '전자세금계산서 발행 기본정보',
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-amber-400/15 bg-amber-950/10 p-4 sm:p-5">
      <h4 className="text-xs font-semibold text-amber-100/85">{title}</h4>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}
