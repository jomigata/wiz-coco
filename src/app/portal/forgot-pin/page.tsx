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
import {
  PortalAuthCard,
  PortalAuthScreenLayout,
  usePortalAuthTheme,
} from '@/components/portal/PortalAuthScreenLayout';

function ForgotPinContent() {
  const searchParams = useSearchParams();
  const t = usePortalAuthTheme('recovery');
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
    <PortalAuthScreenLayout theme="recovery">
      <PortalAuthCard theme="recovery">
        <div className="mb-6">
          <span className={`inline-block text-[11px] uppercase tracking-[0.16em] mb-3 ${t.accent}`}>
            Password Recovery
          </span>
          <h1 className="text-2xl font-semibold text-white tracking-tight">비밀번호 찾기</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label htmlFor="portal-forgot-my-code" className={`block text-sm font-medium mb-2 ${t.label}`}>
              나의코드
            </label>
            <input
              id="portal-forgot-my-code"
              type="text"
              inputMode="text"
              maxLength={20}
              autoComplete="off"
              placeholder={getMyCodeInputPlaceholder()}
              className={`w-full px-4 py-3 rounded-xl text-center text-lg tracking-wider focus:outline-none focus:ring-2 ${t.input}`}
              value={code}
              onChange={(e) => setCode(formatMyCodeWhileTyping(e.target.value))}
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="portal-forgot-email" className={`block text-sm font-medium mb-2 ${t.label}`}>
              이메일
            </label>
            <input
              id="portal-forgot-email"
              type="email"
              autoComplete="email"
              placeholder="등록된 이메일 주소"
              className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 ${t.input}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          {error ? <p className="text-red-400 text-sm font-medium">{error}</p> : null}
          {success ? <p className="text-emerald-300 text-sm">{success}</p> : null}
          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full py-3.5 px-4 rounded-xl font-semibold disabled:opacity-50 transition-colors ${t.button}`}
          >
            {loading ? '발송 중…' : '재설정 링크 받기'}
          </button>
        </form>

        <div className={`mt-5 rounded-xl px-4 py-3 text-sm leading-relaxed ${t.infoBox}`}>
          나의코드나 등록한 이메일을 모를 경우, 담당 상담사·기관 담당자에게 문의해 주세요.
        </div>

        <p className="mt-6 text-center text-sm text-slate-300">
          <Link href="/portal/login/" className={`${t.link} underline-offset-2 hover:underline`}>
            검사시작으로 돌아가기
          </Link>
        </p>
      </PortalAuthCard>
    </PortalAuthScreenLayout>
  );
}

export default function PortalForgotPinPage() {
  return (
    <Suspense fallback={<PortalAuthScreenLayout theme="recovery" loading />}>
      <ForgotPinContent />
    </Suspense>
  );
}
