'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AuthLink from '@/components/auth/AuthLink';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { useRedirectOnLoginRequiredError } from '@/hooks/useRequireLoginRedirect';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { formatPhoneDisplay } from '@/lib/phoneFormat';
import {
  fetchArchivedDispatchRecipients,
  restoreArchivedDispatchRecipients,
  type ArchivedDispatchRecipient,
} from '@/lib/clientPortalApi';

function formatArchivedAt(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ko-KR');
  } catch {
    return String(iso);
  }
}

export default function DeletedRecipientsPage() {
  const [filterAssessmentId, setFilterAssessmentId] = useState('');
  const { authPending, isAuthenticated, showLoginRequired } = useAuthResolved();
  const [items, setItems] = useState<ArchivedDispatchRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchArchivedDispatchRecipients(
        filterAssessmentId || undefined,
      );
      setItems(result.items || []);
      setSelected(new Set());
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : '목록 조회 실패');
    } finally {
      setLoading(false);
    }
  }, [filterAssessmentId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      setFilterAssessmentId((params.get('assessmentId') || '').trim());
    } catch {
      setFilterAssessmentId('');
    }
  }, []);

  useEffect(() => {
    if (authPending || !isAuthenticated) return;
    void load();
  }, [load, authPending, isAuthenticated]);

  useRedirectOnLoginRequiredError(error);

  const allIds = useMemo(() => items.map((i) => i.portalId), [items]);
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
      const result = await restoreArchivedDispatchRecipients(Array.from(selected));
      setMessage(`복구 ${result.restored}명${result.failed ? `, 실패 ${result.failed}명` : ''}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : '복구에 실패했습니다.');
    } finally {
      setRestoring(false);
    }
  };

  if (authPending) {
    return <AuthLoadingState className="py-8" />;
  }
  if (showLoginRequired) {
    return <AuthRequiredState description="Firebase에 로그인한 상태에서 다시 시도해 주세요." />;
  }

  const backHref = filterAssessmentId
    ? `/counselor/assessments/progress?assessmentId=${encodeURIComponent(filterAssessmentId)}`
    : '/counselor/assessments';
  const backLabel = filterAssessmentId ? '← 진행현황' : '← 검사코드 목록';

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <AuthLink href={backHref} className="text-sm text-sky-300/70 hover:text-sky-200">
        {backLabel}
      </AuthLink>
      <CounselorPageSection
        title="삭제된 검사자"
        description={
          <>
            발송·검사 현황에서 삭제한 내담자입니다. 복구하면 해당 검사코드 진행현황에 다시 표시됩니다.
            {filterAssessmentId ? (
              <>
                {' '}
                <Link
                  href="/counselor/assessments/deleted-recipients"
                  className="text-blue-400 hover:text-blue-300 underline-offset-2 hover:underline"
                >
                  전체 삭제 목록 보기
                </Link>
              </>
            ) : null}
          </>
        }
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
              onClick={() => void load()}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5"
            >
              새로고침
            </button>
          </>
        }
      >
        {message ? <p className="mb-3 text-sm text-emerald-300">{message}</p> : null}
        {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}

        {loading ? (
          <AuthLoadingState className="py-8" message="목록을 불러오는 중…" />
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-400">삭제된 검사자가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-[#101f38]/90 text-slate-400">
                <tr>
                  <th className="w-10 px-3 py-2 text-left">선택</th>
                  <th className="px-3 py-2 text-left">이름</th>
                  <th className="px-3 py-2 text-left">이메일</th>
                  <th className="px-3 py-2 text-left">휴대폰</th>
                  <th className="px-3 py-2 text-left">나의코드</th>
                  <th className="px-3 py-2 text-left">검사코드</th>
                  <th className="px-3 py-2 text-left">검사명</th>
                  <th className="px-3 py-2 text-left">삭제일시</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.portalId} className="border-t border-white/10 hover:bg-white/[0.03]">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(row.portalId)}
                        onChange={() => toggleOne(row.portalId)}
                        className="rounded accent-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2 text-white">{row.displayName || '—'}</td>
                    <td className="px-3 py-2 text-slate-300">{row.email || '—'}</td>
                    <td className="px-3 py-2 tabular-nums text-slate-300">
                      {formatPhoneDisplay(row.phone || '') || '—'}
                    </td>
                    <td className="px-3 py-2 font-mono text-cyan-300">{row.myCode || '—'}</td>
                    <td className="px-3 py-2 font-mono text-cyan-300">
                      {row.joinAccessCode ? formatAccessCodeDisplay(row.joinAccessCode) : '—'}
                    </td>
                    <td className="max-w-xs truncate px-3 py-2 text-slate-300" title={row.assessmentTitle}>
                      {row.assessmentTitle || row.cohortName || '—'}
                    </td>
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
