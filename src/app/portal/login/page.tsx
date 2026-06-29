'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginClientPortal } from '@/lib/clientPortalApi';
import {
  formatMyCodeWhileTyping,
  getMyCodeInputPlaceholder,
  isValidMyCodeInput,
  normalizeMyCodeInput,
  normalizeJoinPinDigits,
} from '@/lib/accessCodeFormat';
import { persistClientPortalSession } from '@/lib/clientPortalSession';
import { clearJoinGuestSession } from '@/lib/joinGuestSession';
import { clearJoinParticipantSession } from '@/lib/joinParticipantSession';
import { setPortalReturnPath } from '@/lib/portalReturnPath';
import { clearJoinFreshParticipantFlow } from '@/lib/joinFlowMode';

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
          remember: false,
        });
        persistClientPortalSession(result);
        clearJoinGuestSession();
        clearJoinParticipantSession();
        clearJoinFreshParticipantFlow();
        setPortalReturnPath('/portal/');
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

  const myCodePlaceholder = getMyCodeInputPlaceholder();

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="pt-24 pb-12 px-4">
        <main className="max-w-md mx-auto">
          <div className="bg-slate-800/80 rounded-2xl border border-slate-600 p-8 shadow-xl">
            <h1 className="text-2xl font-bold text-white mb-2">검사시작</h1>
            <p className="text-slate-300 text-sm mb-6">
              안내 받으신 나의코드/비밀번호를 입력해 주세요.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="myCode" className="block text-sm font-medium text-slate-300 mb-2">
                  나의코드
                </label>
                <input
                  id="myCode"
                  name="wizcoco-my-code"
                  type="text"
                  inputMode="text"
                  maxLength={20}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder={myCodePlaceholder}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white text-center text-lg tracking-wider placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                {loading ? '확인 중…' : '검사시작'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
