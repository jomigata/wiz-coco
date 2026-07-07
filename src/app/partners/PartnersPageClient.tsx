'use client';

import Link from 'next/link';
import MonetizationPricingSection from '@/components/monetization/MonetizationPricingSection';
import MonetizationTrustSection from '@/components/monetization/MonetizationTrustSection';
import CounselorProfessionalAccessGate, {
  CounselorProfessionalUnapprovedPrompt,
} from '@/components/auth/CounselorProfessionalAccessGate';
import { APP_PAGE_BG } from '@/components/layout/appChromeTheme';
import { AuthLoadingState } from '@/components/auth/AuthStatusViews';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { PILOT_FREE_CREDITS } from '@/data/monetizationCatalog';
import ProfessionalAccessIcons from '@/components/nav/ProfessionalAccessIcons';

function PartnersContent() {
  return (
    <>
      <section className="py-16 bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900">
        <div className="container max-w-3xl mx-auto px-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 mb-4">
            협회 플랫폼 · B2B / B2B2C
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            기관·상담사 파트너 프로그램
          </h1>
          <p className="text-slate-300 leading-relaxed">
            WizCoCo는 협회(플랫폼)가 검사 품질·정산을 관리하고, 전문상담사와
            학교·기업이 내담자에게 <strong className="text-white">코드 한 장</strong>
            으로 부담 없이 검사를 제공할 수 있도록 설계되었습니다.
          </p>
        </div>
      </section>

      <section className="py-12 bg-gray-900 border-t border-white/5">
        <div className="container max-w-3xl mx-auto px-4">
          <h2 className="text-xl font-bold text-white mb-6">파일럿 (1단계)</h2>
          <ul className="space-y-3 text-slate-300 text-sm">
            <li className="flex gap-2">
              <span className="text-blue-400">1.</span>
              협회 승인 상담사에게 무료 {PILOT_FREE_CREDITS}크레딧 지급 (내담자 1명 = 1크레딧)
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400">2.</span>
              검사코드 일괄 발송·진행률·결과 조회 (기존 상담사 대시보드)
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400">3.</span>
              기관 POC: 1개 학급/부서 단위 cohort 선결제 협의
            </li>
          </ul>
        </div>
      </section>

      <MonetizationPricingSection />
      <MonetizationTrustSection />

      <section id="inquiry" className="py-16 bg-slate-950 scroll-mt-20">
        <div className="container max-w-xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-white text-center mb-6">문의</h2>
          <p className="text-slate-400 text-sm text-center mb-8">
            아래 이메일로 &lsquo;파일럿 / B2B&rsquo;를 제목에 적어 보내 주세요. 협회
            운영팀이 영업일 기준 2~3일 내 답변합니다.
          </p>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center space-y-4">
            <p>
              <a
                href="mailto:wizcocoai@gmail.com?subject=WizCoCo%20파트너%20문의"
                className="text-lg font-semibold text-blue-400 hover:text-blue-300"
              >
                wizcocoai@gmail.com
              </a>
            </p>
            <p className="text-xs text-slate-500">
              상담사 자격 신청은{' '}
              <Link href="/counselor-application/" className="text-blue-400 underline">
                상담사 신청 페이지
              </Link>
              를 이용해 주세요.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function PartnersLoginPrompt() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center rounded-2xl border border-white/10 bg-white/[0.03] p-8 md:p-10">
        <h1 className="text-xl font-semibold text-white mb-3">전문가·기관 전용 안내</h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          파트너 프로그램·요금·B2B 안내는 로그인한 전문가·기관 담당자에게만 표시됩니다.
          내담자 검사는 홈에서 바로 시작할 수 있습니다.
        </p>
        <div className="flex flex-col gap-3 items-center">
          <Link
            href="/portal/login/"
            className="w-full py-3 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-500 transition-colors"
          >
            검사 시작
          </Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-300">
            홈으로
          </Link>
          <div className="pt-4 border-t border-white/10 w-full flex justify-center">
            <ProfessionalAccessIcons variant="nav" isLoggedIn={false} />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function PartnersPageClient() {
  const { authPending } = useAuthResolved();

  if (authPending) {
    return (
      <div className="min-h-screen pt-16" style={{ backgroundColor: APP_PAGE_BG }}>
        <AuthLoadingState message="확인 중…" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16" style={{ backgroundColor: APP_PAGE_BG }}>
      <div className="pt-0">
        <CounselorProfessionalAccessGate
          loginFallback={<PartnersLoginPrompt />}
          unapprovedFallback={<CounselorProfessionalUnapprovedPrompt />}
        >
          <PartnersContent />
        </CounselorProfessionalAccessGate>
      </div>
    </div>
  );
}
