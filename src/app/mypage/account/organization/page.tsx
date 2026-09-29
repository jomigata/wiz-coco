import MypageAccountSectionPage from '@/components/mypage/MypageAccountSectionPage';

export default function MypageAccountOrganizationPage() {
  return (
    <MypageAccountSectionPage
      title="회사/기관 정보"
      description="기관명·사업자등록번호·연락처·주소를 관리합니다. 기관명은 상담사 계정과 저장 시 자동으로 맞춰집니다."
      section="organization"
    />
  );
}
