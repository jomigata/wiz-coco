'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LegacyTestRedirect from '@/components/LegacyTestRedirect';
import StandaloneMbtiMenuTest from '@/components/tests/StandaloneMbtiMenuTest';
import {
  isLocalPsychTestDirectActive,
  withLocalPsychTestDirectHref,
} from '@/lib/localPsychTestDirectStart';
import { LoadingMessage } from '@/components/ui/LoadingMessage';
import { useEffect } from 'react';

export type LocalPsychLegacyKind = 'mbti' | 'ai-profiling' | 'inside-mbti';

function LocalPsychLegacyTestPageInner({ kind }: { kind: LocalPsychLegacyKind }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const localDirect = isLocalPsychTestDirectActive(searchParams);

  useEffect(() => {
    if (!localDirect || kind !== 'ai-profiling') return;
    router.replace(withLocalPsychTestDirectHref('/tests/integrated-assessment'));
  }, [localDirect, kind, router]);

  if (!localDirect) {
    return <LegacyTestRedirect />;
  }

  if (kind === 'ai-profiling') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-[#070b14]">
        <LoadingMessage textClassName="text-slate-300" />
      </div>
    );
  }

  if (kind === 'inside-mbti') {
    return <StandaloneMbtiMenuTest variant="inside-mbti" />;
  }

  return <StandaloneMbtiMenuTest variant="mbti" />;
}

export default function LocalPsychLegacyTestPage({ kind }: { kind: LocalPsychLegacyKind }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <LoadingMessage />
        </div>
      }
    >
      <LocalPsychLegacyTestPageInner kind={kind} />
    </Suspense>
  );
}
