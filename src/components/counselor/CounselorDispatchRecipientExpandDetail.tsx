'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { buildAssessmentProgressHref } from '@/lib/counselorAssessmentListSearch';
import { DISPATCH_SUCCESS_TEXT_CLASS } from '@/lib/dispatchRecipientDisplay';
import {
  counselorListTheadClass,
} from '@/lib/counselorListTableStyles';
import { listCareAssignments } from '@/lib/careAssignmentApi';
import type { CounselorCareAssignmentListItem } from '@/types/careAssignment';
import { dedupeDispatchTestsByTestId } from '@/lib/dispatchRealtime';
import CounselorNextTestRecommendCard from '@/components/counselor/CounselorNextTestRecommendCard';
import CounselorQuickCareRecommendCard from '@/components/counselor/CounselorQuickCareRecommendCard';
import CounselorRecommendDismissedSummary from '@/components/counselor/CounselorRecommendDismissedSummary';
import CounselorRecipientExpandTestName from '@/components/counselor/CounselorRecipientExpandTestName';
import { CounselorRecipientExpandLeadingCells } from '@/components/counselor/CounselorRecipientExpandRowCells';
import type { AssessmentMetaEntry } from '@/lib/clientPortalRealtime';
import type { DispatchRecipient, DispatchTestResult } from '@/lib/clientPortalApi';
import { revokePortalAdditionalAssignment } from '@/lib/clientPortalApi';
import { LoadingSpinner } from '@/components/ui/LoadingMessage';

function formatCompletedAt(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function addedAtForPushedTest(
  testId: string,
  primaryAssessmentId: string,
  assignedAssessmentIds: string[],
  assessmentMeta?: Record<string, AssessmentMetaEntry>,
): string | null {
  const tid = testId.trim();
  if (!tid || !assessmentMeta) return null;
  let latest: string | null = null;
  for (const aid of assignedAssessmentIds) {
    if (aid === primaryAssessmentId) continue;
    const meta = assessmentMeta[aid];
    if (!meta?.testList?.some((t) => (t.testId || '').trim() === tid)) continue;
    const created = (meta.createdAt || '').trim();
    if (created && (!latest || created > latest)) latest = created;
  }
  return latest;
}

function addedAtForAdditionalTest(
  testId: string,
  primaryAssessmentId: string,
  baselineTestIds: Set<string>,
  assignedAssessmentIds: string[],
  assessmentMeta?: Record<string, AssessmentMetaEntry>,
  primaryAdditionalTests?: {
    primaryAssessmentId: string;
    testId: string;
    addedAt?: string | null;
  }[],
): string | null {
  const tid = testId.trim();
  if (!tid || baselineTestIds.has(tid)) return null;
  const onPrimary = (primaryAdditionalTests || []).find(
    (e) => e.primaryAssessmentId === primaryAssessmentId && (e.testId || '').trim() === tid,
  );
  if (onPrimary?.addedAt) return onPrimary.addedAt;
  return addedAtForPushedTest(tid, primaryAssessmentId, assignedAssessmentIds, assessmentMeta);
}

function formatAddedAtInParens(iso: string | null | undefined): string {
  const inner = formatCompletedAt(iso);
  if (inner === '—') return '—';
  return `( ${inner} )`;
}

function formatCompletionOrAddedColumn(row: {
  status: DispatchTestResult['status'];
  completedAt: string | null;
  addedAt: string | null;
  canRemove: boolean;
}): string {
  if (row.status === 'completed') {
    return formatCompletedAt(row.completedAt);
  }
  if (row.canRemove && row.addedAt && row.status === 'not_started') {
    return formatAddedAtInParens(row.addedAt);
  }
  return '—';
}

function testStatusLabel(status: DispatchTestResult['status']): { text: string; className: string } {
  switch (status) {
    case 'completed':
      return { text: '완료', className: DISPATCH_SUCCESS_TEXT_CLASS };
    case 'in_progress':
      return { text: '진행 중', className: 'text-amber-300' };
    default:
      return { text: '미실시', className: 'text-slate-500' };
  }
}

function testLetterLabel(index: number): string {
  return `${String.fromCharCode(97 + index)}.`;
}

function renderResultCheckCell(
  row: {
    status: DispatchTestResult['status'];
    resultId: string | null;
    isCare: boolean;
    addedAt: string | null;
    canRemove: boolean;
  },
  onOpenResult?: (resultId: string) => void,
): React.ReactNode {
  if (row.status === 'completed' && row.resultId && onOpenResult) {
    return (
      <button
        type="button"
        onClick={() => onOpenResult(row.resultId!)}
        className="whitespace-nowrap text-blue-400 hover:text-blue-300"
      >
        결과 보기
      </button>
    );
  }
  if (row.status === 'in_progress') {
    return <span className="text-amber-300">진행 중</span>;
  }
  if (row.status === 'not_started' && row.canRemove && row.addedAt) {
    return (
      <span className="whitespace-nowrap text-slate-400">
        ← {formatAddedAtInParens(row.addedAt)}
      </span>
    );
  }
  return <span className="text-slate-500">미실시</span>;
}

function isMovedOutRecipient(r: DispatchRecipient): boolean {
  return r.moveStatus === 'moved_out';
}

export type CounselorDispatchRecipientExpandContentProps = {
  recipient: DispatchRecipient;
  tests: DispatchTestResult[];
  assessmentId: string;
  searchQuery?: string;
  showRecommendCards?: boolean;
  onOpenResult?: (resultId: string) => void;
  onRestoreTombstone?: (tombstoneId: string) => void;
  restoreLoading?: boolean;
  /** 검사·진행 데이터만 재조회 (추천 검사 즉시 발송 등) */
  onRefreshExpandData?: () => void;
  /** 숙제 목록·추천 숙제 카드 재조회 */
  onCareListRefresh?: () => void;
  /** @deprecated onRefreshExpandData + onCareListRefresh 사용 */
  onRecommendAssigned?: () => void;
  /** 숙제 목록 재조회 (발송 후 테이블 반영) */
  careListRefresh?: number;
  /** 기본 상담(코드) 검사 — 미실시 추가요청 판별 */
  assessmentMeta?: Record<string, AssessmentMetaEntry>;
  /** dispatch 패널 등 testList 직접 전달 */
  baselineTestIds?: string[];
  assignedAssessmentIds?: string[];
  primaryAdditionalTests?: {
    primaryAssessmentId: string;
    testId: string;
    addedAt?: string | null;
  }[];
};

export function CounselorDispatchRecipientExpandContent({
  recipient,
  tests,
  assessmentId,
  searchQuery = '',
  showRecommendCards = false,
  onOpenResult,
  onRestoreTombstone,
  restoreLoading = false,
  onRefreshExpandData,
  onCareListRefresh,
  onRecommendAssigned,
  careListRefresh = 0,
  assessmentMeta,
  baselineTestIds: baselineTestIdsProp,
  assignedAssessmentIds = [],
  primaryAdditionalTests = [],
}: CounselorDispatchRecipientExpandContentProps) {
  const r = recipient;
  const [careItems, setCareItems] = useState<CounselorCareAssignmentListItem[]>([]);
  const [recommendUiRev, setRecommendUiRev] = useState(0);
  const [removeError, setRemoveError] = useState('');
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const [optimisticRemovedTestIds, setOptimisticRemovedTestIds] = useState<Set<string>>(
    () => new Set(),
  );

  const refreshExpandData = onRefreshExpandData ?? onRecommendAssigned;
  const refreshCareList = onCareListRefresh ?? onRecommendAssigned;

  const baselineTestIds = useMemo(() => {
    if (baselineTestIdsProp?.length) {
      return new Set(baselineTestIdsProp.map((id) => id.trim()).filter(Boolean));
    }
    if (!assessmentId || !assessmentMeta?.[assessmentId]?.testList?.length) {
      return new Set<string>();
    }
    return new Set(
      assessmentMeta[assessmentId].testList.map((t) => (t.testId || '').trim()).filter(Boolean),
    );
  }, [assessmentId, assessmentMeta, baselineTestIdsProp]);

  useEffect(() => {
    if (!showRecommendCards || !r.portalId) {
      setCareItems([]);
      return;
    }
    let cancelled = false;
    void listCareAssignments({ portalId: r.portalId, status: 'active', limit: 40 })
      .then((data) => {
        if (!cancelled) setCareItems(data.items || []);
      })
      .catch(() => {
        if (!cancelled) setCareItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [showRecommendCards, r.portalId, tests, careListRefresh]);

  type ExpandTableRow = {
    rowKey: string;
    name: string;
    testId?: string;
    status: DispatchTestResult['status'];
    completedAt: string | null;
    resultId: string | null;
    addedAt: string | null;
    isCare: boolean;
    careAssignmentId?: string;
    canRemove: boolean;
  };

  const uniqueTests = useMemo(() => dedupeDispatchTestsByTestId(tests), [tests]);

  const tableRows = useMemo(() => {
    const fromTests: ExpandTableRow[] = uniqueTests
      .filter((t) => {
        const id = (t.testId || '').trim();
        return !id || !optimisticRemovedTestIds.has(id);
      })
      .map((t) => {
      const testId = (t.testId || '').trim();
      const isBaseline = testId ? baselineTestIds.has(testId) : false;
      const canRemove = t.status === 'not_started' && Boolean(testId) && !isBaseline;
      const addedAt = canRemove
        ? addedAtForAdditionalTest(
            testId,
            assessmentId,
            baselineTestIds,
            assignedAssessmentIds,
            assessmentMeta,
            primaryAdditionalTests,
          )
        : null;
      return {
        rowKey: `test-${t.testId}`,
        name: t.testName || '',
        testId: t.testId,
        status: t.status,
        completedAt: t.completedAt,
        resultId: t.resultId,
        addedAt,
        isCare: false,
        canRemove,
      };
    });
    const testNameKeys = new Set(fromTests.map((t) => t.name.trim().toLowerCase()).filter(Boolean));
    const careByTitle = new Map<string, ExpandTableRow>();
    for (const item of careItems) {
      const title = (item.title || '숙제').trim();
      const titleKey = title.toLowerCase();
      if (testNameKeys.has(titleKey)) continue;
      const progressStatus = item.progress?.status;
      const status: DispatchTestResult['status'] =
        item.status === 'completed' || progressStatus === 'completed'
          ? 'completed'
          : progressStatus === 'in_progress'
            ? 'in_progress'
            : 'not_started';
      const row: ExpandTableRow = {
        rowKey: `care-${item.id}`,
        name: title,
        status,
        completedAt: item.completedAt || item.progress?.completedAt || null,
        resultId: null,
        addedAt: status === 'not_started' ? item.createdAt || null : null,
        isCare: true,
        careAssignmentId: item.id,
        canRemove: status === 'not_started',
      };
      const prev = careByTitle.get(titleKey);
      if (!prev) {
        careByTitle.set(titleKey, row);
        continue;
      }
      const rank = (s: DispatchTestResult['status']) =>
        s === 'completed' ? 3 : s === 'in_progress' ? 2 : 1;
      if (rank(row.status) > rank(prev.status)) {
        careByTitle.set(titleKey, row);
      }
    }
    const fromCare = Array.from(careByTitle.values());
    return [...fromTests, ...fromCare];
  }, [
    uniqueTests,
    careItems,
    baselineTestIds,
    assessmentId,
    assignedAssessmentIds,
    assessmentMeta,
    optimisticRemovedTestIds,
    primaryAdditionalTests,
  ]);

  useEffect(() => {
    if (!removingKey) return;
    if (!tableRows.some((row) => row.rowKey === removingKey)) {
      setRemovingKey(null);
    }
  }, [tableRows, removingKey]);

  useEffect(() => {
    setOptimisticRemovedTestIds((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set(prev);
      for (const id of Array.from(prev)) {
        if (!uniqueTests.some((t) => (t.testId || '').trim() === id)) {
          next.delete(id);
        }
      }
      return next.size === prev.size ? prev : next;
    });
  }, [uniqueTests]);

  const handleRemoveAdditional = async (row: ExpandTableRow) => {
    if (!row.canRemove || removingKey) return;
    setRemoveError('');
    setRemovingKey(row.rowKey);
    try {
      if (row.isCare && row.careAssignmentId) {
        await revokePortalAdditionalAssignment(r.portalId, {
          kind: 'care',
          careAssignmentId: row.careAssignmentId,
        });
        setCareItems((prev) => prev.filter((c) => c.id !== row.careAssignmentId));
        refreshCareList?.();
        setRecommendUiRev((n) => n + 1);
      } else if (row.testId && assessmentId) {
        await revokePortalAdditionalAssignment(r.portalId, {
          kind: 'test',
          testId: row.testId,
          primaryAssessmentId: assessmentId,
        });
        const tid = row.testId.trim();
        if (tid) {
          setOptimisticRemovedTestIds((prev) => new Set(prev).add(tid));
        }
      } else {
        throw new Error('삭제할 항목을 확인할 수 없습니다.');
      }
      refreshExpandData?.();
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
      setRemovingKey(null);
    }
  };

  return (
    <>
      {isMovedOutRecipient(r) ? (
        <div className="mb-3 rounded-lg border border-slate-600/80 bg-slate-950/55 px-4 py-3 text-sm">
          <p className="font-medium text-slate-300">
            상담코드 ({formatAccessCodeDisplay(r.movedToJoinAccessCode || '') || '—'}) 로 이동 완료
          </p>
          <p className="mt-1 text-slate-400">
            {r.movedToAssessmentTitle || '다른 상담코드'}(
            {formatAccessCodeDisplay(r.movedToJoinAccessCode || '') || '—'})로 이동했습니다.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {r.movedToAssessmentId ? (
              <Link
                href={buildAssessmentProgressHref(r.movedToAssessmentId, searchQuery)}
                className="rounded-md border border-sky-500/40 bg-sky-950/40 px-3 py-1.5 text-xs text-sky-200 hover:bg-sky-900/50"
                onClick={(e) => e.stopPropagation()}
              >
                이동한 상담코드로 가기
              </Link>
            ) : null}
            {r.tombstoneId && onRestoreTombstone ? (
              <button
                type="button"
                disabled={restoreLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  onRestoreTombstone(r.tombstoneId!);
                }}
                className="rounded-md border border-amber-500/40 bg-amber-950/30 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-900/40 disabled:opacity-50"
              >
                이전 코드로 복구
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      {tableRows.length === 0 ? (
        <p className="rounded-lg border border-slate-700/60 bg-slate-950/40 px-3 py-2 text-sm text-slate-500">
          등록된 검사·숙제 항목이 없습니다.
        </p>
      ) : (
        <div className="max-w-2xl overflow-hidden rounded-lg border border-slate-600/80 bg-slate-950/55 shadow-inner">
          {removeError ? (
            <p className="border-b border-red-900/40 bg-red-950/20 px-3 py-1.5 text-xs text-red-300">{removeError}</p>
          ) : null}
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-10" />
              <col />
              <col className="w-[5.5rem]" />
              <col className="w-[11.5rem]" />
              <col className="w-[7.5rem]" />
              <col className="w-9" />
            </colgroup>
            <thead className={counselorListTheadClass}>
              <tr className="border-b border-slate-700/70 bg-slate-900/40 text-xs text-slate-400">
                <th className="px-3 py-2" aria-hidden="true" />
                <th className="px-3 py-2 text-left font-medium">검사명</th>
                <th className="px-3 py-2 text-left font-medium">상태</th>
                <th className="px-3 py-2 text-left font-medium leading-tight">
                  완료일시 / (추가일시)
                </th>
                <th className="px-3 py-2 text-left font-medium">결과 확인</th>
                <th className="px-1 py-2" aria-hidden="true" />
              </tr>
            </thead>
            <tbody>
              {tableRows.map((t, testIndex) => {
                const st = testStatusLabel(t.status);
                return (
                  <tr
                    key={t.rowKey}
                    className="border-b border-slate-800/80 last:border-0 hover:bg-slate-900/30"
                  >
                    <td className="px-3 py-2.5 align-top tabular-nums text-slate-500">
                      {testLetterLabel(testIndex)}
                    </td>
                    <td className="break-words px-3 py-2.5 align-top text-white">
                      {t.testId ? (
                        <CounselorRecipientExpandTestName testName={t.name} testId={t.testId} />
                      ) : (
                        t.name
                      )}
                    </td>
                    <td className={`px-3 py-2.5 align-top ${st.className}`}>{st.text}</td>
                    <td className="px-3 py-2.5 align-top text-xs leading-relaxed text-slate-400">
                      {formatCompletionOrAddedColumn(t)}
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      {renderResultCheckCell(t, onOpenResult)}
                    </td>
                    <td className="px-1 py-2.5 align-top text-center">
                      {t.canRemove ? (
                        <button
                          type="button"
                          title="추가 요청 삭제"
                          disabled={removingKey === t.rowKey}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleRemoveAdditional(t);
                          }}
                          className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-red-950/40 hover:text-red-300 disabled:opacity-40"
                          aria-label={`${t.name} 삭제`}
                        >
                          {removingKey === t.rowKey ? (
                            <LoadingSpinner size="sm" className="h-3.5 w-3.5 border-[1.5px]" />
                          ) : (
                            <span className="text-sm leading-none">×</span>
                          )}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {showRecommendCards && !isMovedOutRecipient(r) ? (
        <>
          <CounselorNextTestRecommendCard
            key={`next-reco-${recommendUiRev}`}
            assessmentId={assessmentId}
            recipient={{ ...r, tests: uniqueTests }}
            onAssigned={refreshExpandData}
            onUiChange={() => setRecommendUiRev((n) => n + 1)}
          />
          <CounselorQuickCareRecommendCard
            key={`care-reco-${recommendUiRev}`}
            recipient={{ ...r, tests: uniqueTests }}
            careListRefresh={careListRefresh}
            onAssigned={() => {
              refreshCareList?.();
              refreshExpandData?.();
            }}
            onUiChange={() => setRecommendUiRev((n) => n + 1)}
          />
          <CounselorRecommendDismissedSummary
            portalId={r.portalId}
            assessmentId={assessmentId}
            tests={uniqueTests}
            refreshKey={recommendUiRev}
            onRestore={() => setRecommendUiRev((n) => n + 1)}
          />
        </>
      ) : null}
    </>
  );
}

type ExpandRowProps = CounselorDispatchRecipientExpandContentProps & {
  leadingColSpan: number;
  detailColSpan: number;
};

export default function CounselorDispatchRecipientExpandRow({
  leadingColSpan,
  detailColSpan,
  ...contentProps
}: ExpandRowProps) {
  return (
    <tr data-counselor-list-expand-row>
      <CounselorRecipientExpandLeadingCells
        leadingColSpan={leadingColSpan}
        portalId={contentProps.recipient.portalId}
      />
      <td
        colSpan={detailColSpan}
        className="border-b border-slate-700/60 bg-slate-900/20 px-3 py-3 pb-4 align-top"
      >
        <CounselorDispatchRecipientExpandContent {...contentProps} />
      </td>
    </tr>
  );
}
