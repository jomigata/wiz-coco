import type { Metadata } from 'next';
import PortalGuidePageClient from './PortalGuidePageClient';

export const metadata: Metadata = {
  title: '검사코드 안내 | WizCoCo',
  description:
    '검사코드 받는 방법, 상담사 없이 개인이 검사코드를 구매해 진행하는 방법, 추천 검사 유형 안내',
};

export default function PortalGuidePage() {
  return <PortalGuidePageClient />;
}
