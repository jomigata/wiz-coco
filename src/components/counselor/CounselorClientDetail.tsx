'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import AuthLink from '@/components/auth/AuthLink';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { formatPhoneDisplayOr } from '@/lib/phoneFormat';
import {
  fetchCounselorClientPortalDetail,
  resendDispatchCredentials,
  sendDispatchTestReminders,
} from '@/lib/clientPortalApi';
import { counselorClientDetailHref } from '@/lib/counselorClientRoutes';
import { getCounselorResult } from '@/lib/assessmentApi';
import { printAssessmentReport, buildDefaultResultSections } from '@/lib/assessmentReportPrint';
import AssessmentAiInterpretButton from '@/components/counselor/AssessmentAiInterpretButton';
import AssessmentComprehensiveReportButton from '@/components/counselor/AssessmentComprehensiveReportButton';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { useRedirectOnLoginRequiredError } from '@/hooks/useRequireLoginRedirect';
import type { CounselorClientPortalDetailResult } from '@/types/clientPortal';
import CounselorPushAssessmentPanel from '@/components/counselor/CounselorPushAssessmentPanel';

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
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

function notifyStatusLabel(status: string): { text: string; className: string } {
  switch (status) {
    case 'sent':
      return { text: '발송 완료', className: 'text-emerald-300' };
    case 'pending':
      return { text: '발송 대기', className: 'text-amber-300' };
    case 'failed':
      return { text: '발송 실패', className: 'text-red-400' };
    case 'skipped':
      return { text: '발송 생략', className: 'text-slate-400' };
    default:
      return { text: '미발송', className: 'text-slate-500' };
  }
}

function testStatusBadge(status: string): string {
  if (status === 'completed') return 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30';
  if (status === 'in_progress') return 'bg-sky-500/20 text-sky-200 border-sky-500/30';
  return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
}

function testStatusText(status: string): string {
  if (status === 'completed') return '완료';
  if (status === 'in_progress') return '진행 중';
  return '미시작';
}

type Props = {
  portalId: string;
};

export default function CounselorClientDetail({ portalId }: Props) {
  const { authPending, showLoginRequired } = useAuthResolved();
  const [detail, setDetail] = useState<CounselorClientPortalDetailResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchCounselorClientPortalDetail(portalId);
      setDetail(data);
    } catch (err) {
      setDetail(null);
      setError(err instanceof Error ? err.message : '상세 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [portalId]);

  useEffect(() => {
    if (authPending || showLoginRequired) {
      setLoading(false);
      return;
    }
    void load();
  }, [authPending, showLoginRequired, load]);

  useRedirectOnLoginRequiredError(error);

  const handleResend = async (assessmentId: string) => {
    setActionBusy(true);
    setActionMsg('');
    try {
      const r = await resendDispatchCredentials(assessmentId, [portalId]);
      setActionMsg(`자격증명 재발송: 성공 ${r.sent}건, 실패 ${r.failed}건, 생략 ${r.skipped}건`);
      await load();
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : '재발송에 실패했습니다.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleRemind = async (assessmentId: string) => {
    setActionBusy(true);
    setActionMsg('');
    try {
      const r = await sendDispatchTestReminders(assessmentId, [portalId]);
      setActionMsg(`미완료 알림: 발송 ${r.sent}건, 생략 ${r.skipped}건`);
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : '알림 발송에 실패했습니다.');
    } finally {
      setActionBusy(false);
    }
  };

  const handlePrintResult = async (assessmentId: string, resultId: string, testName: string) => {
    try {
      const result = await getCounselorResult(assessmentId, resultId);
      printAssessmentReport({
        title: `${detail?.portal.displayName || '내담자'} — 검사 결과`,
        subtitle: testName,
        clientLabel: result.clientDisplayName || result.clientEmail || detail?.portal.displayName,
        testName: result.testId || testName,
        accessCode: formatAccessCodeDisplay(result.accessCode),
        status: result.status || 'completed',
        sections: buildDefaultResultSections({
          testType: result.testId || testName,
          email: result.clientEmail,
        }),
      });
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : '리포트 인쇄에 실패했습니다.');
    }
  };

  if (loading) {
    return <p className="py-16 text-center text-sm text-slate-500">내담자 정보를 불러오는 중…</p>;
  }

  if (error || !detail) {
    return (
      <div className="space-y-4 py-8">
        <AuthLink href="/counselor/clients" className="text-sm text-slate-400 hover:text-white">
          ← 내담자 목록
        </AuthLink>
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error || '내담자를 찾을 수 없습니다.'}
        </div>
      </div>
    );
  }

  const { portal, progress, assessments, recentResults, linkedPortals } = detail;
  const notify = notifyStatusLabel(portal.notifyStatus);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AuthLink href="/counselor/clients" className="text-sm text-slate-400 hover:text-white">
          ← 내담자 목록
        </AuthLink>
        <button
          type="button"
          onClick={() => void load()}
          disabled={actionBusy}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-50"
        >
          새로고침
        </button>
      </div>

      {actionMsg ? (
        <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm text-sky-100">
          {actionMsg}
        </div>
      ) : null}

      {portal.status === 'active' ? (
        <CounselorPushAssessmentPanel
          portalIds={[portalId]}
          assignedAssessmentIds={assessments.map((a) => a.assessmentId)}
          onSuccess={() => void load()}
        />
      ) : null}

      <section className="rounded-xl border border-white/10 bg-slate-950/60 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">{portal.displayName || '내담자'}</h2>
            <p className="mt-1 font-mono text-sm text-sky-300">
              나의코드 {formatAccessCodeDisplay(portal.accessCode)}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {portal.cohortName ? `그룹 · ${portal.cohortName}` : '개별 발급'}
              {portal.status === 'archived' ? (
                <span className="ml-2 text-amber-400">(보관됨)</span>
              ) : null}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            <div className="rounded-lg bg-white/5 px-4 py-3">
              <p className="text-xs text-slate-500">검사 진행</p>
              <p className="mt-1 text-lg font-semibold text-white">{progress.percent}%</p>
              <p className="text-[11px] text-slate-500">
                {progress.completedTests}/{progress.totalTests}
              </p>
            </div>
            <div className="rounded-lg bg-white/5 px-4 py-3">
              <p className="text-xs text-slate-500">검사코드</p>
              <p className="mt-1 text-lg font-semibold text-white">{assessments.length}</p>
            </div>
            <div className="rounded-lg bg-white/5 px-4 py-3">
              <p className="text-xs text-slate-500">자격증명</p>
              <p className={`mt-1 text-sm font-medium ${notify.className}`}>{notify.text}</p>
            </div>
            <div className="rounded-lg bg-white/5 px-4 py-3">
              <p className="text-xs text-slate-500">최근 접속</p>
              <p className="mt-1 text-xs text-slate-200">{formatDateTime(portal.lastLoginAt)}</p>
            </div>
          </div>
        </div>

        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-slate-500">이메일</dt>
            <dd className="text-slate-200">{portal.email || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">휴대폰</dt>
            <dd className="text-slate-200">{formatPhoneDisplayOr(portal.phone, '—')}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">등록일</dt>
            <dd className="text-slate-200">{formatDateTime(portal.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">발송 시각</dt>
            <dd className="text-slate-200">{formatDateTime(portal.notifyAt)}</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-white">할당된 검사코드</h3>
        {assessments.length === 0 ? (
          <p className="text-sm text-slate-500">할당된 검사가 없습니다.</p>
        ) : (
          assessments.map((assessment) => (
            <div
              key={assessment.assessmentId}
              className="rounded-xl border border-white/10 bg-slate-950/40 p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="font-medium text-white">{assessment.title}</h4>
                  <p className="mt-1 text-xs text-slate-500">
                    검사코드 {formatAccessCodeDisplay(assessment.joinAccessCode)}
                    {assessment.usageEndDate ? ` · 사용기한 ${assessment.usageEndDate}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    진행 {assessment.completedCount}/{assessment.requiredCount} ·{' '}
                    <span className={testStatusBadge(assessment.testStatus).split(' ')[1]}>
                      {testStatusText(assessment.testStatus)}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/counselor/assessments/progress?assessmentId=${encodeURIComponent(assessment.assessmentId)}`}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-sky-300 hover:bg-white/5"
                  >
                    전체 진행현황
                  </Link>
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => void handleResend(assessment.assessmentId)}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-50"
                  >
                    자격증명 재발송
                  </button>
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => void handleRemind(assessment.assessmentId)}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-50"
                  >
                    미완료 알림
                  </button>
                </div>
              </div>

              {assessment.welcomeMessage ? (
                <p className="mt-3 rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-slate-400">
                  {assessment.welcomeMessage}
                </p>
              ) : null}

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="pb-2 pr-4 font-medium">검사 항목</th>
                      <th className="pb-2 pr-4 font-medium">상태</th>
                      <th className="pb-2 pr-4 font-medium">완료 시각</th>
                      <th className="pb-2 font-medium">액션</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {assessment.tests.map((test) => (
                      <tr key={test.testId}>
                        <td className="py-2 pr-4 text-slate-200">{test.testName}</td>
                        <td className="py-2 pr-4">
                          <span
                            className={`inline-flex rounded border px-2 py-0.5 ${testStatusBadge(test.status)}`}
                          >
                            {testStatusText(test.status)}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-slate-500">
                          {formatDateTime(test.completedAt)}
                        </td>
                        <td className="py-2">
                          {test.resultId && test.status === 'completed' ? (
                            <div className="flex flex-wrap gap-2 items-center">
                              <button
                                type="button"
                                onClick={() =>
                                  void handlePrintResult(
                                    assessment.assessmentId,
                                    test.resultId!,
                                    test.testName,
                                  )
                                }
                                className="text-sky-400 hover:text-sky-300"
                              >
                                리포트 인쇄
                              </button>
                              <AssessmentAiInterpretButton
                                resultId={test.resultId}
                                testLabel={test.testName}
                                compact
                              />
                              <AssessmentComprehensiveReportButton
                                resultId={test.resultId}
                                testLabel={test.testName}
                                clientLabel={detail?.portal.displayName}
                                compact
                              />
                            </div>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </section>

      {recentResults.length > 0 ? (
        <section className="rounded-xl border border-white/10 bg-slate-950/40 p-4 sm:p-5">
          <h3 className="text-lg font-semibold text-white">최근 검사 결과</h3>
          <ul className="mt-3 divide-y divide-white/5 text-sm">
            {recentResults.slice(0, 10).map((r) => (
              <li key={r.resultId} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="text-slate-200">{r.testType || r.testId}</span>
                <span className="text-xs text-slate-500">{formatDateTime(r.completedAt || r.createdAt)}</span>
                <span className={`text-xs ${r.status === 'completed' ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {r.status === 'completed' ? '완료' : r.status || '진행'}
                </span>
              </li>
            ))}
          </ul>
          <Link href="/counselor/test-results" className="mt-3 inline-block text-xs text-sky-400 hover:text-sky-300">
            전체 검사 결과 분석 →
          </Link>
        </section>
      ) : null}

      {linkedPortals.length > 0 ? (
        <section className="rounded-xl border border-white/10 bg-slate-950/40 p-4 sm:p-5">
          <h3 className="text-lg font-semibold text-white">연결된 나의코드</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {linkedPortals.map((lp) => (
              <li key={lp.portalId}>
                <Link
                  href={counselorClientDetailHref(lp.portalId)}
                  className="text-sky-400 hover:text-sky-300"
                >
                  {lp.displayName || '내담자'} · {formatAccessCodeDisplay(lp.accessCode)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
