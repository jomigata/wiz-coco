'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginClientPortal } from '@/lib/clientPortalApi';
import { lookupPublicAssessment } from '@/lib/assessmentApi';
import {
  formatJoinAccessCodeWhileTyping,
  isValidAccessCodeInput,
  normalizeAccessCodeInput,
  normalizeJoinPinDigits,
} from '@/lib/accessCodeFormat';
import {
  persistJoinAssessmentSession,
  pushToJoinDashboard,
} from '@/lib/joinAssessmentSession';
import { persistClientPortalSession, readClientPortalSession } from '@/lib/clientPortalSession';

const MSG_LOOKUP_DEFAULT =
  '요청하신 검사코드가 확인되지 않았습니다. 검사 코드를 다시 확인해 주시기 바랍니다.';

export default function AccessCodeInputPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [formatError, setFormatError] = useState('');
  const [loading, setLoading] = useState(false);
  const autoStartedRef = useRef(false);

  const normalizedCode = normalizeAccessCodeInput(code);
  const normalizedPin = normalizeJoinPinDigits(pin);
  const canSubmit =
    isValidAccessCodeInput(normalizedCode) && normalizedPin.length === 4 && !loading;

  const runJoin = useCallback(
    async (codeInput: string, pinInput: string) => {
      const norm = normalizeAccessCodeInput(codeInput);
      const pinNorm = normalizeJoinPinDigits(pinInput);
      setError('');

      if (codeInput.trim() && !/^[A-Za-z]/.test(codeInput.trim())) {
        setError('검사 코드는 알파벳으로 시작해야 합니다. 예: KAN724');
        return false;
      }
      if (!isValidAccessCodeInput(norm)) {
        setError('검사 코드 형식을 확인해 주시기 바랍니다.');
        return false;
      }
      if (pinNorm.length !== 4) {
        setError('비밀번호 4자리를 입력해 주세요.');
        return false;
      }

      setLoading(true);
      try {
        const portalResult = await loginClientPortal({
          accessCode: norm,
          pin: pinNorm,
          remember,
        });
        persistClientPortalSession(portalResult);

        if ((portalResult as { legacyAssessment?: boolean }).legacyAssessment) {
          const data = await lookupPublicAssessment(norm);
          persistJoinAssessmentSession(norm, data);
          pushToJoinDashboard(router, norm);
          return true;
        }

        router.push('/portal/');
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : MSG_LOOKUP_DEFAULT);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [remember, router],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runJoin(code, pin);
  };

  useEffect(() => {
    const existing = readClientPortalSession();
    if (existing?.portalToken) {
      router.replace('/portal/');
    }
  }, [router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const raw = (params.get('accessCode') || '').trim();
    if (!raw) return;
    setCode(formatJoinAccessCodeWhileTyping(raw));
    const rawPin = (params.get('pin') || '').trim();
    if (rawPin) setPin(normalizeJoinPinDigits(rawPin));
    if (params.get('auto') !== '1' || autoStartedRef.current) return;
    const norm = normalizeAccessCodeInput(raw);
    const pinNorm = normalizeJoinPinDigits(rawPin);
    if (!isValidAccessCodeInput(norm) || pinNorm.length !== 4) return;
    autoStartedRef.current = true;
    void runJoin(raw, rawPin);
  }, [runJoin]);

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="pt-24 pb-12 px-4">
        <main className="max-w-md mx-auto">
          <div className="bg-slate-800/80 rounded-2xl border border-slate-600 p-8 shadow-xl">
            <h1 className="text-2xl font-bold text-white mb-2">검사 시작하기</h1>
            <p className="text-slate-300 text-sm mb-6">
              안내 받은 <span className="text-slate-100">검사 코드</span>와{' '}
              <span className="text-slate-100">비밀번호</span>를 입력해 주세요.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="accessCode" className="block text-sm font-medium text-slate-300 mb-2">
                  검사 코드
                </label>
                <input
                  id="accessCode"
                  type="text"
                  inputMode="text"
                  maxLength={40}
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white text-center text-lg tracking-wider placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: KAN724"
                  value={code}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const trimmed = raw.trim();
                    if (trimmed && !/^[A-Za-z]/.test(trimmed)) {
                      setFormatError('검사 코드는 알파벳으로 시작해야 합니다.');
                    } else {
                      setFormatError('');
                    }
                    setCode(formatJoinAccessCodeWhileTyping(raw));
                  }}
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="joinPin" className="block text-sm font-medium text-slate-300 mb-2">
                  비밀번호 (4자리)
                </label>
                <input
                  id="joinPin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  autoComplete="off"
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white text-center text-2xl tracking-[0.5em] placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(normalizeJoinPinDigits(e.target.value))}
                  disabled={loading}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-slate-500"
                />
                이 기기에서 로그인 상태 유지
              </label>
              {formatError && !error && (
                <p className="text-amber-200/90 text-sm" role="status">
                  {formatError}
                </p>
              )}
              {error && (
                <p className="text-red-400 text-sm" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full py-3 px-4 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '확인 중…' : '내 검사실 들어가기'}
              </button>
            </form>
            <p className="mt-6 text-center text-slate-500 text-xs">
              코드와 비밀번호는 담당 기관·전문가에게 문의하세요.
            </p>
            <div className="mt-4 text-center">
              <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm">
                홈으로
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
