'use client';

import { notFound } from 'next/navigation';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CounselorCategoryHub from '@/components/counselor/CounselorCategoryHub';
import { getCounselorCategoryBySlug, COUNSELOR_SALES_HUB_SLUG } from '@/data/counselorMenu';
import {
  COUNSELOR_PSYCH_TESTS_SLUG,
  COUNSELOR_TOOLS_SLUG,
  getCounselorCategoryDefaultHref,
  getPsychTestsDefaultHref,
} from '@/lib/counselorManageShell';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';

type Props = {
  slug: string;
};

export default function CounselorCategoryHubPageClient({ slug }: Props) {
  const router = useRouter();
  const { authPending, showLoginRequired } = useAuthResolved();
  const category = getCounselorCategoryBySlug(slug);

  useEffect(() => {
    if (slug === COUNSELOR_PSYCH_TESTS_SLUG) {
      router.replace(getPsychTestsDefaultHref());
    } else if (slug === COUNSELOR_TOOLS_SLUG) {
      router.replace(getCounselorCategoryDefaultHref(COUNSELOR_TOOLS_SLUG));
    } else if (slug === COUNSELOR_SALES_HUB_SLUG) {
      router.replace(getCounselorCategoryDefaultHref(COUNSELOR_SALES_HUB_SLUG));
    }
  }, [slug, router]);

  if (!category) {
    notFound();
  }

  if (slug === COUNSELOR_PSYCH_TESTS_SLUG) {
    return <AuthLoadingState className="py-8" message="상담코드 관리로 이동 중…" />;
  }

  if (slug === COUNSELOR_TOOLS_SLUG) {
    return <AuthLoadingState className="py-8" message="1:1 채팅으로 이동 중…" />;
  }

  if (slug === COUNSELOR_SALES_HUB_SLUG) {
    return <AuthLoadingState className="py-8" message="3분 마음 체크로 이동 중…" />;
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
