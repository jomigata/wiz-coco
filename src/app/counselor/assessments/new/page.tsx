'use client';

import React, { Suspense } from 'react';
import AuthLink from '@/components/auth/AuthLink';
import IndividualAssessmentCreateForm from '@/components/counselor/IndividualAssessmentCreateForm';

function NewAssessmentContent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <AuthLink href="/counselor/assessments" className="text-slate-400 hover:text-white text-sm">
          ← 목록
        </AuthLink>
        <h1 className="text-2xl font-bold text-white">새 검사코드 만들기</h1>
      </div>

      <ul className="text-slate-400 text-sm max-w-2xl space-y-1.5 list-disc pl-5">
        <li>검사코드는 각 내담자에게 각각의 고유한 나의코드·비밀번호가 함께 발송됩니다.</li>
        <li>내담자 명단은 이름·이메일·휴대폰을 직접 입력하거나 CSV/텍스트 파일로 일괄 등록할 수 있습니다.</li>
        <li>기존 검사코드를 선택하여 내담자 추가도 가능합니다.</li>
      </ul>

      <IndividualAssessmentCreateForm />
    </div>
  );
}

export default function AssessmentCreatePage() {
  return (
    <Suspense fallback={<div className="text-slate-400 py-8">불러오는 중…</div>}>
      <NewAssessmentContent />
    </Suspense>
  );
}
