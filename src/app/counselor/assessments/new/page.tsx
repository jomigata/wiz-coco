'use client';

import React from 'react';
import Link from 'next/link';
import AssessmentCreateForm from '@/components/counselor/AssessmentCreateForm';

export default function AssessmentCreatePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/counselor/assessments"
          className="text-slate-400 hover:text-white text-sm"
        >
          ← 목록
        </Link>
        <h1 className="text-2xl font-bold text-white">검사 코드 패키지 만들기</h1>
      </div>
      <p className="text-slate-400 text-sm">
        제목, 대상, 안내 메시지, 포함할 검사를 설정하면 6자리 검사 코드가 발급됩니다. 내담자에게 코드를 전달해 검사를 수행하게 하세요.
      </p>
      <AssessmentCreateForm />
    </div>
  );
}
