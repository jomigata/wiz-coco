'use client';

import React, { Suspense, useCallback, useEffect, useLayoutEffect, useState } from 'react';
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
import {
  PortalAuthCard,
  PortalAuthScreenLayout,
  usePortalAuthTheme,
} from '@/components/portal/PortalAuthScreenLayout';

function PortalLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = parsePortalLoginIntent(searchParams.get('intent'));
  const theme = intent === 'results' ? 'results' : 'start';
  const t = usePortalAuthTheme(theme);
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

  useLayoutEffect(() => {
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
        await resetAllSessionsBeforePortalLinkEntry({ notifyOtherTabs: false });
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
    <PortalAuthScreenLayout theme={theme}>
      <PortalAuthCard theme={theme}>
        <div className="mb-6 relative">
          <Link
            href="/portal/forgot-pin/"
            className={`absolute -top-1 right-0 text-xs underline-offset-2 hover:underline ${t.link}`}
          >
            (비밀번호 찾기)
          </Link>
          <span className={`inline-block text-[11px] uppercase tracking-[0.16em] mb-3 ${t.accent}`}>
            {theme === 'results' ? 'Result Check' : 'Assessment Start'}
          </span>
          <h1 className="text-2xl font-semibold text-white mb-2 tracking-tight pr-24">{copy.title}</h1>
          <p className="text-slate-400 text-sm leading-relaxed">{copy.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <input type="text" name="prevent_autofill_username" tabIndex={-1} autoComplete="username" className="sr-only" aria-hidden readOnly />
          <input type="password" name="prevent_autofill_password" tabIndex={-1} autoComplete="current-password" className="sr-only" aria-hidden readOnly />
          <div>
            <label htmlFor="wizcoco-portal-my-code" className={`block text-sm font-medium mb-2 ${t.label}`}>
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
              className={`w-full px-4 py-3 rounded-xl text-center text-lg tracking-wider focus:outline-none focus:ring-2 ${t.input}`}
              value={code}
              onChange={(e) => setCode(formatMyCodeWhileTyping(e.target.value))}
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="wizcoco-portal-pin" className={`block text-sm font-medium mb-2 ${t.label}`}>
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
              className={`w-full px-4 py-3 rounded-xl text-center text-2xl tracking-[0.5em] placeholder:tracking-[0.5em] focus:outline-none focus:ring-2 ${t.input}`}
              value={pin}
              onChange={(e) => setPin(normalizeJoinPinDigits(e.target.value))}
              disabled={loading}
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full py-3.5 px-4 rounded-xl font-semibold disabled:opacity-50 transition-colors ${t.button}`}
          >
            {loading ? copy.loadingLabel : copy.submitLabel}
          </button>
        </form>

        {copy.alternate && alternateHref && (
          <p className="mt-6 text-center text-sm text-slate-300">
            {copy.alternate.label}{' '}
            <Link
              href={alternateHref}
              className={`${t.link} underline-offset-2 hover:underline font-semibold`}
              onClick={handleAlternateClick}
            >
              여기
            </Link>
          </p>
        )}
      </PortalAuthCard>
    </PortalAuthScreenLayout>
  );
}

export default function PortalLoginPage() {
  return (
    <Suspense fallback={<PortalAuthScreenLayout theme="start" loading />}>
      <PortalLoginContent />
    </Suspense>
  );
}
