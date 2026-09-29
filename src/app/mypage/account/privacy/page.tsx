import { redirect } from 'next/navigation';

export default function MypagePrivacyRedirect() {
  redirect('/mypage/account/info');
}
