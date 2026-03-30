'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AssessmentEditForm from '@/components/counselor/AssessmentEditForm';

function AssessmentEditContent() {
  const searchParams = useSearchParams();
  const id = (searchParams.get('id') || '').trim();

  if (!id) {
    return (
      <div className="text-red-400">
        수정할 검사코드를 선택해 주세요.{' '}
        <Link href="/counselor/assessments" className="text-blue-400 hover:text-blue-300">
          목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/counselor/assessments" className="text-slate-400 hover:text-white text-sm">
          ← 목록
        </Link>
        <h1 className="text-2xl font-bold text-white">검사코드 수정</h1>
      </div>
      <p className="text-slate-400 text-sm">
        안내 제목·대상·메시지·포함 검사를 수정할 수 있습니다. 검사코드 문자열은 변경되지 않습니다.
      </p>
      <AssessmentEditForm assessmentId={id} />
    </div>
  );
}

export default function AssessmentEditPage() {
  return (
    <Suspense fallback={<p className="text-slate-400">불러오는 중…</p>}>
      <AssessmentEditContent />
    </Suspense>
  );
}
