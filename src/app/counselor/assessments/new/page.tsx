'use client';

import React, { Suspense } from 'react';
import AuthLink from '@/components/auth/AuthLink';
import IndividualAssessmentCreateForm from '@/components/counselor/IndividualAssessmentCreateForm';

function NewAssessmentContent() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <AuthLink
          href="/counselor/assessments"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
        >
          <span aria-hidden>←</span>
          검사코드 목록
        </AuthLink>
        <p className="text-[11px] text-slate-500">
          나의코드·비밀번호 발송 · CSV/엑셀 일괄 · 기존 코드에 추가
        </p>
      </div>

      <IndividualAssessmentCreateForm />
    </div>
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
