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

function formatUsageEndDate(iso: string | undefined): string {
  const s = (iso || '').trim();
  if (!s) return '무기한';
  try {
    const d = new Date(`${s}T00:00:00`);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString('ko-KR');
  } catch {
    return s;
  }
}

function isExpired(iso: string | undefined): boolean {
  const s = (iso || '').trim();
  if (!s) return false;
  try {
    const d = new Date(`${s}T23:59:59`);
    return d < new Date();
  } catch {
    return false;
  }
}

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

  const totalParticipants = assessments.reduce(
    (sum, a) => sum + (a.emailsCompletedAllTestsCount ?? 0) + (a.emailsNotCompletedAllTestsCount ?? 0),
    0,
  );
  const totalCompleted = assessments.reduce(
    (sum, a) => sum + (a.emailsCompletedAllTestsCount ?? 0),
    0,
  );

  if (assessments.length === 0 && !createdInfo) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-slate-200 text-lg font-semibold mb-2">등록된 검사코드가 없습니다</p>
        <p className="text-slate-500 text-sm mb-8">첫 번째 검사코드를 만들어 내담자에게 배포하세요.</p>
        <Link
          href="/counselor/assessments/new"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-900/40"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          첫 검사코드 만들기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-assessment-title"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h2 id="delete-assessment-title" className="text-lg font-semibold text-white">검사코드 삭제</h2>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 mb-4">
              <p className="text-cyan-400 font-mono font-bold tracking-wider">{formatAccessCodeDisplay(deleteTarget.accessCode)}</p>
              <p className="text-slate-300 text-sm mt-1">{deleteTarget.title}</p>
            </div>
            <p className="text-slate-400 text-sm mb-5 leading-relaxed">
              목록에서 제거되며, 내담자는 더 이상 이 코드로 새로 접속할 수 없습니다. 이미 제출된 결과는 상담사 화면에서 계속 조회할 수 있습니다.
            </p>
            {deleteError && <p className="text-red-400 text-sm mb-4">{deleteError}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setDeleteTarget(null); setDeleteError(''); }}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-lg text-slate-300 bg-slate-800 border border-slate-600 hover:bg-slate-700 disabled:opacity-50 text-sm transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                {deleteLoading ? '처리 중…' : '삭제 확인'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 신규 발급 배너 */}
      {createdInfo && (
        <div className="rounded-xl bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border border-emerald-500/30 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-emerald-200 font-medium text-sm">검사코드가 발급되었습니다</p>
              <p className="text-emerald-300 font-mono font-bold tracking-widest text-lg mt-1">
                {formatAccessCodeDisplay(createdInfo.accessCode)}
              </p>
              <p className="text-emerald-400/70 text-xs mt-1">
                내담자는 사이트에 로그인한 뒤 「검사 하기」에서 위 코드를 입력하면 됩니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 요약 통계 */}
      {assessments.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white tabular-nums">{assessments.length}</p>
            <p className="text-slate-400 text-xs mt-1">전체 검사코드</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-cyan-400 tabular-nums">{totalParticipants}</p>
            <p className="text-slate-400 text-xs mt-1">전체 응시자</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400 tabular-nums">{totalCompleted}</p>
            <p className="text-slate-400 text-xs mt-1">전체 완료</p>
          </div>
        </div>
      )}

      {/* 검사코드 카드 목록 */}
      <div className="space-y-3">
        {assessments.map((a) => {
          const incomplete = a.emailsNotCompletedAllTestsCount ?? 0;
          const complete = a.emailsCompletedAllTestsCount ?? 0;
          const total = incomplete + complete;
          const progressPct = total > 0 ? Math.round((complete / total) * 100) : 0;
          const expired = isExpired(a.usageEndDate);
          const isGroup = (a.targetAudience || '개인') !== '개인';

          return (
            <div
              key={a.id}
              className="group bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* 왼쪽: 주요 정보 */}
                <div className="flex-1 min-w-0">
                  {/* 제목 + 뱃지 */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-white font-semibold text-base">{a.title || '-'}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-medium border ${
                        isGroup
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      }`}
                    >
                      {a.targetAudience || '개인'}
                    </span>
                    {expired && (
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                        만료
                      </span>
                    )}
                  </div>

                  {/* 메타 정보 */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mb-4">
                    <span className="font-mono text-cyan-400 font-bold tracking-wider">
                      {formatAccessCodeDisplay(a.accessCode)}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      검사 {(a.testList || []).length}개
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatUsageEndDate(a.usageEndDate)}
                    </span>
                    <span className="text-slate-600 text-xs">생성 {formatDate(a.createdAt)}</span>
                  </div>

                  {/* 진행 현황 바 */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400 font-medium">진행 현황</span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-orange-400 font-mono font-semibold tabular-nums" title="미완료">
                          -{incomplete}
                        </span>
                        <span className="text-slate-600">/</span>
                        <span className="text-emerald-400 font-mono font-semibold tabular-nums" title="완료">
                          {complete}
                        </span>
                        {total > 0 && (
                          <span className="text-slate-500 ml-1">({progressPct}% 완료)</span>
                        )}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-700/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 오른쪽: 액션 버튼 */}
                <div className="flex sm:flex-col gap-2 flex-shrink-0">
                  <Link
                    href={`/counselor/assessments/progress?assessmentId=${encodeURIComponent(a.id)}`}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/30 hover:border-blue-400/50 text-xs font-medium transition-colors whitespace-nowrap"
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    진행 현황
                  </Link>
                  <Link
                    href={`/counselor/assessments/edit?id=${encodeURIComponent(a.id)}`}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600/20 border border-amber-500/30 text-amber-300 hover:bg-amber-600/30 hover:border-amber-400/50 text-xs font-medium transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    수정
                  </Link>
                  <button
                    type="button"
                    onClick={() => { setDeleteError(''); setDeleteTarget(a); }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600/20 hover:border-red-500/40 text-xs font-medium transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    삭제
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
