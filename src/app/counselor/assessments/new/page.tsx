'use client';

import React, { Suspense } from 'react';
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
    <Suspense fallback={<div className="text-slate-400 py-4 text-sm">불러오는 중…</div>}>
      <div className="flex min-h-0 flex-1 flex-col">
        <NewAssessmentContent />
      </div>
    </Suspense>
  );
}
