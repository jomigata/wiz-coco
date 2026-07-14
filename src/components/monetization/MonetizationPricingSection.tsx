import Link from 'next/link';
import {
  counselorMonetizationProducts,
  orgMonetizationProducts,
} from '@/data/monetizationCatalog';
import HomeSectionShell from '@/components/home/HomeSectionShell';
import { wizCardClasses, wizSectionClasses } from '@/components/layout/wizDesignTokens';

function ProductCard({
  product,
}: {
  product: (typeof counselorMonetizationProducts)[number];
}) {
  return (
    <div
      className={`rounded-xl border p-6 flex flex-col h-full shadow-sm ${
        product.highlighted
          ? 'border-blue-400 bg-blue-50 shadow-md shadow-blue-100'
          : `${wizCardClasses.base} !p-6`
      }`}
    >
      {product.highlighted && (
        <span className="text-xs font-semibold text-blue-600 mb-2">추천</span>
      )}
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{product.name}</h3>
      <p className="text-slate-600 text-sm mb-4 flex-1">{product.description}</p>
      <p className="text-2xl font-bold text-slate-900 mb-1">{product.priceLabel}</p>
      {product.priceNote && (
        <p className="text-xs text-slate-500 mb-4">{product.priceNote}</p>
      )}
      <ul className="space-y-1.5 mb-6">
        {product.features.map((f) => (
          <li key={f} className="text-sm text-slate-600 flex gap-2">
            <span className="text-emerald-500" aria-hidden>
              •
            </span>
            {f}
          </li>
        ))}
      </ul>
      <Link
        href={product.ctaHref}
        className={`inline-flex justify-center py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors ${
          product.highlighted
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
        }`}
      >
        {product.ctaLabel}
      </Link>
    </div>
  );
}

export default function MonetizationPricingSection() {
  return (
    <HomeSectionShell tone="pricing" className="py-16 md:py-20">
      <div className="container max-w-6xl mx-auto px-4">
        <h2 className={`${wizSectionClasses.title} text-center mb-3`}>요금 안내 (가이드)</h2>
        <p className="text-slate-600 text-center mb-10 text-sm">
          1단계 파일럿은 협회 Admin이 크레딧을 지급합니다. 정식 요금·PG 결제는 2단계에서
          연동됩니다.
        </p>

        <h3 className="text-lg font-semibold text-blue-700 mb-4">전문상담사 · 센터</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {counselorMonetizationProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        <h3 className="text-lg font-semibold text-blue-700 mb-4">학교 · 기업 · 기관</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {orgMonetizationProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </HomeSectionShell>
  );
}
