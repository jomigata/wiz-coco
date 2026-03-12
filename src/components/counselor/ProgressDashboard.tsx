'use client';

import React, { useState } from 'react';
import { getCounselorResult, type ProgressByClient, type CounselorResultDetail } from '@/lib/assessmentApi';

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

export default function ProgressDashboard({
  assessmentId,
  accessCode,
  byClient,
  assessmentTitle,
}: ProgressDashboardProps) {
  const [detail, setDetail] = useState<CounselorResultDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

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
          <span className="text-slate-400">참여 코드:</span>
          <span className="font-mono text-cyan-400 tracking-widest">{accessCode}</span>
        </div>
      </div>

      {byClient.length === 0 ? (
        <div className="bg-slate-800/80 rounded-xl border border-slate-600 p-8 text-center">
          <p className="text-slate-400">아직 제출된 결과가 없습니다.</p>
          <p className="text-slate-500 text-sm mt-1">내담자가 참여 코드로 접속해 검사를 제출하면 여기에 표시됩니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {byClient.map((client) => (
            <div
              key={client.clientEmail}
              className="bg-slate-800/80 rounded-xl border border-slate-600 overflow-hidden"
            >
              <div className="px-4 py-3 bg-slate-700/50 border-b border-slate-600">
                <span className="text-slate-400 text-sm">내담자</span>
                <span className="ml-2 text-white font-medium">{client.clientEmail}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-600 text-slate-400 text-sm">
                      <th className="px-4 py-2 font-medium">검사</th>
                      <th className="px-4 py-2 font-medium">상태</th>
                      <th className="px-4 py-2 font-medium">완료일시</th>
                      <th className="px-4 py-2 font-medium">열람</th>
                    </tr>
                  </thead>
                  <tbody>
                    {client.results.map((r) => (
                      <tr key={r.resultId} className="border-b border-slate-700 last:border-0">
                        <td className="px-4 py-2 text-white">{r.testId}</td>
                        <td className="px-4 py-2">
                          <span
                            className={
                              r.status === 'completed'
                                ? 'text-green-400'
                                : 'text-amber-400'
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
            </div>
          ))}
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
