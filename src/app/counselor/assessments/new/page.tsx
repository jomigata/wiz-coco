'use client';

import React, { Suspense } from 'react';
import AuthLink from '@/components/auth/AuthLink';
import IndividualAssessmentCreateForm from '@/components/counselor/IndividualAssessmentCreateForm';

function NewAssessmentContent() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <AuthLink href="/counselor/assessments" className="text-slate-400 hover:text-white text-sm shrink-0">
          ← 검사코드 목록
        </AuthLink>
        <p className="text-slate-500 text-xs">
          내담자별 나의코드·비밀번호 발송 · CSV/엑셀 일괄 · 기존 코드에 추가
        </p>
      </div>

      <IndividualAssessmentCreateForm />
    </div>
  );
}

export default function AssessmentCreatePage() {
  return (
    <Suspense fallback={<div className="text-slate-400 py-4 text-sm">불러오는 중…</div>}>
      <NewAssessmentContent />
    </Suspense>
  );
}
