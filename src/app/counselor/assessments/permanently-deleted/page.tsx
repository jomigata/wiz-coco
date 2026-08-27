'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaClipboard } from 'react-icons/fa';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { useRedirectOnLoginRequiredError } from '@/hooks/useRequireLoginRedirect';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import CounselorListPagination from '@/components/counselor/CounselorListPagination';
import CounselorListSearchInput from '@/components/counselor/CounselorListSearchInput';
import CounselorSlashInfoCell from '@/components/counselor/CounselorSlashInfoCell';
import CounselorProgressMetricsInline from '@/components/counselor/CounselorProgressMetricsInline';
import CounselorActionProgressOverlay from '@/components/counselor/CounselorActionProgressOverlay';
import CounselorActionCompleteModal from '@/components/counselor/CounselorActionCompleteModal';
import { counselingCodeTypeLabel } from '@/data/counselingCodeTypes';
import { getAssessmentOrgLabel } from '@/lib/assessmentSortOptions';
import {
  counselorListBodyRowStaticClass,
  counselorListHeaderRowClass,
  counselorListNoThClass,
  counselorListSelectTdClass,
  counselorListSelectThClass,
  counselorListSortActiveClass,
  counselorListSortIdleClass,
  counselorListTableWrapperClass,
  counselorListTdCompactClass,
  counselorListThClass,
  formatCounselorIssueDate,
} from '@/lib/counselorListTableStyles';
import { useListPagination } from '@/hooks/useListPagination';
import { useCounselorListPageSize } from '@/hooks/useCounselorListPageSize';
import { matchesWildcardFields } from '@/lib/wildcardSearch';
import { getAppRoleSync, isAdmin } from '@/utils/roleUtils';
import { CounselorAdminEmailSortHeader, CounselorAdminEmailTd, compareCounselorEmail } from '@/components/counselor/CounselorAdminEmailColumn';
import {
  fetchPermanentlyDeletedRecords,
  restorePermanentlyDeletedRecords,
  type PermanentlyDeletedAssessment,
} from '@/lib/adminDeletionsApi';
import { exportDeletedAssessments } from '@/lib/counselorAssessmentListExport';

type ListSortKey =
  | 'counselInfo'
  | 'accessCode'
  | 'usageEndDate'
  | 'permanentlyDeletedAt'
  | 'counselorEmail';
type SortDirection = 'asc' | 'desc';
type CounselSortPhase = 'org-asc' | 'org-desc' | 'title-asc' | 'title-desc';

function parseWhen(iso?: string | null): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function parseUsageEndDate(iso?: string): number {
  const s = (iso || '').trim();
  if (!s) return Number.MAX_SAFE_INTEGER;
  const t = new Date(`${s}T00:00:00`).getTime();
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
}

function compareRows(
  a: PermanentlyDeletedAssessment,
  b: PermanentlyDeletedAssessment,
  key: ListSortKey,
  dir: SortDirection,
  counselSortPhase: CounselSortPhase,
): number {
  const mult = dir === 'asc' ? 1 : -1;
  switch (key) {
    case 'permanentlyDeletedAt':
      return mult * (parseWhen(a.permanentlyDeletedAt) - parseWhen(b.permanentlyDeletedAt));
    case 'counselInfo': {
      const phaseMult = (p: CounselSortPhase) => (p.endsWith('-asc') ? 1 : -1);
      const m = phaseMult(counselSortPhase);
      if (counselSortPhase.startsWith('title')) {
        return (
          m *
          ((a.title || '').trim() || '—').localeCompare((b.title || '').trim() || '—', 'ko')
        );
      }
      return m * getAssessmentOrgLabel(a).localeCompare(getAssessmentOrgLabel(b), 'ko');
    }
    case 'accessCode':
      return (
        mult *
        formatAccessCodeDisplay(a.accessCode).localeCompare(formatAccessCodeDisplay(b.accessCode), 'ko')
      );
    case 'usageEndDate':
      return mult * (parseUsageEndDate(a.usageEndDate) - parseUsageEndDate(b.usageEndDate));
    case 'counselorEmail':
      return compareCounselorEmail(a.counselorEmail, b.counselorEmail, dir);
    default:
      return 0;
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

function resultStatusCounts(a: PermanentlyDeletedAssessment) {
  const testComplete = a.testCompleteCount ?? 0;
  const testIncomplete = a.testIncompleteCount ?? 0;
  const dispatchTotal = testComplete + testIncomplete;
  return { dispatchTotal, testComplete };
}

function sortPhaseIcon(active: boolean, phase: string): string {
  if (!active) return '↕';
  return phase.endsWith('-asc') ? '▲' : '▼';
}

function DualFieldSortHeader({
  leftLabel,
  rightLabel,
  activeKey,
  sortKey,
  phase,
  onSortLeft,
  onSortRight,
  className = '',
}: {
  leftLabel: string;
  rightLabel: string;
  activeKey: ListSortKey;
  sortKey: ListSortKey;
  phase: CounselSortPhase;
  onSortLeft: () => void;
  onSortRight: () => void;
  className?: string;
}) {
  const active = activeKey === sortKey;
  const leftActive = active && phase.startsWith('org');
  const rightActive = active && phase.startsWith('title');
  return (
    <th scope="col" className={`${counselorListThClass} ${className}`}>
      <div className="inline-flex flex-wrap items-center gap-1">
        <button type="button" onClick={onSortLeft} className="inline-flex items-center gap-0.5 transition-colors hover:text-slate-200">
          <span>{leftLabel}</span>
          <span className={`text-[10px] ${leftActive ? counselorListSortActiveClass : counselorListSortIdleClass}`} aria-hidden="true">
            {sortPhaseIcon(leftActive, phase.startsWith('org') ? phase : 'org-asc')}
          </span>
        </button>
        <span className="text-slate-600">/</span>
        <button type="button" onClick={onSortRight} className="inline-flex items-center gap-0.5 transition-colors hover:text-slate-200">
          <span>{rightLabel}</span>
          <span className={`text-[10px] ${rightActive ? counselorListSortActiveClass : counselorListSortIdleClass}`} aria-hidden="true">
            {sortPhaseIcon(rightActive, phase.startsWith('title') ? phase : 'title-asc')}
          </span>
        </button>
      </div>
    </th>
  );
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
    <th scope="col" className={`${counselorListThClass} ${className}`}>
      <button type="button" onClick={() => onSort(sortKey)} className="inline-flex items-center gap-1 transition-colors hover:text-slate-200">
        <span>{label}</span>
        <span className={`text-[10px] ${active ? counselorListSortActiveClass : counselorListSortIdleClass}`} aria-hidden="true">
          {active ? (direction === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  );
}

export default function PermanentlyDeletedAssessmentsPage() {
  const { authPending, showLoginRequired } = useAuthResolved();
  const adminUser = isAdmin(getAppRoleSync());
  const [items, setItems] = useState<PermanentlyDeletedAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [restoring, setRestoring] = useState(false);
  const [actionComplete, setActionComplete] = useState<{
    title: string;
    message: string;
    error?: boolean;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<ListSortKey>('permanentlyDeletedAt');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [counselSortPhase, setCounselSortPhase] = useState<CounselSortPhase>('org-asc');
  const { pageSize, setPageSize } = useCounselorListPageSize();

  const load = useCallback(async () => {
    if (!adminUser) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchPermanentlyDeletedRecords();
      setItems(data.assessments || []);
      setSelected(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : '목록 조회 실패');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [adminUser]);

  useEffect(() => {
    if (authPending || !adminUser) {
      setLoading(false);
      return;
    }
    void load();
  }, [authPending, adminUser, load]);

  useRedirectOnLoginRequiredError(error);

  const allIds = useMemo(() => items.map((i) => i.id), [items]);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  const filtered = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return items;
    return items.filter((a) =>
      matchesWildcardFields(
        [
          a.cohortName || '',
          a.title || '',
          a.accessCode || '',
          formatAccessCodeDisplay(a.accessCode),
          counselingCodeTypeLabel(a.codeCategory),
          a.targetAudience || '',
          a.counselorEmail || '',
        ],
        q,
      ),
    );
  }, [items, searchQuery]);

  const sortedFiltered = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => compareRows(a, b, sortKey, sortDir, counselSortPhase));
    return list;
  }, [filtered, sortKey, sortDir, counselSortPhase]);

  const {
    page,
    setPage,
    paginatedItems,
    totalPages,
    totalCount,
    currentCount,
    startIndex,
  } = useListPagination(sortedFiltered, pageSize);

  const toggleCounselFieldSort = (field: 'org' | 'title') => {
    setSortKey('counselInfo');
    setCounselSortPhase((prev) => {
      if (field === 'org') {
        if (prev.startsWith('org')) return prev === 'org-asc' ? 'org-desc' : 'org-asc';
        return 'org-asc';
      }
      if (prev.startsWith('title')) return prev === 'title-asc' ? 'title-desc' : 'title-asc';
      return 'title-asc';
    });
  };

  const toggleSort = (key: ListSortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'permanentlyDeletedAt' ? 'desc' : 'asc');
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
    try {
      const result = await restorePermanentlyDeletedRecords({
        assessmentIds: Array.from(selected),
      });
      setActionComplete({
        title: '복구 완료',
        message: `삭제된 상담코드로 복구 ${result.restoredAssessments}건${
          result.restoredPortals ? ` · 연결 내담자 ${result.restoredPortals}명` : ''
        }${result.failed ? `, 실패 ${result.failed}건` : ''}`,
      });
      await load();
    } catch (err) {
      setActionComplete({
        title: '복구 실패',
        message: err instanceof Error ? err.message : '복구에 실패했습니다.',
        error: true,
      });
    } finally {
      setRestoring(false);
    }
  };

  const selectedRows = useMemo(
    () => sortedFiltered.filter((row) => selected.has(row.id)),
    [sortedFiltered, selected],
  );

  const handleAssessmentDownload = () => {
    exportDeletedAssessments(selectedRows, 'download', {
      dateColumnLabel: '영구삭제일',
      dateField: 'permanentlyDeletedAt',
      sheetTitle: '영구삭제상담코드',
      printTitle: '영구삭제 상담코드',
    });
  };

  const handleAssessmentPrint = () => {
    exportDeletedAssessments(selectedRows, 'print', {
      dateColumnLabel: '영구삭제일',
      dateField: 'permanentlyDeletedAt',
      sheetTitle: '영구삭제상담코드',
      printTitle: '영구삭제 상담코드',
    });
  };

  if (authPending) return <AuthLoadingState className="py-8" />;
  if (showLoginRequired) {
    return <AuthRequiredState description="Firebase에 로그인한 상태에서 다시 시도해 주세요." />;
  }
  if (!adminUser) {
    return (
      <AuthRequiredState
        autoRedirect={false}
        title="관리자 권한이 필요합니다"
        description="관리자 계정으로 로그인해야 영구삭제 상담코드 목록을 이용할 수 있습니다."
      />
    );
  }

  return (
    <CounselorPageSection
      title="영구삭제 상담코드"
      titleAccent="deleted"
      className="flex min-h-0 flex-1"
      bodyClassName="flex min-h-0 flex-1 flex-col !p-0"
      noBodyPadding
      dense
      description={
        <span className="inline-flex w-full flex-wrap items-center gap-x-3 gap-y-2">
          <span className="shrink-0">
            전체 <span className="font-semibold text-white">{items.length}</span>개
          </span>
          <CounselorListSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="검사명 · 상담유형 · 코드 · 기관명 · 상담사 이메일 검색"
          />
        </span>
      }
    >
      <motion.div
        className="flex min-h-0 flex-1 flex-col p-2.5 text-sm sm:p-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {error ? <p className="mb-2 shrink-0 text-sm text-red-400">{error}</p> : null}

        {loading ? (
          <AuthLoadingState className="py-8" message="목록을 로딩중…" />
        ) : filtered.length === 0 ? (
          <div className="flex min-h-[12rem] flex-1 flex-col items-center justify-center rounded-md border border-white/10 bg-white/[0.03] py-10 text-center">
            <FaClipboard className="mb-2 h-10 w-10 text-slate-600" />
            <p className="text-base text-slate-300">
              {items.length === 0 ? '영구삭제된 상담코드가 없습니다' : '검색 결과가 없습니다'}
            </p>
          </div>
        ) : (
          <>
            <div className={`min-h-0 flex-1 ${counselorListTableWrapperClass}`}>
              <table className="w-max min-w-full table-fixed text-sm">
                <thead>
                  <tr className={counselorListHeaderRowClass}>
                    <th className={counselorListNoThClass}>No.</th>
                    <th className={counselorListSelectThClass}>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="rounded accent-blue-500"
                        aria-label="전체 선택"
                      />
                    </th>
                    <SortableColumnHeader
                      label="영구삭제일"
                      sortKey="permanentlyDeletedAt"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                      className="whitespace-nowrap text-center"
                    />
                    <SortableColumnHeader
                      label="상담코드"
                      sortKey="accessCode"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                      className="whitespace-nowrap text-center"
                    />
                    <DualFieldSortHeader
                      leftLabel="그룹명"
                      rightLabel="제목"
                      activeKey={sortKey}
                      sortKey="counselInfo"
                      phase={counselSortPhase}
                      onSortLeft={() => toggleCounselFieldSort('org')}
                      onSortRight={() => toggleCounselFieldSort('title')}
                    />
                    <th scope="col" className={`${counselorListThClass} whitespace-nowrap text-center`}>
                      <span className="block">진행현황</span>
                    </th>
                    <SortableColumnHeader
                      label="사용 종료일"
                      sortKey="usageEndDate"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                      className="whitespace-nowrap text-center"
                    />
                    <CounselorAdminEmailSortHeader
                      emailSortKey="counselorEmail"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                    />
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((row, idx) => {
                    const { dispatchTotal, testComplete } = resultStatusCounts(row);
                    const expired = isExpired(row.usageEndDate);
                    const infoPrimary = getAssessmentOrgLabel(row);
                    const infoSecondary = (row.title || '—').trim();
                    const isSelected = selected.has(row.id);

                    return (
                      <tr
                        key={row.id}
                        className={`${counselorListBodyRowStaticClass} ${isSelected ? 'bg-white/[0.04]' : ''}`}
                      >
                        <td className={`${counselorListTdCompactClass} tabular-nums text-slate-500`}>
                          {startIndex + idx + 1}
                        </td>
                        <td className={counselorListSelectTdClass} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleOne(row.id)}
                            className="rounded accent-blue-500"
                            aria-label={`${infoSecondary} 선택`}
                          />
                        </td>
                        <td className={`whitespace-nowrap ${counselorListTdCompactClass} text-center text-slate-300`}>
                          {formatCounselorIssueDate(row.permanentlyDeletedAt)}
                        </td>
                        <td className={`whitespace-nowrap ${counselorListTdCompactClass} text-center`}>
                          <span className="font-mono tracking-wide text-cyan-300/95">
                            {formatAccessCodeDisplay(row.accessCode)}
                          </span>
                        </td>
                        <td className={`max-w-[16rem] ${counselorListTdCompactClass}`}>
                          <CounselorSlashInfoCell
                            primary={infoPrimary}
                            secondary={infoSecondary}
                            showTooltip={false}
                          />
                        </td>
                        <td className={`whitespace-nowrap ${counselorListTdCompactClass} text-center`}>
                          <CounselorProgressMetricsInline
                            totalClients={dispatchTotal}
                            showTotalClients={false}
                            items={[{ label: '검사완료', value: testComplete }]}
                          />
                        </td>
                        <td
                          className={`whitespace-nowrap ${counselorListTdCompactClass} text-center ${expired ? 'text-red-400' : ''}`}
                        >
                          {formatUsageEndDate(row.usageEndDate)}
                        </td>
                        <CounselorAdminEmailTd email={row.counselorEmail} />
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <CounselorListPagination
              page={page}
              totalPages={totalPages}
              currentCount={currentCount}
              totalCount={totalCount}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              footerAction={
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleAll}
                    disabled={loading || items.length === 0}
                    className="rounded-md border border-white/10 bg-[#101f38]/90 px-2.5 py-1 text-sm text-slate-300 transition-colors hover:bg-white/5 disabled:opacity-50"
                  >
                    {allSelected ? '전체 해제' : '전체 선택'}
                  </button>
                  <button
                    type="button"
                    onClick={handleAssessmentDownload}
                    disabled={selected.size === 0}
                    className="rounded-md bg-emerald-700/90 px-2.5 py-1 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                  >
                    다운로드 ({selected.size})
                  </button>
                  <button
                    type="button"
                    onClick={handleAssessmentPrint}
                    disabled={selected.size === 0}
                    className="rounded-md border border-white/15 bg-[#101f38]/90 px-2.5 py-1 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5 disabled:opacity-50"
                  >
                    인쇄 ({selected.size})
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleRestore()}
                    disabled={restoring || selected.size === 0}
                    className="inline-flex items-center rounded-md bg-emerald-600 px-2.5 py-1 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {restoring ? '복구 중…' : `삭제된 상담코드로 복구 (${selected.size})`}
                  </button>
                </div>
              }
            />
          </>
        )}
      </motion.div>

      {restoring ? (
        <CounselorActionProgressOverlay
          open={restoring}
          title="복구 진행 중…"
          message="선택한 상담코드를 삭제된 상담코드로 복구하고 있습니다."
        />
      ) : null}
      <CounselorActionCompleteModal
        open={Boolean(actionComplete)}
        title={actionComplete?.title ?? ''}
        message={actionComplete?.message}
        error={actionComplete?.error}
        onConfirm={() => setActionComplete(null)}
      />
    </CounselorPageSection>
  );
}
