'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoadingMessage } from '@/components/ui/LoadingMessage';
import { CounselorPageBody } from '@/components/counselor/CounselorPageSection';
import IndividualAssessmentCreateForm from '@/components/counselor/IndividualAssessmentCreateForm';
import CounselorQuickSendForm from '@/components/counselor/CounselorQuickSendForm';

function NewAssessmentContent() {
  const searchParams = useSearchParams();
  const full = searchParams.get('full') === '1';

  return (
    <CounselorPageBody className="gap-4">
      {full ? <IndividualAssessmentCreateForm /> : <CounselorQuickSendForm />}
    </CounselorPageBody>
  );
}

export default function AssessmentCreatePage() {
  return (
    <Suspense
      fallback={
        <LoadingMessage layout="inline" className="py-4" textClassName="text-slate-400 text-sm" />
      }
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <NewAssessmentContent />
      </div>
    </Suspense>
  );
}
