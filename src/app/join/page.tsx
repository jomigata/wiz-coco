'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { lookupPublicAssessment } from '@/lib/assessmentApi';
import {
  formatJoinAccessCodeWhileTyping,
  isValidAccessCodeInput,
  normalizeAccessCodeInput,
} from '@/lib/accessCodeFormat';
import { persistJoinAssessmentSession, pushToJoinDashboard } from '@/lib/joinAssessmentSession';
import { clearJoinGuestSession } from '@/lib/joinGuestSession';
import { clearJoinParticipantSession } from '@/lib/joinParticipantSession';
import { resetJoinStartEnvironment } from '@/lib/joinStartReset';

const MSG_LOOKUP_DEFAULT =
  '요청하신 검사코드가 확인되지 않았습니다. 검사 코드를 다시 확인해 주시기 바랍니다.';

export default function AccessCodeInputPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [formatError, setFormatError] = useState('');
  const [loading, setLoading] = useState(false);
  const autoStartedRef = useRef(false);
  const resetDoneRef = useRef(false);

  useEffect(() => {
    if (resetDoneRef.current) return;
    resetDoneRef.current = true;
    resetJoinStartEnvironment();
    setCode('');
    setError('');
    setFormatError('');
  }, []);

  const normalizedCode = normalizeAccessCodeInput(code);
  const canSubmit = isValidAccessCodeInput(normalizedCode) && !loading;

  const runStart = useCallback(
    async (codeInput: string) => {
      const norm = normalizeAccessCodeInput(codeInput);
      setError('');

      if (codeInput.trim() && !/^[A-Za-z]/.test(codeInput.trim())) {
        setError('검사 코드는 알파벳으로 시작해야 합니다. 예: KAN724');
        return false;
      }
      if (!isValidAccessCodeInput(norm)) {
        setError('검사 코드 형식을 확인해 주시기 바랍니다.');
        return false;
      }

      setLoading(true);
      try {
        const data = await lookupPublicAssessment(norm);
        persistJoinAssessmentSession(norm, data);

        clearJoinGuestSession();
        clearJoinParticipantSession();

        pushToJoinDashboard(router, norm);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : MSG_LOOKUP_DEFAULT);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runStart(code);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const raw = (params.get('accessCode') || '').trim();
    if (!raw) return;
    setCode(formatJoinAccessCodeWhileTyping(raw));
    if (params.get('auto') !== '1' || autoStartedRef.current) return;
    const norm = normalizeAccessCodeInput(raw);
    if (!isValidAccessCodeInput(norm)) return;
    autoStartedRef.current = true;
    void runStart(raw);
  }, [runStart]);

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="pt-24 pb-12 px-4">
        <main className="max-w-md mx-auto">
          <div className="bg-slate-800/80 rounded-2xl border border-slate-600 p-8 shadow-xl">
            <h1 className="text-2xl font-bold text-white mb-2">검사 시작하기</h1>
            <p className="text-slate-300 text-sm mb-6">
              안내 받은 <span className="text-slate-100">검사 코드</span>를 입력해 주세요.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="accessCode" className="block text-sm font-medium text-slate-300 mb-2">
                  검사 코드
                </label>
                <input
                  id="accessCode"
                  type="text"
                  inputMode="text"
                  maxLength={40}
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white text-center text-lg tracking-wider placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: KAN724"
                  value={code}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const trimmed = raw.trim();
                    if (trimmed && !/^[A-Za-z]/.test(trimmed)) {
                      setFormatError('검사 코드는 알파벳으로 시작해야 합니다.');
                    } else {
                      setFormatError('');
                    }
                    setCode(formatJoinAccessCodeWhileTyping(raw));
                  }}
                  disabled={loading}
                />
              </div>
              {formatError && !error && (
                <p className="text-amber-200/90 text-sm" role="status">
                  {formatError}
                </p>
              )}
              {error && (
                <p className="text-red-400 text-sm" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full py-3 px-4 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '확인 중…' : '검사 시작하기'}
              </button>
            </form>
            <p className="mt-6 text-center text-slate-500 text-xs">
              검사 코드는 담당 기관·전문가에게 문의하세요.{' '}
              <Link href="/portal/login/" className="text-blue-400 hover:text-blue-300">
                내 검사실 들어가기
              </Link>
            </p>
            <div className="mt-4 text-center">
              <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm">
                홈으로
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
