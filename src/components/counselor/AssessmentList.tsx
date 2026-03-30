'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CounselorAssessment, EmailCompletionTotalRow } from '@/lib/assessmentApi';
import { deleteAssessment } from '@/lib/assessmentApi';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';

interface AssessmentListProps {
  assessments: CounselorAssessment[];
  createdCode?: string | null;
  /** 내담자(이메일)별 검사 완료 건수 합계 — 보유한 모든 검사코드 통합 */
  emailCompletionTotals?: EmailCompletionTotalRow[];
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('ko-KR', {
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

function completionByEmailTitle(byEmail: Record<string, number> | undefined): string | undefined {
  if (!byEmail || Object.keys(byEmail).length === 0) return undefined;
  return Object.entries(byEmail)
    .map(([em, n]) => `${em}: ${n}건`)
    .join('\n');
}

export default function AssessmentList({
  assessments,
  createdCode,
  emailCompletionTotals = [],
}: AssessmentListProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<CounselorAssessment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError('');
    setDeleteLoading(true);
    try {
      await deleteAssessment(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : '삭제에 실패했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (assessments.length === 0 && !createdCode) {
    return (
      <div className="bg-slate-800/80 rounded-xl border border-slate-600 p-8 text-center">
        <p className="text-slate-400 mb-4">등록된 검사코드가 없습니다.</p>
        <Link
          href="/counselor/assessments/new"
          className="inline-block px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          첫 검사코드 만들기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-assessment-title"
        >
          <div className="bg-slate-800 border border-slate-600 rounded-xl max-w-md w-full p-6 shadow-xl">
            <h2 id="delete-assessment-title" className="text-lg font-semibold text-white mb-2">
              검사코드 삭제
            </h2>
            <p className="text-slate-300 text-sm mb-1">
              <span className="font-mono text-cyan-400">{formatAccessCodeDisplay(deleteTarget.accessCode)}</span> —{' '}
              {deleteTarget.title}
            </p>
            <p className="text-slate-400 text-sm mb-4">
              목록에서 제거되며, 내담자는 더 이상 이 코드로 새로 접속할 수 없습니다. 이미 제출된 결과는 상담사 화면에서 조회할 수 있습니다.
            </p>
            {deleteError && <p className="text-red-400 text-sm mb-3">{deleteError}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError('');
                }}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-lg text-slate-300 bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? '처리 중…' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
      {createdCode && (
        <div className="rounded-lg bg-green-900/30 border border-green-600/50 p-4 text-green-200 text-sm">
          검사코드가 발급되었습니다. 코드:{' '}
          <strong className="font-mono tracking-wider">{formatAccessCodeDisplay(createdCode)}</strong>
          — 내담자에게 이 코드를 전달하세요.
        </div>
      )}
      {emailCompletionTotals.length > 0 && (
        <div className="rounded-xl border border-slate-600 bg-slate-800/80 p-4">
          <h2 className="text-sm font-semibold text-slate-200 mb-3">
            내담자(이메일)별 검사 완료 합계
          </h2>
          <p className="text-xs text-slate-500 mb-2">
            보유 중인 모든 검사코드에서 제출 완료된 검사 건수를 이메일 기준으로 합산했습니다.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-600 text-slate-400">
                  <th className="py-2 pr-4 font-medium">이메일</th>
                  <th className="py-2 font-medium whitespace-nowrap">완료 합계</th>
                </tr>
              </thead>
              <tbody>
                {emailCompletionTotals.map((row) => (
                  <tr key={row.clientEmail} className="border-b border-slate-700/80 last:border-0">
                    <td className="py-2 pr-4 text-slate-200 break-all">{row.clientEmail}</td>
                    <td className="py-2 text-cyan-300 font-mono whitespace-nowrap">
                      {row.completedCount}건
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="bg-slate-800/80 rounded-xl border border-slate-600 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-600 bg-slate-800">
                <th className="px-4 py-3 text-slate-300 font-medium">제목</th>
                <th className="px-4 py-3 text-slate-300 font-medium">검사코드</th>
                <th className="px-4 py-3 text-slate-300 font-medium">대상</th>
                <th className="px-4 py-3 text-slate-300 font-medium">포함 검사</th>
                <th className="px-4 py-3 text-slate-300 font-medium">검사 완료(이메일별)</th>
                <th className="px-4 py-3 text-slate-300 font-medium">생성일</th>
                <th className="px-4 py-3 text-slate-300 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((a) => (
                <tr key={a.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                  <td className="px-4 py-3 text-white font-medium">{a.title || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-cyan-400 tracking-wider">
                      {formatAccessCodeDisplay(a.accessCode)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{a.targetAudience || '개인'}</td>
                  <td className="px-4 py-3 text-slate-300">{(a.testList || []).length}개</td>
                  <td
                    className="px-4 py-3 text-slate-300 text-sm"
                    title={completionByEmailTitle(a.completionByEmail)}
                  >
                    <span className="text-cyan-200 font-mono">
                      {(a.completedTestsTotal ?? 0)}건
                    </span>
                    <span className="text-slate-500"> · </span>
                    <span>{(a.completedClientsCount ?? 0)}명</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{formatDate(a.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <Link
                        href={`/counselor/assessments/progress?assessmentId=${encodeURIComponent(a.id)}`}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        진행 현황
                      </Link>
                      <Link
                        href={`/counselor/assessments/edit?id=${encodeURIComponent(a.id)}`}
                        className="text-amber-400 hover:text-amber-300 text-sm"
                      >
                        수정
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError('');
                          setDeleteTarget(a);
                        }}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
