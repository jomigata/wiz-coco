'use client';

import React, { useState, useMemo, useEffect } from 'react';
import AuthLink from '@/components/auth/AuthLink';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaClipboard } from 'react-icons/fa';
import type { CounselorAssessment, CreatedAssessmentBannerInfo } from '@/lib/assessmentApi';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import CounselorListPagination from '@/components/counselor/CounselorListPagination';
import CounselorSlashInfoCell from '@/components/counselor/CounselorSlashInfoCell';
import {
  counselingCodeTypeLabel,
  formatCounselingTypeWithCodeSlash,
} from '@/data/counselingCodeTypes';
import { getAssessmentOrgLabel } from '@/lib/assessmentSortOptions';
import {
  counselorListActionBtnClass,
  counselorListNoThClass,
  counselorListSortActiveClass,
  counselorListSortIdleClass,
  counselorListTableWrapperClass,
  counselorListTdClass,
  counselorListThClass,
  counselorListTheadClass,
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
  return `${(a.title || '—').trim()}/${getAssessmentOrgLabel(a)}`;
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

function formatDate(iso: string | undefined): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  } catch { return String(iso); }
}

function formatUsageEndDate(iso: string | undefined): string {
  const s = (iso || '').trim();
  if (!s) return '무기한';
  try {
    const d = new Date(`${s}T00:00:00`);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString('ko-KR');
  } catch { return s; }
}

function isExpired(iso: string | undefined): boolean {
  const s = (iso || '').trim();
  if (!s) return false;
  try { return new Date(`${s}T23:59:59`) < new Date(); } catch { return false; }
}

function resultStatusCounts(a: CounselorAssessment) {
  const dispatchSent = a.dispatchSentCount ?? 0;
  const dispatchFailed = a.dispatchFailedCount ?? 0;
  const testComplete = a.testCompleteCount ?? a.emailsCompletedAllTestsCount ?? 0;
  const testIncomplete = a.testIncompleteCount ?? a.emailsNotCompletedAllTestsCount ?? 0;
  const dispatchTotal = Math.max(testComplete + testIncomplete, dispatchSent + dispatchFailed);
  return { dispatchSent, dispatchFailed, testComplete, testIncomplete, dispatchTotal };
}

export default function AssessmentList({ assessments, createdInfo }: AssessmentListProps) {
  const router = useRouter();
  const [listItems, setListItems] = useState(assessments);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<ListSortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  useEffect(() => {
    setListItems(assessments);
  }, [assessments]);

  const rowHoverCellClass = (id: string) =>
    hoveredRowId === id ? 'bg-white/[0.06]' : '';

  const goToProgress = (assessmentId: string) => {
    router.push(progressHref(assessmentId));
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
    const { testComplete, testIncomplete } = resultStatusCounts(a);
    return sum + testComplete + testIncomplete;
  }, 0);
  const totalCompleted = listItems.reduce(
    (sum, a) => sum + resultStatusCounts(a).testComplete,
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
      className="flex min-h-0 flex-1"
      bodyClassName="flex min-h-0 flex-1 flex-col !p-0"
      noBodyPadding
      description={
        <>
          전체 <span className="font-semibold text-white">{listItems.length}</span>개 · 응시자{' '}
          <span className="font-semibold text-cyan-300">{totalParticipants}</span>명 · 완료{' '}
          <span className="font-semibold text-emerald-300">{totalCompleted}</span>명
          <span className="ml-2 text-sky-200/60">({filtered.length}건 표시)</span>
        </>
      }
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
              placeholder="검사명 · 상담유형 · 코드 · 기관명 검색"
              className="w-full rounded-md border border-white/10 bg-[#101f38]/90 py-1.5 pl-8 pr-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500/60"
            />
          </div>
          <AuthLink
            href="/counselor/assessments/new"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-sky-600/90 px-2.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-sky-500"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            상담코드생성
          </AuthLink>
        </>
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
              <thead className={counselorListTheadClass}>
                <tr>
                  <th className={counselorListNoThClass}>No.</th>
                  <SortableColumnHeader
                    label="생성 일시"
                    sortKey="createdAt"
                    activeKey={sortKey}
                    direction={sortDir}
                    onSort={toggleSort}
                    className="whitespace-nowrap"
                  />
                  <SortableColumnHeader
                    label="안내정보"
                    sortKey="counselInfo"
                    activeKey={sortKey}
                    direction={sortDir}
                    onSort={toggleSort}
                  />
                  <th scope="col" className={`${counselorListThClass} whitespace-nowrap`}>코드 사용 마감일</th>
                  <th scope="col" className={`${counselorListThClass} whitespace-nowrap text-center`}>
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
                  <th scope="col" className={`${counselorListThClass} text-center`}>작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {paginatedItems.map((a, idx) => {
                  const { dispatchSent, testComplete, dispatchTotal } = resultStatusCounts(a);
                  const expired = isExpired(a.usageEndDate);
                  const infoPrimary = (a.title || '—').trim();
                  const infoSecondary = getAssessmentOrgLabel(a);
                  const hoverTypeCode = formatCounselingTypeWithCodeSlash(
                    a.codeCategory,
                    formatAccessCodeDisplay(a.accessCode),
                  );

                  return (
                    <tr
                      key={a.id}
                      className="group"
                      onMouseEnter={() => setHoveredRowId(a.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                    >
                      <td className={`${counselorListTdClass} text-slate-500 tabular-nums`}>
                        {startIndex + idx + 1}
                      </td>
                      <td
                        className={`whitespace-nowrap ${counselorListTdClass} text-slate-200 cursor-pointer transition-colors ${rowHoverCellClass(a.id)}`}
                        onClick={() => goToProgress(a.id)}
                      >
                        <span className={cellLinkClass}>{formatDate(a.createdAt)}</span>
                      </td>
                      <td
                        className={`max-w-[16rem] ${counselorListTdClass} cursor-pointer transition-colors ${rowHoverCellClass(a.id)}`}
                        onClick={() => goToProgress(a.id)}
                      >
                        <CounselorSlashInfoCell
                          primary={infoPrimary}
                          secondary={infoSecondary}
                          hoverExtra={hoverTypeCode}
                          className={cellLinkClass}
                        />
                        {expired ? (
                          <span className="ml-1 inline-block rounded-full border border-red-500/30 bg-red-500/15 px-1.5 py-0.5 align-middle text-[10px] font-medium text-red-300">
                            만료
                          </span>
                        ) : null}
                      </td>
                      <td
                        className={`whitespace-nowrap ${counselorListTdClass} cursor-pointer transition-colors ${rowHoverCellClass(a.id)} ${expired ? 'text-red-400' : 'text-slate-400'}`}
                        onClick={() => goToProgress(a.id)}
                      >
                        {formatUsageEndDate(a.usageEndDate)}
                      </td>
                      <td className={`whitespace-nowrap ${counselorListTdClass} text-center text-slate-500 cursor-default`}>
                        (
                        <span className="px-2 font-medium tabular-nums text-slate-300">{dispatchTotal}</span>
                        /
                        <span className="px-2 font-medium tabular-nums text-emerald-400">{dispatchSent}</span>
                        /
                        <span className="px-2 font-medium tabular-nums text-emerald-400">{testComplete}</span>
                        )
                      </td>
                      <td className={`whitespace-nowrap ${counselorListTdClass} cursor-default`}>
                        <div className="grid min-w-[10rem] grid-cols-2 gap-1">
                          <AuthLink
                            href={progressHref(a.id)}
                            className={`${counselorListActionBtnClass} bg-sky-800/50 text-sky-100 hover:bg-sky-700/60`}
                          >
                            진행현황
                          </AuthLink>
                          <AuthLink
                            href={`/counselor/assessments/edit?id=${encodeURIComponent(a.id)}`}
                            className={`${counselorListActionBtnClass} bg-emerald-800/50 text-emerald-100 hover:bg-emerald-700/60`}
                          >
                            수정
                          </AuthLink>
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
    </CounselorPageSection>
  );
}
