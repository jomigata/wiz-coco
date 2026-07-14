'use client';

import React from 'react';
import { genericJoinQuestions } from '@/data/genericJoinQuestions';
import { getClientResult } from '@/lib/assessmentApi';
import { formatCompletedAt } from '@/lib/portalTestResults';

const RESPONSE_SCALE_LABELS: Record<number, string> = {
  1: '매우 그렇지 않다',
  2: '그렇지 않다',
  3: '약간 그렇지 않다',
  4: '보통',
  5: '약간 그렇다',
  6: '그렇다',
  7: '매우 그렇다',
};

function formatResponseValue(value: unknown): string {
  if (typeof value === 'number' && RESPONSE_SCALE_LABELS[value]) {
    return `${value} · ${RESPONSE_SCALE_LABELS[value]}`;
  }
  if (value == null) return '—';
  return String(value);
}

export type PortalResultViewState = {
  testName: string;
  roundNumber: number | null;
  accessCode: string;
  resultId: string;
  submittedAt: string | null;
  updatedAt: string | null;
};

type PortalResultViewModalProps = {
  resultView: PortalResultViewState;
  resultDetail: Awaited<ReturnType<typeof getClientResult>> | null;
  loading: boolean;
  error: string;
  onClose: () => void;
};

export default function PortalResultViewModal({
  resultView,
  resultDetail,
  loading,
  error,
  onClose,
}: PortalResultViewModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => !loading && onClose()}
    >
      <div
        className="bg-slate-800 rounded-xl border border-slate-600 max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-slate-600 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-white truncate">검사 결과</h3>
            <p className="text-sm text-slate-400 mt-0.5 truncate">
              {resultView.testName}
              {resultView.roundNumber != null ? ` · ${resultView.roundNumber}회차` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm shrink-0"
          >
            닫기
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
            <span className="text-slate-400">제출</span>
            <span className="text-slate-200">{formatCompletedAt(resultView.submittedAt)}</span>
            {resultView.updatedAt ? (
              <>
                <span className="text-slate-400">수정</span>
                <span className="text-slate-200">{formatCompletedAt(resultView.updatedAt)}</span>
              </>
            ) : null}
          </div>

          {loading ? <p className="text-slate-400 text-sm">결과를 불러오는 중…</p> : null}
          {error ? <p className="text-red-400 text-sm">{error}</p> : null}

          {resultDetail && !loading ? (
            <>
              {resultDetail.resultData &&
              typeof resultDetail.resultData === 'object' &&
              Object.keys(resultDetail.resultData).length > 0 ? (
                <div className="rounded-lg border border-emerald-700/40 bg-emerald-950/25 p-4">
                  <h4 className="text-emerald-200 text-sm font-medium mb-2">검사 결과 요약</h4>
                  {typeof resultDetail.resultData.summary === 'string' ? (
                    <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                      {resultDetail.resultData.summary}
                    </p>
                  ) : null}
                  {Object.entries(resultDetail.resultData)
                    .filter(([key]) => key !== 'summary' && key !== 'testId')
                    .map(([key, value]) => (
                      <p key={key} className="text-slate-300 text-sm mt-2">
                        <span className="text-slate-500">{key}: </span>
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </p>
                    ))}
                </div>
              ) : null}

              {resultDetail.responses != null &&
              typeof resultDetail.responses === 'object' &&
              !Array.isArray(resultDetail.responses) ? (
                <div>
                  <h4 className="text-slate-400 text-sm font-medium mb-2">문항별 응답</h4>
                  <ul className="space-y-2">
                    {genericJoinQuestions.map((q) => {
                      const raw = (resultDetail.responses as Record<string, unknown>)[q.id];
                      if (raw === undefined) return null;
                      return (
                        <li
                          key={q.id}
                          className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm"
                        >
                          <p className="text-white mb-1">{q.question}</p>
                          <p className="text-cyan-300">{formatResponseValue(raw)}</p>
                        </li>
                      );
                    })}
                    {Object.entries(resultDetail.responses as Record<string, unknown>)
                      .filter(([id]) => !genericJoinQuestions.some((q) => q.id === id))
                      .map(([id, value]) => (
                        <li
                          key={id}
                          className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm"
                        >
                          <p className="text-slate-400 mb-1">{id}</p>
                          <p className="text-cyan-300">{formatResponseValue(value)}</p>
                        </li>
                      ))}
                  </ul>
                </div>
              ) : null}

              {!resultDetail.resultData &&
              (resultDetail.responses == null ||
                (typeof resultDetail.responses === 'object' &&
                  Object.keys(resultDetail.responses as object).length === 0)) ? (
                <p className="text-slate-500 text-sm">표시할 결과 데이터가 없습니다.</p>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
