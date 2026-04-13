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
        안내 제목, 대상, 안내 메시지, 포함할 검사를 설정하면 고유 <strong className="text-slate-200">검사코드</strong>가
        발급됩니다. (검사코드 형식: 자음-모음-자음 + 숫자 2~9만, 3자리부터 등.) 내담자는 로그인한 뒤 「검사 하기」에서 이
        코드만 입력하면 됩니다.
      </p>
      <AssessmentCreateForm />
    </div>
  );
}
