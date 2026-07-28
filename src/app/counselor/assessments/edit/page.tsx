'use client';

import React, { Suspense } from 'react';
import AuthLink from '@/components/auth/AuthLink';
import { CounselorPageBody } from '@/components/counselor/CounselorPageSection';
import { useSearchParams } from 'next/navigation';
import AssessmentEditForm from '@/components/counselor/AssessmentEditForm';

function AssessmentEditContent() {
  const searchParams = useSearchParams();
  const id = (searchParams.get('id') || '').trim();

  if (!id) {
    return (
      <div className="text-red-400">
        수정할 상담코드를 선택해 주세요.{' '}
        <AuthLink href="/counselor/assessments" className="text-blue-400 hover:text-blue-300">
          목록으로
        </AuthLink>
      </div>
    );
  }

  return <AssessmentEditForm assessmentId={id} />;
}

export default function AssessmentEditPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 py-4 text-sm">불러오는 중…</div>}>
      <CounselorPageBody className="gap-1.5">
        <div className="flex shrink-0">
          <AuthLink
            href="/counselor/assessments"
            className="inline-flex items-center gap-1.5 text-sm text-slate-300 transition hover:text-white"
          >
            <span aria-hidden>←</span>
            상담코드 목록
          </AuthLink>
        </div>
        <AssessmentEditContent />
      </CounselorPageBody>
    </Suspense>
  );
}
