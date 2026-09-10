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
  formatPhoneWhileTyping,
  normalizeRecipientPhone,
  PHONE_INPUT_MASK_PLACEHOLDER,
} from '@/lib/phoneFormat';
import PortalAuthTopBar from '@/components/portal/PortalAuthTopBar';
import {
  PortalAuthCard,
  PortalAuthScreenLayout,
  usePortalAuthTheme,
} from '@/components/portal/PortalAuthScreenLayout';

function ForgotPinContent() {
  const searchParams = useSearchParams();
  const t = usePortalAuthTheme('recovery');
  const [code, setCode] = useState(() => formatMyCodeWhileTyping(searchParams.get('accessCode') || ''));
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const normalizedCode = normalizeMyCodeInput(code);
  const phoneNorm = normalizeRecipientPhone(phone);
  const canSubmit = isValidMyCodeInput(normalizedCode) && phoneNorm.length >= 10 && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const result = await requestPortalPinReset({
        accessCode: normalizedCode,
        phone: phoneNorm,
      });
      setSuccess(result.message || '등록된 휴대폰으로 재설정 안내를 보냈습니다.');
    } catch (err) {
      setError(err instanceof Error ? err.message : '재설정 요청 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PortalAuthScreenLayout theme="recovery">
      <PortalAuthCard theme="recovery">
        <PortalAuthTopBar showForgotPin={false} linkClassName={t.link} />
        <div className="text-center">
          <span className={`inline-block text-[11px] uppercase tracking-[0.16em] ${t.accent}`}>
            Password Recovery
          </span>
        </div>
        <h1 className="mt-3 text-center text-2xl font-semibold tracking-tight text-white">비밀번호 찾기</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" autoComplete="off">
          <div>
            <label htmlFor="portal-forgot-my-code" className={`mb-2 block text-sm font-medium ${t.label}`}>
              나의코드
            </label>
            <input
              id="portal-forgot-my-code"
              type="text"
              inputMode="text"
              maxLength={20}
              autoComplete="off"
              placeholder={getMyCodeInputPlaceholder()}
              className={`w-full rounded-xl px-4 py-3 text-center text-lg tracking-wider focus:outline-none focus:ring-2 ${t.input}`}
              value={code}
              onChange={(e) => setCode(formatMyCodeWhileTyping(e.target.value))}
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="portal-forgot-phone" className={`mb-2 block text-sm font-medium ${t.label}`}>
              휴대폰번호
            </label>
            <input
              id="portal-forgot-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder={PHONE_INPUT_MASK_PLACEHOLDER}
              className={`w-full rounded-xl px-4 py-3 text-center tracking-wider focus:outline-none focus:ring-2 ${t.input}`}
              value={phone}
              onChange={(e) => setPhone(formatPhoneWhileTyping(e.target.value))}
              disabled={loading}
            />
          </div>
          {error ? <p className="text-sm font-medium text-red-400">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full rounded-xl px-4 py-3.5 font-semibold disabled:opacity-50 ${t.button}`}
          >
            {loading ? '발송 중…' : '재설정 링크 받기'}
          </button>
        </form>

        <div className={`mt-5 rounded-xl px-4 py-3 text-sm leading-relaxed ${t.infoBox}`}>
          나의코드나 등록한 휴대폰 번호를 모를 경우, 담당 상담사·기관 담당자에게 문의해 주세요.
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
