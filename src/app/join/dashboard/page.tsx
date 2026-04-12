'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import CompletedTestList from '@/components/join/CompletedTestList';
import { lookupPublicAssessment, PublicAssessment, TestResultItem } from '@/lib/assessmentApi';
import {
  isValidAccessCodeInput,
  normalizeAccessCodeInput,
  normalizeJoinPinDigits,
} from '@/lib/accessCodeFormat';
import { readJoinClientEmail, writeJoinClientEmail } from '@/lib/joinClientEmailStorage';

const JOIN_STORAGE_KEY = 'wizcoco_join_assessment';

function readJoinPinFromSession(accessCodeNorm: string): string {
  try {
    const raw = typeof window !== 'undefined' ? sessionStorage.getItem(JOIN_STORAGE_KEY) : null;
    if (!raw) return '';
    const p = JSON.parse(raw) as { accessCode?: unknown; joinPin?: unknown };
    if (normalizeAccessCodeInput(String(p.accessCode ?? '')) !== accessCodeNorm) return '';
    return normalizeJoinPinDigits(p.joinPin);
  } catch {
    return '';
  }
}

/** /join → 대시보드 이동 시 PIN 전달용 (#p=1234). HTTP 요청 URL에 포함되지 않음. */
function peekJoinPinFromHash(): string {
  if (typeof window === 'undefined') return '';
  const h = window.location.hash;
  if (!h.startsWith('#p=')) return '';
  return normalizeJoinPinDigits(decodeURIComponent(h.slice(3)));
}

function clearJoinPinHashFromUrl(): void {
  if (typeof window === 'undefined') return;
  if (!window.location.hash.startsWith('#p=')) return;
  try {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  } catch {
    // ignore
  }
}

function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navigation />
      </div>
      <div className="pt-24 flex justify-center">
        <p className="text-slate-400">불러오는 중…</p>
      </div>
    </div>
  );
}

function JoinDashboardContent() {
  const searchParams = useSearchParams();
  const accessCodeRaw = searchParams.get('accessCode') ?? '';

  const code = useMemo(
    () => normalizeAccessCodeInput((accessCodeRaw || '').trim()),
    [accessCodeRaw]
  );

  const [assessment, setAssessment] = useState<PublicAssessment | null>(null);
  const [clientEmail, setClientEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [joinResults, setJoinResults] = useState<TestResultItem[]>([]);

  const loadAssessment = useCallback(() => {
    if (!isValidAccessCodeInput(code)) {
      setError('잘못된 검사 코드입니다.');
      setAssessment(null);
      setLoading(false);
      return;
    }
    let joinPin = readJoinPinFromSession(code);
    if (!joinPin) {
      joinPin = peekJoinPinFromHash();
    }
    setLoading(true);
    setError('');
    lookupPublicAssessment(code, joinPin)
      .then((data) => {
        clearJoinPinHashFromUrl();
        setAssessment(data);
        try {
          sessionStorage.setItem(
            JOIN_STORAGE_KEY,
            JSON.stringify({
              accessCode: code,
              joinPin,
              assessmentId: data.assessmentId,
              title: data.title,
              welcomeMessage: data.welcomeMessage,
              testList: data.testList,
            })
          );
        } catch {
          // ignore
        }
      })
      .catch((err) => {
        setAssessment(null);
        setError(err instanceof Error ? err.message : '불러오기 실패');
      })
      .finally(() => setLoading(false));
  }, [code]);

  useEffect(() => {
    loadAssessment();
  }, [loadAssessment]);

  useEffect(() => {
    const v = readJoinClientEmail();
    if (v) {
      setEmailInput(v);
      setClientEmail(v);
    }
  }, []);

  useEffect(() => {
    if (!clientEmail.trim().toLowerCase().includes('@')) setJoinResults([]);
  }, [clientEmail]);

  const latestCompletedByTestId = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of joinResults) {
      const tid = String(r.testId);
      if (!r.completedAt) continue;
      const prev = m.get(tid);
      const t = new Date(r.completedAt).getTime();
      if (!prev || t > new Date(prev).getTime()) m.set(tid, r.completedAt);
    }
    return m;
  }, [joinResults]);

  const sortedTestList = useMemo(() => {
    if (!assessment?.testList.length) return [];
    const withIdx = assessment.testList.map((t, i) => {
      const tid = String(t.testId);
      const isDone = joinResults.some((r) => String(r.testId) === tid);
      return {
        ...t,
        _idx: i,
        latestAt: latestCompletedByTestId.get(tid) ?? null,
        isDone,
      };
    });
    withIdx.sort((a, b) => {
      if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
      if (!a.isDone) return a._idx - b._idx;
      const ta = a.latestAt ? new Date(a.latestAt).getTime() : 0;
      const tb = b.latestAt ? new Date(b.latestAt).getTime() : 0;
      return tb - ta;
    });
    return withIdx;
  }, [assessment, latestCompletedByTestId, joinResults]);

  const handleSetEmail = () => {
    const trimmed = (emailInput || '').trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) return;
    setClientEmail(trimmed);
    writeJoinClientEmail(trimmed);
  };

  /** 검사 링크 클릭 직전에 저장(적용·blur 없이 입력만 한 경우 대비) */
  const persistEmailBeforeTestNavigation = useCallback(() => {
    const trimmed = (emailInput || '').trim().toLowerCase();
    if (!trimmed.includes('@')) return;
    setClientEmail(trimmed);
    writeJoinClientEmail(trimmed);
  }, [emailInput]);

  if (loading) {
    return <DashboardLoading />;
  }

  if (error || !assessment) {
    const pinHint =
      error.includes('비밀번호') || error.includes('4자리')
        ? ' 같은 브라우저에서 검사 코드·비밀번호를 입력한 뒤 이동했는지 확인하거나, 아래 링크에서 다시 입력해 주세요.'
        : '';
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="fixed top-0 left-0 right-0 z-50">
          <Navigation />
        </div>
        <div className="pt-24 px-4">
          <div className="max-w-lg mx-auto text-center">
            <p className="text-red-400 mb-4">
              {error || '검사코드 정보를 불러올 수 없습니다.'}
              {pinHint && <span className="text-slate-400 text-sm block mt-2">{pinHint}</span>}
            </p>
            <Link href="/join" className="text-blue-400 hover:text-blue-300">
              검사 코드 다시 입력
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navigation />
      </div>
      <div className="pt-24 pb-12 px-4">
        <main className="max-w-2xl mx-auto space-y-6">
          <div className="bg-slate-800/80 rounded-2xl border border-slate-600 p-6 shadow-xl">
            <h1 className="text-xl font-bold text-white mb-2">{assessment.title}</h1>
            {assessment.welcomeMessage && (
              <p className="text-slate-300 whitespace-pre-wrap mb-6">{assessment.welcomeMessage}</p>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">내 이메일</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="example@email.com"
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onBlur={handleSetEmail}
                />
                <button
                  type="button"
                  onClick={handleSetEmail}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  적용
                </button>
              </div>
              <p className="text-slate-500 text-xs mt-1">검사 제출 및 완료 목록에 사용됩니다.</p>
            </div>

            <h2 className="text-lg font-semibold text-white mb-3">수행할 검사</h2>
            {!clientEmail.trim().toLowerCase().includes('@') ? (
              <p className="text-amber-200/90 text-sm mb-2">
                위에서 「내 이메일」을 입력·적용하면 완료 여부가 표시됩니다.
              </p>
            ) : null}
            {assessment.testList.length === 0 ? (
              <p className="text-slate-400 text-sm">등록된 검사가 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {sortedTestList.map((t) => {
                  const done = t.isDone;
                  const dateLabel =
                    t.latestAt != null
                      ? new Date(t.latestAt).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : null;
                  return (
                    <li key={t.testId}>
                      <Link
                        href={`/join/test?accessCode=${encodeURIComponent(code)}&testId=${encodeURIComponent(t.testId)}`}
                        onClick={persistEmailBeforeTestNavigation}
                        className="block py-3 px-4 rounded-lg bg-slate-700/80 border border-slate-600 text-white hover:bg-slate-700 hover:border-slate-500 transition-colors"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium">{t.name || t.testId}</span>
                          <span className="text-slate-400 text-sm">시작하기 →</span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          {done ? (
                            <>
                              <span className="rounded bg-emerald-900/60 text-emerald-300 px-2 py-0.5 border border-emerald-700/50">
                                검사 실시 완료
                              </span>
                              {dateLabel ? (
                                <span className="text-slate-400">최근 제출: {dateLabel}</span>
                              ) : null}
                            </>
                          ) : (
                            <span className="rounded bg-amber-900/50 text-amber-200 px-2 py-0.5 border border-amber-700/40">
                              미완료 · 제출 전
                            </span>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <CompletedTestList
            clientEmail={clientEmail}
            onRefresh={loadAssessment}
            onResultsChange={setJoinResults}
          />
        </main>

        <p className="text-center mt-6">
          <Link href="/join" className="text-blue-400 hover:text-blue-300 text-sm">
            다른 검사 코드 입력
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ClientDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <JoinDashboardContent />
    </Suspense>
  );
}
