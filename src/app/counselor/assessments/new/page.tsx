'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthLink from '@/components/auth/AuthLink';
import AssessmentCreateForm from '@/components/counselor/AssessmentCreateForm';
import IndividualAssessmentCreateForm from '@/components/counselor/IndividualAssessmentCreateForm';
import Link from 'next/link';

type IssueMode = 'shared' | 'individual';

function NewAssessmentContent() {
  const searchParams = useSearchParams();
  const mode = (searchParams.get('type') === 'individual' ? 'individual' : 'shared') as IssueMode;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <AuthLink href="/counselor/assessments" className="text-slate-400 hover:text-white text-sm">
          ← 목록
        </AuthLink>
        <h1 className="text-2xl font-bold text-white">새 검사코드 만들기</h1>
      </div>

      <div className="flex gap-2 p-1 rounded-xl bg-slate-800/80 border border-slate-600 max-w-xl">
        <Link
          href="/counselor/assessments/new?type=shared"
          className={`flex-1 text-center py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
            mode === 'shared'
              ? 'bg-blue-600 text-white'
              : 'text-slate-300 hover:bg-slate-700/80'
          }`}
        >
          공동 이용
        </Link>
        <Link
          href="/counselor/assessments/new?type=individual"
          className={`flex-1 text-center py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
            mode === 'individual'
              ? 'bg-blue-600 text-white'
              : 'text-slate-300 hover:bg-slate-700/80'
          }`}
        >
          개별 발급
        </Link>
      </div>

      {mode === 'shared' ? (
        <>
          <p className="text-slate-400 text-sm max-w-2xl">
            하나의 검사코드를 여러 내담자가 공유합니다.{' '}
            <AuthLink href="/join/" className="text-sky-400 hover:text-sky-300 underline">
              검사 시작
            </AuthLink>
            에서 코드만 입력해 검사를 시작하고, <strong className="text-slate-200">검사 1건 이상 완료</strong> 시
            입력한 연락처로 개인 <strong className="text-slate-200">내 검사실</strong> 코드·비밀번호가 발송됩니다.
          </p>
          <AssessmentCreateForm />
        </>
      ) : (
        <>
          <p className="text-slate-400 text-sm max-w-2xl">
            내담자마다 고유 검사코드·비밀번호를 발급합니다. 이름·이메일·휴대폰을 직접 입력하거나 CSV/텍스트 파일로
            일괄 등록할 수 있으며, 즉시 또는 예약 시각에 이메일·문자로 발송됩니다. 내담자는{' '}
            <AuthLink href="/portal/login" className="text-sky-400 hover:text-sky-300 underline">
              내 검사실
            </AuthLink>
            에서 검사를 이어갑니다.
          </p>
          <IndividualAssessmentCreateForm />
        </>
      )}
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
