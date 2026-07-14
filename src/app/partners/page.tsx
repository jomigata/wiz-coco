import PartnersPageClient from './PartnersPageClient';

export const metadata = {
  title: '파트너 · 기관 도입 | WizCoCo',
  description: '승인 상담사 전용 — 전문상담사·학교·기업 B2B2C·B2B 안내',
  robots: { index: false, follow: false },
};

export default function PartnersPage() {
  return <PartnersPageClient />;
}
