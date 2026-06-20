'use client';

import React from 'react';
import AuthLink from '@/components/auth/AuthLink';
import AssessmentCreateForm from '@/components/counselor/AssessmentCreateForm';

export default function AssessmentCreatePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <AuthLink
          href="/counselor/assessments"
          className="text-slate-400 hover:text-white text-sm"
        >
          ← 목록
        </AuthLink>
        <h1 className="text-2xl font-bold text-white">새 검사코드 만들기</h1>
      </div>
      <p className="text-slate-400 text-sm">
        안내 제목, 대상, 안내 메시지, 포함할 검사를 설정하면 고유 <strong className="text-slate-200">검사코드</strong>가 발급됩니다.
        내담자는 회원가입 없이{' '}
        <AuthLink href="/join/" className="text-sky-400 hover:text-sky-300 underline">
          검사 시작
        </AuthLink>
        에서 코드만 입력해 검사를 시작합니다. 검사 완료 후 내 검사실 접속 정보는 이메일·문자로 발송됩니다.
      </p>
      <AssessmentCreateForm />
    </div>
  );
}
