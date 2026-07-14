'use client';

import AdminPageLayout from '@/components/AdminPageLayout';
import RoleGuard from '@/components/RoleGuard';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { counselorAssessmentTestOptions } from '@/data/counselorAssessmentTests';
import {
  fetchTestRecommendationCache,
  recommendTestsFromResult,
  testRecommendationCreditCost,
} from '@/lib/aiRecommendApi';
import { createCareAssignments } from '@/lib/careAssignmentApi';
import { counselorClientDetailHref } from '@/lib/counselorClientRoutes';
import type { TestRecommendationItem } from '@/types/aiRecommendation';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';

type CounselorResultRow = {
  id: string;
  uid?: string;
  email?: string | null;
  testType?: string;
  code?: string;
  status?: string;
  portalId?: string;
  createdAt?: unknown;
};

function formatCreatedAt(v: unknown): string {
  const d =
    v && typeof v === 'object' && 'toDate' in v && typeof (v as { toDate: () => Date }).toDate === 'function'
      ? (v as { toDate: () => Date }).toDate()
      : v && typeof v === 'object' && 'seconds' in v
        ? new Date(Number((v as { seconds: number }).seconds) * 1000)
        : typeof v === 'string'
          ? new Date(v)
          : null;
  if (!d || Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function priorityBadge(p: TestRecommendationItem['priority']) {
  if (p === 'high') return 'border-rose-400/40 text-rose-200 bg-rose-950/30';
  if (p === 'low') return 'border-slate-500/40 text-slate-300 bg-slate-900/40';
  return 'border-amber-400/40 text-amber-200 bg-amber-950/20';
}

function TestRecommendationsContent() {
  const { user, loading } = useFirebaseAuth();
  const [rows, setRows] = useState<CounselorResultRow[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [queryText, setQueryText] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [recoLoading, setRecoLoading] = useState(false);
  const [recoError, setRecoError] = useState('');
  const [summary, setSummary] = useState('');
  const [recommendations, setRecommendations] = useState<TestRecommendationItem[]>([]);
  const [portalId, setPortalId] = useState<string | null>(null);
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [assignBusy, setAssignBusy] = useState(false);
  const [assignMsg, setAssignMsg] = useState('');
  const creditCost = testRecommendationCreditCost();

  useEffect(() => {
    const run = async () => {
      if (loading) return;
      if (!user?.uid) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError('');
      try {
        const { queryDocuments } = await import('@/utils/firebaseFirestore');
        const docs = await queryDocuments(
          'testResults',
          [{ field: 'counselorId', operator: '==', value: user.uid }],
          'createdAt',
          'desc',
          100,
        );
        const completed = (docs || []).filter(
          (d: Record<string, unknown>) => (d.status as string || 'completed') === 'completed',
        );
        setRows(
          completed.map((d: Record<string, unknown>) => ({
            id: String(d.id || ''),
            uid: d.uid as string | undefined,
            email: d.email as string | null | undefined,
            testType: d.testType as string | undefined,
            code: d.code as string | undefined,
            status: d.status as string | undefined,
            portalId: d.portalId as string | undefined,
            createdAt: d.createdAt,
          })),
        );
      } catch (e) {
        console.error('[TestRecommendations] load failed', e);
        setError('검사 결과를 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    void run();
  }, [user?.uid, loading]);

  const filtered = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = [r.email || '', r.uid || '', r.testType || '', r.code || '', r.status || '']
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, queryText]);

  const selectedRow = filtered.find((r) => r.id === selectedId) || rows.find((r) => r.id === selectedId);

  const resetReco = useCallback(() => {
    setSummary('');
    setRecommendations([]);
    setPortalId(null);
    setSelectedTests(new Set());
    setRecoError('');
    setAssignMsg('');
  }, []);

  const loadRecommendations = useCallback(
    async (resultId: string, force?: boolean) => {
      setRecoLoading(true);
      setRecoError('');
      setAssignMsg('');
      try {
        if (!force) {
          const cached = await fetchTestRecommendationCache(resultId);
          if (cached) {
            setSummary(cached.summary);
            setRecommendations(cached.recommendations);
            setPortalId(cached.portalId);
            setSelectedTests(new Set(cached.recommendations.map((r) => r.testId)));
            return;
          }
        }
        const res = await recommendTestsFromResult(
          resultId,
          counselorAssessmentTestOptions.map((t) => ({ testId: t.testId, name: t.name })),
          { forceRegenerate: force },
        );
        setSummary(res.summary);
        setRecommendations(res.recommendations);
        setPortalId(res.portalId);
        setSelectedTests(new Set(res.recommendations.map((r) => r.testId)));
      } catch (err) {
        setRecoError(err instanceof Error ? err.message : 'AI 추천 실패');
      } finally {
        setRecoLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!selectedId) {
      resetReco();
      return;
    }
    void loadRecommendations(selectedId);
  }, [selectedId, loadRecommendations, resetReco]);

  const toggleTest = (testId: string) => {
    setSelectedTests((prev) => {
      const next = new Set(prev);
      if (next.has(testId)) next.delete(testId);
      else next.add(testId);
      return next;
    });
  };

  const handleAssign = async () => {
    if (!portalId) {
      setAssignMsg('포털 연결 내담자만 자동 할당할 수 있습니다. 치료 계획에서 수동 할당해 주세요.');
      return;
    }
    const picked = recommendations.filter((r) => selectedTests.has(r.testId));
    if (!picked.length) {
      setAssignMsg('할당할 검사를 선택해 주세요.');
      return;
    }
    setAssignBusy(true);
    setAssignMsg('');
    try {
      const result = await createCareAssignments({
        portalIds: [portalId],
        type: 'additional_assessment',
        title: 'AI 추천 추가 검사',
        description: summary,
        instructions: picked.map((p) => `• ${p.name}: ${p.rationale}`).join('\n'),
        testList: picked.map((p) => ({ testId: p.testId, name: p.name })),
        source: 'ai_recommendation',
        sourceRefId: selectedId,
        notify: true,
        priority: 'medium',
      });
      setAssignMsg(`${result.assigned ?? 1}건 포털에 할당했습니다.`);
    } catch (err) {
      setAssignMsg(err instanceof Error ? err.message : '할당 실패');
    } finally {
      setAssignBusy(false);
    }
  };

  if (loading) {
    return <AuthLoadingState message="불러오는 중…" />;
  }

  if (!user) {
    return <AuthRequiredState description="로그인 후 이용할 수 있습니다." />;
  }

  return (
    <AdminPageLayout title="검사 추천">
      <div className="space-y-6">
        <p className="text-slate-400 text-sm">
          완료된 검사 결과를 바탕으로 AI가 추가 검사를 추천합니다. 추천 1회 = {creditCost} AI 크레딧.
          포털 연결 내담자는 추천 검사를 바로 할당할 수 있습니다.
        </p>

        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <input
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="이메일/검사명/코드 검색"
            className="w-full max-w-md px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white placeholder-white/40"
          />
          <span className="text-sm text-white/70">
            완료 결과 <span className="text-white font-semibold">{filtered.length}</span>건
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="overflow-x-auto rounded-lg border border-white/10">
            {isLoading ? (
              <p className="p-4 text-sm text-white/60">불러오는 중…</p>
            ) : (
              <table className="min-w-full text-sm text-white/90">
                <thead className="bg-white/5 text-white/70">
                  <tr>
                    <th className="px-3 py-2 text-left">일시</th>
                    <th className="px-3 py-2 text-left">검사</th>
                    <th className="px-3 py-2 text-left">내담자</th>
                    <th className="px-3 py-2 text-left" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className={`border-t border-white/10 cursor-pointer ${
                        selectedId === r.id ? 'bg-violet-950/40' : 'hover:bg-white/5'
                      }`}
                      onClick={() => setSelectedId(r.id)}
                    >
                      <td className="px-3 py-2 whitespace-nowrap">{formatCreatedAt(r.createdAt)}</td>
                      <td className="px-3 py-2">{r.testType || '—'}</td>
                      <td className="px-3 py-2 text-xs text-white/60">{r.email || r.uid || '—'}</td>
                      <td className="px-3 py-2 text-xs font-mono text-white/50">
                        {formatAccessCodeDisplay(r.code || '') || '—'}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-white/50">
                        완료된 검사 결과가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="rounded-xl border border-violet-500/20 bg-slate-950/50 p-5 min-h-[320px]">
            {!selectedId ? (
              <p className="text-sm text-slate-500 py-12 text-center">왼쪽에서 검사 결과를 선택하세요.</p>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {selectedRow?.testType || '검사'} 추천
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedRow?.email || selectedRow?.uid || '내담자'}
                      {portalId ? (
                        <>
                          {' · '}
                          <Link
                            href={counselorClientDetailHref(portalId)}
                            className="text-violet-300 hover:text-violet-200"
                          >
                            포털 연결됨
                          </Link>
                        </>
                      ) : (
                        ' · 포털 미연결'
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={recoLoading}
                    onClick={() => void loadRecommendations(selectedId, true)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-white/20 text-slate-300 hover:bg-white/5 disabled:opacity-50"
                  >
                    재추천 ({creditCost} 크레딧)
                  </button>
                </div>

                {recoLoading && !recommendations.length ? (
                  <p className="text-slate-400 text-sm py-8 text-center">AI가 맞춤 검사를 분석하는 중…</p>
                ) : recoError ? (
                  <p className="text-red-300 text-sm">{recoError}</p>
                ) : (
                  <>
                    {summary && (
                      <p className="text-sm text-slate-300 mb-4 leading-relaxed">{summary}</p>
                    )}
                    <ul className="space-y-3">
                      {recommendations.map((item) => (
                        <li
                          key={item.testId}
                          className="rounded-lg border border-white/10 bg-white/5 px-4 py-3"
                        >
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedTests.has(item.testId)}
                              onChange={() => toggleTest(item.testId)}
                              className="mt-1"
                            />
                            <span className="flex-1">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="font-medium text-white">{item.name}</span>
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded border ${priorityBadge(item.priority)}`}
                                >
                                  {item.priority}
                                </span>
                              </span>
                              <span className="block text-xs text-slate-500 mt-1 font-mono">{item.testId}</span>
                              <span className="block text-sm text-slate-400 mt-2">{item.rationale}</span>
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>

                    {recommendations.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-4">
                        <button
                          type="button"
                          disabled={assignBusy || !portalId}
                          onClick={() => void handleAssign()}
                          className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-40"
                        >
                          {assignBusy ? '할당 중…' : '선택 검사 포털에 할당'}
                        </button>
                        <Link
                          href="/counselor/treatment-plans"
                          className="px-4 py-2 rounded-lg border border-white/20 text-slate-300 text-sm hover:bg-white/5"
                        >
                          치료 계획에서 할당
                        </Link>
                        <Link
                          href="/counselor/credits"
                          className="px-4 py-2 rounded-lg text-violet-300 text-sm hover:text-violet-200"
                        >
                          AI 크레딧
                        </Link>
                      </div>
                    )}
                    {assignMsg && <p className="mt-3 text-sm text-slate-400">{assignMsg}</p>}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
}

export default function TestRecommendationsPage() {
  return (
    <RoleGuard allowedRoles={['counselor', 'admin']}>
      <TestRecommendationsContent />
    </RoleGuard>
  );
}
