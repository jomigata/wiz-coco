'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { useRedirectOnLoginRequiredError } from '@/hooks/useRequireLoginRedirect';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { formatPhoneDisplayOr, formatPhoneMaskedDisplay } from '@/lib/phoneFormat';
import {
  compareArchivedRecipients,
  dispatchStatusDisplay,
  formatNotifyDate,
  testSummary,
  type RecipientSortKey,
  type SortDirection,
} from '@/lib/dispatchRecipientDisplay';
import {
  fetchArchivedDispatchRecipients,
  permanentlyDeleteArchivedDispatchRecipients,
  restoreArchivedDispatchRecipients,
  type ArchivedDispatchRecipient,
} from '@/lib/clientPortalApi';

function SortableColumnHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  className = '',
}: {
  label: string;
  sortKey: RecipientSortKey;
  activeKey: RecipientSortKey;
  direction: SortDirection;
  onSort: (key: RecipientSortKey) => void;
  className?: string;
}) {
  const active = activeKey === sortKey;
  return (
    <th className={`px-3 py-2 text-left text-xs font-medium text-slate-400 ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 transition-colors hover:text-slate-200"
      >
        <span>{label}</span>
        <span className={`text-[10px] ${active ? 'text-cyan-400' : 'text-slate-600'}`} aria-hidden="true">
          {active ? (direction === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  );
}

export default function DeletedRecipientsPage() {
  const [filterAssessmentId, setFilterAssessmentId] = useState('');
  const { authPending, isAuthenticated, showLoginRequired } = useAuthResolved();
  const [items, setItems] = useState<ArchivedDispatchRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [sortKey, setSortKey] = useState<RecipientSortKey>('notifyAt');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [revealedPhonePortalId, setRevealedPhonePortalId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!revealedPhonePortalId) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-phone-reveal]')) return;
      setRevealedPhonePortalId(null);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [revealedPhonePortalId]);

  const allIds = useMemo(() => items.map((i) => i.portalId), [items]);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  const sortedItems = useMemo(() => {
    const list = [...items];
    list.sort((a, b) => compareArchivedRecipients(a, b, sortKey, sortDir));
    return list;
  }, [items, sortKey, sortDir]);

  const toggleSort = (key: RecipientSortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'notifyAt' || key === 'archivedAt' ? 'desc' : 'asc');
    }
  };

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
    if (
      !window.confirm(
        `선택 ${selected.size}명을 영구 삭제하시겠습니까?\n관리자 화면으로 이동하며 상담사 목록에서는 더 이상 보이지 않습니다.`,
      )
    ) {
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

  return (
    <CounselorPageSection
      title="삭제된 검사자"
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
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-max min-w-full text-sm table-fixed">
            <thead className="sticky top-0 z-10 bg-slate-800 text-slate-400 shadow-[0_1px_0_0_rgb(71,85,105)]">
              <tr>
                <th className="w-10 px-3 py-2 text-left text-xs font-medium">No.</th>
                <th className="w-10 px-3 py-2 text-left text-xs font-medium">선택</th>
                <SortableColumnHeader
                  label="발송일시"
                  sortKey="notifyAt"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={toggleSort}
                  className="w-36"
                />
                <SortableColumnHeader
                  label="이름"
                  sortKey="displayName"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={toggleSort}
                  className="w-28"
                />
                <SortableColumnHeader
                  label="이메일"
                  sortKey="email"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={toggleSort}
                  className="w-52"
                />
                <SortableColumnHeader
                  label="휴대폰"
                  sortKey="phone"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={toggleSort}
                  className="w-32"
                />
                <SortableColumnHeader
                  label="나의코드"
                  sortKey="myCode"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={toggleSort}
                  className="w-24"
                />
                <SortableColumnHeader
                  label="발송"
                  sortKey="notifyStatus"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={toggleSort}
                  className="w-24"
                />
                <SortableColumnHeader
                  label="검사"
                  sortKey="testStatus"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={toggleSort}
                  className="w-24"
                />
                {showAssessmentColumns ? (
                  <>
                    <th className="px-3 py-2 text-left text-xs font-medium">검사코드</th>
                    <th className="px-3 py-2 text-left text-xs font-medium">검사명</th>
                  </>
                ) : null}
                <SortableColumnHeader
                  label="삭제일시"
                  sortKey="archivedAt"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={toggleSort}
                  className="w-36"
                />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {sortedItems.map((row, rowIndex) => {
                const notify = dispatchStatusDisplay(row);
                const summary = testSummary(row);
                return (
                  <tr key={row.portalId} className="hover:bg-slate-800/50">
                    <td className="px-3 py-2 tabular-nums text-slate-400 align-top">{rowIndex + 1}</td>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="checkbox"
                        checked={selected.has(row.portalId)}
                        onChange={() => toggleOne(row.portalId)}
                        className="rounded text-blue-500"
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs tabular-nums text-slate-400 align-top">
                      {formatNotifyDate(row.notifyAt)}
                    </td>
                    <td className="max-w-[7rem] truncate px-3 py-2 text-white align-top">
                      {row.displayName || '—'}
                    </td>
                    <td className="truncate px-3 py-2 text-slate-300 align-top">
                      {row.email?.trim() ? (
                        row.email
                      ) : (
                        <span className="text-amber-300/90" title="이메일 주소 없음">
                          없음
                        </span>
                      )}
                    </td>
                    <td
                      className="whitespace-nowrap px-3 py-2 text-slate-300 align-top"
                      data-phone-reveal
                    >
                      {row.phone?.trim() ? (
                        <button
                          type="button"
                          onClick={() =>
                            setRevealedPhonePortalId((prev) =>
                              prev === row.portalId ? null : row.portalId,
                            )
                          }
                          className="rounded tabular-nums transition hover:text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500"
                          title={
                            revealedPhonePortalId === row.portalId ? '번호 숨기기' : '번호 보기'
                          }
                        >
                          {revealedPhonePortalId === row.portalId
                            ? formatPhoneDisplayOr(row.phone)
                            : formatPhoneMaskedDisplay(row.phone)}
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-cyan-300 align-top">
                      {formatAccessCodeDisplay(row.myCode)}
                    </td>
                    <td
                      className={`whitespace-nowrap px-3 py-2 align-top ${notify.className}`}
                      title={notify.title}
                    >
                      {notify.text}
                    </td>
                    <td className={`whitespace-nowrap px-3 py-2 align-top ${summary.className}`}>
                      {summary.text}
                    </td>
                    {showAssessmentColumns ? (
                      <>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-cyan-300 align-top">
                          {row.joinAccessCode ? formatAccessCodeDisplay(row.joinAccessCode) : '—'}
                        </td>
                        <td
                          className="max-w-xs truncate px-3 py-2 text-slate-300 align-top"
                          title={row.assessmentTitle}
                        >
                          {row.assessmentTitle || row.cohortName || '—'}
                        </td>
                      </>
                    ) : null}
                    <td className="whitespace-nowrap px-3 py-2 text-xs tabular-nums text-slate-400 align-top">
                      {formatNotifyDate(row.archivedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </CounselorPageSection>
  );
}
