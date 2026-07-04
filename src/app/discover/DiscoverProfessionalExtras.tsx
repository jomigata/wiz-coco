'use client';

import Link from 'next/link';
import ProfessionalContentGate from '@/components/auth/ProfessionalContentGate';

export function DiscoverProfessionalExtras() {
  return (
    <ProfessionalContentGate>
      <section className="text-left rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8 mt-16">
        <h2 className="text-lg font-semibold mb-4">SNS · 바이럴 (운영)</h2>
        <ul className="text-sm text-slate-400 space-y-2 list-disc pl-5">
          <li>미니 검사 완료 화면에서 링크 공유 (카카오·인스타 스토리 등)</li>
          <li>UTM 예: ?utm_source=instagram&amp;utm_campaign=discover_mini</li>
          <li>협회 공식 채널과 콘텐츠·톤 분리 유지</li>
        </ul>
      </section>
      <p className="mt-4 text-sm text-slate-500">
        <Link href="/partners/" className="text-violet-300 hover:underline">
          파트너(상담사·기관)
        </Link>
      </p>
    </ProfessionalContentGate>
  );
}
