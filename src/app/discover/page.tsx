import Link from 'next/link';
import type { Metadata } from 'next';
import { DiscoverProfessionalExtras } from './DiscoverProfessionalExtras';

export const metadata: Metadata = {
  title: 'WizCoCo Discover — 3분 마음 체크',
  description: '무료 미니 검사로 시작하는 개인 심리 웰니스. 협회 B2B2C와 분리된 D2C 경로.',
  openGraph: {
    title: 'WizCoCo Discover — 3분 마음 체크',
    description: '6문항 무료 · 로그인 없이 시작 · 심층 리포트 업그레이드',
  },
};

export default function DiscoverLandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-violet-950/40 to-slate-950 text-white">
      <div className="container py-16 md:py-24 max-w-3xl mx-auto text-center px-4">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-violet-500/20 text-violet-200 border border-violet-400/20 mb-6">
          WizCoCo Discover · D2C
        </span>
        <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
          3분으로 시작하는
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300">
            마음 웰니스 체크
          </span>
        </h1>
        <p className="text-slate-300 text-lg mb-10 leading-relaxed">
          6문항 무료 미니 검사 → 맞춤 리포트 업그레이드.
          <br />
          상담사·기관 파트너 경로와 브랜드를 분리했습니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            href="/discover/mini-check/"
            className="px-8 py-4 rounded-xl bg-violet-600 font-semibold hover:bg-violet-500 transition-colors"
          >
            무료 미니 검사 시작
          </Link>
          <Link
            href="/discover/shop/"
            className="px-8 py-4 rounded-xl border border-white/25 font-semibold hover:bg-white/5 transition-colors"
          >
            Basic · Premium · Pro
          </Link>
        </div>
        <DiscoverProfessionalExtras />
        <p className="mt-8 text-sm text-slate-500">
          <Link href="/" className="text-violet-300 hover:underline">
            WizCoCo 홈
          </Link>
        </p>
      </div>
    </main>
  );
}
