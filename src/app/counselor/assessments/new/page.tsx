'use client';

import React, { Suspense } from 'react';
import { LoadingMessage } from '@/components/ui/LoadingMessage';
import { CounselorPageBody } from '@/components/counselor/CounselorPageSection';
import IndividualAssessmentCreateForm from '@/components/counselor/IndividualAssessmentCreateForm';

function NewAssessmentContent() {
  return (
    <CounselorPageBody className="gap-4">
      <IndividualAssessmentCreateForm />
    </CounselorPageBody>
  );
}

export default function AssessmentCreatePage() {
  return (
    <Suspense fallback={<LoadingMessage layout="inline" className="py-4" textClassName="text-slate-400 text-sm" />}>
      <div className="flex min-h-0 flex-1 flex-col">
        <NewAssessmentContent />
      </div>
    </Suspense>
  );
}
