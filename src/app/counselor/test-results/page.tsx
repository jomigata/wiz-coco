'use client';

import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { counselorClientDetailHref } from '@/lib/counselorClientRoutes';
import {
  buildDefaultResultSections,
  printAssessmentReport,
} from '@/lib/assessmentReportPrint';
import AssessmentAiInterpretButton from '@/components/counselor/AssessmentAiInterpretButton';
import AssessmentComprehensiveReportButton from '@/components/counselor/AssessmentComprehensiveReportButton';
import CounselorListPagination from '@/components/counselor/CounselorListPagination';
import {
  counselorListNoThClass,
  counselorListTableWrapperClass,
  counselorListTdClass,
  counselorListThClass,
  counselorListTheadClass,
} from '@/lib/counselorListTableStyles';
import {
  readCachedTestResults,
  writeCachedTestResults,
} from '@/lib/counselorSessionCache';
import { useListPagination } from '@/hooks/useListPagination';
import { useCounselorListPageSize } from '@/hooks/useCounselorListPageSize';

type CounselorResultRow = {
  id: string;
  uid?: string;
  email?: string | null;
  testType?: string;
  code?: string;
  status?: string;
  createdAt?: any;
  counselorCode?: string;
  portalId?: string;
};

function formatCreatedAt(v: any): string {
  const d =
    v?.toDate?.() instanceof Date
      ? v.toDate()
      : v?.seconds
        ? new Date(Number(v.seconds) * 1000)
        : typeof v === 'string'
          ? new Date(v)
          : null;
  if (!d || Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function TestResultsPage() {
  const { user, loading } = useFirebaseAuth();
  const searchParams = useSearchParams();
  const filterPortalId = (searchParams.get('portalId') || '').trim();
  const [rows, setRows] = useState<CounselorResultRow[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [queryText, setQueryText] = useState('');
  const { pageSize, setPageSize } = useCounselorListPageSize();

  useEffect(() => {
    const run = async () => {
      if (loading) return;
      if (!user?.uid) {
        setIsLoading(false);
        return;
      }

      const cached = readCachedTestResults<CounselorResultRow>(user.uid);
      if (cached?.length) {
        setRows(cached);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }
      setError('');
      try {
        const { queryDocuments } = await import('@/utils/firebaseFirestore');
        const docs = await queryDocuments(
          'testResults',
          [{ field: 'counselorId', operator: '==', value: user.uid }],
          'createdAt',
          'desc',
          200
        );
        const nextRows = (docs || []).map((d: any) => ({ id: d.id, ...d }));
        writeCachedTestResults(user.uid, nextRows);
        setRows(nextRows);
      } catch (e: any) {
        console.error('[CounselorTestResults] load failed', e);
        if (!cached?.length) {
          setError('검사 결과를 불러오지 못했습니다. 권한/규칙을 확인해 주세요.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    void run();
  }, [user?.uid, loading]);

  const filtered = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    let list = rows;
    if (filterPortalId) {
      list = list.filter((r) => (r.portalId || '') === filterPortalId);
    }
    if (!q) return list;
    return list.filter((r) => {
      const hay = [
        r.email || '',
        r.uid || '',
        r.testType || '',
        r.code || '',
        r.counselorCode || '',
        r.status || '',
        r.portalId || '',
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, queryText, filterPortalId]);

  const {
    page,
    setPage,
    totalPages,
    totalCount,
    startIndex,
    paginatedItems,
    currentCount,
  } = useListPagination(filtered, pageSize);

  return (
    <CounselorPageSection
      showHierarchyBreadcrumb
      className="flex min-h-0 flex-1"
      bodyClassName="flex min-h-0 flex-1 flex-col !p-0"
      noBodyPadding
      description={
        filterPortalId ? (
          <>
            선택 내담자 결과만 표시 중 ·{' '}
            <Link href="/counselor/test-results" className="text-sky-400 hover:text-sky-300">
              전체 결과 보기
            </Link>
          </>
        ) : (
          <>내담자 검사 결과를 조회하고 리포트·AI 해석을 실행합니다.</>
        )
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
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="이메일 · 검사명 · 코드 검색"
              className="w-full rounded-md border border-white/10 bg-[#101f38]/90 py-1.5 pl-8 pr-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500/60"
            />
          </div>
          <span className="text-sm text-slate-400">
            필터 결과 <span className="font-semibold text-white">{filtered.length}</span>건
          </span>
          {filterPortalId ? (
            <Link
              href={counselorClientDetailHref(filterPortalId)}
              className="rounded-md border border-white/15 px-2.5 py-1.5 text-xs text-sky-300 hover:bg-white/5"
            >
              내담자 상세
            </Link>
          ) : null}
        </>
      }
    >
      <div className="space-y-4 p-2.5 sm:p-3">
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-white/70 text-sm">불러오는 중…</div>
        ) : filtered.length === 0 ? (
          <div className="text-white/70 text-sm">표시할 결과가 없습니다.</div>
        ) : (
          <>
            <div className={counselorListTableWrapperClass}>
              <table className="w-max min-w-full table-fixed text-sm text-white/90">
                <thead className={counselorListTheadClass}>
                  <tr>
                    <th className={counselorListNoThClass}>No.</th>
                    <th className={counselorListThClass}>일시</th>
                    <th className={counselorListThClass}>내담자</th>
                    <th className={counselorListThClass}>검사</th>
                    <th className={counselorListThClass}>상태</th>
                    <th className={counselorListThClass}>코드</th>
                    <th className={counselorListThClass}>리포트</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {paginatedItems.map((r, idx) => (
                    <tr key={r.id} className="hover:bg-white/[0.03]">
                      <td className={`${counselorListTdClass} text-slate-500 tabular-nums`}>
                        {startIndex + idx + 1}
                      </td>
                      <td className={`whitespace-nowrap ${counselorListTdClass}`}>{formatCreatedAt(r.createdAt)}</td>
                      <td className={counselorListTdClass}>
                      {r.portalId ? (
                        <Link
                          href={counselorClientDetailHref(r.portalId)}
                          className="text-sky-300 hover:text-sky-200"
                        >
                          {r.email || '내담자 상세'}
                        </Link>
                      ) : (
                        <div className="text-white">{r.email || '—'}</div>
                      )}
                      <div className="text-xs text-white/50">{r.uid || '—'}</div>
                    </td>
                    <td className={counselorListTdClass}>{r.testType || '—'}</td>
                    <td className={counselorListTdClass}>{r.status || 'completed'}</td>
                    <td className={counselorListTdClass}>
                      <div className="font-mono text-xs text-white/70">{formatAccessCodeDisplay(r.code || '') || '—'}</div>
                      {r.counselorCode && <div className="font-mono text-xs text-white/40">연결: {formatAccessCodeDisplay(r.counselorCode)}</div>}
                    </td>
                    <td className={counselorListTdClass}>
                      <div className="flex flex-wrap gap-2 items-center">
                        <button
                          type="button"
                          className="text-xs px-2 py-1 rounded border border-blue-400/40 text-blue-200 hover:bg-blue-950/40"
                          onClick={() =>
                            printAssessmentReport({
                              title: '심리검사 결과 리포트',
                              subtitle: r.testType || '검사 결과',
                              clientLabel: r.email || r.uid || '내담자',
                              testName: r.testType,
                              accessCode: formatAccessCodeDisplay(r.code || ''),
                              status: r.status || 'completed',
                              sections: buildDefaultResultSections(r),
                            })
                          }
                        >
                          PDF / 인쇄
                        </button>
                        {r.status === 'completed' || !r.status ? (
                          <>
                            <AssessmentAiInterpretButton
                              resultId={r.id}
                              testLabel={r.testType}
                              clientLabel={r.email || r.uid || undefined}
                              compact
                            />
                            <AssessmentComprehensiveReportButton
                              resultId={r.id}
                              testLabel={r.testType}
                              clientLabel={r.email || r.uid || undefined}
                              accessCode={formatAccessCodeDisplay(r.code || '')}
                              compact
                            />
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
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
          />
          </>
        )}
      </div>
    </CounselorPageSection>
  );
}
