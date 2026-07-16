'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AuthLink from '@/components/auth/AuthLink';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { useRedirectOnLoginRequiredError } from '@/hooks/useRequireLoginRedirect';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import {
  listArchivedAssessments,
  permanentlyDeleteArchivedAssessments,
  restoreArchivedAssessments,
  type ArchivedAssessment,
} from '@/lib/assessmentApi';

function formatArchivedAt(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ko-KR');
  } catch {
    return String(iso);
  }
}

export default function DeletedAssessmentsPage() {
  const { authPending, isAuthenticated, showLoginRequired } = useAuthResolved();
  const [items, setItems] = useState<ArchivedAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listArchivedAssessments();
      setItems(result.assessments || []);
      setSelected(new Set());
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : '목록 조회 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authPending || !isAuthenticated) return;
    void load();
  }, [load, authPending, isAuthenticated]);

  useRedirectOnLoginRequiredError(error);

  const allIds = useMemo(() => items.map((i) => i.id), [items]);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allIds));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRestore = async () => {
    if (selected.size === 0) return;
    setRestoring(true);
    setMessage('');
    try {
      const result = await restoreArchivedAssessments(Array.from(selected));
      setMessage(`복구 ${result.restored}건${result.failed ? `, 실패 ${result.failed}건` : ''}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : '복구에 실패했습니다.');
    } finally {
      setRestoring(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (selected.size === 0) return;
    if (
      !window.confirm(
        `선택 ${selected.size}건을 영구 삭제하시겠습니까?\n관리자 화면으로 이동하며 상담사 목록에서는 더 이상 보이지 않습니다.`,
      )
    ) {
      return;
    }
    setDeleting(true);
    setMessage('');
    try {
      const result = await permanentlyDeleteArchivedAssessments(Array.from(selected));
      setMessage(`영구 삭제 ${result.deleted}건${result.failed ? `, 실패 ${result.failed}건` : ''}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : '영구 삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  if (authPending) return <AuthLoadingState className="py-8" />;
  if (showLoginRequired) {
    return <AuthRequiredState description="Firebase에 로그인한 상태에서 다시 시도해 주세요." />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <AuthLink href="/counselor/assessments" className="text-sm text-sky-300/70 hover:text-sky-200">
        ← 검사코드 목록
      </AuthLink>
      <CounselorPageSection
        title="삭제된 검사코드"
        description="목록에서 삭제한 검사코드입니다. 복구하면 검사코드 목록에 다시 표시됩니다. 영구 삭제 시 관리자만 조회할 수 있습니다."
        toolbar={
          <>
            <button
              type="button"
              onClick={toggleAll}
              disabled={loading || items.length === 0}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-50"
            >
              {allSelected ? '전체 해제' : '전체 선택'}
            </button>
            <button
              type="button"
              onClick={() => void handleRestore()}
              disabled={restoring || selected.size === 0}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {restoring ? '복구 중…' : `복구 (${selected.size})`}
            </button>
            <button
              type="button"
              onClick={() => void handlePermanentDelete()}
              disabled={deleting || selected.size === 0}
              className="rounded-lg bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
            >
              {deleting ? '처리 중…' : `영구 삭제 (${selected.size})`}
            </button>
          </>
        }
      >
        {message ? <p className="mb-3 text-sm text-emerald-300">{message}</p> : null}
        {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}
        {loading ? (
          <AuthLoadingState className="py-8" message="목록을 불러오는 중…" />
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-400">삭제된 검사코드가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-[#101f38]/90 text-slate-400">
                <tr>
                  <th className="w-10 px-3 py-2 text-left">선택</th>
                  <th className="px-3 py-2 text-left">검사코드</th>
                  <th className="px-3 py-2 text-left">검사명</th>
                  <th className="px-3 py-2 text-left">유형</th>
                  <th className="px-3 py-2 text-left">삭제일시</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-t border-white/10 hover:bg-white/[0.03]">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={() => toggleOne(row.id)}
                        className="rounded accent-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2 font-mono text-cyan-300">
                      {formatAccessCodeDisplay(row.accessCode)}
                    </td>
                    <td className="px-3 py-2 text-white">{row.title || '—'}</td>
                    <td className="px-3 py-2 text-slate-300">{row.targetAudience || '—'}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs tabular-nums text-slate-400">
                      {formatArchivedAt(row.archivedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CounselorPageSection>
    </div>
  );
}
