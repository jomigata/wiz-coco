'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  deleteResult,
  getResult,
  getResultAsAuthenticatedOwner,
  listMyAssessmentResults,
  MyAssessmentResultRow,
} from '@/lib/assessmentApi';
import { normalizeAccessCodeInput } from '@/lib/accessCodeFormat';
import { JOIN_STORAGE_KEY } from '@/lib/joinAssessmentSession';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

const EDIT_RESULT_STORAGE_KEY = 'wizcoco_edit_result';

export default function CounselorAssessmentResultsPanel() {
  const router = useRouter();
  const { user, loading: authLoading } = useFirebaseAuth();
  const [rows, setRows] = useState<MyAssessmentResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [viewRow, setViewRow] = useState<MyAssessmentResultRow | null>(null);
  const [viewBody, setViewBody] = useState<string>('');

  const [pwdModal, setPwdModal] = useState<
    | null
    | { mode: 'edit' | 'delete'; row: MyAssessmentResultRow }
  >(null);
  const [pwd, setPwd] = useState('');
  const [busy, setBusy] = useState(false);
  const [pwdError, setPwdError] = useState('');

  const load = useCallback(() => {
    if (!user?.email) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    listMyAssessmentResults()
      .then((d) => setRows(d.results || []))
      .catch((e) => setError(e instanceof Error ? e.message : '불러오기 실패'))
      .finally(() => setLoading(false));
  }, [user?.email]);

  useEffect(() => {
    if (authLoading) return;
    load();
  }, [authLoading, load]);

  const openView = async (row: MyAssessmentResultRow) => {
    setViewRow(row);
    setViewBody('불러오는 중…');
    try {
      const data = await getResultAsAuthenticatedOwner(row.resultId);
      const rd = data.resultData;
      const summary =
        rd && typeof rd === 'object' && 'summary' in rd
          ? String((rd as { summary?: unknown }).summary ?? '')
          : '';
      const lines = [
        `검사 세트: ${row.assessmentTitle || '—'}`,
        `접속 코드: ${row.accessCode || '—'}`,
        `검사 ID: ${row.testId}`,
        '',
        summary || '요약 정보가 없습니다.',
      ];
      setViewBody(lines.join('\n'));
    } catch (e) {
      setViewBody(e instanceof Error ? e.message : '조회 실패');
    }
  };

  const runEditAfterPassword = async () => {
    if (!pwdModal || pwdModal.mode !== 'edit' || pwd.length !== 4) return;
    const { row } = pwdModal;
    setBusy(true);
    setPwdError('');
    try {
      const data = await getResult(row.resultId, pwd);
      const code = normalizeAccessCodeInput(String(row.accessCode || ''));
      if (!code) {
        setPwdError('검사 코드가 없어 수정 화면으로 이동할 수 없습니다.');
        return;
      }
      const testList = [
        {
          testId: String(data.testId || row.testId),
          name: row.assessmentTitle ? `${row.assessmentTitle} (${row.testId})` : String(row.testId),
        },
      ];
      try {
        sessionStorage.setItem(
          JOIN_STORAGE_KEY,
          JSON.stringify({
            accessCode: code,
            joinPin: '',
            assessmentId: row.assessmentId || '',
            title: row.assessmentTitle || '검사',
            welcomeMessage: '',
            testList,
          })
        );
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
      setPwdModal(null);
      setPwd('');
      router.push(
        `/join/test?accessCode=${encodeURIComponent(code)}&testId=${encodeURIComponent(String(data.testId))}`
      );
    } catch (e) {
      setPwdError(e instanceof Error ? e.message : '조회 실패');
    } finally {
      setBusy(false);
    }
  };

  const runDeleteAfterPassword = async () => {
    if (!pwdModal || pwdModal.mode !== 'delete' || pwd.length !== 4) return;
    const { row } = pwdModal;
    setBusy(true);
    setPwdError('');
    try {
      await deleteResult(row.resultId, pwd);
      setPwdModal(null);
      setPwd('');
      load();
    } catch (e) {
      setPwdError(e instanceof Error ? e.message : '삭제 실패');
    } finally {
      setBusy(false);
    }
  };

  if (authLoading) return null;

  if (!user?.email?.includes('@')) {
    return (
      <div className="mb-8 rounded-xl border border-amber-600/40 bg-amber-950/20 p-4 text-amber-100/90 text-sm">
        상담사 검사코드 결과는 이메일 로그인 계정에서만 확인할 수 있습니다.
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 rounded-xl border border-white/20 bg-white/5 p-5 shadow-lg">
        <h3 className="text-lg font-semibold text-blue-100 mb-1">상담사 검사코드 결과</h3>
        <p className="text-sm text-blue-200/90 mb-4">
          상담사가 발급한 코드로 제출한 검사입니다. 아래에서 확인·수정(4자리 비밀번호 필요)·삭제할 수 있습니다. 수정은 검사
          화면으로 이동합니다.{' '}
          <Link href="/join" className="text-blue-300 underline hover:text-white">
            검사 코드 입력
          </Link>
        </p>
        {loading ? (
          <p className="text-blue-300/80 text-sm">불러오는 중…</p>
        ) : error ? (
          <p className="text-red-300 text-sm">{error}</p>
        ) : rows.length === 0 ? (
          <p className="text-blue-300/70 text-sm">아직 제출된 상담사 검사 결과가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-white/20 text-blue-300">
                  <th className="py-2 pr-3 font-medium whitespace-nowrap">완료일시</th>
                  <th className="py-2 pr-3 font-medium">세트명</th>
                  <th className="py-2 pr-3 font-medium whitespace-nowrap">검사코드</th>
                  <th className="py-2 pr-3 font-medium whitespace-nowrap">검사</th>
                  <th className="py-2 text-right font-medium whitespace-nowrap">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-blue-100">
                {rows.map((row) => (
                  <tr key={row.resultId} className="hover:bg-white/5">
                    <td className="py-2.5 pr-3 whitespace-nowrap text-xs sm:text-sm">
                      {row.completedAt
                        ? new Date(row.completedAt).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="py-2.5 pr-3 max-w-[140px] sm:max-w-xs truncate" title={row.assessmentTitle || ''}>
                      {row.assessmentTitle || '—'}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-xs">{row.accessCode || '—'}</td>
                    <td className="py-2.5 pr-3 font-mono text-xs">{row.testId}</td>
                    <td className="py-2.5 text-right whitespace-nowrap space-x-1">
                      <button
                        type="button"
                        onClick={() => openView(row)}
                        className="px-2 py-1 rounded bg-blue-700/60 text-white text-xs hover:bg-blue-600/80"
                      >
                        확인
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPwd('');
                          setPwdError('');
                          setPwdModal({ mode: 'edit', row });
                        }}
                        className="px-2 py-1 rounded bg-indigo-700/60 text-white text-xs hover:bg-indigo-600/80"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPwd('');
                          setPwdError('');
                          setPwdModal({ mode: 'delete', row });
                        }}
                        className="px-2 py-1 rounded bg-red-800/60 text-white text-xs hover:bg-red-700/80"
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
      </div>

      {viewRow && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setViewRow(null)}
        >
          <div
            className="max-w-lg w-full rounded-xl border border-white/20 bg-slate-900 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-lg font-semibold text-white mb-2">검사 결과 요약</h4>
            <pre className="text-sm text-slate-200 whitespace-pre-wrap break-words max-h-[60vh] overflow-y-auto bg-black/30 rounded-lg p-4 border border-white/10">
              {viewBody}
            </pre>
            <button
              type="button"
              onClick={() => setViewRow(null)}
              className="mt-4 w-full py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {pwdModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => !busy && setPwdModal(null)}
        >
          <div
            className="max-w-sm w-full rounded-xl border border-white/20 bg-slate-900 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-lg font-semibold text-white mb-2">
              {pwdModal.mode === 'edit' ? '결과 수정' : '결과 삭제'}
            </h4>
            <p className="text-slate-300 text-sm mb-3">
              제출 완료 시 안내된 숫자 4자리 비밀번호를 입력해 주세요.
            </p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              autoComplete="off"
              placeholder="4자리"
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white mb-2"
              value={pwd}
              onChange={(e) => setPwd(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
            {pwdError ? <p className="text-red-400 text-sm mb-2">{pwdError}</p> : null}
            <div className="flex gap-2 justify-end mt-4">
              <button
                type="button"
                disabled={busy}
                onClick={() => !busy && setPwdModal(null)}
                className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800"
              >
                취소
              </button>
              <button
                type="button"
                disabled={busy || pwd.length !== 4}
                onClick={() => (pwdModal.mode === 'edit' ? runEditAfterPassword() : runDeleteAfterPassword())}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-500"
              >
                {busy ? '처리 중…' : pwdModal.mode === 'edit' ? '수정 진행' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
