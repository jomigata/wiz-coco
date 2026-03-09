'use client';

import React from 'react';
import type { ProgressByClient } from '@/lib/assessmentApi';

interface ProgressDashboardProps {
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
  accessCode,
  byClient,
  assessmentTitle,
}: ProgressDashboardProps) {
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
