import type { Metadata } from 'next';
import DiscoverPageClient from './DiscoverPageClient';

export const metadata: Metadata = {
  title: 'Discover — 상담사 영업 도구 | WizCoCo',
  description: '승인 상담사 전용 Discover D2C — 3분 마음 체크·개인 리포트 영업',
  robots: { index: false, follow: false },
};

export default function DiscoverLandingPage() {
  return <DiscoverPageClient />;
}
