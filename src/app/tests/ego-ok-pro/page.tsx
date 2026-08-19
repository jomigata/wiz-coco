'use client';

import MbtiProTest from '@/components/tests/MbtiProTest';
import { EGO_OK_PRO_TEST_FLOW } from '@/config/mbtiProTestFlow';
import { Suspense } from 'react';
import { LoadingMessage } from '@/components/ui/LoadingMessage';

function EgoOkProTestContent() {
  return <MbtiProTest isLoggedIn flow={EGO_OK_PRO_TEST_FLOW} />;
}

export default function EgoOkProTestPage() {
  return (
    <div className="bg-[#070b14]">
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center pt-16">
            <LoadingMessage textClassName="text-lg text-slate-300" />
          </div>
        }
      >
        <EgoOkProTestContent />
      </Suspense>
    </div>
  );
}
