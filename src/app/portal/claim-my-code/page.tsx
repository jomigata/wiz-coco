'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
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

function parseClaimContact(raw: string): { email: string; phone: string } {
  const trimmed = raw.trim();
  if (trimmed.includes('@')) {
    return { email: trimmed.toLowerCase(), phone: '' };
  }
  return { email: '', phone: normalizeRecipientPhone(trimmed) };
}

function isValidClaimContact(raw: string): boolean {
  const { email, phone } = parseClaimContact(raw);
  if (email) return email.includes('@') && email.length >= 5;
  return phone.length >= 10;
}

type ClaimResult = {
  displayName: string;
  contactKind: 'email' | 'phone';
  message: string;
};

export default function ClaimMyCodePage() {
  const router = useRouter();
  const t = usePortalAuthTheme('start');
  const [joinCode, setJoinCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [contact, setContact] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClaimResult | null>(null);

  const normalizedJoinCode = normalizeAccessCodeInput(joinCode);
  const canSubmit =
    isValidAccessCodeInput(normalizedJoinCode) &&
    displayName.trim().length > 0 &&
    isValidClaimContact(contact) &&
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
          contact: contact.trim(),
        });
        setResult({
          displayName: data.displayName || displayName.trim(),
          contactKind: data.contactKind === 'email' ? 'email' : 'phone',
          message: data.message || '나의코드와 비밀번호를 발송했습니다.',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : '나의코드 발급에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [canSubmit, contact, displayName, normalizedJoinCode],
  );

  const startHref = portalLoginHref('start');

  const goToExamStart = () => {
    navigateToClientPortalLogin(router, startHref);
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
            상담사에게 안내받은 상담코드와 가명, 휴대폰 번호 또는 이메일을 입력하면 나의코드와 비밀번호를
            받을 수 있습니다.
          </p>
        </div>

        {result ? (
          <div className="space-y-4">
            <div className={`rounded-xl px-4 py-5 text-center ${t.infoBox}`}>
              <div
                className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400"
                aria-hidden
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-medium leading-relaxed text-slate-100">{result.message}</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                {result.contactKind === 'email'
                  ? '입력하신 이메일을 확인해 주세요.'
                  : '입력하신 휴대폰 문자(알림톡)를 확인해 주세요.'}
              </p>
            </div>
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
                setContact('');
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
                placeholder="상담코드 입력"
                className={`w-full rounded-xl px-4 py-3 text-center text-lg tracking-wider focus:outline-none focus:ring-2 ${t.input}`}
                value={joinCode}
                onChange={(e) => setJoinCode(formatAccessCodeWhileTyping(e.target.value))}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="claim-display-name" className={`mb-2 block text-sm font-medium ${t.label}`}>
                이름(가명)
              </label>
              <input
                id="claim-display-name"
                name="claim_display_name"
                type="text"
                autoComplete="off"
                placeholder="사용자 이름(가명) 입력"
                className={`w-full rounded-xl px-4 py-3 text-center focus:outline-none focus:ring-2 ${t.input}`}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="claim-contact" className={`mb-2 block text-sm font-medium ${t.label}`}>
                휴대폰번호 / 이메일
              </label>
              <input
                id="claim-contact"
                name="claim_contact"
                type="text"
                inputMode="text"
                autoComplete="email tel"
                placeholder="코드 받을 휴대폰 또는 이메일 1가지 입력"
                className={`w-full rounded-xl px-4 py-3 text-center focus:outline-none focus:ring-2 ${t.input}`}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                disabled={loading}
              />
            </div>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full rounded-xl px-4 py-3.5 text-sm font-semibold disabled:opacity-50 ${t.button}`}
            >
              {loading ? '발송 중…' : '나의코드 받기'}
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
