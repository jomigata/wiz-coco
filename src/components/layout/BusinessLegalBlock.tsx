import { BUSINESS_LEGAL } from '@/lib/businessLegal';

type BusinessLegalBlockProps = {
  /** 카카오 심사용 캡처 — 브랜드·상호 연결 문구 포함 */
  variant?: 'compact' | 'full';
  className?: string;
};

export default function BusinessLegalBlock({
  variant = 'compact',
  className = '',
}: BusinessLegalBlockProps) {
  const b = BUSINESS_LEGAL;

  if (variant === 'full') {
    return (
      <div
        className={`rounded-xl border border-white/10 bg-white/[0.03] p-5 text-xs leading-relaxed text-slate-400 ${className}`}
      >
        <p className="mb-3 text-sm font-semibold text-slate-200">
          {b.brandNameKo}({b.brandName}) · 사업자 정보
        </p>
        <dl className="grid gap-2 sm:grid-cols-[7.5rem_1fr]">
          <dt className="text-slate-500">서비스명</dt>
          <dd className="text-slate-300">
            {b.brandNameKo} ({b.brandName})
          </dd>
          <dt className="text-slate-500">상호</dt>
          <dd className="text-slate-300">{b.companyName}</dd>
          <dt className="text-slate-500">대표자</dt>
          <dd className="text-slate-300">{b.representative}</dd>
          <dt className="text-slate-500">사업자등록번호</dt>
          <dd className="text-slate-300">{b.businessRegistrationNumber}</dd>
          <dt className="text-slate-500">사업장 소재지</dt>
          <dd className="text-slate-300">{b.address}</dd>
          <dt className="text-slate-500">문의</dt>
          <dd className="text-slate-300">
            <a href={`mailto:${b.contactEmail}`} className="text-sky-300/90 hover:text-sky-200">
              {b.contactEmail}
            </a>
          </dd>
          <dt className="text-slate-500">통신판매업 신고</dt>
          <dd className="text-slate-300">
            {b.mailOrderReportNumber ?? '해당 없음'}
            <span className="mt-1 block text-[11px] text-slate-500">{b.mailOrderReportNote}</span>
          </dd>
        </dl>
        <p className="mt-4 border-t border-white/10 pt-3 text-[11px] text-slate-500">
          {b.brandRelationNote}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-1 text-[11px] leading-relaxed text-slate-500 ${className}`}>
      <p>
        <span className="text-slate-400">{b.brandNameKo}</span> · 상호 {b.companyName} · 대표{' '}
        {b.representative}
      </p>
      <p>
        사업자등록번호 {b.businessRegistrationNumber} · {b.contactEmail}
      </p>
      <p className="text-slate-600">{b.address}</p>
    </div>
  );
}
