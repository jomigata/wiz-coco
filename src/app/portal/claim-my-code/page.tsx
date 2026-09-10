'use client';

import React, { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  formatAccessCodeWhileTyping,
  isValidAccessCodeInput,
  normalizeAccessCodeInput,
} from '@/lib/accessCodeFormat';
import { normalizeRecipientPhone, formatPhoneWhileTyping, phoneInputCaretIndex, PHONE_INPUT_MASK_PLACEHOLDER } from '@/lib/phoneFormat';
import { verifyPortalMagicToken } from '@/lib/clientPortalApi';
import { persistClientPortalSession } from '@/lib/clientPortalSession';
import { clearJoinGuestSession } from '@/lib/joinGuestSession';
import { clearJoinParticipantSession } from '@/lib/joinParticipantSession';
import {
  claimJoinMyCode,
  previewClaimMyCode,
  publicClaimSuccessHint,
} from '@/lib/joinFlowApi';
import {
  type PublicClaimChannel,
} from '@/lib/publicClaimDelivery';
import { portalLoginHref } from '@/lib/portalLoginIntent';
import { navigateToClientPortalLogin } from '@/lib/portalLoginNavigation';
import { resetAllSessionsBeforePortalLinkEntry } from '@/lib/portalLinkEntryReset';
import { setPortalReturnPath } from '@/lib/portalReturnPath';
import PortalAuthTopBar from '@/components/portal/PortalAuthTopBar';
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
  deliveryChannel: PublicClaimChannel;
};

type Step = 'code' | 'contact' | 'done';

export default function ClaimMyCodePage() {
  const router = useRouter();
  const t = usePortalAuthTheme('start');
  const [step, setStep] = useState<Step>('code');
  const [joinCode, setJoinCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryChannel, setDeliveryChannel] = useState<PublicClaimChannel | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [enteringPortal, setEnteringPortal] = useState(false);
  const [result, setResult] = useState<ClaimResult | null>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const normalizedJoinCode = normalizeAccessCodeInput(joinCode);
  const phoneNorm = normalizeRecipientPhone(phone);
  const canProceedCode =
    isValidAccessCodeInput(normalizedJoinCode) && !loading && step === 'code';
  const canSendContact =
    displayName.trim().length > 0 && phoneNorm.length >= 10 && !loading && step === 'contact';

  const handleCodeNext = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canProceedCode) return;
      setError('');
      setLoading(true);
      try {
        const preview = await previewClaimMyCode(normalizedJoinCode);
        setDeliveryChannel(preview.deliveryChannel);
        setStep('contact');
      } catch (err) {
        setError(err instanceof Error ? err.message : '상담코드 확인에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [canProceedCode, normalizedJoinCode],
  );

  const handleSendCode = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSendContact || !deliveryChannel) return;
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
          deliveryChannel: data.deliveryChannel || deliveryChannel,
        });
        setStep('done');
      } catch (err) {
        setError(err instanceof Error ? err.message : '코드 전송에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [canSendContact, deliveryChannel, displayName, normalizedJoinCode, phoneNorm],
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
        throw new Error('내검사실로 이동할 수 없습니다. 발송된 안내를 확인해 주세요.');
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

  const backToCode = () => {
    setStep('code');
    setError('');
    setDeliveryChannel(null);
  };

  return (
    <PortalAuthScreenLayout theme="start">
      <PortalAuthCard theme="start">
        <PortalAuthTopBar linkClassName={t.link} />
        <div className="text-center">
          <span className={`inline-block text-[11px] uppercase tracking-[0.16em] ${t.accent}`}>
            Get My Code
          </span>
        </div>
        <h1 className="mt-3 text-center text-2xl font-semibold tracking-tight text-white">검사코드 받기</h1>
        {step === 'code' ? (
          <p className="mt-2 text-center text-sm text-slate-400">상담사에게 받은 상담코드를 입력해 주세요.</p>
        ) : null}

        {step === 'done' && result ? (
          <div className="space-y-4">
            <div className={`rounded-xl px-4 py-5 text-center ${t.infoBox}`}>
              <p className="text-sm font-medium text-white">발송이 완료되었습니다.</p>
              <p className="mt-1 text-xs text-slate-400">{publicClaimSuccessHint(result.deliveryChannel)}</p>
            </div>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button
              type="button"
              onClick={() => void goToMyPortal()}
              disabled={enteringPortal}
              className={`w-full rounded-xl px-4 py-3.5 text-sm font-semibold transition-colors disabled:opacity-50 ${t.button}`}
            >
              {enteringPortal ? '내검사실 이동 중…' : '검사 바로시작하기'}
            </button>
          </div>
        ) : step === 'contact' ? (
          <form onSubmit={handleSendCode} className="space-y-4" autoComplete="off" lang="ko">
            <div className="rounded-lg border border-sky-400/25 bg-sky-500/10 px-3 py-2.5 text-center">
              <p className="text-[10px] font-medium tracking-widest text-sky-300/80">상담코드</p>
              <p className="mt-1 font-mono text-lg font-bold tracking-[0.14em] text-sky-50 sm:text-xl">
                {normalizedJoinCode || joinCode}
              </p>
            </div>
            <div>
              <label htmlFor="claim-display-name" className={`mb-2 block text-sm font-medium ${t.label}`}>
                이름
              </label>
              <input
                id="claim-display-name"
                name="claim_display_name"
                type="text"
                autoComplete="off"
                autoFocus
                lang="ko"
                inputMode="text"
                placeholder="이름 입력"
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
                ref={phoneInputRef}
                id="claim-phone"
                name="claim_phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                lang="ko"
                placeholder={PHONE_INPUT_MASK_PLACEHOLDER}
                className={`w-full rounded-xl px-4 py-3 text-center tracking-wider focus:outline-none focus:ring-2 ${t.input}`}
                value={phone}
                onChange={(e) => {
                  const formatted = formatPhoneWhileTyping(e.target.value);
                  setPhone(formatted);
                  requestAnimationFrame(() => {
                    const el = phoneInputRef.current;
                    if (!el) return;
                    const pos = phoneInputCaretIndex(formatted);
                    el.setSelectionRange(pos, pos);
                  });
                }}
                disabled={loading}
              />
            </div>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button
              type="submit"
              disabled={!canSendContact}
              className={`w-full rounded-xl px-4 py-3.5 text-sm font-semibold disabled:opacity-50 ${t.button}`}
            >
              {loading ? '전송 중…' : '코드 전송'}
            </button>
            <button
              type="button"
              onClick={backToCode}
              disabled={loading}
              className="w-full text-center text-xs text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline"
            >
              상담코드 다시 입력
            </button>
          </form>
        ) : (
          <form onSubmit={handleCodeNext} className="space-y-4" autoComplete="off">
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
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button
              type="submit"
              disabled={!canProceedCode}
              className={`w-full rounded-xl px-4 py-3.5 text-sm font-semibold disabled:opacity-50 ${t.button}`}
            >
              {loading ? '확인 중…' : '검사코드 받기'}
            </button>
          </form>
        )}

        {step !== 'done' ? (
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
