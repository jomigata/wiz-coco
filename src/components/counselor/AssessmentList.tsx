'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import AuthLink from '@/components/auth/AuthLink';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaClipboard } from 'react-icons/fa';
import type { CounselorAssessment, CreatedAssessmentBannerInfo } from '@/lib/assessmentApi';
import { deleteAssessment, removeCounselorAssessmentFromListCache } from '@/lib/assessmentApi';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import CounselorListPagination from '@/components/counselor/CounselorListPagination';
import CounselorSlashInfoCell from '@/components/counselor/CounselorSlashInfoCell';
import AssessmentAddRecipientModal, {
  buildContextFromAssessment,
} from '@/components/counselor/AssessmentAddRecipientModal';
import { rememberCounselorAssessmentContext } from '@/lib/counselorNestedNav';
import {
  counselingCodeTypeLabel,
} from '@/data/counselingCodeTypes';
import { getAssessmentOrgLabel } from '@/lib/assessmentSortOptions';
import {
  counselorListActionBtnClass,
  counselorListBodyRowClass,
  counselorListHeaderRowClass,
  counselorListNoThClass,
  counselorListSortActiveClass,
  counselorListSortIdleClass,
  counselorListTableWrapperClass,
  counselorListTdCompactClass,
  counselorListThClass,
  counselorResultMetricClass,
  formatCounselorIssueDate,
} from '@/lib/counselorListTableStyles';
import { useListPagination } from '@/hooks/useListPagination';

type ListSortKey = 'createdAt' | 'counselInfo';
type SortDirection = 'asc' | 'desc';

function parseCreatedAt(iso?: string): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function assessmentInfoLabel(a: CounselorAssessment): string {
  return `${getAssessmentOrgLabel(a)} / ${(a.title || '—').trim()}`;
}

function resultStatusCounts(a: CounselorAssessment) {
  const dispatchSent = a.dispatchSentCount ?? 0;
  const dispatchFailed = a.dispatchFailedCount ?? 0;
  const testComplete = a.testCompleteCount ?? a.emailsCompletedAllTestsCount ?? 0;
  const testIncomplete = a.testIncompleteCount ?? a.emailsNotCompletedAllTestsCount ?? 0;
  const dispatchTotal = Math.max(testComplete + testIncomplete, dispatchSent + dispatchFailed);
  return { dispatchFailed, testIncomplete, dispatchTotal };
}

function compareAssessments(
  a: CounselorAssessment,
  b: CounselorAssessment,
  key: ListSortKey,
  dir: SortDirection,
): number {
  const mult = dir === 'asc' ? 1 : -1;
  switch (key) {
    case 'createdAt':
      return mult * (parseCreatedAt(a.createdAt) - parseCreatedAt(b.createdAt));
    case 'counselInfo':
      return mult * assessmentInfoLabel(a).localeCompare(assessmentInfoLabel(b), 'ko');
    default:
      return 0;
  }
}

function progressHref(assessmentId: string): string {
  return `/counselor/assessments/progress?assessmentId=${encodeURIComponent(assessmentId)}`;
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
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 hover:text-slate-200 transition-colors"
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

interface AssessmentListProps {
  assessments: CounselorAssessment[];
  createdInfo?: CreatedAssessmentBannerInfo | null;
}

const LIVE_POLL_INTERVAL_MS = 3000;
const LIVE_POLL_MAX_MS = 60_000;

export default function AssessmentList({ assessments, createdInfo }: AssessmentListProps) {
  const router = useRouter();
  const [listItems, setListItems] = useState(assessments);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<ListSortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [addTarget, setAddTarget] = useState<CounselorAssessment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CounselorAssessment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [liveAssessmentId, setLiveAssessmentId] = useState<string | null>(null);
  const liveStartRef = useRef<number>(0);

  useEffect(() => {
    setListItems(assessments);
  }, [assessments]);

  useEffect(() => {
    if (!liveAssessmentId) return;
    const row = listItems.find((a) => a.id === liveAssessmentId);
    if (row) {
      const { dispatchTotal } = resultStatusCounts(row);
      const dispatchDone = (row.dispatchSentCount ?? 0) + (row.dispatchFailedCount ?? 0);
      if (dispatchTotal > 0 && dispatchDone >= dispatchTotal) {
        setLiveAssessmentId(null);
        return;
      }
    }
    if (Date.now() - liveStartRef.current >= LIVE_POLL_MAX_MS) {
      setLiveAssessmentId(null);
      return;
    }
    const timer = window.setTimeout(() => {
      router.refresh();
    }, LIVE_POLL_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [liveAssessmentId, listItems, router]);

  const startLivePolling = (assessmentId: string) => {
    liveStartRef.current = Date.now();
    setLiveAssessmentId(assessmentId);
  };

  const goToProgress = (assessmentId: string) => {
    rememberCounselorAssessmentContext(assessmentId);
    router.push(progressHref(assessmentId));
  };

  const openAddRecipient = (assessment: CounselorAssessment) => {
    rememberCounselorAssessmentContext(assessment.id);
    setAddTarget(assessment);
  };

  const openDelete = (assessment: CounselorAssessment) => {
    rememberCounselorAssessmentContext(assessment.id);
    setDeleteError('');
    setDeleteTarget(assessment);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await deleteAssessment(deleteTarget.id, deleteTarget.accessCode);
      removeCounselorAssessmentFromListCache(deleteTarget.id, deleteTarget.accessCode);
      setListItems((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleSort = (key: ListSortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'createdAt' ? 'desc' : 'asc');
    }
  };

  const cellLinkClass =
    'cursor-pointer text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500/60 rounded-sm';

  const totalParticipants = listItems.reduce((sum, a) => {
    const { testIncomplete } = resultStatusCounts(a);
    const testComplete = a.testCompleteCount ?? a.emailsCompletedAllTestsCount ?? 0;
    return sum + testComplete + testIncomplete;
  }, 0);
  const totalCompleted = listItems.reduce(
    (sum, a) => sum + (a.testCompleteCount ?? a.emailsCompletedAllTestsCount ?? 0),
    0,
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return listItems;
    return listItems.filter(
      (a) =>
        (a.title || '').toLowerCase().includes(q) ||
        (a.accessCode || '').toLowerCase().includes(q) ||
        counselingCodeTypeLabel(a.codeCategory).toLowerCase().includes(q) ||
        (a.targetAudience || '').toLowerCase().includes(q) ||
        getAssessmentOrgLabel(a).toLowerCase().includes(q),
    );
  }, [listItems, searchQuery]);

  const sortedFiltered = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => compareAssessments(a, b, sortKey, sortDir));
    return list;
  }, [filtered, sortKey, sortDir]);

  const {
    page,
    setPage,
    totalPages,
    totalCount,
    startIndex,
    paginatedItems,
    currentCount,
  } = useListPagination(sortedFiltered);

  return (
    <CounselorPageSection
      showHierarchyBreadcrumb
      title="상담코드 목록"
      className="flex min-h-0 flex-1"
      bodyClassName="flex min-h-0 flex-1 flex-col !p-0"
      noBodyPadding
      dense
      description={
        <>
          전체 <span className="font-semibold text-white">{listItems.length}</span>개 · 응시자{' '}
          <span className="font-semibold text-cyan-300">{totalParticipants}</span>명 · 완료{' '}
          <span className="font-semibold text-emerald-300">{totalCompleted}</span>명
          <span className="ml-2 text-sky-200/60">({filtered.length}건 표시)</span>
        </>
      }
      toolbar={
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
            placeholder="검사명 · 상담유형 · 코드 · 기관명 검색"
            className="w-full rounded-md border border-white/10 bg-[#101f38]/90 py-1.5 pl-8 pr-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500/60"
          />
        </div>
      }
    >
    <motion.div
      className="flex min-h-0 flex-1 flex-col p-2.5 text-sm sm:p-3"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {createdInfo && (
        <div className="mb-2 shrink-0 rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-3 py-2">
          <p className="text-emerald-200 font-medium">상담코드가 발급되었습니다</p>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <p>
              <span className="text-emerald-400/80">코드 </span>
              <span className="text-emerald-300 font-mono font-bold tracking-widest">
                {formatAccessCodeDisplay(createdInfo.accessCode)}
              </span>
              {(createdInfo.cohortName || createdInfo.title) ? (
                <span className="ml-2 font-normal text-white">
                  ({(createdInfo.cohortName || '—').trim()} / {(createdInfo.title || '—').trim()})
                </span>
              ) : null}
            </p>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex min-h-[12rem] flex-1 flex-col items-center justify-center rounded-md border border-white/10 bg-white/[0.03] py-10 text-center">
          <FaClipboard className="mb-2 h-10 w-10 text-slate-600" />
          <p className="text-base text-slate-300">
            {listItems.length === 0 ? '등록된 상담코드가 없습니다' : '검색 결과가 없습니다'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {listItems.length === 0 ? '첫 상담코드를 만들어 내담자에게 배포하세요.' : '검색어를 바꿔 보세요.'}
          </p>
          {listItems.length === 0 && (
            <AuthLink
              href="/counselor/assessments/new"
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-sky-600/90 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              첫 상담코드생성
            </AuthLink>
          )}
        </div>
      ) : (
        <>
          <div className={`min-h-0 flex-1 ${counselorListTableWrapperClass}`}>
            <table className="w-max min-w-full table-fixed text-sm">
              <thead>
                <tr className={counselorListHeaderRowClass}>
                  <th className={counselorListNoThClass}>No.</th>
                  <SortableColumnHeader
                    label="발급일"
                    sortKey="createdAt"
                    activeKey={sortKey}
                    direction={sortDir}
                    onSort={toggleSort}
                    className="whitespace-nowrap"
                  />
                  <SortableColumnHeader
                    label="그룹명 / 제목"
                    sortKey="counselInfo"
                    activeKey={sortKey}
                    direction={sortDir}
                    onSort={toggleSort}
                  />
                  <th scope="col" className={`${counselorListThClass} whitespace-nowrap text-center`}>
                    사용 종료일
                  </th>
                  <th scope="col" className={`${counselorListThClass} whitespace-nowrap text-center`}>
                    <span className="block">결과현황</span>
                    <span className="mt-0.5 block text-[10px] font-normal leading-tight text-slate-500">
                      (
                      <span className="text-slate-300">총발송수</span>
                      <span> / </span>
                      <span className="text-red-400">발송실패</span>
                      <span> / </span>
                      <span className="text-red-400">미완료</span>
                      )
                    </span>
                  </th>
                  <th scope="col" className={`${counselorListThClass} text-center`}>기타</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((a, idx) => {
                  const { dispatchFailed, testIncomplete, dispatchTotal } = resultStatusCounts(a);
                  const expired = isExpired(a.usageEndDate);
                  const infoPrimary = getAssessmentOrgLabel(a);
                  const infoSecondary = (a.title || '—').trim();

                  return (
                    <tr key={a.id} className={counselorListBodyRowClass}>
                      <td className={`${counselorListTdCompactClass} tabular-nums text-slate-500`}>
                        {startIndex + idx + 1}
                      </td>
                      <td
                        className={`whitespace-nowrap ${counselorListTdCompactClass} cursor-pointer text-white`}
                        onClick={() => goToProgress(a.id)}
                      >
                        <span className={cellLinkClass}>{formatCounselorIssueDate(a.createdAt)}</span>
                      </td>
                      <td
                        className={`max-w-[16rem] ${counselorListTdCompactClass} cursor-pointer`}
                        onClick={() => goToProgress(a.id)}
                      >
                        <CounselorSlashInfoCell
                          primary={infoPrimary}
                          secondary={infoSecondary}
                          showTooltip={false}
                          className={cellLinkClass}
                        />
                        {expired ? (
                          <span className="ml-1 inline-block rounded-full border border-red-500/30 bg-red-500/15 px-1.5 py-0.5 align-middle text-[10px] font-medium text-red-300">
                            만료
                          </span>
                        ) : null}
                      </td>
                      <td
                        className={`whitespace-nowrap ${counselorListTdCompactClass} cursor-pointer text-center ${expired ? 'text-red-400' : ''}`}
                        onClick={() => goToProgress(a.id)}
                      >
                        {formatUsageEndDate(a.usageEndDate)}
                      </td>
                      <td className={`whitespace-nowrap ${counselorListTdCompactClass} text-center cursor-default`}>
                        (
                        <span className="px-1 font-medium tabular-nums text-slate-300">{dispatchTotal}</span>
                        /
                        <span className={`px-1 font-medium tabular-nums ${counselorResultMetricClass(dispatchFailed)}`}>
                          {dispatchFailed}
                        </span>
                        /
                        <span className={`px-1 font-medium tabular-nums ${counselorResultMetricClass(testIncomplete)}`}>
                          {testIncomplete}
                        </span>
                        )
                      </td>
                      <td className={`whitespace-nowrap ${counselorListTdCompactClass} cursor-default text-center`}>
                        <div className="inline-flex flex-wrap items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openAddRecipient(a)}
                            className="inline-flex items-center justify-center rounded bg-sky-800/50 px-2 py-0.5 text-xs font-medium text-sky-100 hover:bg-sky-700/60"
                          >
                            내담자추가
                          </button>
                          <AuthLink
                            href={`/counselor/assessments/edit?id=${encodeURIComponent(a.id)}`}
                            onClick={() => rememberCounselorAssessmentContext(a.id)}
                            className="inline-flex min-w-0 items-center justify-center rounded bg-emerald-800/50 px-2 py-0.5 text-xs font-medium text-emerald-100 hover:bg-emerald-700/60"
                          >
                            수정
                          </AuthLink>
                          <button
                            type="button"
                            onClick={() => openDelete(a)}
                            className="inline-flex items-center justify-center rounded bg-red-950/50 px-2 py-0.5 text-xs font-medium text-red-300 hover:bg-red-900/60"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
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
          />
        </>
      )}
    </motion.div>

    <AssessmentAddRecipientModal
      open={Boolean(addTarget)}
      onClose={() => setAddTarget(null)}
      context={addTarget ? buildContextFromAssessment(addTarget) : null}
      onSuccess={(info) => {
        const targetId = addTarget?.id;
        router.refresh();
        if (info.sent && targetId) {
          startLivePolling(targetId);
        }
      }}
    />

    {deleteTarget ? (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
        <div
          className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl shadow-black/50"
          role="dialog"
          aria-labelledby="delete-assessment-title"
          aria-modal="true"
        >
          <div className="border-b border-red-500/20 bg-gradient-to-r from-red-950/50 via-slate-900 to-slate-900 px-6 py-5">
            <div className="flex items-start gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400"
                aria-hidden
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </span>
              <div className="min-w-0">
                <h2 id="delete-assessment-title" className="text-lg font-semibold text-white">
                  상담코드 삭제
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">
                  선택한 상담코드를 삭제 목록으로 이동합니다.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-6 py-5">
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                삭제 대상
              </p>
              <p className="mt-1.5 font-mono text-lg font-bold tracking-wider text-cyan-300">
                {formatAccessCodeDisplay(deleteTarget.accessCode)}
              </p>
              <p className="mt-1 text-sm leading-snug text-slate-200">{deleteTarget.title}</p>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-sm leading-relaxed text-slate-400">
              <p>
                <span className="font-medium text-slate-300">삭제된 상담코드 목록</span>으로 이동하며,
                필요 시 복구할 수 있습니다.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                내담자 접속 정보·검사 결과는 삭제 목록에서 복구하기 전까지 보관됩니다.
              </p>
            </div>

            {deleteError ? (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {deleteError}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 border-t border-white/[0.06] bg-black/20 px-6 py-4">
            <button
              type="button"
              onClick={() => {
                if (!deleteLoading) {
                  setDeleteTarget(null);
                  setDeleteError('');
                }
              }}
              disabled={deleteLoading}
              className="rounded-lg border border-white/10 bg-slate-800/80 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteConfirm()}
              disabled={deleteLoading}
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-red-900/30 transition-colors hover:bg-red-500 disabled:opacity-50"
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
