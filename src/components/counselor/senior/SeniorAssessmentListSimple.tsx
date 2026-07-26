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

/** 간편 목록 — 큰 글씨 한 줄씩 */
export default function SeniorAssessmentListSimple({ assessments, revalidating }: Props) {
  const [items, setItems] = useState(assessments);
  const [query, setQuery] = useState('');

  React.useEffect(() => {
    setItems(assessments);
  }, [assessments]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...items].sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
    );
    if (!q) return list;
    return list.filter(
      (a) =>
        (a.title || '').toLowerCase().includes(q) ||
        (a.accessCode || '').toLowerCase().includes(q),
    );
  }, [items, query]);

  const handleDelete = async (a: CounselorAssessment) => {
    if (!window.confirm(`${formatAccessCodeDisplay(a.accessCode)} 검사코드를 삭제할까요?`)) {
      return;
    }
    try {
      await deleteAssessment(a.id, a.accessCode);
      removeCounselorAssessmentFromListCache(a.id, a.accessCode);
      setItems((prev) => prev.filter((x) => x.id !== a.id));
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '삭제에 실패했습니다.');
    }
  };

  return (
    <CounselorPageSection
      showHierarchyBreadcrumb
      description={
        <>
          검색 한 칸 · 큰 목록 · {filtered.length}건
          {revalidating ? (
            <span className="ml-2 text-sky-300">· 최신 정보 불러오는 중…</span>
          ) : null}
        </>
      }
      toolbar={
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="코드 또는 검사명 검색"
          className="min-w-[14rem] flex-1 rounded-xl border-2 border-white/20 bg-[#101f38] px-4 py-3 text-lg text-white placeholder:text-slate-500"
        />
      }
    >
      <ul className="divide-y divide-white/15 p-2">
        {filtered.length === 0 ? (
          <li className="py-12 text-center text-xl text-slate-400">표시할 항목이 없습니다.</li>
        ) : (
          filtered.map((a) => (
            <li key={a.id} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-2xl font-bold text-sky-300">
                  {formatAccessCodeDisplay(a.accessCode)}
                </p>
                <p className="mt-1 text-xl text-white">{a.title || '-'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <AuthLink
                  href={`/counselor/assessments/progress?assessmentId=${encodeURIComponent(a.id)}`}
                  className="rounded-lg bg-emerald-700 px-5 py-3 text-lg font-semibold text-white hover:bg-emerald-600"
                >
                  열기
                </AuthLink>
                <button
                  type="button"
                  onClick={() => void handleDelete(a)}
                  className="rounded-lg border-2 border-slate-500 px-5 py-3 text-lg text-slate-200 hover:bg-white/10"
                >
                  삭제
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </CounselorPageSection>
  );
}
