'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchPortalDashboard, linkSharedAssessment } from '@/lib/clientPortalApi';
import { listResults, TestResultItem } from '@/lib/assessmentApi';
import {
  formatAccessCodeDisplay,
  formatJoinAccessCodeWhileTyping,
  isValidAccessCodeInput,
  normalizeAccessCodeInput,
} from '@/lib/accessCodeFormat';
import {
  clearClientPortalSession,
  readClientPortalSession,
} from '@/lib/clientPortalSession';
import { persistJoinAssessmentSession, getJoinDashboardPath } from '@/lib/joinAssessmentSession';
import { setPortalReturnPath } from '@/lib/portalReturnPath';

type PortalAssessment = {
  assessmentId: string;
  title: string;
  welcomeMessage: string;
  usageEndDate?: string;
  testList: { testId: string; name: string }[];
  accessCode: string;
  issueType?: string;
  isLinkedShared?: boolean;
};

function PortalLoading() {
  return (
    <div className="min-h-screen bg-gray-900 pt-24 flex justify-center">
      <p className="text-slate-400">내 검사실을 불러오는 중…</p>
    </div>
  );
}

function ClientPortalContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [myCode, setMyCode] = useState('');
  const [assessments, setAssessments] = useState<PortalAssessment[]>([]);
  const [resultsByCode, setResultsByCode] = useState<Record<string, TestResultItem[]>>({});

  const [linkInput, setLinkInput] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkMessage, setLinkMessage] = useState('');
  const [linkError, setLinkError] = useState('');

  const loadResults = useCallback(async (items: PortalAssessment[]) => {
    const session = readClientPortalSession();
    if (!session?.portalToken) return;
    const map: Record<string, TestResultItem[]> = {};
    await Promise.all(
      items.map(async (a) => {
        const code = normalizeAccessCodeInput(a.accessCode);
        if (!code) return;
        try {
          const data = await listResults(code);
          map[code] = data.results || [];
        } catch {
          map[code] = [];
        }
      })
    );
    setResultsByCode(map);
  }, []);

  const load = useCallback(async () => {
    const session = readClientPortalSession();
    if (!session?.portalToken) {
      router.replace('/portal/login/');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await fetchPortalDashboard(session.portalToken);
      const items = (data.assessments || []) as PortalAssessment[];
      setDisplayName(data.displayName || '내담자');
      setMyCode(data.accessCode || session.portal.accessCode);
      setAssessments(items);
      await loadResults(items);
    } catch (err) {
      clearClientPortalSession();
      setError(err instanceof Error ? err.message : '세션이 만료되었습니다.');
    } finally {
      setLoading(false);
    }
  }, [router, loadResults]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPortalReturnPath('/portal/');
  }, []);

  const openTest = (a: PortalAssessment, testId: string) => {
    setPortalReturnPath('/portal/');
    const code = normalizeAccessCodeInput(a.accessCode);
    persistJoinAssessmentSession(code, {
      assessmentId: a.assessmentId,
      title: a.title,
      welcomeMessage: a.welcomeMessage,
      usageEndDate: a.usageEndDate || '',
      testList: a.testList,
    });
    router.push(
      `/join/test?accessCode=${encodeURIComponent(code)}&testId=${encodeURIComponent(testId)}`
    );
  };

  const handleLinkShared = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError('');
    setLinkMessage('');
    const code = normalizeAccessCodeInput(linkInput);
    if (!isValidAccessCodeInput(code)) {
      setLinkError('공유 검사코드 형식을 확인해 주세요.');
      return;
    }
    setLinkLoading(true);
    try {
      const session = readClientPortalSession();
      if (!session?.portalToken) throw new Error('로그인이 필요합니다.');
      const res = await linkSharedAssessment(session.portalToken, code);
      setAssessments((res.assessments || []) as PortalAssessment[]);
      await loadResults((res.assessments || []) as PortalAssessment[]);
      setLinkMessage(res.message || '공유 검사가 연결되었습니다.');
      setLinkInput('');
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : '연결에 실패했습니다.');
    } finally {
      setLinkLoading(false);
    }
  };

  if (loading) return <PortalLoading />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 pt-24 px-4">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/portal/login/" className="text-blue-400 hover:text-blue-300">
            다시 로그인
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="pt-24 pb-12 px-4">
        <main className="max-w-3xl mx-auto space-y-6">
          <div className="bg-slate-800/80 rounded-2xl border border-slate-600 p-6 shadow-xl">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h1 className="text-xl font-bold text-white">내 검사실</h1>
                <p className="text-slate-300 text-sm mt-1">{displayName}님, 환영합니다.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearClientPortalSession();
                  router.push('/portal/login/');
                }}
                className="text-xs text-slate-400 hover:text-slate-200 underline"
              >
                로그아웃
              </button>
            </div>
            <p className="text-sm text-slate-400">
              나의코드{' '}
              <span className="font-mono text-cyan-300">{formatAccessCodeDisplay(myCode)}</span>
            </p>
          </div>

          <div className="bg-slate-800/60 rounded-xl border border-slate-600 p-5">
            <h2 className="text-base font-semibold text-white mb-2">공유 검사코드 연결</h2>
            <p className="text-slate-400 text-sm mb-3">
              상담사가 안내한 공유 검사코드를 입력하면 검사 목록에 추가됩니다.
            </p>
            <form onSubmit={handleLinkShared} className="flex flex-wrap gap-2">
              <input
                type="text"
                value={linkInput}
                onChange={(e) => setLinkInput(formatJoinAccessCodeWhileTyping(e.target.value))}
                placeholder="공유 검사코드"
                className="flex-1 min-w-[10rem] px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
                disabled={linkLoading}
              />
              <button
                type="submit"
                disabled={linkLoading}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {linkLoading ? '연결 중…' : '추가'}
              </button>
            </form>
            {linkMessage ? <p className="text-emerald-300 text-sm mt-2">{linkMessage}</p> : null}
            {linkError ? <p className="text-red-400 text-sm mt-2">{linkError}</p> : null}
          </div>

          <h2 className="text-lg font-semibold text-white">검사코드별 진행 현황</h2>

          {assessments.length === 0 ? (
            <p className="text-slate-400 text-sm">배정·연결된 검사가 없습니다. 공유 검사코드를 추가해 주세요.</p>
          ) : (
            assessments.map((a) => {
              const code = normalizeAccessCodeInput(a.accessCode);
              const results = resultsByCode[code] || [];
              const doneIds = new Set(
                results.filter((r) => r.status === 'completed').map((r) => String(r.testId))
              );

              return (
                <section
                  key={a.assessmentId}
                  className="bg-slate-800/80 rounded-2xl border border-slate-600 p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-medium text-white">{a.title}</h3>
                      <p className="text-sm text-slate-400 mt-1">
                        검사코드{' '}
                        <span className="font-mono text-cyan-300">{formatAccessCodeDisplay(code)}</span>
                        {a.isLinkedShared ? (
                          <span className="ml-2 text-xs text-purple-300 border border-purple-500/40 rounded px-1.5 py-0.5">
                            공유 연결
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <Link
                      href={`/join/dashboard?accessCode=${encodeURIComponent(code)}`}
                      onClick={() => {
                        setPortalReturnPath(getJoinDashboardPath(code));
                        persistJoinAssessmentSession(code, {
                          assessmentId: a.assessmentId,
                          title: a.title,
                          welcomeMessage: a.welcomeMessage,
                          usageEndDate: a.usageEndDate || '',
                          testList: a.testList,
                        });
                      }}
                      className="text-sm text-blue-400 hover:text-blue-300 shrink-0"
                    >
                      검사실 열기 →
                    </Link>
                  </div>

                  {a.welcomeMessage ? (
                    <p className="text-slate-400 text-sm whitespace-pre-wrap">{a.welcomeMessage}</p>
                  ) : null}

                  {!a.testList?.length ? (
                    <p className="text-slate-500 text-sm">등록된 검사가 없습니다.</p>
                  ) : (
                    <ul className="space-y-2">
                      {a.testList.map((t) => {
                        const done = doneIds.has(String(t.testId));
                        return (
                          <li key={t.testId}>
                            <button
                              type="button"
                              onClick={() => openTest(a, t.testId)}
                              className="w-full text-left py-3 px-4 rounded-lg bg-slate-700/80 border border-slate-600 hover:bg-slate-700 transition-colors"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-white font-medium">{t.name || t.testId}</span>
                                <span className="text-slate-400 text-sm">
                                  {done ? '완료 · 다시 보기' : '미완료 · 시작하기'} →
                                </span>
                              </div>
                              <span
                                className={`inline-block mt-2 text-xs px-2 py-0.5 rounded ${
                                  done
                                    ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/40'
                                    : 'bg-amber-900/40 text-amber-200 border border-amber-700/30'
                                }`}
                              >
                                {done ? '검사 실시 완료' : '미실시'}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })
          )}

          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 text-sm text-slate-400">
            <p className="font-medium text-slate-300 mb-1">안내</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>검사는 <strong className="text-slate-200">검사코드</strong>로 시작하고, 진행·관리는 <strong className="text-slate-200">나의코드</strong>로 내 검사실에서 확인합니다.</li>
              <li>새 공유 검사가 있으면 위에서 검사코드를 추가하세요.</li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ClientPortalPage() {
  return (
    <Suspense fallback={<PortalLoading />}>
      <ClientPortalContent />
    </Suspense>
  );
}
