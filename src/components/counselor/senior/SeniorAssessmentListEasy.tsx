'use client';

import React, { useMemo, useState } from 'react';
import AuthLink from '@/components/auth/AuthLink';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import {
  deleteAssessment,
  removeCounselorAssessmentFromListCache,
  type CounselorAssessment,
} from '@/lib/assessmentApi';

type Props = {
  assessments: CounselorAssessment[];
  revalidating?: boolean;
};

/** 큰 카드형 — 한 장씩 읽기 쉽게 */
export default function SeniorAssessmentListEasy({ assessments, revalidating }: Props) {
  const [items, setItems] = useState(assessments);
  const [deleteTarget, setDeleteTarget] = useState<CounselorAssessment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  React.useEffect(() => {
    setItems(assessments);
  }, [assessments]);

  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
      ),
    [items],
  );

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await deleteAssessment(deleteTarget.id, deleteTarget.accessCode);
      removeCounselorAssessmentFromListCache(deleteTarget.id, deleteTarget.accessCode);
      setItems((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : '삭제에 실패했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <CounselorPageSection
      showHierarchyBreadcrumb
      description={
        <>
          큰 글씨·카드형 화면 · 검사코드 {sorted.length}개
          {revalidating ? (
            <span className="ml-2 text-sky-300">· 최신 정보 불러오는 중…</span>
          ) : null}
        </>
      }
      toolbar={
        <AuthLink
          href="/counselor/assessments"
          className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-base font-medium text-white hover:bg-white/15"
        >
          일반 목록
        </AuthLink>
      }
    >
      <div className="space-y-4 p-2">
        {sorted.length === 0 ? (
          <p className="py-16 text-center text-xl text-slate-300">등록된 검사코드가 없습니다.</p>
        ) : (
          sorted.map((a) => (
            <article
              key={a.id}
              className="rounded-2xl border-2 border-sky-500/30 bg-[#0f1f38] p-5 shadow-lg"
            >
              <p className="font-mono text-3xl font-bold tracking-widest text-sky-300">
                {formatAccessCodeDisplay(a.accessCode)}
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">{a.title || '제목 없음'}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <AuthLink
                  href={`/counselor/assessments/progress?assessmentId=${encodeURIComponent(a.id)}`}
                  className="min-h-[3rem] min-w-[8rem] rounded-xl bg-sky-600 px-6 py-3 text-center text-lg font-bold text-white hover:bg-sky-500"
                >
                  진행 보기
                </AuthLink>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError('');
                    setDeleteTarget(a);
                  }}
                  className="min-h-[3rem] rounded-xl border-2 border-red-400/50 px-6 py-3 text-lg font-medium text-red-200 hover:bg-red-950/40"
                >
                  삭제
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {deleteTarget ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-slate-900 p-6 text-lg">
            <h2 className="text-2xl font-bold text-white">검사코드 삭제</h2>
            <p className="mt-3 font-mono text-2xl text-sky-300">
              {formatAccessCodeDisplay(deleteTarget.accessCode)}
            </p>
            {deleteError ? <p className="mt-3 text-red-400">{deleteError}</p> : null}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl bg-slate-700 px-6 py-3 text-white"
              >
                취소
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => void confirmDelete()}
                className="rounded-xl bg-red-600 px-6 py-3 font-bold text-white disabled:opacity-50"
              >
                {deleteLoading ? '처리 중…' : '삭제 확인'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </CounselorPageSection>
  );
}
