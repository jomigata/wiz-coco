'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { listResults, deleteResult, TestResultItem } from '@/lib/assessmentApi';
import { normalizeAccessCodeInput } from '@/lib/accessCodeFormat';

const JOIN_STORAGE_KEY = 'wizcoco_join_assessment';

interface StoredAssessment {
  accessCode: string;
  testList: { testId: string; name: string }[];
}

interface CompletedTestListProps {
  clientUid: string;
  onRefresh?: () => void;
  /** 대시보드「수행할 검사」정렬·상태용으로 완료 목록 동기화 */
  onResultsChange?: (items: TestResultItem[]) => void;
}

function getTestName(testId: string, testList: { testId: string; name: string }[]): string {
  const found = testList.find((t) => String(t.testId) === String(testId));
  return found?.name || testId;
}

type SortColumn = 'name' | 'date';

export default function CompletedTestList({
  clientUid,
  onRefresh,
  onResultsChange,
}: CompletedTestListProps) {
  const [results, setResults] = useState<TestResultItem[]>([]);
  const [sortColumn, setSortColumn] = useState<SortColumn>('date');
  const [sortDesc, setSortDesc] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stored, setStored] = useState<StoredAssessment | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ resultId: string; testName: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = typeof window !== 'undefined' ? sessionStorage.getItem(JOIN_STORAGE_KEY) : null;
    } catch {
      // ignore
    }
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as StoredAssessment;
        if (parsed.accessCode) setStored(parsed);
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (!stored?.accessCode) {
      setResults([]);
      onResultsChange?.([]);
      setLoading(false);
      return;
    }
    // 로그인(UID) 준비 전에는 API 호출을 하지 않고, 로그인된 뒤에 다시 시도
    if (!clientUid?.trim()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    listResults(normalizeAccessCodeInput(stored.accessCode))
      .then((data) => {
        const list = data.results || [];
        setResults(list);
        onResultsChange?.(list);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : '목록 조회 실패');
        setResults([]);
        onResultsChange?.([]);
      })
      .finally(() => setLoading(false));
  }, [stored?.accessCode, clientUid, onResultsChange]);

  const sortedResults = useMemo(() => {
    const tl = stored?.testList || [];
    const arr = [...results];
    arr.sort((a, b) => {
      if (sortColumn === 'date') {
        const ta = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const tb = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        const cmp = ta - tb;
        return sortDesc ? -cmp : cmp;
      }
      const na = getTestName(a.testId, tl);
      const nb = getTestName(b.testId, tl);
      const cmp = na.localeCompare(nb, 'ko');
      return sortDesc ? -cmp : cmp;
    });
    return arr;
  }, [results, sortColumn, sortDesc, stored?.testList]);

  const onSortHeader = useCallback(
    (col: SortColumn) => {
      setSortColumn((prev) => {
        if (prev === col) {
          setSortDesc((d) => !d);
          return prev;
        }
        setSortDesc(col === 'date');
        return col;
      });
    },
    []
  );

  const handleDelete = () => {
    if (!deleteModal) return;
    setActionLoading(true);
    setActionError('');
    deleteResult(deleteModal.resultId)
      .then(() => {
        const rid = deleteModal.resultId;
        setDeleteModal(null);
        setResults((prev) => {
          const next = prev.filter((r) => r.resultId !== rid);
          onResultsChange?.(next);
          return next;
        });
        onRefresh?.();
      })
      .catch((err) => setActionError(err instanceof Error ? err.message : '삭제 실패'))
      .finally(() => setActionLoading(false));
  };

  if (!clientUid?.trim()) {
    return (
      <div className="rounded-xl bg-slate-800/60 border border-slate-600 p-4">
        <h3 className="text-lg font-semibold text-white mb-2">완료한 검사</h3>
        <p className="text-slate-400 text-sm">로그인 후 완료 내역이 표시됩니다.</p>
      </div>
    );
  }

  const testList = stored?.testList || [];

  return (
    <div className="rounded-xl bg-slate-800/60 border border-slate-600 p-4">
      <h3 className="text-lg font-semibold text-white mb-3">완료한 검사</h3>
      {loading ? (
        <p className="text-slate-400 text-sm">불러오는 중…</p>
      ) : error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : results.length === 0 ? (
        <p className="text-slate-400 text-sm">아직 완료한 검사가 없습니다.</p>
      ) : (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full min-w-[320px] text-sm border-collapse">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-600">
                <th className="py-2 pr-3 font-medium align-bottom">
                  <button
                    type="button"
                    onClick={() => onSortHeader('name')}
                    className="inline-flex items-center gap-1 hover:text-white text-left"
                  >
                    검사명
                    {sortColumn === 'name' ? (
                      <span className="text-blue-400" aria-hidden>
                        {sortDesc ? '↓' : '↑'}
                      </span>
                    ) : null}
                  </button>
                </th>
                <th className="py-2 pr-3 font-medium align-bottom whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onSortHeader('date')}
                    className="inline-flex items-center gap-1 hover:text-white text-left"
                  >
                    검사완료일
                    {sortColumn === 'date' ? (
                      <span className="text-blue-400" aria-hidden>
                        {sortDesc ? '↓' : '↑'}
                      </span>
                    ) : null}
                  </button>
                </th>
                <th className="py-2 w-[1%] whitespace-nowrap text-right font-medium align-bottom">작업</th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((r) => (
                <tr
                  key={r.resultId}
                  className="border-b border-slate-700/80 last:border-0 hover:bg-slate-700/30"
                >
                  <td className="py-2.5 pr-3 text-white font-medium align-middle">
                    {getTestName(r.testId, testList)}
                  </td>
                  <td className="py-2.5 pr-3 text-slate-400 align-middle whitespace-nowrap">
                    {r.completedAt
                      ? new Date(r.completedAt).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </td>
                  <td className="py-2.5 text-right align-middle whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteModal({ resultId: r.resultId, testName: getTestName(r.testId, testList) });
                        setActionError('');
                      }}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !actionLoading && setDeleteModal(null)}
        >
          <div
            className="bg-slate-800 rounded-xl border border-slate-600 p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-lg font-semibold text-white mb-2">검사 결과 삭제</h4>
            <p className="text-slate-300 text-sm mb-4">
              「{deleteModal.testName}」 결과를 삭제할까요? 로그인한 계정으로만 삭제할 수 있습니다.
            </p>
            {actionError && <p className="text-red-400 text-sm mb-2">{actionError}</p>}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => !actionLoading && setDeleteModal(null)}
                className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? '처리 중…' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
