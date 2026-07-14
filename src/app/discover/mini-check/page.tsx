import Link from 'next/link';
import MiniCheckQuiz from '@/components/discover/MiniCheckQuiz';
import DiscoverLoggedInPurchaseGate from '@/components/auth/DiscoverLoggedInPurchaseGate';
import CounselorSalesBackLink from '@/components/counselor/CounselorSalesBackLink';
import { APP_HEADER_PT } from '@/lib/appChromeLayout';

export default function MiniCheckPage() {
  return (
    <DiscoverLoggedInPurchaseGate>
      <main
        className={`min-h-screen bg-gradient-to-b from-slate-950 to-violet-950/30 text-white ${APP_HEADER_PT}`}
      >
        <div className="container py-8 px-4 max-w-2xl mx-auto">
          <CounselorSalesBackLink />
          <h1 className="text-2xl font-bold mb-2 text-center">3분 마음 체크</h1>
          <p className="text-slate-400 text-sm text-center mb-10">
            내담자·SNS 공유용 무료 미니 검사 · PII 미수집 · 참고용 (진단 아님)
          </p>
          <MiniCheckQuiz />
        </div>
      </main>
    </DiscoverLoggedInPurchaseGate>
  );
}
