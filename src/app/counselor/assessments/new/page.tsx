'use client';

import React, { Suspense } from 'react';
import AuthLink from '@/components/auth/AuthLink';
import { CounselorPageBody } from '@/components/counselor/CounselorPageSection';
import IndividualAssessmentCreateForm from '@/components/counselor/IndividualAssessmentCreateForm';

function NewAssessmentContent() {
  return (
    <CounselorPageBody className="gap-4 overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <AuthLink
          href="/counselor/assessments"
          className="inline-flex items-center gap-1.5 text-base text-slate-300 transition hover:text-white"
        >
          <span aria-hidden>←</span>
          검사코드 목록
        </AuthLink>
        <p className="text-sm text-slate-400">
          나의코드·비밀번호 발송 · CSV/엑셀 일괄 · 기존 코드에 추가
        </p>
      </div>

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
