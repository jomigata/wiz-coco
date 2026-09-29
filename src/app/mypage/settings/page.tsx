import { redirect } from 'next/navigation';

export default function MypageSettingsRedirect() {
  redirect('/mypage/account/info');
}
