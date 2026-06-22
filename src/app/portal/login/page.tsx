'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginClientPortal } from '@/lib/clientPortalApi';
import {
  formatMyCodeWhileTyping,
  isValidMyCodeInput,
  normalizeMyCodeInput,
  normalizeJoinPinDigits,
} from '@/lib/accessCodeFormat';
import { persistClientPortalSession } from '@/lib/clientPortalSession';

export default function PortalLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const normalizedCode = normalizeMyCodeInput(code);
  const normalizedPin = normalizeJoinPinDigits(pin);
  const canSubmit =
    isValidMyCodeInput(normalizedCode) && normalizedPin.length === 4 && !loading;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);
      try {
        const result = await loginClientPortal({
          accessCode: normalizedCode,
          pin: normalizedPin,
          remember: true,
        });
        persistClientPortalSession(result);
        router.push('/portal/');
      } catch (err) {
        setError(err instanceof Error ? err.message : '나의코드 또는 비밀번호를 확인해 주세요.');
      } finally {
        setLoading(false);
      }
    },
    [normalizedCode, normalizedPin, router],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const raw = (params.get('accessCode') || '').trim();
    if (raw) setCode(formatMyCodeWhileTyping(raw));
    const rawPin = (params.get('pin') || '').trim();
    if (rawPin) setPin(normalizeJoinPinDigits(rawPin));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="pt-24 pb-12 px-4">
        <main className="max-w-md mx-auto">
          <div className="bg-slate-800/80 rounded-2xl border border-slate-600 p-8 shadow-xl">
            <h1 className="text-2xl font-bold text-white mb-2">내 검사실 들어가기</h1>
            <p className="text-slate-300 text-sm mb-6">
              검사 완료 후 받으신 <span className="text-slate-100">나의코드</span>(연도 알파벳+숫자, I/L/O/S/Z/B/G/Q·0·1 제외)와{' '}
              <span className="text-slate-100">비밀번호</span>를 입력해 주세요.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="accessCode" className="block text-sm font-medium text-slate-300 mb-2">
                  나의코드
                </label>
                <input
                  id="accessCode"
                  type="text"
                  inputMode="text"
                  maxLength={20}
                  autoComplete="off"
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white text-center text-lg tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={code}
                  onChange={(e) => setCode(formatMyCodeWhileTyping(e.target.value))}
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="portalPin" className="block text-sm font-medium text-slate-300 mb-2">
                  비밀번호 (4자리)
                </label>
                <input
                  id="portalPin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  autoComplete="off"
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={pin}
                  onChange={(e) => setPin(normalizeJoinPinDigits(e.target.value))}
                  disabled={loading}
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full py-3 px-4 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '확인 중…' : '내 검사실 들어가기'}
              </button>
            </form>
            <p className="mt-6 text-center text-slate-500 text-xs">
              새 검사를 시작하려면{' '}
              <Link href="/join/" className="text-blue-400 hover:text-blue-300">
                검사 시작하기
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
