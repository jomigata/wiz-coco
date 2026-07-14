import Link from 'next/link';
import { privacyTrustPoints } from '@/data/monetizationCatalog';
import HomeSectionShell from '@/components/home/HomeSectionShell';
import { wizSectionClasses } from '@/components/layout/wizDesignTokens';

export default function MonetizationTrustSection() {
  return (
    <HomeSectionShell tone="monetizationTrust" className="py-16 md:py-20">
      <div className="container max-w-4xl mx-auto px-4">
        <h2 className={`${wizSectionClasses.title} text-center mb-3`}>
          비용·개인정보 부담을 줄이는 설계
        </h2>
        <p className="text-slate-600 text-center mb-10 text-sm">
          &ldquo;내 돈 내고 민감한 정보를 넘겨도 되나?&rdquo; — 채널별로 결제 주체와 신원
          수집을 분리합니다.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {privacyTrustPoints.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm"
            >
              <h3 className="font-semibold text-emerald-800 mb-2">{p.title}</h3>
              <p className="text-slate-600 text-sm">{p.body}</p>
            </div>
          ))}
        </div>
        <p className="text-center mt-8 text-sm text-slate-500">
          <Link href="/privacy/" className="text-blue-600 hover:text-blue-700 underline">
            개인정보처리방침
          </Link>
          {' · '}
          SSL 적용 · Firebase 위탁 운영
        </p>
      </div>
    </HomeSectionShell>
  );
}
