'use client';

import Link from 'next/link';
import { COUNSELOR_SALES_HUB_HREF } from '@/data/counselorMenu';

export function DiscoverProfessionalExtras() {
  return (
    <section className="text-left rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8 mt-16">
      <h2 className="text-lg font-semibold mb-4">SNS · 바이럴 영업 팁</h2>
      <ul className="text-sm text-slate-400 space-y-2 list-disc pl-5">
        <li>미니 검사 완료 화면에서 링크 공유 (카카오·인스타 스토리 등)</li>
        <li>UTM 예: ?utm_source=instagram&amp;utm_campaign=discover_mini</li>
        <li>협회 공식 채널과 콘텐츠·톤 분리 유지</li>
        <li>기관·B2B 제안은 파트너 프로그램 요금표를 함께 안내</li>
      </ul>
      <p className="mt-4 text-sm text-slate-500">
        <Link href={COUNSELOR_SALES_HUB_HREF} className="text-violet-300 hover:underline">
          영업 · 파트너 허브
        </Link>
        {' · '}
        <Link href="/partners/" className="text-violet-300 hover:underline">
          파트너 · 요금 안내
        </Link>
      </p>
    </section>
  );
}
