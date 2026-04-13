'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { getCounselorResult, type ProgressByClient, type CounselorResultDetail } from '@/lib/assessmentApi';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';

type ResultRow = ProgressByClient['results'][number];
type SortCol = 'testId' | 'status' | 'completedAt';

interface ProgressDashboardProps {
  assessmentId: string;
  accessCode: string;
  byClient: ProgressByClient[];
  assessmentTitle?: string;
}

function formatCompletedAt(iso: string | null | undefined): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('ko-KR');
  } catch {
    return String(iso);
  }
}

function maxCompletedAtMs(client: ProgressByClient): number {
  let m = 0;
  for (const r of client.results) {
    if (!r.completedAt) continue;
    const t = new Date(r.completedAt).getTime();
    if (!Number.isNaN(t) && t > m) m = t;
  }
  return m;
}

function latestCompletedLabel(client: ProgressByClient): string | null {
  let best: string | null = null;
  let bestMs = 0;
  for (const r of client.results) {
    if (r.status !== 'completed' || !r.completedAt) continue;
    const t = new Date(r.completedAt).getTime();
    if (!Number.isNaN(t) && t >= bestMs) {
      bestMs = t;
      best = r.completedAt;
    }
  }
  return best ? formatCompletedAt(best) : null;
}

export default function ProgressDashboard({
  assessmentId,
  accessCode,
  byClient,
  assessmentTitle,
}: ProgressDashboardProps) {
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(() => new Set());
  const [sortCol, setSortCol] = useState<SortCol>('completedAt');
  const [sortDesc, setSortDesc] = useState(true);

  const [detail, setDetail] = useState<CounselorResultDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const sortedClients = useMemo(
    () => [...byClient].sort((a, b) => maxCompletedAtMs(b) - maxCompletedAtMs(a)),
    [byClient]
  );

  const sortRows = useCallback(
    (rows: ResultRow[]) => {
      const arr = [...rows];
      arr.sort((a, b) => {
        if (sortCol === 'completedAt') {
          const ta = a.completedAt ? new Date(a.completedAt).getTime() : 0;
          const tb = b.completedAt ? new Date(b.completedAt).getTime() : 0;
          const cmp = ta - tb;
          return sortDesc ? -cmp : cmp;
        }
        if (sortCol === 'status') {
          const sa = a.status === 'completed' ? 1 : 0;
          const sb = b.status === 'completed' ? 1 : 0;
          const cmp = sa - sb;
          return sortDesc ? -cmp : cmp;
        }
        const cmp = String(a.testId).localeCompare(String(b.testId), 'ko');
        return sortDesc ? -cmp : cmp;
      });
      return arr;
    },
    [sortCol, sortDesc]
  );

  const onSortHeader = useCallback((col: SortCol) => {
    setSortCol((prev) => {
      if (prev === col) {
        setSortDesc((d) => !d);
        return prev;
      }
      setSortDesc(col === 'completedAt');
      return col;
    });
  }, []);

  const toggleClient = (email: string) => {
    setExpandedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const openResultDetail = (resultId: string) => {
    setDetail(null);
    setDetailError('');
    setDetailLoading(true);
    getCounselorResult(assessmentId, resultId)
      .then(setDetail)
      .catch((err) => setDetailError(err instanceof Error ? err.message : '조회 실패'))
      .finally(() => setDetailLoading(false));
  };

  const closeModal = () => {
    setDetail(null);
    setDetailError('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        {assessmentTitle && (
          <h2 className="text-lg font-semibold text-white">{assessmentTitle}</h2>
        )}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">검사코드:</span>
          <span className="font-mono text-cyan-400 tracking-wider">{formatAccessCodeDisplay(accessCode)}</span>
        </div>
      </div>

      {byClient.length === 0 ? (
        <div className="bg-slate-800/80 rounded-xl border border-slate-600 p-8 text-center">
          <p className="text-slate-400">아직 제출된 결과가 없습니다.</p>
          <p className="text-slate-500 text-sm mt-1">내담자가 검사코드로 접속해 검사를 제출하면 여기에 표시됩니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedClients.map((client) => {
            const isOpen = expandedEmails.has(client.clientEmail);
            const completed = client.results.filter((r) => r.status === 'completed').length;
            const inProgress = client.results.length - completed;
            const latest = latestCompletedLabel(client);
            const rows = sortRows(client.results);
            return (
              <div
                key={client.clientEmail}
                className="bg-slate-800/80 rounded-xl border border-slate-600 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleClient(client.clientEmail)}
                  className="w-full px-4 py-3 bg-slate-700/50 border-b border-slate-600 flex flex-wrap items-center justify-between gap-3 text-left hover:bg-slate-700/70 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0 flex-1">
                    <span className="text-slate-400 shrink-0" aria-hidden>
                      {isOpen ? '▼' : '▶'}
                    </span>
                    <div className="min-w-0">
                      <span className="text-slate-400 text-sm">내담자</span>
                      <span className="ml-2 text-white font-medium break-all">{client.clientEmail}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-300">
                    <span>
                      완료 <span className="text-green-400 font-mono tabular-nums">{completed}</span>건
                    </span>
                    {inProgress > 0 ? (
                      <span>
                        진행 중 <span className="text-amber-400 font-mono tabular-nums">{inProgress}</span>건
                      </span>
                    ) : null}
                    {latest ? (
                      <span className="text-slate-400 hidden sm:inline">
                        최근 완료 <span className="text-slate-200">{latest}</span>
                      </span>
                    ) : null}
                  </div>
                </button>
                {isOpen ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-600 text-slate-400 text-sm">
                          <th className="px-4 py-2 font-medium w-[28%]">
                            <button
                              type="button"
                              onClick={() => onSortHeader('testId')}
                              className="inline-flex items-center gap-1 hover:text-white"
                            >
                              검사
                              {sortCol === 'testId' ? (
                                <span className="text-cyan-400">{sortDesc ? '↓' : '↑'}</span>
                              ) : null}
                            </button>
                          </th>
                          <th className="px-4 py-2 font-medium w-[18%]">
                            <button
                              type="button"
                              onClick={() => onSortHeader('status')}
                              className="inline-flex items-center gap-1 hover:text-white"
                            >
                              상태
                              {sortCol === 'status' ? (
                                <span className="text-cyan-400">{sortDesc ? '↓' : '↑'}</span>
                              ) : null}
                            </button>
                          </th>
                          <th className="px-4 py-2 font-medium w-[32%]">
                            <button
                              type="button"
                              onClick={() => onSortHeader('completedAt')}
                              className="inline-flex items-center gap-1 hover:text-white"
                            >
                              완료일시
                              {sortCol === 'completedAt' ? (
                                <span className="text-cyan-400">{sortDesc ? '↓' : '↑'}</span>
                              ) : null}
                            </button>
                          </th>
                          <th className="px-4 py-2 font-medium">열람</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => (
                          <tr key={r.resultId} className="border-b border-slate-700 last:border-0">
                            <td className="px-4 py-2 text-white">{r.testId}</td>
                            <td className="px-4 py-2">
                              <span
                                className={
                                  r.status === 'completed' ? 'text-green-400' : 'text-amber-400'
                                }
                              >
                                {r.status === 'completed' ? '완료' : '진행 중'}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-slate-400 text-sm">
                              {formatCompletedAt(r.completedAt)}
                            </td>
                            <td className="px-4 py-2">
                              {r.status === 'completed' && (
                                <button
                                  type="button"
                                  onClick={() => openResultDetail(r.resultId)}
                                  className="text-sm text-blue-400 hover:text-blue-300"
                                >
                                  결과 보기
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-4 py-2.5 bg-slate-900/40 text-sm text-slate-400 border-t border-slate-700/50">
                    제출 {client.results.length}건 · 완료 {completed}건
                    {inProgress > 0 ? ` · 진행 중 ${inProgress}건` : ' · 진행 중 없음'}
                    {latest ? ` · 최근 완료 ${latest}` : ''}
                    <span className="text-slate-500"> — 행을 눌러 상세 목록을 펼칩니다.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 결과 상세 모달 (상담사 전용, 비밀번호 불필요) */}
      {(detail !== null || detailLoading || detailError) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !detailLoading && closeModal()}
        >
          <div
            className="bg-slate-800 rounded-xl border border-slate-600 max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-600 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">검사 결과 상세</h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-white text-sm"
              >
                닫기
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {detailLoading && <p className="text-slate-400">불러오는 중…</p>}
              {detailError && <p className="text-red-400 text-sm">{detailError}</p>}
              {detail && !detailLoading && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-slate-400">내담자</span>
                    <span className="text-white">{detail.clientEmail}</span>
                    <span className="text-slate-400">검사 ID</span>
                    <span className="text-white">{detail.testId}</span>
                    <span className="text-slate-400">완료일시</span>
                    <span className="text-slate-300">{formatCompletedAt(detail.completedAt)}</span>
                  </div>
                  {detail.resultData && Object.keys(detail.resultData).length > 0 && (
                    <div>
                      <h4 className="text-slate-400 text-sm font-medium mb-2">채점/요약</h4>
                      <pre className="bg-slate-900/80 rounded-lg p-3 text-slate-300 text-sm overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(detail.resultData, null, 2)}
                      </pre>
                    </div>
                  )}
                  {detail.responses != null && (
                    <div>
                      <h4 className="text-slate-400 text-sm font-medium mb-2">응답</h4>
                      <pre className="bg-slate-900/80 rounded-lg p-3 text-slate-300 text-sm overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(detail.responses, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
