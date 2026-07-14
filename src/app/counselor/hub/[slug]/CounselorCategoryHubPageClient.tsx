'use client';

import { notFound } from 'next/navigation';
import CounselorCategoryHub from '@/components/counselor/CounselorCategoryHub';
import { getCounselorCategoryBySlug } from '@/data/counselorMenu';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';

type Props = {
  slug: string;
};

export default function CounselorCategoryHubPageClient({ slug }: Props) {
  const { authPending, showLoginRequired } = useAuthResolved();
  const category = getCounselorCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  if (authPending) {
    return <AuthLoadingState className="py-16" message="확인 중…" />;
  }

  if (showLoginRequired) {
    return (
      <AuthRequiredState description="Firebase에 로그인한 상태에서 상담관리 허브를 이용할 수 있습니다." />
    );
  }

  return <CounselorCategoryHub category={category} />;
}
