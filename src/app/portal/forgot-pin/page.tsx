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
    <div className="min-h-screen bg-[#0a0814] pt-24 flex justify-center">
      <p className="text-violet-200/70 text-sm">불러오는 중…</p>
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
    <div className="min-h-screen bg-[#0a0814]">
      <div className="pt-24 pb-12 px-4">
        <main className="max-w-md mx-auto">
          <div className="bg-violet-950/40 rounded-2xl border border-violet-400/25 p-8 shadow-2xl shadow-violet-950/40">
            <div className="mb-6">
              <span className="inline-block text-[11px] uppercase tracking-[0.16em] text-violet-300/80 mb-3">
                Password Recovery
              </span>
              <h1 className="text-2xl font-semibold text-white mb-2 tracking-tight">비밀번호 찾기</h1>
              <p className="text-violet-100/70 text-sm leading-relaxed">
                나의코드와 등록된 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label htmlFor="portal-forgot-my-code" className="block text-sm font-medium text-violet-100 mb-2">
                  나의코드
                </label>
                <input
                  id="portal-forgot-my-code"
                  type="text"
                  inputMode="text"
                  maxLength={20}
                  autoComplete="off"
                  placeholder={getMyCodeInputPlaceholder()}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/70 border border-violet-200/35 text-white text-center text-lg tracking-wider placeholder:text-violet-100/55 focus:outline-none focus:ring-2 focus:ring-violet-300/60 focus:border-violet-200/50"
                  value={code}
                  onChange={(e) => setCode(formatMyCodeWhileTyping(e.target.value))}
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="portal-forgot-email" className="block text-sm font-medium text-violet-100 mb-2">
                  이메일
                </label>
                <input
                  id="portal-forgot-email"
                  type="email"
                  autoComplete="email"
                  placeholder="등록된 이메일 주소"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/70 border border-violet-200/35 text-white placeholder:text-violet-100/55 focus:outline-none focus:ring-2 focus:ring-violet-300/60 focus:border-violet-200/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              {error ? <p className="text-red-300 text-sm font-medium">{error}</p> : null}
              {success ? <p className="text-emerald-300 text-sm">{success}</p> : null}
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-colors"
              >
                {loading ? '발송 중…' : '재설정 링크 받기'}
              </button>
            </form>

            <div className="mt-5 rounded-xl border border-violet-400/15 bg-violet-950/30 px-4 py-3 text-sm text-violet-100/75 leading-relaxed">
              나의코드나 등록한 이메일을 모를 경우, 담당 상담사·기관 담당자에게 문의해 주세요.
            </div>

            <p className="mt-6 text-center text-sm text-violet-100/70">
              <Link
                href="/portal/login/"
                className="text-violet-200 hover:text-white underline-offset-2 hover:underline"
              >
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
