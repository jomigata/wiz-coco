'use client';

import { notFound } from 'next/navigation';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CounselorCategoryHub from '@/components/counselor/CounselorCategoryHub';
import { getCounselorCategoryBySlug } from '@/data/counselorMenu';
import {
  COUNSELOR_PSYCH_TESTS_SLUG,
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
    }
  }, [slug, router]);

  if (!category) {
    notFound();
  }

  if (slug === COUNSELOR_PSYCH_TESTS_SLUG) {
    return <AuthLoadingState className="py-8" message="심리검사 관리로 이동 중…" />;
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
