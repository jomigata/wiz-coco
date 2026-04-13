'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CounselorAssessment, CreatedAssessmentBannerInfo } from '@/lib/assessmentApi';
import { deleteAssessment } from '@/lib/assessmentApi';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';

interface AssessmentListProps {
  assessments: CounselorAssessment[];
  createdInfo?: CreatedAssessmentBannerInfo | null;
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

const PROGRESS_TOOLTIP =
  '(-앞 숫자): 세트 검사를 모두 완료하지 않은 이메일 수 · (뒤 숫자): 세트 전부 완료한 이메일 수';

export default function AssessmentList({ assessments, createdInfo }: AssessmentListProps) {
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

  if (assessments.length === 0 && !createdInfo) {
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
      {createdInfo && (
        <div className="rounded-lg bg-green-900/30 border border-green-600/50 p-4 text-green-200 text-sm space-y-2">
          <p>
            검사코드가 발급되었습니다. 코드:{' '}
            <strong className="font-mono tracking-wider">
              {formatAccessCodeDisplay(createdInfo.accessCode)}
            </strong>
          </p>
          {createdInfo.joinPin != null && createdInfo.joinPin !== '' && (
            <p>
              비밀번호(숫자 4자리):{' '}
              <strong className="font-mono tracking-widest text-white">{createdInfo.joinPin}</strong>
            </p>
          )}
          <p className="text-green-300/90 text-xs">
            내담자는 사이트에 로그인한 뒤 「검사 하기」에서 코드와 비밀번호를 입력하면 됩니다. 검사 제출이 끝나면 화면에만
            결과 수정용 4자리 비밀번호가 표시되며, 이메일로는 발송되지 않습니다.
          </p>
        </div>
      )}
      <div className="bg-slate-800/80 rounded-xl border border-slate-600 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-600 bg-slate-800">
                <th className="px-4 py-3 text-slate-300 font-medium">제목</th>
                <th className="px-4 py-3 text-slate-300 font-medium">검사코드</th>
                <th className="px-4 py-3 text-slate-300 font-medium whitespace-nowrap">비밀번호</th>
                <th className="px-4 py-3 text-slate-300 font-medium">대상</th>
                <th className="px-4 py-3 text-slate-300 font-medium">포함 검사</th>
                <th className="px-4 py-3 text-slate-300 font-medium whitespace-nowrap">
                  진행 현황
                  <span className="block text-xs font-normal text-slate-500 normal-case mt-0.5">
                    (-미전체완료 / 전체완료)
                  </span>
                </th>
                <th className="px-4 py-3 text-slate-300 font-medium">생성일</th>
                <th className="px-4 py-3 text-slate-300 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((a) => {
                const incomplete = a.emailsNotCompletedAllTestsCount ?? 0;
                const completeAll = a.emailsCompletedAllTestsCount ?? 0;
                return (
                  <tr key={a.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                    <td className="px-4 py-3 text-white font-medium">{a.title || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-cyan-400 tracking-wider">
                        {formatAccessCodeDisplay(a.accessCode)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm">
                      {a.joinPin ? (
                        <span className="font-mono tabular-nums tracking-widest text-cyan-200">{a.joinPin}</span>
                      ) : a.joinPinConfigured ? (
                        <span className="text-amber-400/90" title="평문이 저장되지 않은 기존 항목입니다. 새 검사코드를 만들면 목록에서 비밀번호를 확인할 수 있습니다.">
                          비노출
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{a.targetAudience || '개인'}</td>
                    <td className="px-4 py-3 text-slate-300">{(a.testList || []).length}개</td>
                    <td className="px-4 py-3 text-slate-300 text-sm font-mono" title={PROGRESS_TOOLTIP}>
                      <span className="text-slate-400">(</span>
                      {incomplete === 0 ? (
                        <span className="text-white">-</span>
                      ) : (
                        <span className="text-orange-400 font-semibold tabular-nums">-{incomplete}</span>
                      )}
                      <span className="text-slate-500">/</span>
                      <span className="text-cyan-300 tabular-nums">{completeAll}</span>
                      <span className="text-slate-400">)</span>
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
