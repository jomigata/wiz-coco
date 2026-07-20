'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { resetAllSessionsBeforePortalLinkEntry } from '@/lib/portalLinkEntryReset';
import {
  PORTAL_LOGIN_COPY,
  parsePortalLoginIntent,
} from '@/lib/portalLoginIntent';

function PortalLoginLoading() {
  return (
    <div className="min-h-screen bg-[#070b14] pt-24 flex justify-center">
      <p className="text-slate-400 text-sm">불러오는 중…</p>
    </div>
  );
}

function PortalLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = parsePortalLoginIntent(searchParams.get('intent'));
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionResetDone, setSessionResetDone] = useState(false);

  const copy = PORTAL_LOGIN_COPY[intent];
  const normalizedCode = normalizeMyCodeInput(code);
  const normalizedPin = normalizeJoinPinDigits(pin);
  const canSubmit =
    sessionResetDone &&
    isValidMyCodeInput(normalizedCode) &&
    normalizedPin.length === 4 &&
    !loading;

  useEffect(() => {
    const raw = (searchParams.get('accessCode') || '').trim();
    if (raw) setCode(formatMyCodeWhileTyping(raw));
    const rawPin = (searchParams.get('pin') || '').trim();
    if (rawPin) setPin(normalizeJoinPinDigits(rawPin));
  }, [searchParams]);

  useEffect(() => {
    const clearEmailAutofill = () => {
      setCode((prev) => (prev.includes('@') ? '' : prev));
    };
    clearEmailAutofill();
    const t1 = window.setTimeout(clearEmailAutofill, 50);
    const t2 = window.setTimeout(clearEmailAutofill, 300);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [intent]);

  useEffect(() => {
    let cancelled = false;
    void resetAllSessionsBeforePortalLinkEntry().then(() => {
      if (!cancelled) setSessionResetDone(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sessionResetDone) return;
    const session = readClientPortalSession();
    if (!session?.portalToken) return;
    const target =
      intent === 'results' ? PORTAL_LOGIN_COPY.results.redirectPath : PORTAL_LOGIN_COPY.start.redirectPath;
    router.replace(target);
  }, [intent, router, sessionResetDone]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!sessionResetDone) return;
      setError('');
      setLoading(true);
      try {
        await resetAllSessionsBeforePortalLinkEntry();
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
    [normalizedCode, normalizedPin, router, copy.redirectPath, sessionResetDone],
  );

  const myCodePlaceholder = getMyCodeInputPlaceholder();
  const isResults = intent === 'results';
  const alternateHref = copy.alternate?.href;

  const handleAlternateClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!alternateHref) return;
      e.preventDefault();
      setError('');
      router.push(alternateHref);
    },
    [alternateHref, router],
  );

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

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <input
                type="text"
                name="prevent_autofill_username"
                tabIndex={-1}
                autoComplete="username"
                className="sr-only"
                aria-hidden
                readOnly
              />
              <input
                type="password"
                name="prevent_autofill_password"
                tabIndex={-1}
                autoComplete="current-password"
                className="sr-only"
                aria-hidden
                readOnly
              />
              <div>
                <label htmlFor="wizcoco-portal-my-code" className="block text-sm font-medium text-slate-300 mb-2">
                  나의코드
                </label>
                <input
                  id="wizcoco-portal-my-code"
                  name="wizcoco_portal_my_code"
                  type="text"
                  inputMode="text"
                  maxLength={20}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore
                  placeholder={myCodePlaceholder}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-center text-lg tracking-wider placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  value={code}
                  onChange={(e) => setCode(formatMyCodeWhileTyping(e.target.value))}
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="wizcoco-portal-pin" className="block text-sm font-medium text-slate-300 mb-2">
                  비밀번호 (4자리)
                </label>
                <input
                  id="wizcoco-portal-pin"
                  name="wizcoco_portal_pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  placeholder="••••"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-center text-2xl tracking-[0.5em] placeholder:text-slate-500 placeholder:tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-sky-500/50"
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

            {copy.alternate && alternateHref && (
              <p className="mt-6 text-center text-xs text-slate-500">
                {copy.alternate.label}{' '}
                <Link
                  href={alternateHref}
                  className="text-sky-400 hover:text-sky-300 underline-offset-2 hover:underline font-medium"
                  onClick={handleAlternateClick}
                >
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

export default function PortalLoginPage() {
  return (
    <Suspense fallback={<PortalLoginLoading />}>
      <PortalLoginContent />
    </Suspense>
  );
}
