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

      <p className="text-slate-400 text-sm max-w-2xl">
        <strong className="text-slate-200">검사코드</strong>를 내담자 목록에 발급합니다. 내담자마다 고유한
        나의코드·비밀번호가 함께 발송되며, 이름·이메일·휴대폰을 직접 입력하거나 CSV/텍스트로 일괄 등록할 수
        있습니다. 기존 검사코드를 선택해 추가 초대도 가능합니다. 내담자는{' '}
        <AuthLink href="/portal/login" className="text-sky-400 hover:text-sky-300 underline">
          검사시작
        </AuthLink>
        에서 나의코드로 검사를 진행합니다.
      </p>

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
