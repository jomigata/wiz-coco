'use client';

import Link from 'next/link';
import DiscoverPurchaseLinks from './DiscoverPurchaseLinks';
import { DiscoverProfessionalExtras } from './DiscoverProfessionalExtras';
import DiscoverLoggedInPurchaseGate from '@/components/auth/DiscoverLoggedInPurchaseGate';
import CounselorSalesBackLink from '@/components/counselor/CounselorSalesBackLink';
import { APP_HEADER_PT } from '@/lib/appChromeLayout';

export default function DiscoverPageClient() {
  return (
    <DiscoverLoggedInPurchaseGate>
      <main
        className={`min-h-screen bg-gradient-to-b from-slate-950 via-violet-950/40 to-slate-950 text-white ${APP_HEADER_PT}`}
      >
        <div className="container py-8 md:py-12 max-w-3xl mx-auto px-4">
          <CounselorSalesBackLink />
          <div className="text-center">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-violet-500/20 text-violet-200 border border-violet-400/20 mb-6">
              상담사 영업 · Discover D2C
            </span>
            <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              3분으로 시작하는
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300">
                마음 웰니스 체크
              </span>
            </h1>
            <p className="text-slate-300 text-lg mb-10 leading-relaxed">
              내담자·SNS에 공유할 무료 미니 검사와 개인 리포트 업그레이드 경로입니다.
              <br />
              협회 B2B2C와 브랜드를 분리해 상담사가 직접 영업에 활용할 수 있습니다.
            </p>
            <DiscoverPurchaseLinks />
            <DiscoverProfessionalExtras />
            <p className="mt-8 text-sm text-slate-500">
              <Link href="/counselor/" className="text-violet-300 hover:underline">
                상담관리 대시보드
              </Link>
            </p>
          </div>
        </div>
      </main>
    </DiscoverLoggedInPurchaseGate>
  );
}
