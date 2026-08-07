'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { requestPortalPinReset } from '@/lib/clientPortalApi';
import {
  formatMyCodeWhileTyping,
  getMyCodeInputPlaceholder,
  isValidMyCodeInput,
  normalizeMyCodeInput,
} from '@/lib/accessCodeFormat';

function ForgotPinLoading() {
  return (
    <div className="min-h-screen bg-[#070b14] pt-24 flex justify-center">
      <p className="text-slate-400 text-sm">불러오는 중…</p>
    </div>
  );
}

function ForgotPinContent() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState(() => formatMyCodeWhileTyping(searchParams.get('accessCode') || ''));
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const normalizedCode = normalizeMyCodeInput(code);
  const canSubmit = isValidMyCodeInput(normalizedCode) && email.trim().includes('@') && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const result = await requestPortalPinReset({
        accessCode: normalizedCode,
        email: email.trim(),
      });
      setSuccess(result.message || '등록된 이메일로 재설정 안내를 보냈습니다.');
    } catch (err) {
      setError(err instanceof Error ? err.message : '재설정 요청 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14]">
      <div className="pt-24 pb-12 px-4">
        <main className="max-w-md mx-auto">
          <div className="bg-slate-900/90 rounded-2xl border border-white/[0.08] p-8 shadow-2xl shadow-black/30">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-white mb-2 tracking-tight">비밀번호 찾기</h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                나의코드와 등록된 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label htmlFor="portal-forgot-my-code" className="block text-sm font-medium text-slate-300 mb-2">
                  나의코드
                </label>
                <input
                  id="portal-forgot-my-code"
                  type="text"
                  inputMode="text"
                  maxLength={20}
                  autoComplete="off"
                  placeholder={getMyCodeInputPlaceholder()}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-center text-lg tracking-wider placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  value={code}
                  onChange={(e) => setCode(formatMyCodeWhileTyping(e.target.value))}
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="portal-forgot-email" className="block text-sm font-medium text-slate-300 mb-2">
                  이메일
                </label>
                <input
                  id="portal-forgot-email"
                  type="email"
                  autoComplete="email"
                  placeholder="등록된 이메일 주소"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              {error ? <p className="text-red-400 text-sm">{error}</p> : null}
              {success ? <p className="text-emerald-300 text-sm">{success}</p> : null}
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 transition-colors"
              >
                {loading ? '발송 중…' : '재설정 링크 받기'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-300">
              <Link href="/portal/login/" className="text-sky-300 hover:text-sky-200 underline-offset-2 hover:underline">
                로그인으로 돌아가기
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function PortalForgotPinPage() {
  return (
    <Suspense fallback={<ForgotPinLoading />}>
      <ForgotPinContent />
    </Suspense>
  );
}
