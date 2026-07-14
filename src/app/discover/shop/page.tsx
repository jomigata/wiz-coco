'use client';

import Link from 'next/link';
import B2cCheckoutPanel from '@/components/commerce/B2cCheckoutPanel';
import DiscoverLoggedInPurchaseGate from '@/components/auth/DiscoverLoggedInPurchaseGate';
import CounselorSalesBackLink from '@/components/counselor/CounselorSalesBackLink';
import { APP_HEADER_PT } from '@/lib/appChromeLayout';

export default function DiscoverShopPage() {
  return (
    <DiscoverLoggedInPurchaseGate>
      <main
        className={`min-h-screen bg-gradient-to-b from-slate-950 to-violet-950/30 text-white ${APP_HEADER_PT}`}
      >
        <div className="container py-8 px-4 max-w-4xl mx-auto">
          <CounselorSalesBackLink />
          <h1 className="text-2xl font-bold mb-2">개인 리포트 · 이용권</h1>
          <p className="text-slate-400 text-sm mb-8">
            내담자에게 안내할 Basic / Premium / Pro 이용권 — 결제 후 1년간 해당 등급 리포트 이용
            (파일럿)
          </p>
          <B2cCheckoutPanel />
          <p className="mt-8 text-xs text-slate-500">
            기관·B2B 패키지는{' '}
            <Link href="/partners/" className="text-violet-300 underline">
              파트너 프로그램
            </Link>
            에서 확인하세요.
          </p>
        </div>
      </main>
    </DiscoverLoggedInPurchaseGate>
  );
}
