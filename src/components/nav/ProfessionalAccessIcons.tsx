'use client';

import Link from 'next/link';
import { buildLoginRedirectUrl } from '@/lib/authRedirect';
import { counselorApplicationStatusLabel } from '@/lib/counselorProfessionalAccess';

type AccessState = {
  canShowApplyIcon: boolean;
  showPartnerIcon: boolean;
  showPendingBadge: boolean;
  applicationStatus?: 'pending' | 'under_review' | 'approved' | 'rejected' | null;
};

type Props = {
  variant?: 'nav' | 'dock';
  onNavigate?: () => void;
  /** false: 로그인 아이콘만 */
  isLoggedIn?: boolean;
  access?: AccessState;
};

const iconBtnBase =
  'inline-flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60';

const navIconClass = `${iconBtnBase} h-9 w-9 text-slate-400/90 hover:text-slate-100 hover:bg-white/10 border border-transparent hover:border-white/10`;
const dockIconClass = `${iconBtnBase} h-11 w-11 text-slate-300/80 hover:text-white bg-slate-900/70 hover:bg-slate-800/90 border border-white/10 hover:border-white/20 backdrop-blur-md shadow-lg`;

function LoginIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h10.5m0 0L18 15.75M19.5 12 18 8.25" />
    </svg>
  );
}

function ApplyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3-12H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V9.75M9 3.75h6.75A2.25 2.25 0 0118 6v2.25" />
    </svg>
  );
}

function PartnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 9h.01M15 9h.01M9 13h.01M15 13h.01" />
    </svg>
  );
}

export default function ProfessionalAccessIcons({
  variant = 'nav',
  onNavigate,
  isLoggedIn = false,
  access,
}: Props) {
  const btn = variant === 'dock' ? dockIconClass : navIconClass;
  const iconSize = variant === 'dock' ? 'h-5 w-5' : 'h-[18px] w-[18px]';
  const loginHref = buildLoginRedirectUrl();
  const pendingLabel = counselorApplicationStatusLabel(access?.applicationStatus ?? null) || '승인신청중';

  const wrap = (node: React.ReactNode) =>
    variant === 'dock' ? (
      <div className="flex flex-col gap-2">{node}</div>
    ) : (
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 border-l border-white/10 pl-2 ml-1">{node}</div>
    );

  if (isLoggedIn) {
    const showApply = access?.canShowApplyIcon ?? true;
    const showPartner = access?.showPartnerIcon ?? false;
    const showPending = access?.showPendingBadge ?? false;

    if (!showApply && !showPartner && !showPending) {
      return null;
    }

    return wrap(
      <>
        {showPending && (
          <span
            className="px-2 py-1 rounded-md text-[11px] sm:text-xs font-semibold text-amber-100 bg-amber-500/20 border border-amber-400/30 whitespace-nowrap"
            title="관리자 승인 검토 중입니다"
          >
            {pendingLabel}
          </span>
        )}
        {showApply && (
          <Link
            href="/counselor-application/"
            onClick={onNavigate}
            className={btn}
            title="전문가·상담사 가입 신청"
            aria-label="전문가·상담사 가입 신청"
          >
            <ApplyIcon className={iconSize} />
          </Link>
        )}
        {showPartner && (
          <Link
            href="/partners/"
            onClick={onNavigate}
            className={btn}
            title="기관·파트너 안내"
            aria-label="기관·파트너 안내"
          >
            <PartnerIcon className={iconSize} />
          </Link>
        )}
      </>,
    );
  }

  return wrap(
    <Link
      href={loginHref}
      onClick={onNavigate}
      className={btn}
      title="전문가·상담사 로그인"
      aria-label="전문가·상담사 로그인"
    >
      <LoginIcon className={iconSize} />
    </Link>,
  );
}
