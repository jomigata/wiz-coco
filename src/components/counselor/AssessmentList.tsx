'use client';

import React, { useState, useMemo } from 'react';
import AuthLink from '@/components/auth/AuthLink';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaClipboard } from 'react-icons/fa';
import type { CounselorAssessment, CreatedAssessmentBannerInfo } from '@/lib/assessmentApi';
import { deleteAssessment } from '@/lib/assessmentApi';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { getAssessmentOrgLabel } from '@/lib/assessmentSortOptions';

type ListSortKey = 'createdAt' | 'accessCode' | 'orgName' | 'title';
type SortDirection = 'asc' | 'desc';

function parseCreatedAt(iso?: string): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
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
    <th scope="col" className={`px-2 py-2 text-left text-xs font-medium text-slate-400 ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 hover:text-slate-200 transition-colors"
      >
        <span>{label}</span>
        <span className={`text-[10px] ${active ? 'text-sky-400' : 'text-slate-600'}`} aria-hidden="true">
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
  const [deleteTarget, setDeleteTarget] = useState<CounselorAssessment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<ListSortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

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
    'cursor-pointer text-left hover:text-sky-200 hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500/60 rounded-sm';

  const totalParticipants = assessments.reduce((sum, a) => {
    const { testComplete, testIncomplete } = resultStatusCounts(a);
    return sum + testComplete + testIncomplete;
  }, 0);
  const totalCompleted = assessments.reduce(
    (sum, a) => sum + resultStatusCounts(a).testComplete,
    0,
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return assessments;
    return assessments.filter(
      (a) =>
        (a.title || '').toLowerCase().includes(q) ||
        (a.accessCode || '').toLowerCase().includes(q) ||
        (a.targetAudience || '').toLowerCase().includes(q) ||
        getAssessmentOrgLabel(a).toLowerCase().includes(q),
    );
  }, [assessments, searchQuery]);

  const sortedFiltered = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => compareAssessments(a, b, sortKey, sortDir));
    return list;
  }, [filtered, sortKey, sortDir]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError('');
    setDeleteLoading(true);
    try {
      await deleteAssessment(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : '삭제에 실패했습니다.');
    } finally { setDeleteLoading(false); }
  };

  return (
    <motion.div
      className="flex min-h-0 flex-1 flex-col bg-white/[0.06] backdrop-blur-sm rounded-lg border border-white/10 p-3 sm:p-4 text-sm"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* 삭제 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-xl max-w-md w-full p-6 shadow-2xl text-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white">검사코드 삭제</h2>
            </div>
            <div className="bg-white/[0.06] rounded-xl p-4 mb-4 border border-white/10">
              <p className="text-cyan-400 font-mono font-bold tracking-wider">{formatAccessCodeDisplay(deleteTarget.accessCode)}</p>
              <p className="text-slate-300 mt-1">{deleteTarget.title}</p>
            </div>
            <p className="text-slate-400 mb-5 leading-relaxed">
              목록에서 제거되며, 내담자는 더 이상 이 코드로 새로 접속할 수 없습니다. 이미 제출된 결과는 상담사 화면에서 계속 조회할 수 있습니다.
            </p>
            {deleteError && <p className="text-red-400 mb-4">{deleteError}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setDeleteTarget(null); setDeleteError(''); }}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-lg text-slate-300 bg-slate-800 border border-white/10 hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >취소</button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 font-medium transition-colors"
              >{deleteLoading ? '처리 중…' : '삭제 확인'}</button>
            </div>
          </div>
        </div>
      )}

      {createdInfo && (
        <div className="mb-2 shrink-0 rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-3 py-2">
          <p className="text-emerald-200 font-medium">검사코드가 발급되었습니다</p>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <p>
              <span className="text-emerald-400/80">코드 </span>
              <span className="text-emerald-300 font-mono font-bold tracking-widest">
                {formatAccessCodeDisplay(createdInfo.accessCode)}
              </span>
            </p>
          </div>
          <p className="mt-2 text-sm text-emerald-400/80">
            내담자에게 나의코드·비밀번호를 전달하세요.{' '}
            <AuthLink href="/portal/login" className="text-emerald-300 underline hover:text-emerald-200">
              검사시작
            </AuthLink>
            에서 로그인하면 검사를 진행할 수 있습니다.
          </p>
        </div>
      )}

      {/* 툴바 — 마이페이지 검사 기록 탭과 동일 패턴 */}
      <div className="mb-2 flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <h2 className="text-lg font-semibold text-slate-100 sm:w-auto">
          검사코드 목록{' '}
          <span className="font-normal text-slate-500">({filtered.length})</span>
        </h2>
        <div className="relative min-w-0 flex-1">
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
            className="w-full rounded-md border border-white/10 bg-white/[0.06] py-1.5 pl-8 pr-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500/60"
          />
        </div>
        <AuthLink
          href="/counselor/assessments/new"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-sky-600/90 px-2.5 py-1.5 text-sm font-medium text-white hover:bg-sky-500 transition-colors sm:self-auto"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          새 검사코드 만들기
        </AuthLink>
      </div>

      <p className="mb-2 text-xs text-slate-400 sm:text-sm">
        전체 <span className="font-semibold text-white">{assessments.length}</span>개 · 응시자{' '}
        <span className="font-semibold text-cyan-300">{totalParticipants}</span>명 · 완료{' '}
        <span className="font-semibold text-emerald-300">{totalCompleted}</span>명
      </p>

      {filtered.length === 0 ? (
        <div className="flex min-h-[12rem] flex-1 flex-col items-center justify-center rounded-md border border-white/10 bg-white/[0.03] py-10 text-center">
          <FaClipboard className="mb-2 h-10 w-10 text-slate-600" />
          <p className="text-base text-slate-300">
            {assessments.length === 0 ? '등록된 검사코드가 없습니다' : '검색 결과가 없습니다'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {assessments.length === 0 ? '첫 검사코드를 만들어 내담자에게 배포하세요.' : '검색어를 바꿔 보세요.'}
          </p>
          {assessments.length === 0 && (
            <AuthLink
              href="/counselor/assessments/new"
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-sky-600/90 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              첫 검사코드 만들기
            </AuthLink>
          )}
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-auto rounded-md border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="sticky top-0 z-[1] bg-[#0f172a]/95 backdrop-blur-sm">
                <tr>
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
                  <th scope="col" className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-400">코드 사용 마감일</th>
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
                  <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-slate-400">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {sortedFiltered.map((a) => {
                  const { dispatchSent, testComplete, dispatchTotal } = resultStatusCounts(a);
                  const expired = isExpired(a.usageEndDate);
                  const orgLabel = getAssessmentOrgLabel(a);

                  return (
                    <tr key={a.id} className="group hover:bg-white/[0.04]">
                      <td className="whitespace-nowrap px-2 py-2 text-left text-sm text-slate-200">
                        <button
                          type="button"
                          onClick={() => goToProgress(a.id)}
                          className={`${cellLinkClass} text-slate-200`}
                        >
                          {formatDate(a.createdAt)}
                        </button>
                      </td>
                      <td className="max-w-[10rem] truncate px-2 py-2 text-left text-sm">
                        <button
                          type="button"
                          onClick={() => goToProgress(a.id)}
                          className={`${cellLinkClass} font-mono font-semibold text-sky-300 tracking-wide`}
                        >
                          {formatAccessCodeDisplay(a.accessCode)}
                        </button>
                      </td>
                      <td className="max-w-[12rem] truncate px-2 py-2 text-left text-sm text-slate-200">
                        <button
                          type="button"
                          onClick={() => goToProgress(a.id)}
                          className={`${cellLinkClass} text-slate-200 truncate max-w-full block`}
                          title={orgLabel}
                        >
                          {orgLabel}
                        </button>
                      </td>
                      <td className="max-w-[14rem] truncate px-2 py-2 text-left text-sm text-slate-200">
                        <button
                          type="button"
                          onClick={() => goToProgress(a.id)}
                          className={`${cellLinkClass} truncate max-w-full block`}
                          title={a.title || '-'}
                        >
                          <span className="font-medium text-white">{a.title || '-'}</span>
                          {expired ? (
                            <span className="ml-1 inline-block rounded-full border border-red-500/30 bg-red-500/15 px-1.5 py-0.5 align-middle text-[10px] font-medium text-red-300">
                              만료
                            </span>
                          ) : null}
                        </button>
                      </td>
                      <td className={`whitespace-nowrap px-2 py-2 text-left text-sm ${expired ? 'text-red-400' : 'text-slate-400'}`}>
                        {formatUsageEndDate(a.usageEndDate)}
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
                      <td className="whitespace-nowrap px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          <AuthLink
                            href={progressHref(a.id)}
                            className="rounded bg-sky-800/50 px-2 py-0.5 text-xs font-medium text-sky-100 hover:bg-sky-700/60 transition-colors"
                          >
                            진행현황
                          </AuthLink>
                          <AuthLink
                            href={`/counselor/assessments/edit?id=${encodeURIComponent(a.id)}`}
                            className="rounded bg-emerald-800/50 px-2 py-0.5 text-xs font-medium text-emerald-100 hover:bg-emerald-700/60 transition-colors"
                          >
                            수정
                          </AuthLink>
                          <button
                            type="button"
                            onClick={() => { setDeleteError(''); setDeleteTarget(a); }}
                            className="rounded bg-white/10 px-2 py-0.5 text-xs font-medium text-slate-300 hover:bg-white/15 transition-colors"
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
          <div className="mt-2 shrink-0 text-xs text-slate-500 sm:text-sm">총 {filtered.length}건</div>
        </>
      )}
    </motion.div>
  );
}
