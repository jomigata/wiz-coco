import MypageAccountSectionPage from '@/components/mypage/MypageAccountSectionPage';

export default function MypageAccountInfoPage() {
  return (
    <MypageAccountSectionPage
      title="계정 정보"
      description="로그인 계정, 개인 기본 정보, 공개 범위, 상담사 역할을 관리합니다."
      section="account"
      showAccountExtras
    />
  );
}
