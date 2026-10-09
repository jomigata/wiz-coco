'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoadingMessage } from '@/components/ui/LoadingMessage';
import LocalPsychTestArchivePanel from '@/components/tests/LocalPsychTestArchivePanel';
import LegacyTestRedirect from '@/components/LegacyTestRedirect';
import { isLocalPsychTestDirectActive } from '@/lib/localPsychTestDirectStart';

function LocalArchiveContent() {
  const searchParams = useSearchParams();
  const localDirect = isLocalPsychTestDirectActive(searchParams);
  const focusId = searchParams.get('focus');

  if (!localDirect) {
    return <LegacyTestRedirect />;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 px-4 py-8">
      <div className="mb-6">
        <Link href="/tests?localDirect=1" className="text-sm text-sky-300 hover:text-sky-200">
          ← 검사 목록
        </Link>
      </div>
      <LocalPsychTestArchivePanel focusId={focusId} />
    </div>
  );
}

export default function LocalArchivePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <LoadingMessage />
        </div>
      }
    >
      <LocalArchiveContent />
    </Suspense>
  );
}
