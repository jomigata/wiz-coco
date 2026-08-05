'use client';

import React, { useMemo, useState } from 'react';
import CounselorListPagination from '@/components/counselor/CounselorListPagination';
import { getCounselorResult, type CounselorResultDetail } from '@/lib/assessmentApi';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { displayContactEmail, displayContactPhone } from '@/lib/contactPrivacy';
import type { DispatchTestResult } from '@/lib/clientPortalApi';
import DispatchStatusText from '@/components/counselor/DispatchStatusText';
import {
  compareArchivedRecipients,
  dispatchStatusDisplay,
  formatNotifyDate,
  testSummary,
  type RecipientSortKey,
  type SortDirection,
} from '@/lib/dispatchRecipientDisplay';
import type { ArchivedDispatchRecipient } from '@/lib/clientPortalApi';
import {
  counselorListBodyRowClass,
  counselorListHeaderRowClass,
  counselorListNoThClass,
  counselorListSelectTdClass,
  counselorListSelectThClass,
  counselorListSortActiveClass,
  counselorListSortIdleClass,
  counselorListTableWrapperClass,
  counselorListTdClass,
  counselorListThClass,
} from '@/lib/counselorListTableStyles';
import { useListPagination } from '@/hooks/useListPagination';
import { useCounselorListPageSize } from '@/hooks/useCounselorListPageSize';

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
    <th className={`${counselorListThClass} ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 transition-colors hover:text-slate-200"
      >
        <span>{label}</span>
        <span
          className={`text-[10px] ${active ? counselorListSortActiveClass : counselorListSortIdleClass}`}
          aria-hidden="true"
        >
          {active ? (direction === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  );
}

function testStatusLabel(status: DispatchTestResult['status']): { text: string; className: string } {
  if (status === 'completed') return { text: '완료', className: 'text-emerald-300' };
  if (status === 'in_progress') return { text: '진행 중', className: 'text-amber-300' };
  return { text: '미실시', className: 'text-slate-500' };
}

function testLetterLabel(index: number): string {
  return `${String.fromCharCode(97 + index)}.`;
}

function formatCompletedAt(iso: string | null | undefined): string {
  return formatNotifyDate(iso);
}

type ArchivedRecipientsTableProps = {
  items: ArchivedDispatchRecipient[];
  selected: Set<string>;
  onToggleOne: (id: string) => void;
  onToggleAll?: () => void;
  allSelected?: boolean;
  showAssessmentColumns?: boolean;
  layout?: 'default' | 'dispatch';
  hideSelect?: boolean;
  hideArchivedAt?: boolean;
  hidePagination?: boolean;
};

export default function ArchivedRecipientsTable({
  items,
  selected,
  onToggleOne,
  onToggleAll,
  allSelected = false,
  showAssessmentColumns = false,
  layout = 'default',
  hideSelect = false,
  hideArchivedAt = false,
  hidePagination = false,
}: ArchivedRecipientsTableProps) {
  const [sortKey, setSortKey] = useState<RecipientSortKey>('notifyAt');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CounselorResultDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const { pageSize, setPageSize } = useCounselorListPageSize();

  const sortedItems = useMemo(() => {
    const list = [...items];
    list.sort((a, b) => compareArchivedRecipients(a, b, sortKey, sortDir));
    return list;
  }, [items, sortKey, sortDir]);

  const {
    page,
    setPage,
    totalPages,
    totalCount,
    startIndex,
    paginatedItems,
    currentCount,
  } = useListPagination(sortedItems, pageSize);

  const toggleSort = (key: RecipientSortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'notifyAt' || key === 'archivedAt' ? 'desc' : 'asc');
    }
  };

  const toggleExpand = (portalId: string) => {
    setExpandedId((prev) => (prev === portalId ? null : portalId));
  };

  const openResultDetail = async (resultId: string, assessmentId: string) => {
    if (!assessmentId) {
      setDetailError('상담코드 정보가 없어 결과를 열 수 없습니다.');
      return;
    }
    setDetailLoading(true);
    setDetailError('');
    try {
      const result = await getCounselorResult(assessmentId, resultId);
      setDetail(result);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : '결과를 불러오지 못했습니다.');
    } finally {
      setDetailLoading(false);
    }
  };

  const isDispatchLayout = layout === 'dispatch';
  const showArchivedAtColumn = !hideArchivedAt && !isDispatchLayout;
  const showSelectColumn = !hideSelect;

  const expandLeadingColSpan = isDispatchLayout
    ? showSelectColumn
      ? 2
      : 1
    : 3;
  const expandRestColSpan = isDispatchLayout
    ? 6
    : (showAssessmentColumns ? 9 : showArchivedAtColumn ? 7 : 6);

  const renderTestExpandRow = (row: ArchivedDispatchRecipient, tests: DispatchTestResult[]) => (
    <tr>
      <td
        colSpan={expandLeadingColSpan}
        className="border-b border-slate-700/60 bg-slate-900/20 p-0"
        aria-hidden="true"
      />
      <td
        colSpan={expandRestColSpan}
        className="border-b border-slate-700/60 bg-slate-900/20 px-3 py-3 pb-4 align-top"
      >
        {tests.length === 0 ? (
          <p className="rounded-lg border border-slate-700/60 bg-slate-950/40 px-3 py-2 text-sm text-slate-500">
            등록된 검사 항목이 없습니다.
          </p>
        ) : (
          <div className="max-w-2xl overflow-hidden rounded-lg border border-slate-600/80 bg-slate-950/55 shadow-inner">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="border-b border-slate-700/70 bg-slate-900/40 text-xs text-slate-400">
                  <th className="w-10 px-3 py-2" aria-hidden="true" />
                  <th className="px-3 py-2 text-left font-medium">검사명</th>
                  <th className="w-[5.5rem] px-3 py-2 text-left font-medium">상태</th>
                  <th className="w-[10.5rem] px-3 py-2 text-left font-medium">완료일시</th>
                  <th className="w-[5.5rem] px-3 py-2 text-left font-medium">결과 확인</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((t, testIndex) => {
                  const st = testStatusLabel(t.status);
                  return (
                    <tr
                      key={t.testId}
                      className="border-b border-slate-800/80 last:border-0 hover:bg-slate-900/30"
                    >
                      <td className="px-3 py-2.5 tabular-nums text-slate-500 align-top">
                        {testLetterLabel(testIndex)}
                      </td>
                      <td className="break-words px-3 py-2.5 text-white align-top">
                        {t.testName || t.testId}
                      </td>
                      <td className={`px-3 py-2.5 align-top ${st.className}`}>{st.text}</td>
                      <td className="px-3 py-2.5 text-xs leading-relaxed text-slate-400 align-top">
                        {formatCompletedAt(t.completedAt)}
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        {t.status === 'completed' && t.resultId ? (
                          <button
                            type="button"
                            onClick={() => void openResultDetail(t.resultId!, row.assessmentId)}
                            className="whitespace-nowrap text-blue-400 hover:text-blue-300"
                          >
                            결과 보기
                          </button>
                        ) : t.status === 'in_progress' ? (
                          <span className="text-amber-300">진행 중</span>
                        ) : (
                          <span className="text-slate-500">미실시</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </td>
    </tr>
  );

  return (
    <>
      <div className={counselorListTableWrapperClass}>
        <table className="w-max min-w-full table-fixed text-sm">
          <thead>
            <tr className={counselorListHeaderRowClass}>
              <th className={counselorListNoThClass}>No.</th>
              {showSelectColumn ? (
                <th className={isDispatchLayout ? counselorListSelectThClass : `${counselorListThClass} w-10 text-center`}>
                  {onToggleAll ? (
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={onToggleAll}
                      className="rounded accent-blue-500"
                      aria-label="전체 선택"
                    />
                  ) : (
                    <span className="sr-only">선택</span>
                  )}
                </th>
              ) : null}
              {isDispatchLayout ? (
                <>
                  <SortableColumnHeader
                    label="이름 (나의코드)"
                    sortKey="displayName"
                    activeKey={sortKey}
                    direction={sortDir}
                    onSort={toggleSort}
                    className="w-36"
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
                    label="검사 현황"
                    sortKey="testStatus"
                    activeKey={sortKey}
                    direction={sortDir}
                    onSort={toggleSort}
                    className="w-36"
                  />
                  <SortableColumnHeader
                    label="발송현황"
                    sortKey="notifyStatus"
                    activeKey={sortKey}
                    direction={sortDir}
                    onSort={toggleSort}
                    className="w-28"
                  />
                  <SortableColumnHeader
                    label="발송일시"
                    sortKey="notifyAt"
                    activeKey={sortKey}
                    direction={sortDir}
                    onSort={toggleSort}
                    className="w-36"
                  />
                </>
              ) : (
                <>
                  <SortableColumnHeader
                    label="검사 현황"
                    sortKey="testStatus"
                    activeKey={sortKey}
                    direction={sortDir}
                    onSort={toggleSort}
                    className="w-32"
                  />
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
                  {showAssessmentColumns ? (
                    <>
                      <th className={counselorListThClass}>상담코드</th>
                      <th className={counselorListThClass}>검사명</th>
                    </>
                  ) : null}
                  {showArchivedAtColumn ? (
                    <SortableColumnHeader
                      label="삭제일시"
                      sortKey="archivedAt"
                      activeKey={sortKey}
                      direction={sortDir}
                      onSort={toggleSort}
                      className="w-36"
                    />
                  ) : null}
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((row, rowIndex) => {
              const notify = dispatchStatusDisplay(row);
              const summary = testSummary(row);
              const isOpen = expandedId === row.portalId;
              const contactRevealed = isOpen;
              const tests = row.tests ?? [];
              const myCodeLabel = formatAccessCodeDisplay(row.myCode);
              const nameWithCode = row.displayName
                ? `${row.displayName}${myCodeLabel && myCodeLabel !== '—' ? ` (${myCodeLabel})` : ''}`
                : myCodeLabel && myCodeLabel !== '—'
                  ? `(${myCodeLabel})`
                  : '—';

              return (
                <React.Fragment key={row.portalId}>
                  <tr
                    onClick={() => toggleExpand(row.portalId)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleExpand(row.portalId);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-expanded={isOpen}
                    aria-label={
                      isDispatchLayout
                        ? `${row.displayName || '내담자'} 검사 현황 ${isOpen ? '접기' : '펼치기'}`
                        : undefined
                    }
                    className={`cursor-pointer ${counselorListBodyRowClass} ${isOpen ? 'bg-white/[0.04]' : ''}`}
                  >
                    <td className={`${counselorListTdClass} tabular-nums text-slate-400 align-top`}>
                      {startIndex + rowIndex + 1}
                    </td>
                    {showSelectColumn ? (
                      <td
                        className={isDispatchLayout ? counselorListSelectTdClass : `${counselorListTdClass} align-top`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(row.portalId)}
                          onChange={() => onToggleOne(row.portalId)}
                          className="rounded text-blue-500"
                        />
                      </td>
                    ) : null}
                    {isDispatchLayout ? (
                      <>
                        <td
                          className="max-w-[9rem] truncate px-3 py-2 text-white align-top w-36"
                          title={nameWithCode}
                        >
                          {nameWithCode}
                        </td>
                        <td className="truncate px-3 py-2 text-slate-300 align-top tabular-nums">
                          {row.email?.trim() ? (
                            displayContactEmail(row.email, contactRevealed)
                          ) : (
                            <span className="text-amber-300/90" title="이메일 주소 없음">
                              없음
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-300 align-top tabular-nums">
                          {row.phone?.trim() ? displayContactPhone(row.phone, contactRevealed) : '—'}
                        </td>
                        <td className={`px-3 py-2.5 align-top whitespace-nowrap text-sm ${summary.className}`}>
                          <span className="text-slate-400" aria-hidden="true">
                            {isOpen ? '▼' : '▶'}{' '}
                          </span>
                          <span>{summary.text}</span>
                        </td>
                        <td className="px-3 py-2.5 align-top whitespace-nowrap text-sm" title={notify.title}>
                          <DispatchStatusText value={notify} />
                        </td>
                        <td className="px-3 py-2.5 align-top whitespace-nowrap text-sm tabular-nums text-slate-400">
                          {formatNotifyDate(row.notifyAt)}
                        </td>
                      </>
                    ) : (
                      <>
                        <td
                          className={`${counselorListTdClass} whitespace-nowrap align-top ${summary.className}`}
                        >
                          <span className="text-slate-400" aria-hidden="true">
                            {isOpen ? '▼' : '▶'}{' '}
                          </span>
                          <span>{summary.text}</span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs tabular-nums text-slate-400 align-top">
                          {formatNotifyDate(row.notifyAt)}
                        </td>
                        <td className="max-w-[7rem] truncate px-3 py-2 text-white align-top">
                          {row.displayName || '—'}
                        </td>
                        <td className="truncate px-3 py-2 text-slate-300 align-top tabular-nums">
                          {row.email?.trim() ? (
                            displayContactEmail(row.email, contactRevealed)
                          ) : (
                            <span className="text-amber-300/90" title="이메일 주소 없음">
                              없음
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-300 align-top tabular-nums">
                          {row.phone?.trim() ? displayContactPhone(row.phone, contactRevealed) : '—'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-cyan-300 align-top">
                          {formatAccessCodeDisplay(row.myCode)}
                        </td>
                        <td className={`whitespace-nowrap ${counselorListTdClass} align-top`} title={notify.title}>
                          <DispatchStatusText value={notify} />
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
                        {showArchivedAtColumn ? (
                          <td className="whitespace-nowrap px-3 py-2 text-xs tabular-nums text-slate-400 align-top">
                            {formatNotifyDate(row.archivedAt)}
                          </td>
                        ) : null}
                      </>
                    )}
                  </tr>
                  {isOpen ? renderTestExpandRow(row, tests) : null}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {hidePagination ? null : (
        <CounselorListPagination
          page={page}
          totalPages={totalPages}
          currentCount={currentCount}
          totalCount={totalCount}
          onPageChange={setPage}
          unit="명"
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      )}

      {detailLoading ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
          <p className="text-sm text-slate-200">결과 불러오는 중…</p>
        </div>
      ) : null}
      {detailError ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
          <div className="rounded-xl border border-red-500/40 bg-slate-900 p-6 text-center">
            <p className="text-sm text-red-300">{detailError}</p>
            <button
              type="button"
              onClick={() => setDetailError('')}
              className="mt-4 rounded-lg bg-slate-700 px-4 py-2 text-sm text-white"
            >
              닫기
            </button>
          </div>
        </div>
      ) : null}
      {detail ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-xl border border-slate-600 bg-slate-900 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white">{detail.testId || '검사 결과'}</h3>
            <p className="mt-1 text-sm text-slate-400">
              {detail.clientDisplayName || detail.clientEmail || ''}
            </p>
            <pre className="mt-4 max-h-[50vh] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950/80 p-4 text-xs text-slate-300">
              {JSON.stringify(detail.resultData ?? detail.responses ?? detail, null, 2)}
            </pre>
            <button
              type="button"
              onClick={() => setDetail(null)}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500"
            >
              닫기
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
