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

/** 어르신용 고대비 — 흰 배경·검은 글씨·큰 버튼 */
export default function SeniorAssessmentListContrast({ assessments, revalidating }: Props) {
  const [items, setItems] = useState(assessments);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const selected = sorted.find((a) => a.id === selectedId) ?? sorted[0] ?? null;

  const handleDelete = async () => {
    if (!selected) return;
    if (!window.confirm('선택한 검사코드를 삭제할까요?')) return;
    try {
      await deleteAssessment(selected.id, selected.accessCode);
      removeCounselorAssessmentFromListCache(selected.id, selected.accessCode);
      setItems((prev) => prev.filter((a) => a.id !== selected.id));
      setSelectedId(null);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '삭제에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-0 flex-1 rounded-xl border-4 border-black bg-white text-black">
      <CounselorPageSection
        showHierarchyBreadcrumb
        className="!text-black"
        description={
          <span className="text-lg font-medium text-black">
            고대비 · 큰 버튼 · {sorted.length}개
            {revalidating ? ' · 업데이트 중…' : ''}
          </span>
        }
        toolbar={
          <AuthLink
            href="/counselor/assessments"
            className="rounded-lg border-2 border-black bg-yellow-300 px-4 py-2 text-lg font-bold text-black"
          >
            일반 목록
          </AuthLink>
        }
      >
        <div className="grid gap-4 p-3 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-2">
            <p className="text-xl font-bold">① 목록에서 고르기</p>
            {sorted.map((a) => {
              const active = selected?.id === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedId(a.id)}
                  className={`block w-full rounded-xl border-4 px-4 py-4 text-left transition ${
                    active
                      ? 'border-blue-700 bg-blue-100'
                      : 'border-black bg-white hover:bg-yellow-50'
                  }`}
                >
                  <span className="block font-mono text-2xl font-black">
                    {formatAccessCodeDisplay(a.accessCode)}
                  </span>
                  <span className="mt-1 block text-lg font-semibold">{a.title || '-'}</span>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border-4 border-black bg-yellow-50 p-5">
            <p className="text-xl font-bold">② 선택한 검사코드</p>
            {selected ? (
              <>
                <p className="mt-4 font-mono text-4xl font-black tracking-wider">
                  {formatAccessCodeDisplay(selected.accessCode)}
                </p>
                <p className="mt-3 text-2xl font-bold">{selected.title}</p>
                <div className="mt-8 flex flex-col gap-4">
                  <AuthLink
                    href={`/counselor/assessments/progress?assessmentId=${encodeURIComponent(selected.id)}`}
                    className="block rounded-xl border-4 border-black bg-blue-600 py-5 text-center text-2xl font-black text-white hover:bg-blue-700"
                  >
                    진행 현황 보기
                  </AuthLink>
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    className="rounded-xl border-4 border-black bg-white py-4 text-xl font-bold text-red-700 hover:bg-red-50"
                  >
                    삭제하기
                  </button>
                </div>
              </>
            ) : (
              <p className="mt-6 text-xl">왼쪽에서 검사코드를 선택해 주세요.</p>
            )}
          </div>
        </div>
      </CounselorPageSection>
    </div>
  );
}
