import Link from 'next/link';
import BusinessLegalBlock from '@/components/layout/BusinessLegalBlock';
import { BUSINESS_LEGAL } from '@/lib/businessLegal';

export const metadata = {
  title: '사업자 정보 | WizCoCo',
  description: '위즈코코(WizCoCo) 사업자 및 연락처 정보',
};

/** 카카오 채널 심사·푸터 캡처용 사업자 정보 페이지 */
export default function CompanyPage() {
  return (
    <div className="min-h-screen bg-[#f2f6fa] text-slate-700">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <p className="text-xs uppercase tracking-widest text-emerald-600/80">WizCoCo</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-800">사업자 정보</h1>
        <p className="mt-2 text-sm text-slate-600">
          카카오 비즈니스 채널 심사 및 이용자 고지용 공식 사업자 정보입니다.
        </p>

        <div className="mt-8">
          <BusinessLegalBlock variant="full" />
        </div>

        <p className="mt-6 text-xs text-slate-500">
          화면 캡처: 이 페이지 또는 사이트 하단 푸터의 사업자 정보 영역을 사용하세요.
        </p>

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link href="/" className="text-emerald-400 hover:text-emerald-300">
            홈으로
          </Link>
          <Link href="/terms/" className="text-slate-400 hover:text-slate-300">
            이용약관
          </Link>
          <Link href="/privacy/" className="text-slate-400 hover:text-slate-300">
            개인정보처리방침
          </Link>
        </div>

        <p className="mt-12 text-center text-[11px] text-slate-600">
          © {new Date().getFullYear()} {BUSINESS_LEGAL.brandName}. Operated by{' '}
          {BUSINESS_LEGAL.companyName}.
        </p>
      </div>
    </div>
  );
}
