'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { lookupPublicAssessment } from '@/lib/assessmentApi';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import {
  formatJoinAccessCodeWhileTyping,
  isValidAccessCodeInput,
  normalizeAccessCodeInput,
} from '@/lib/accessCodeFormat';
import {
  persistJoinAssessmentSession,
  pushToJoinDashboard,
} from '@/lib/joinAssessmentSession';

const MSG_LOOKUP_DEFAULT =
  '요청하신 검사코드가 확인되지 않았습니다. 검사 코드를 다시 확인해 주시기 바랍니다.';

export default function AccessCodeInputPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useFirebaseAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [formatError, setFormatError] = useState('');
  const [loading, setLoading] = useState(false);

  const normalizedCode = normalizeAccessCodeInput(code);
  /** 마이페이지·네비와 동일: Firebase 세션만으로 로그인 판별(이메일 없는 소셜 계정 포함) */
  const isLoggedIn = !authLoading && !!user;
  const canSubmit = isValidAccessCodeInput(normalizedCode) && isLoggedIn;
  const autoStartedRef = useRef(false);

  const runJoinLookup = useCallback(
    async (codeInput: string) => {
      const norm = normalizeAccessCodeInput(codeInput);
      setError('');
      if (codeInput.trim() && !/^[A-Za-z]/.test(codeInput.trim())) {
        setError('검사 코드는 알파벳으로 시작해야 합니다. 예: KAN724');
        return false;
      }
      if (!isLoggedIn) {
        setError('로그인 후 검사가 가능합니다.');
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
        pushToJoinDashboard(router, norm);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : MSG_LOOKUP_DEFAULT);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [isLoggedIn, router],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runJoinLookup(code);
  };

  // 마이페이지 등에서 ?accessCode=…&auto=1 로 진입 시 코드 채우기·자동 진행
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const raw = (params.get('accessCode') || '').trim();
    if (!raw) return;
    setCode(formatJoinAccessCodeWhileTyping(raw));
    if (params.get('auto') !== '1' || authLoading) return;
    if (!isLoggedIn || autoStartedRef.current) return;
    const norm = normalizeAccessCodeInput(raw);
    if (!isValidAccessCodeInput(norm)) return;
    autoStartedRef.current = true;
    void runJoinLookup(raw);
  }, [authLoading, isLoggedIn, runJoinLookup]);

  return (
    <div className="min-h-screen bg-gray-900">
      
<div className="pt-24 pb-12 px-4">
        <main className="max-w-md mx-auto">
          <div className="bg-slate-800/80 rounded-2xl border border-slate-600 p-8 shadow-xl">
            <h1 className="text-2xl font-bold text-white mb-2">검사 코드 입력</h1>
            <div className="text-sm mb-6 space-y-1.5">
              <p className="text-slate-300">
                상담사에게 받은 <span className="text-slate-200">검사 코드</span>를 입력해 주세요.
              </p>
              {!isLoggedIn ? (
                <p className="text-slate-400">로그인 후 검사가 가능합니다.</p>
              ) : null}
            </div>
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
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white text-center text-lg tracking-wider placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
                  placeholder="예: KAN724"
                  value={code}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const trimmed = raw.trim();
                    if (trimmed && !/^[A-Za-z]/.test(trimmed)) {
                      setFormatError('검사 코드는 알파벳으로 시작해야 합니다. 예: KAN724');
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
                disabled={loading || !canSubmit}
                className="w-full py-3 px-4 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '확인 중…' : '검사 하기'}
              </button>
            </form>
            <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center items-stretch sm:items-center">
              {!isLoggedIn ? (
                <Link
                  href="/login?redirect=/join"
                  className="text-center py-2.5 px-4 rounded-lg border border-slate-500 text-slate-200 hover:bg-slate-700/80 text-sm font-medium transition-colors"
                >
                  로그인
                </Link>
              ) : null}
              <Link href="/" className="text-center py-2.5 px-4 rounded-lg text-blue-400 hover:text-blue-300 text-sm">
                홈으로
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
