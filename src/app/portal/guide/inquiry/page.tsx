import type { Metadata } from 'next';
import PersonalPurchaseInquiryPageClient from './PersonalPurchaseInquiryPageClient';

export const metadata: Metadata = {
  title: '개인 구매 문의 | WizCoCo',
  description: '개인 검사코드 구매·패키지 선택 문의 접수',
};

export default function PersonalPurchaseInquiryPage() {
  return <PersonalPurchaseInquiryPageClient />;
}
