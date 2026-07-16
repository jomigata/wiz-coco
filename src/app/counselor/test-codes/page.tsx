'use client';

import AdminPageLayout from '@/components/AdminPageLayout';
import AuthLink from '@/components/auth/AuthLink';

export default function TestCodesPage() {
  return (
    <AdminPageLayout
      sectionTitle="심리검사 코드"
      description="포함 검사·검사 유형 설정을 관리합니다. 내담자 발급용 검사코드는 별도 메뉴에서 생성합니다."
      toolbar={
        <AuthLink
          href="/counselor/assessments"
          className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500"
        >
          검사코드 목록
        </AuthLink>
      }
    >
      <p className="text-sm text-slate-400">
        검사 패키지·유형 관리 UI가 이 영역에 표시됩니다. 발급·발송은{' '}
        <AuthLink href="/counselor/assessments/new" className="text-sky-400 hover:text-sky-300">
          새 검사코드 만들기
        </AuthLink>
        에서 진행하세요.
      </p>
    </AdminPageLayout>
  );
}
