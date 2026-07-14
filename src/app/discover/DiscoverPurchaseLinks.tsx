'use client';

import Link from 'next/link';

export default function DiscoverPurchaseLinks() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
      <Link
        href="/discover/mini-check/"
        className="px-8 py-4 rounded-xl bg-violet-600 font-semibold hover:bg-violet-500 transition-colors"
      >
        3분 마음 체크 시작
      </Link>
      <Link
        href="/discover/shop/"
        className="px-8 py-4 rounded-xl border border-white/25 font-semibold hover:bg-white/5 transition-colors"
      >
        개인 리포트 · 이용권
      </Link>
    </div>
  );
}
