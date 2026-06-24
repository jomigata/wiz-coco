'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { COUNSELOR_REGIONS } from '@/types/counselorProfile';
import { isValidAccessCodeInput, normalizeAccessCodeInput } from '@/lib/accessCodeFormat';
import { listResults } from '@/lib/assessmentApi';
import { registerJoinParticipant } from '@/lib/joinFlowApi';
import {
  clearJoinGuestSession,
  ensureJoinGuestSession,
  hasJoinGuestSessionForCode,
} from '@/lib/joinGuestSession';
import { clearJoinParticipantSession } from '@/lib/joinParticipantSession';
import { getJoinDashboardPath } from '@/lib/joinAssessmentSession';
import { clearJoinFreshParticipantFlow } from '@/lib/joinFlowMode';

function ProfileFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accessCodeRaw = searchParams.get('accessCode') ?? '';
  const code = useMemo(() => normalizeAccessCodeInput(accessCodeRaw.trim()), [accessCodeRaw]);

  const [displayName, setDisplayName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState('');
  const [region, setRegion] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  const canSubmit =
    displayName.trim() &&
    birthYear.length === 4 &&
    gender &&
    region &&
    email.includes('@') &&
    phone.replace(/\D/g, '').length >= 10 &&
    !loading &&
    !checking;

  useEffect(() => {
    if (!isValidAccessCodeInput(code)) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        if (!hasJoinGuestSessionForCode(code)) {
          await ensureJoinGuestSession(code);
        }
        const data = await listResults(code);
        const hasDone = (data.results || []).some((r) => r.status === 'completed');
        if (!hasDone) {
          router.replace(getJoinDashboardPath(code));
          return;
        }
      } catch {
        if (!cancelled) setError('검사 완료 여부를 확인하지 못했습니다.');
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAccessCodeInput(code)) {
      setError('잘못된 검사 코드입니다.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await registerJoinParticipant({
        accessCode: code,
        displayName: displayName.trim(),
        birthYear,
        gender,
        region,
        email: email.trim(),
        phone: phone.trim(),
      });
      clearJoinGuestSession();
      clearJoinParticipantSession();
      clearJoinFreshParticipantFlow(code);
      setSuccessMessage(
        result.message ||
          (result.credentialsSent
            ? '나의코드와 비밀번호를 이메일·문자로 보내드렸습니다.'
            : '등록이 완료되었습니다.')
      );
      router.push('/portal/login/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!isValidAccessCodeInput(code)) {
    return (
      <div className="min-h-screen bg-gray-900 pt-24 px-4 text-center">
        <p className="text-red-400 mb-4">검사 코드가 없거나 형식이 올바르지 않습니다.</p>
        <Link href="/join/" className="text-blue-400 hover:text-blue-300">
          검사 코드 입력
        </Link>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-900 pt-24 flex justify-center">
        <p className="text-slate-400">검사 완료 여부를 확인하는 중…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="pt-24 pb-12 px-4">
        <main className="max-w-lg mx-auto">
          <div className="bg-slate-800/80 rounded-2xl border border-slate-600 p-8 shadow-xl">
            <h1 className="text-2xl font-bold text-white mb-2">검사자 정보 입력</h1>
            <p className="text-slate-300 text-sm mb-6">
              검사를 완료하셨습니다. 나의코드와 비밀번호를 받으실 이메일·휴대폰 정보를 입력해 주세요.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-slate-300 mb-2">
                  이름
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="홍길동"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="birthYear" className="block text-sm font-medium text-slate-300 mb-2">
                  출생년도
                </label>
                <input
                  id="birthYear"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1990"
                  disabled={loading}
                />
              </div>
              <div>
                <span className="block text-sm font-medium text-slate-300 mb-2">성별</span>
                <div className="flex gap-3">
                  {[
                    { value: 'male', label: '남성' },
                    { value: 'female', label: '여성' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex-1 py-3 px-4 rounded-lg border text-center cursor-pointer transition-colors ${
                        gender === opt.value
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={opt.value}
                        checked={gender === opt.value}
                        onChange={() => setGender(opt.value)}
                        className="sr-only"
                        disabled={loading}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="region" className="block text-sm font-medium text-slate-300 mb-2">
                  지역
                </label>
                <select
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="">지역 선택</option>
                  {COUNSELOR_REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                  이메일
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="example@email.com"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-2">
                  휴대폰 번호
                </label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="01012345678"
                  disabled={loading}
                />
              </div>
              {error && (
                <p className="text-red-400 text-sm" role="alert">
                  {error}
                </p>
              )}
              {successMessage ? (
                <p className="text-emerald-300 text-sm">{successMessage}</p>
              ) : null}
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full py-3 px-4 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '처리 중…' : '검사완료 및 나의코드 생성하기'}
              </button>
            </form>
            <div className="mt-4 text-center">
              <Link href={getJoinDashboardPath(code)} className="text-blue-400 hover:text-blue-300 text-sm">
                ← 검사 목록으로
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function JoinProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-900 pt-24 flex justify-center">
          <p className="text-slate-400">불러오는 중…</p>
        </div>
      }
    >
      <ProfileFormContent />
    </Suspense>
  );
}
