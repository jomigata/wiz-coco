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
        <h1 className="text-2xl font-bold text-white">새 검사코드 만들기</h1>
      </div>
      <p className="text-slate-400 text-sm">
        안내 제목, 대상, 안내 메시지, 포함할 검사를 설정하면 검사코드와 함께 내담자용 숫자 4자리 비밀번호가 자동 발급됩니다. (검사코드 형식: 자음-모음-자음 + 숫자 2~9만, 3자리부터 등.) 목록 상단 안내에서만 비밀번호 숫자를 확인할 수 있으니 내담자에게 검사코드·비밀번호를 안전하게 전달해 주세요.
      </p>
      <AssessmentCreateForm />
    </div>
  );
}
