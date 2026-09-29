import { redirect } from 'next/navigation';

export default function MypageRootRedirect() {
  redirect('/mypage/account/info');
}
