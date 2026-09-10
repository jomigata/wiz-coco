'use client';

import Link from 'next/link';

type Props = {
  homeHref?: string;
  forgotPinHref?: string;
  showForgotPin?: boolean;
  linkClassName: string;
};

/** 포털 인증 화면 상단 — ← 홈으로 (좌) · 비밀번호 찾기 → (우) */
export default function PortalAuthTopBar({
  homeHref = '/',
  forgotPinHref = '/portal/forgot-pin/',
  showForgotPin = true,
  linkClassName,
}: Props) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <Link href={homeHref} className={`shrink-0 text-xs underline-offset-2 hover:underline ${linkClassName}`}>
        ← 홈으로
      </Link>
      {showForgotPin ? (
        <Link
          href={forgotPinHref}
          className={`shrink-0 text-xs underline-offset-2 hover:underline ${linkClassName}`}
        >
          비밀번호 찾기 →
        </Link>
      ) : (
        <span className="w-[1px]" aria-hidden />
      )}
    </div>
  );
}
