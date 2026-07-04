'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginClientPortal } from '@/lib/clientPortalApi';
import {
  formatMyCodeWhileTyping,
  getMyCodeInputPlaceholder,
  isValidMyCodeInput,
  normalizeMyCodeInput,
  normalizeJoinPinDigits,
} from '@/lib/accessCodeFormat';
import { persistClientPortalSession, readClientPortalSession } from '@/lib/clientPortalSession';
import { clearJoinGuestSession } from '@/lib/joinGuestSession';
import { clearJoinParticipantSession } from '@/lib/joinParticipantSession';
import { setPortalReturnPath } from '@/lib/portalReturnPath';
import { clearJoinFreshParticipantFlow } from '@/lib/joinFlowMode';
import {
  PORTAL_LOGIN_COPY,
  parsePortalLoginIntent,
  type PortalLoginIntent,
} from '@/lib/portalLoginIntent';

export default function PortalLoginPage() {
  const router = useRouter();
  const [intent, setIntent] = useState<PortalLoginIntent>('start');
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const copy = PORTAL_LOGIN_COPY[intent];
  const normalizedCode = normalizeMyCodeInput(code);
  const normalizedPin = normalizeJoinPinDigits(pin);
  const canSubmit =
    isValidMyCodeInput(normalizedCode) && normalizedPin.length === 4 && !loading;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setIntent(parsePortalLoginIntent(params.get('intent')));

    const raw = (params.get('accessCode') || '').trim();
    if (raw) setCode(formatMyCodeWhileTyping(raw));
    const rawPin = (params.get('pin') || '').trim();
    if (rawPin) setPin(normalizeJoinPinDigits(rawPin));
  }, []);

  useEffect(() => {
    const session = readClientPortalSession();
    if (!session?.portalToken) return;
    const target =
      intent === 'results' ? PORTAL_LOGIN_COPY.results.redirectPath : PORTAL_LOGIN_COPY.start.redirectPath;
    router.replace(target);
  }, [intent, router]);

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
        setPortalReturnPath(copy.redirectPath.split('?')[0] || '/portal/');
        router.push(copy.redirectPath);
      } catch (err) {
        setError(err instanceof Error ? err.message : '나의코드 또는 비밀번호를 확인해 주세요.');
      } finally {
        setLoading(false);
      }
    },
    [normalizedCode, normalizedPin, router, copy.redirectPath],
  );

  const myCodePlaceholder = getMyCodeInputPlaceholder();
  const isResults = intent === 'results';

  return (
    <div className="min-h-screen bg-[#070b14]">
      <div className="pt-24 pb-12 px-4">
        <main className="max-w-md mx-auto">
          <div className="bg-slate-900/90 rounded-2xl border border-white/[0.08] p-8 shadow-2xl shadow-black/30">
            <div className="mb-6">
              <span
                className={`inline-block text-[11px] uppercase tracking-[0.16em] mb-3 ${
                  isResults ? 'text-emerald-300/80' : 'text-sky-300/80'
                }`}
              >
                {isResults ? 'Result Check' : 'Assessment Start'}
              </span>
              <h1 className="text-2xl font-semibold text-white mb-2 tracking-tight">{copy.title}</h1>
              <p className="text-slate-400 text-sm leading-relaxed">{copy.description}</p>
            </div>

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
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-center text-lg tracking-wider placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
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
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  value={pin}
                  onChange={(e) => setPin(normalizeJoinPinDigits(e.target.value))}
                  disabled={loading}
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={!canSubmit}
                className={`w-full py-3.5 px-4 rounded-xl font-semibold text-white disabled:opacity-50 transition-colors ${
                  isResults
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-sky-600 hover:bg-sky-500'
                }`}
              >
                {loading ? copy.loadingLabel : copy.submitLabel}
              </button>
            </form>

            {copy.alternate && (
              <p className="mt-6 text-center text-xs text-slate-500">
                {copy.alternate.label}{' '}
                <Link href={copy.alternate.href} className="text-sky-400 hover:text-sky-300 underline-offset-2 hover:underline">
                  여기
                </Link>
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
