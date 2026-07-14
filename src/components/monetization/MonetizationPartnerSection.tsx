import Link from 'next/link';
import HomeSectionShell from '@/components/home/HomeSectionShell';
import { wizButtonClasses, wizSectionClasses } from '@/components/layout/wizDesignTokens';

export default function MonetizationPartnerSection() {
  return (
    <HomeSectionShell tone="partner" className="py-16 md:py-20" showBottomFade={false}>
      <div className="container max-w-4xl mx-auto px-4 text-center">
        <h2 className={`${wizSectionClasses.title} mb-4`}>파트너 · 기관 도입 문의</h2>
        <p className="text-slate-600 mb-8 max-w-xl mx-auto">
          전문상담사·센터, 학교·기업 HR 담당자를 위한 파일럿 및 B2B 제안을 받습니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/counselor-application/" className={wizButtonClasses.primary}>
            상담사 · 센터 신청
          </Link>
          <Link href="/partners/" className={wizButtonClasses.outline}>
            기관 · B2B 안내
          </Link>
        </div>
      </div>
    </HomeSectionShell>
  );
}
