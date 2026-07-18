'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ArchivedRecipientsTable from '@/components/counselor/ArchivedRecipientsTable';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { useRedirectOnLoginRequiredError } from '@/hooks/useRequireLoginRedirect';
import {
  fetchArchivedDispatchRecipients,
  permanentlyDeleteArchivedDispatchRecipients,
  restoreArchivedDispatchRecipients,
} from '@/lib/clientPortalApi';

function DeletedRecipientsPageContent() {
  const searchParams = useSearchParams();
  const filterAssessmentId = (searchParams.get('assessmentId') || '').trim();
  const { authPending, isAuthenticated, showLoginRequired } = useAuthResolved();
  const [items, setItems] = useState<Awaited<ReturnType<typeof fetchArchivedDispatchRecipients>>['items']>([]);
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
      const result = await fetchArchivedDispatchRecipients(filterAssessmentId || undefined);
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

  const handlePermanentDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`선택 ${selected.size}명을 영구 삭제하시겠습니까?`)) {
      return;
    }
    setDeleting(true);
    setMessage('');
    try {
      const result = await permanentlyDeleteArchivedDispatchRecipients(Array.from(selected));
      setMessage(`영구 삭제 ${result.deleted}명${result.failed ? `, 실패 ${result.failed}명` : ''}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : '영구 삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  if (authPending) {
    return <AuthLoadingState className="py-8" />;
  }
  if (showLoginRequired) {
    return <AuthRequiredState description="Firebase에 로그인한 상태에서 다시 시도해 주세요." />;
  }

  const showAssessmentColumns = !filterAssessmentId;
  const pageTitle = filterAssessmentId ? '삭제된 검사자' : '전체 삭제된 검사자';

  return (
    <CounselorPageSection
      title={pageTitle}
      description={
        <>
          발송·검사 현황에서 삭제한 내담자입니다. 복구하면 발송·검사 현황에 다시 표시됩니다.
          {filterAssessmentId ? (
            <>
              {' '}
              <Link
                href="/counselor/assessments/deleted-recipients"
                className="text-blue-400 underline-offset-2 hover:text-blue-300 hover:underline"
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
            onClick={() => void handlePermanentDelete()}
            disabled={deleting || selected.size === 0}
            className="rounded-lg bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
          >
            {deleting ? '처리 중…' : `영구 삭제 (${selected.size})`}
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
        <ArchivedRecipientsTable
          items={items}
          selected={selected}
          onToggleOne={toggleOne}
          showAssessmentColumns={showAssessmentColumns}
        />
      )}
    </CounselorPageSection>
  );
}

export default function DeletedRecipientsPage() {
  return (
    <Suspense fallback={<AuthLoadingState className="py-8" message="목록을 불러오는 중…" />}>
      <DeletedRecipientsPageContent />
    </Suspense>
  );
}
