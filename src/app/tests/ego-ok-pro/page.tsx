'use client';

import MbtiProTest from '@/components/tests/MbtiProTest';
import { EGO_OK_PRO_TEST_FLOW } from '@/config/mbtiProTestFlow';
import { Suspense } from 'react';

function EgoOkProTestContent() {
  return <MbtiProTest isLoggedIn flow={EGO_OK_PRO_TEST_FLOW} />;
}

export default function EgoOkProTestPage() {
  return (
    <div className="min-h-screen h-full overflow-y-auto bg-emerald-950">
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center pt-16">
            <div className="text-lg text-emerald-200">로딩 중...</div>
          </div>
        }
      >
        <EgoOkProTestContent />
      </Suspense>
    </div>
  );
}
