import { redirect } from 'next/navigation';

export default function MypageRoleRedirect() {
  redirect('/mypage/account/info');
}
