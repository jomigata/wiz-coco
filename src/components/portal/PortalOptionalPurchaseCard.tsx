'use client';

import React from 'react';
import Link from 'next/link';

/** 7단계 — 내담자 선택 결제 안내 (홈 중앙이 아닌 기록·도움말 영역) */
export default function PortalOptionalPurchaseCard() {
  return (
    <section className="rounded-xl border border-slate-700/80 bg-slate-800/40 p-5">
      <h3 className="text-sm font-semibold text-slate-200">개인 검사 · 추가 이용 (선택)</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        검사 케어 매니저와 상의한 뒤, 개인적으로 검사를 더 받고 싶을 때 이용할 수 있습니다. 필수가 아닙니다.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/portal/guide/inquiry/"
          className="inline-flex rounded-lg border border-sky-500/40 bg-sky-950/30 px-4 py-2 text-sm font-medium text-sky-200 hover:bg-sky-950/50"
        >
          구매 문의하기
        </Link>
        <Link
          href="/portal/guide/"
          className="inline-flex rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
        >
          이용 안내
        </Link>
      </div>
    </section>
  );
}
