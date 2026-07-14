'use client';

import Link from 'next/link';
import { APP_HEADER_PT } from '@/lib/appChromeLayout';
import { buildLoginRedirectUrl } from '@/lib/authRedirect';

type Props = {
  title?: string;
  description?: string;
};

export default function CounselorSalesLoginPrompt({
  title = '상담사 전용 영업 도구',
  description = '파트너·요금·Discover·크레딧 안내는 승인된 상담사에게만 제공됩니다. 로그인 후 상담관리 메뉴에서 이용할 수 있습니다.',
}: Props) {
  return (
    <main
      className={`min-h-[70vh] flex items-center justify-center px-4 bg-gradient-to-b from-slate-950 to-violet-950/20 text-white ${APP_HEADER_PT}`}
    >
      <div className="max-w-md w-full text-center rounded-2xl border border-white/10 bg-white/[0.03] p-8 md:p-10">
        <h1 className="text-xl font-semibold text-white mb-3">{title}</h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">{description}</p>
        <div className="flex flex-col gap-3 items-center">
          <Link
            href={buildLoginRedirectUrl()}
            className="w-full py-3 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-500 transition-colors"
          >
            로그인
          </Link>
          <Link
            href="/counselor-application/"
            className="w-full py-3 rounded-xl border border-white/20 text-white text-sm hover:bg-white/5 transition-colors"
          >
            상담사 신청
          </Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-300">
            홈으로
          </Link>
        </div>
      </div>
    </main>
  );
}
