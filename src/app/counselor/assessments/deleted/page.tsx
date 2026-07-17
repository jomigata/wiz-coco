'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { useRedirectOnLoginRequiredError } from '@/hooks/useRequireLoginRedirect';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { getAssessmentOrgLabel } from '@/lib/assessmentSortOptions';
import {
  listArchivedAssessments,
  permanentlyDeleteArchivedAssessments,
  restoreArchivedAssessments,
  type ArchivedAssessment,
} from '@/lib/assessmentApi';

type ListSortKey = 'createdAt' | 'accessCode' | 'orgName' | 'title' | 'archivedAt';
type SortDirection = 'asc' | 'desc';

function parseDate(iso?: string | null): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function compareRows(
  a: ArchivedAssessment,
  b: ArchivedAssessment,
  key: ListSortKey,
  dir: SortDirection,
): number {
  const mult = dir === 'asc' ? 1 : -1;
  switch (key) {
    case 'createdAt':
      return mult * (parseDate(a.createdAt) - parseDate(b.createdAt));
    case 'archivedAt':
      return mult * (parseDate(a.archivedAt) - parseDate(b.archivedAt));
    case 'accessCode':
      return mult * (a.accessCode || '').localeCompare(b.accessCode || '');
    case 'orgName':
      return mult * getAssessmentOrgLabel(a).localeCompare(getAssessmentOrgLabel(b), 'ko');
    case 'title':
      return mult * (a.title || '').localeCompare(b.title || '', 'ko');
    default:
      return 0;
  }
}

function formatDate(iso: string | undefined | null): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(iso);
  }
}

function formatUsageEndDate(iso: string | undefined): string {
  const s = (iso || '').trim();
  if (!s) return '무기한';
  try {
    const d = new Date(`${s}T00:00:00`);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString('ko-KR');
  } catch {
    return s;
  }
}

function isExpired(iso: string | undefined): boolean {
  const s = (iso || '').trim();
  if (!s) return false;
  try {
    return new Date(`${s}T23:59:59`) < new Date();
  } catch {
    return false;
  }
}

function resultStatusCounts(a: ArchivedAssessment) {
  const dispatchSent = a.dispatchSentCount ?? 0;
  const testComplete = a.testCompleteCount ?? 0;
  const testIncomplete = a.testIncompleteCount ?? 0;
  const dispatchTotal = Math.max(testComplete + testIncomplete, dispatchSent);
  return { dispatchSent, testComplete, dispatchTotal };
}

function SortableColumnHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  className = '',
}: {
  label: string;
  sortKey: ListSortKey;
  activeKey: ListSortKey;
  direction: SortDirection;
  onSort: (key: ListSortKey) => void;
  className?: string;
}) {
  const active = activeKey === sortKey;
  return (
    <th scope="col" className={`px-2 py-2 text-left text-xs font-medium text-slate-400 ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 transition-colors hover:text-slate-200"
      >
        <span>{label}</span>
        <span className={`text-[10px] ${active ? 'text-sky-400' : 'text-slate-600'}`} aria-hidden="true">
          {active ? (direction === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  );
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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<ListSortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

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

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (a) =>
        (a.title || '').toLowerCase().includes(q) ||
        (a.accessCode || '').toLowerCase().includes(q) ||
        (a.targetAudience || '').toLowerCase().includes(q) ||
        getAssessmentOrgLabel(a).toLowerCase().includes(q),
    );
  }, [items, searchQuery]);

  const sortedFiltered = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => compareRows(a, b, sortKey, sortDir));
    return list;
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key: ListSortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'createdAt' || key === 'archivedAt' ? 'desc' : 'asc');
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
    <CounselorPageSection
      className="flex min-h-0 flex-1"
      bodyClassName="flex min-h-0 flex-1 flex-col !p-0"
      noBodyPadding
      title={
        <>
          삭제된 검사코드
          <span className="ml-1.5 font-normal text-sky-200/60">({filtered.length})</span>
        </>
      }
      description="목록에서 삭제한 검사코드입니다. 복구하면 검사코드 목록에 다시 표시됩니다. 영구 삭제 시 관리자만 조회할 수 있습니다."
      toolbar={
        <>
          <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
              <svg className="h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="검사명 · 코드 · 유형 검색"
              className="w-full rounded-md border border-white/10 bg-[#101f38]/90 py-1.5 pl-8 pr-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500/60"
            />
          </div>
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
      <div className="flex min-h-0 flex-1 flex-col p-2.5 text-sm sm:p-3">
        {message ? <p className="mb-3 shrink-0 text-sm text-emerald-300">{message}</p> : null}
        {error ? <p className="mb-3 shrink-0 text-sm text-red-400">{error}</p> : null}

        {loading ? (
          <AuthLoadingState className="py-8" message="목록을 불러오는 중…" />
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-400">
            {items.length === 0 ? '삭제된 검사코드가 없습니다.' : '검색 결과가 없습니다.'}
          </p>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-auto rounded-md border border-white/10">
              <table className="min-w-full divide-y divide-white/10 text-sm">
                <thead className="sticky top-0 z-[1] bg-[#0f172a]/95 backdrop-blur-sm">
                  <tr>
                    <th scope="col" className="w-10 px-2 py-2 text-left text-xs font-medium text-slate-400">
                      선택
                    </th>
                    <SortableColumnHeader
                      label="생성 일시"
                      sortKey="createdAt"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                      className="whitespace-nowrap"
                    />
                    <SortableColumnHeader
                      label="검사코드"
                      sortKey="accessCode"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                    />
                    <SortableColumnHeader
                      label="기관/단체/그룹명"
                      sortKey="orgName"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                    />
                    <SortableColumnHeader
                      label="검사명"
                      sortKey="title"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                    />
                    <th scope="col" className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-400">
                      코드 사용 마감일
                    </th>
                    <th scope="col" className="whitespace-nowrap px-2 py-2 text-center text-xs font-medium text-slate-400">
                      <span className="block">결과현황</span>
                      <span className="mt-0.5 block text-[10px] font-normal leading-tight text-slate-500">
                        (
                        <span className="text-slate-300">총발송수</span>
                        <span> / </span>
                        <span className="text-emerald-400">발송성공</span>
                        <span> / </span>
                        <span className="text-emerald-400">검사완료</span>
                        )
                      </span>
                    </th>
                    <SortableColumnHeader
                      label="삭제일시"
                      sortKey="archivedAt"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                      className="whitespace-nowrap"
                    />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {sortedFiltered.map((row) => {
                    const { dispatchSent, testComplete, dispatchTotal } = resultStatusCounts(row);
                    const expired = isExpired(row.usageEndDate);
                    const orgLabel = getAssessmentOrgLabel(row);

                    return (
                      <tr key={row.id} className="group hover:bg-white/[0.04]">
                        <td className="px-2 py-2">
                          <input
                            type="checkbox"
                            checked={selected.has(row.id)}
                            onChange={() => toggleOne(row.id)}
                            className="rounded accent-blue-500"
                          />
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-left text-sm text-slate-200">
                          {formatDate(row.createdAt)}
                        </td>
                        <td className="max-w-[10rem] truncate px-2 py-2 font-mono font-semibold tracking-wide text-sky-300">
                          {formatAccessCodeDisplay(row.accessCode)}
                        </td>
                        <td className="max-w-[12rem] truncate px-2 py-2 text-left text-sm text-slate-200" title={orgLabel}>
                          {orgLabel}
                        </td>
                        <td className="max-w-[14rem] truncate px-2 py-2 text-left text-sm text-slate-200" title={row.title || '-'}>
                          <span className="font-medium text-white">{row.title || '-'}</span>
                          {expired ? (
                            <span className="ml-1 inline-block rounded-full border border-red-500/30 bg-red-500/15 px-1.5 py-0.5 align-middle text-[10px] font-medium text-red-300">
                              만료
                            </span>
                          ) : null}
                        </td>
                        <td className={`whitespace-nowrap px-2 py-2 text-left text-sm ${expired ? 'text-red-400' : 'text-slate-400'}`}>
                          {formatUsageEndDate(row.usageEndDate)}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-center text-sm text-slate-500">
                          (
                          <span className="px-2 font-medium tabular-nums text-slate-300">{dispatchTotal}</span>
                          /
                          <span className="px-2 font-medium tabular-nums text-emerald-400">{dispatchSent}</span>
                          /
                          <span className="px-2 font-medium tabular-nums text-emerald-400">{testComplete}</span>
                          )
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-left text-xs tabular-nums text-slate-400">
                          {formatDate(row.archivedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-2 shrink-0 text-xs text-slate-500 sm:text-sm">총 {filtered.length}건</div>
          </>
        )}
      </div>
    </CounselorPageSection>
  );
}
