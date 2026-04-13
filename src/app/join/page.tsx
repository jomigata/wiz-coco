'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { lookupPublicAssessment } from '@/lib/assessmentApi';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import {
  formatJoinAccessCodeWhileTyping,
  isValidAccessCodeInput,
  normalizeAccessCodeInput,
} from '@/lib/accessCodeFormat';
import { JOIN_STORAGE_KEY } from '@/lib/joinAssessmentSession';

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
  const accountEmail = (user?.email || '').trim().toLowerCase();
  /** 마이페이지·네비와 동일: Firebase 세션만으로 로그인 판별(이메일 없는 소셜 계정 포함) */
  const isLoggedIn = !authLoading && !!user;
  const hasEmail = accountEmail.includes('@');
  const canSubmit = isValidAccessCodeInput(normalizedCode) && hasEmail;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (code.trim() && !/^[A-Za-z]/.test(code.trim())) {
      setError('검사 코드는 알파벳으로 시작해야 합니다. 예: KAN-724');
      return;
    }
    if (!hasEmail) {
      setError('검사 진행에는 이메일이 등록된 계정이 필요합니다. 구글·이메일 로그인으로 다시 시도해 주세요.');
      return;
    }
    if (!isValidAccessCodeInput(normalizedCode)) {
      setError('검사 코드 형식을 확인해 주시기 바랍니다.');
      return;
    }
    setLoading(true);
    try {
      const data = await lookupPublicAssessment(normalizedCode);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          JOIN_STORAGE_KEY,
          JSON.stringify({
            accessCode: normalizedCode,
            assessmentId: data.assessmentId,
            title: data.title,
            welcomeMessage: data.welcomeMessage,
            testList: data.testList,
          })
        );
      }
      router.push(`/join/dashboard?accessCode=${encodeURIComponent(normalizedCode)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : MSG_LOOKUP_DEFAULT);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navigation />
      </div>
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
            {isLoggedIn && !hasEmail ? (
              <p className="text-amber-200/90 text-sm mb-6 rounded-lg border border-amber-700/40 bg-amber-950/20 px-3 py-2">
                현재 계정에 이메일 정보가 없어 검사를 진행할 수 없습니다. 이메일이 제공되는 방식(구글·이메일 로그인 등)으로
                로그인해 주세요.
              </p>
            ) : null}
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
                  placeholder="예: KAN-724"
                  value={code}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const trimmed = raw.trim();
                    if (trimmed && !/^[A-Za-z]/.test(trimmed)) {
                      setFormatError('검사 코드는 알파벳으로 시작해야 합니다. 예: KAN-724');
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
