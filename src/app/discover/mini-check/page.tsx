import Link from 'next/link';
import MiniCheckQuiz from '@/components/discover/MiniCheckQuiz';
import DiscoverLoggedInPurchaseGate from '@/components/auth/DiscoverLoggedInPurchaseGate';
import { APP_HEADER_PT } from '@/lib/appChromeLayout';

export default function MiniCheckPage() {
  return (
    <DiscoverLoggedInPurchaseGate>
      <main
        className={`min-h-screen bg-gradient-to-b from-slate-950 to-violet-950/30 text-white ${APP_HEADER_PT}`}
      >
        <div className="container py-8 px-4 max-w-2xl mx-auto">
          <Link href="/discover/" className="text-sm text-violet-300 hover:underline mb-8 inline-block">
            ← Discover
          </Link>
          <h1 className="text-2xl font-bold mb-2 text-center">3분 마음 체크</h1>
          <p className="text-slate-400 text-sm text-center mb-10">
            로그인 없이 진행 · PII 미수집 · 참고용 (진단 아님)
          </p>
          <MiniCheckQuiz />
        </div>
      </main>
    </DiscoverLoggedInPurchaseGate>
  );
}
