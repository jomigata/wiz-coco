'use client';

import React, { Suspense } from 'react';
import AuthLink from '@/components/auth/AuthLink';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import { useSearchParams } from 'next/navigation';
import AssessmentEditForm from '@/components/counselor/AssessmentEditForm';

function AssessmentEditContent() {
  const searchParams = useSearchParams();
  const id = (searchParams.get('id') || '').trim();

  if (!id) {
    return (
      <div className="text-red-400">
        수정할 검사코드를 선택해 주세요.{' '}
        <AuthLink href="/counselor/assessments" className="text-blue-400 hover:text-blue-300">
          목록으로
        </AuthLink>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <AuthLink href="/counselor/assessments" className="text-sm text-sky-300/70 hover:text-sky-200">
        ← 검사코드 목록
      </AuthLink>
      <CounselorPageSection
        title="검사 설정"
        description="안내 제목·대상·메시지·포함 검사를 수정할 수 있습니다. 검사코드는 변경되지 않습니다."
      >
        <AssessmentEditForm assessmentId={id} />
      </CounselorPageSection>
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
