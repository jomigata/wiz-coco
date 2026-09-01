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
import { verifyPortalMagicToken } from '@/lib/clientPortalApi';
import { persistClientPortalSession } from '@/lib/clientPortalSession';
import { clearJoinGuestSession } from '@/lib/joinGuestSession';
import { clearJoinParticipantSession } from '@/lib/joinParticipantSession';
import { claimJoinMyCode } from '@/lib/joinFlowApi';
import { portalLoginHref } from '@/lib/portalLoginIntent';
import { navigateToClientPortalLogin } from '@/lib/portalLoginNavigation';
import { resetAllSessionsBeforePortalLinkEntry } from '@/lib/portalLinkEntryReset';
import { setPortalReturnPath } from '@/lib/portalReturnPath';
import {
  PortalAuthCard,
  PortalAuthScreenLayout,
  usePortalAuthTheme,
} from '@/components/portal/PortalAuthScreenLayout';

function extractMagicToken(magicPath: string): string {
  const query = magicPath.includes('?') ? magicPath.split('?')[1] : '';
  return new URLSearchParams(query).get('t') || '';
}

type ClaimResult = {
  magicPath: string;
};

export default function ClaimMyCodePage() {
  const router = useRouter();
  const t = usePortalAuthTheme('start');
  const [joinCode, setJoinCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [enteringPortal, setEnteringPortal] = useState(false);
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
          magicPath: data.magicPath || '',
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

  const goToMyPortal = async () => {
    if (!result || enteringPortal) return;
    setError('');
    setEnteringPortal(true);
    try {
      await resetAllSessionsBeforePortalLinkEntry({ notifyOtherTabs: false });
      const token = extractMagicToken(result.magicPath);
      if (!token) {
        throw new Error('내검사실로 이동할 수 없습니다. 문자(알림톡)를 확인해 주세요.');
      }
      const session = await verifyPortalMagicToken(token);
      persistClientPortalSession(session);
      clearJoinGuestSession();
      clearJoinParticipantSession();
      setPortalReturnPath('/portal/');
      router.push('/portal/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '내검사실 이동에 실패했습니다.');
    } finally {
      setEnteringPortal(false);
    }
  };

  return (
    <PortalAuthScreenLayout theme="start">
      <PortalAuthCard theme="start">
        <div className="mb-6">
          <Link href="/" className={`text-xs underline-offset-2 hover:underline ${t.link}`}>
            ← 홈으로
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">
            무료 검사코드 (나의코드) 받기
          </h1>
          <p className="mt-2 text-sm text-slate-400">상담코드, 이름(가명), 휴대폰번호를 입력해 주세요.</p>
        </div>

        {result ? (
          <div className="space-y-4">
            <div className={`rounded-xl px-4 py-5 text-center ${t.infoBox}`}>
              <p className="text-sm font-medium text-white">발송이 완료되었습니다.</p>
              <p className="mt-1 text-xs text-slate-400">휴대폰 문자(알림톡)를 확인해 주세요.</p>
            </div>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button
              type="button"
              onClick={() => void goToMyPortal()}
              disabled={enteringPortal}
              className={`w-full rounded-xl px-4 py-3.5 text-sm font-semibold transition-colors disabled:opacity-50 ${t.button}`}
            >
              {enteringPortal ? '내검사실 이동 중…' : '검사 시작하기'}
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
              <label htmlFor="claim-phone" className={`mb-2 block text-sm font-medium ${t.label}`}>
                휴대폰번호
              </label>
              <input
                id="claim-phone"
                name="claim_phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="휴대폰번호 입력"
                className={`w-full rounded-xl px-4 py-3 text-center focus:outline-none focus:ring-2 ${t.input}`}
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
              {loading ? '발송 중…' : '나의코드 받기'}
            </button>
          </form>
        )}

        {!result ? (
          <p className="mt-5 text-center text-xs text-slate-500">
            이미 나의코드가 있으신가요?{' '}
            <Link
              href={startHref}
              onClick={(e) => {
                e.preventDefault();
                navigateToClientPortalLogin(router, startHref);
              }}
              className={`${t.link} underline-offset-2 hover:underline`}
            >
              검사 시작
            </Link>
          </p>
        ) : null}
      </PortalAuthCard>
    </PortalAuthScreenLayout>
  );
}
