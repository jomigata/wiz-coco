'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  formatAccessCodeDisplay,
  formatAccessCodeWhileTyping,
  isValidAccessCodeInput,
  normalizeAccessCodeInput,
} from '@/lib/accessCodeFormat';
import { normalizeRecipientPhone } from '@/lib/phoneFormat';
import { claimJoinMyCode } from '@/lib/joinFlowApi';
import { portalLoginHref } from '@/lib/portalLoginIntent';
import { navigateToClientPortalLogin } from '@/lib/portalLoginNavigation';
import {
  PortalAuthCard,
  PortalAuthScreenLayout,
  usePortalAuthTheme,
} from '@/components/portal/PortalAuthScreenLayout';

type ClaimResult = {
  myCode: string;
  pin: string;
  displayName: string;
};

export default function ClaimMyCodePage() {
  const router = useRouter();
  const t = usePortalAuthTheme('start');
  const [joinCode, setJoinCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClaimResult | null>(null);

  const normalizedJoinCode = normalizeAccessCodeInput(joinCode);
  const phoneNorm = normalizeRecipientPhone(phone);
  const canSubmit =
    isValidAccessCodeInput(normalizedJoinCode) &&
    displayName.trim().length > 0 &&
    phoneNorm.length >= 10 &&
    !loading &&
    !result;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit) return;
      setError('');
      setLoading(true);
      try {
        const data = await claimJoinMyCode({
          accessCode: normalizedJoinCode,
          displayName: displayName.trim(),
          phone: phoneNorm,
        });
        setResult({
          myCode: data.myCode || data.accessCode,
          pin: data.pin,
          displayName: data.displayName || displayName.trim(),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : '나의코드 발급에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [canSubmit, displayName, normalizedJoinCode, phoneNorm],
  );

  const startHref = portalLoginHref('start');

  const goToExamStart = () => {
    if (!result) return;
    const params = new URLSearchParams({
      accessCode: result.myCode,
      pin: result.pin,
    });
    navigateToClientPortalLogin(router, `${startHref}?${params.toString()}`);
  };

  return (
    <PortalAuthScreenLayout theme="start">
      <PortalAuthCard theme="start">
        <div className="mb-6">
          <Link href="/" className={`text-xs underline-offset-2 hover:underline ${t.link}`}>
            ← 홈으로
          </Link>
          <span className={`mt-3 inline-block text-[11px] uppercase tracking-[0.16em] ${t.accent}`}>
            Free My Code
          </span>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            무료 검사코드 (나의코드) 받기
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            상담사에게 안내받은 상담코드와 가명, 휴대폰 번호를 입력하면 나의코드와 비밀번호를 받을 수 있습니다.
          </p>
        </div>

        {result ? (
          <div className="space-y-4">
            <div className={`rounded-xl px-4 py-4 text-left ${t.infoBox}`}>
              <p className="text-sm text-slate-300">
                <span className="font-medium text-white">{result.displayName}</span>님, 나의코드가 발급되었습니다.
              </p>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-slate-500">나의코드</dt>
                  <dd className="mt-1 font-mono text-lg font-semibold tracking-wide text-sky-200">
                    {formatAccessCodeDisplay(result.myCode)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">비밀번호 (4자리)</dt>
                  <dd className="mt-1 font-mono text-2xl tracking-[0.35em] text-white">{result.pin}</dd>
                </div>
              </dl>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              나의코드와 비밀번호를 메모해 두세요. 분실 시 담당 상담사에게 문의해 주세요.
            </p>
            <button
              type="button"
              onClick={goToExamStart}
              className={`w-full rounded-xl px-4 py-3.5 text-sm font-semibold transition-colors ${t.button}`}
            >
              검사 시작하기
            </button>
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setJoinCode('');
                setDisplayName('');
                setPhone('');
              }}
              className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-2.5 text-sm text-slate-400 transition hover:bg-white/[0.04]"
            >
              다시 받기
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label htmlFor="claim-join-code" className={`mb-2 block text-sm font-medium ${t.label}`}>
                상담코드
              </label>
              <input
                id="claim-join-code"
                name="claim_join_code"
                type="text"
                inputMode="text"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="상담사에게 받은 상담코드"
                className={`w-full rounded-xl px-4 py-3 text-center text-lg tracking-wider focus:outline-none focus:ring-2 ${t.input}`}
                value={joinCode}
                onChange={(e) => setJoinCode(formatAccessCodeWhileTyping(e.target.value))}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="claim-display-name" className={`mb-2 block text-sm font-medium ${t.label}`}>
                가명
              </label>
              <input
                id="claim-display-name"
                name="claim_display_name"
                type="text"
                autoComplete="off"
                placeholder="검사에 사용할 이름(가명)"
                className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ${t.input}`}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="claim-phone" className={`mb-2 block text-sm font-medium ${t.label}`}>
                휴대폰 번호
              </label>
              <input
                id="claim-phone"
                name="claim_phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="나의코드를 받을 핸드폰 번호를 입력하세요."
                className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ${t.input}`}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full rounded-xl px-4 py-3.5 text-sm font-semibold disabled:opacity-50 ${t.button}`}
            >
              {loading ? '발급 중…' : '나의코드 받기'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          이미 나의코드가 있으신가요?{' '}
          <Link
            href={startHref}
            onClick={(e) => {
              e.preventDefault();
              navigateToClientPortalLogin(router, startHref);
            }}
            className={`${t.link} font-semibold underline-offset-2 hover:underline`}
          >
            검사 시작
          </Link>
        </p>
      </PortalAuthCard>
    </PortalAuthScreenLayout>
  );
}
