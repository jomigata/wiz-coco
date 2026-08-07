'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPortalPin } from '@/lib/clientPortalApi';
import { normalizeJoinPinDigits } from '@/lib/accessCodeFormat';

function ResetPinLoading() {
  return (
    <div className="min-h-screen bg-[#070b14] pt-24 flex justify-center">
      <p className="text-slate-400 text-sm">불러오는 중…</p>
    </div>
  );
}

function ResetPinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = (searchParams.get('t') || '').trim();
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const normalizedNew = normalizeJoinPinDigits(newPin);
  const normalizedConfirm = normalizeJoinPinDigits(confirmPin);
  const canSubmit =
    Boolean(token) &&
    normalizedNew.length === 4 &&
    normalizedConfirm.length === 4 &&
    normalizedNew === normalizedConfirm &&
    !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (normalizedNew !== normalizedConfirm) {
      setError('새 비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const result = await resetPortalPin({ token, newPin: normalizedNew });
      setSuccess(result.message || '비밀번호가 변경되었습니다.');
      window.setTimeout(() => router.push('/portal/login/'), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : '비밀번호 재설정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#070b14] pt-24 px-4">
        <main className="max-w-md mx-auto text-center">
          <p className="text-red-300 text-sm mb-4">유효하지 않은 재설정 링크입니다.</p>
          <Link href="/portal/forgot-pin/" className="text-sky-300 hover:text-sky-200 underline">
            비밀번호 찾기 다시 하기
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14]">
      <div className="pt-24 pb-12 px-4">
        <main className="max-w-md mx-auto">
          <div className="bg-slate-900/90 rounded-2xl border border-white/[0.08] p-8 shadow-2xl shadow-black/30">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-white mb-2 tracking-tight">새 비밀번호 설정</h1>
              <p className="text-slate-400 text-sm leading-relaxed">새 비밀번호(4자리 숫자)를 입력해 주세요.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label htmlFor="portal-reset-pin" className="block text-sm font-medium text-slate-300 mb-2">
                  새 비밀번호 (4자리)
                </label>
                <input
                  id="portal-reset-pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  autoComplete="new-password"
                  placeholder="••••"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-center text-2xl tracking-[0.5em] placeholder:text-slate-400 placeholder:tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  value={newPin}
                  onChange={(e) => setNewPin(normalizeJoinPinDigits(e.target.value))}
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="portal-reset-pin-confirm" className="block text-sm font-medium text-slate-300 mb-2">
                  새 비밀번호 확인
                </label>
                <input
                  id="portal-reset-pin-confirm"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  autoComplete="new-password"
                  placeholder="••••"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-center text-2xl tracking-[0.5em] placeholder:text-slate-400 placeholder:tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(normalizeJoinPinDigits(e.target.value))}
                  disabled={loading}
                />
              </div>
              {error ? <p className="text-red-400 text-sm">{error}</p> : null}
              {success ? <p className="text-emerald-300 text-sm">{success}</p> : null}
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 transition-colors"
              >
                {loading ? '저장 중…' : '비밀번호 변경'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function PortalResetPinPage() {
  return (
    <Suspense fallback={<ResetPinLoading />}>
      <ResetPinContent />
    </Suspense>
  );
}
