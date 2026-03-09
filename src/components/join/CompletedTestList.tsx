'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { listResults, getResult, deleteResult, TestResultItem } from '@/lib/assessmentApi';

const JOIN_STORAGE_KEY = 'wizcoco_join_assessment';
const EDIT_RESULT_STORAGE_KEY = 'wizcoco_edit_result';

interface StoredAssessment {
  accessCode: string;
  testList: { testId: string; name: string }[];
}

interface CompletedTestListProps {
  clientEmail: string;
  onRefresh?: () => void;
}

function getTestName(testId: string, testList: { testId: string; name: string }[]): string {
  const found = testList.find((t) => String(t.testId) === String(testId));
  return found?.name || testId;
}

export default function CompletedTestList({
  clientEmail,
  onRefresh,
}: CompletedTestListProps) {
  const router = useRouter();
  const [results, setResults] = useState<TestResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stored, setStored] = useState<StoredAssessment | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ resultId: string; testName: string } | null>(null);
  const [editModal, setEditModal] = useState<{ resultId: string; testId: string; testName: string } | null>(null);
  const [password, setPassword] = useState('');
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
    if (!stored?.accessCode || !clientEmail || !clientEmail.includes('@')) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    listResults(stored.accessCode, clientEmail)
      .then((data) => setResults(data.results || []))
      .catch((err) => setError(err instanceof Error ? err.message : '목록 조회 실패'))
      .finally(() => setLoading(false));
  }, [stored?.accessCode, clientEmail]);

  const handleDelete = () => {
    if (!deleteModal || !password.trim()) return;
    setActionLoading(true);
    setActionError('');
    deleteResult(deleteModal.resultId, password)
      .then(() => {
        setDeleteModal(null);
        setPassword('');
        setResults((prev) => prev.filter((r) => r.resultId !== deleteModal.resultId));
        onRefresh?.();
      })
      .catch((err) => setActionError(err instanceof Error ? err.message : '삭제 실패'))
      .finally(() => setActionLoading(false));
  };

  const handleEditConfirm = () => {
    if (!editModal || !stored?.accessCode || password.length !== 4) return;
    setActionLoading(true);
    setActionError('');
    getResult(editModal.resultId, password)
      .then((data) => {
        try {
          sessionStorage.setItem(
            EDIT_RESULT_STORAGE_KEY,
            JSON.stringify({
              resultId: data.resultId,
              testId: data.testId,
              responses: data.responses,
            })
          );
        } catch {
          // ignore
        }
        setEditModal(null);
        setPassword('');
        router.push(`/join/test?accessCode=${encodeURIComponent(stored.accessCode)}&testId=${encodeURIComponent(editModal.testId)}`);
      })
      .catch((err) => setActionError(err instanceof Error ? err.message : '조회 실패'))
      .finally(() => setActionLoading(false));
  };

  if (!clientEmail?.trim() || !clientEmail.includes('@')) {
    return null;
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
        <ul className="space-y-2">
          {results.map((r) => (
            <li
              key={r.resultId}
              className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-slate-700/50 border border-slate-600"
            >
              <div>
                <span className="text-white font-medium">
                  {getTestName(r.testId, testList)}
                </span>
                {r.completedAt && (
                  <span className="text-slate-400 text-xs ml-2">
                    {new Date(r.completedAt).toLocaleDateString('ko-KR')}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditModal({ resultId: r.resultId, testId: r.testId, testName: getTestName(r.testId, testList) });
                    setPassword('');
                    setActionError('');
                  }}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteModal({ resultId: r.resultId, testName: getTestName(r.testId, testList) });
                    setPassword('');
                    setActionError('');
                  }}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 수정: 4자리 비밀번호 입력 후 해당 검사 페이지로 이동 (기존 응답 로드) */}
      {editModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !actionLoading && setEditModal(null)}
        >
          <div
            className="bg-slate-800 rounded-xl border border-slate-600 p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-lg font-semibold text-white mb-2">검사 결과 수정</h4>
            <p className="text-slate-300 text-sm mb-4">
              「{editModal.testName}」 결과를 수정하려면 4자리 비밀번호를 입력하세요.
            </p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              autoComplete="off"
              placeholder="4자리 비밀번호"
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white mb-2"
              value={password}
              onChange={(e) => setPassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
            {actionError && <p className="text-red-400 text-sm mb-2">{actionError}</p>}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => !actionLoading && setEditModal(null)}
                className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleEditConfirm}
                disabled={actionLoading || password.length !== 4}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? '확인 중…' : '수정하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 (4자리 비밀번호) */}
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
              「{deleteModal.testName}」 결과를 삭제하려면 결과 발송 시 안내된 4자리 비밀번호를 입력하세요.
            </p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              autoComplete="off"
              placeholder="4자리 비밀번호"
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white mb-2"
              value={password}
              onChange={(e) => setPassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
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
                disabled={actionLoading || password.length !== 4}
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
