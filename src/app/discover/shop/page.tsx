'use client';

import Link from 'next/link';
import B2cCheckoutPanel from '@/components/commerce/B2cCheckoutPanel';
import DiscoverLoggedInPurchaseGate from '@/components/auth/DiscoverLoggedInPurchaseGate';

export default function DiscoverShopPage() {
  return (
    <DiscoverLoggedInPurchaseGate>
      <main className="min-h-screen bg-gradient-to-b from-slate-950 to-violet-950/30 text-white">
        <div className="container py-12 px-4 max-w-4xl mx-auto">
          <Link href="/discover/" className="text-sm text-violet-300 hover:underline mb-8 inline-block">
            ← Discover
          </Link>
          <h1 className="text-2xl font-bold mb-2">개인 리포트 · 이용권</h1>
          <p className="text-slate-400 text-sm mb-8">
            Basic / Premium / Pro — 결제 후 1년간 해당 등급 리포트 이용 (파일럿)
          </p>
          <B2cCheckoutPanel />
        </div>
      </main>
    </DiscoverLoggedInPurchaseGate>
  );
}
