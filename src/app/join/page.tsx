'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { lookupPublicAssessment } from '@/lib/assessmentApi';
import {
  formatJoinAccessCodeWhileTyping,
  isValidAccessCodeInput,
  normalizeAccessCodeInput,
} from '@/lib/accessCodeFormat';

const JOIN_STORAGE_KEY = 'wizcoco_join_assessment';

const MSG_LOOKUP_DEFAULT =
  '요청하신 검사코드가 확인되지 않았습니다. 검사코드 및 내담자 비밀번호를 다시 한 번 확인해 주시기 바랍니다.';

export default function AccessCodeInputPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [joinPin, setJoinPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const normalizedCode = normalizeAccessCodeInput(code);
  const pinDigits = joinPin.replace(/\D/g, '').slice(0, 4);
  const pinOk = pinDigits.length === 0 || pinDigits.length === 4;
  const canSubmit = isValidAccessCodeInput(normalizedCode) && pinOk;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isValidAccessCodeInput(normalizedCode)) {
      setError('검사 코드 형식을 확인해 주시기 바랍니다.');
      return;
    }
    if (!pinOk) {
      setError('내담자 비밀번호는 숫자 4자리이거나, 구형 검사코드의 경우 비워 두실 수 있습니다.');
      return;
    }
    setLoading(true);
    try {
      const data = await lookupPublicAssessment(normalizedCode, pinDigits);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          JOIN_STORAGE_KEY,
          JSON.stringify({
            accessCode: normalizedCode,
            joinPin: pinDigits,
            assessmentId: data.assessmentId,
            title: data.title,
            welcomeMessage: data.welcomeMessage,
            testList: data.testList,
          })
        );
      }
      router.push(`/join/dashboard?accessCode=${encodeURIComponent(normalizedCode)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : MSG_LOOKUP_DEFAULT);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navigation />
      </div>
      <div className="pt-24 pb-12 px-4">
        <main className="max-w-md mx-auto">
          <div className="bg-slate-800/80 rounded-2xl border border-slate-600 p-8 shadow-xl">
            <h1 className="text-2xl font-bold text-white mb-2">검사 코드 입력</h1>
            <p className="text-slate-300 text-sm mb-6">
              상담사에게 받은 검사코드와 내담자 비밀번호(숫자 4자리)를 입력해 주세요. 구형 검사코드로 비밀번호가 없는 경우 비밀번호 칸은 비워 두세요.
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
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white text-center text-lg tracking-wider placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: KAN-724"
                  value={code}
                  onChange={(e) => setCode(formatJoinAccessCodeWhileTyping(e.target.value))}
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="joinPin" className="block text-sm font-medium text-slate-300 mb-2">
                  내담자 비밀번호 (숫자 4자리)
                </label>
                <input
                  id="joinPin"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  autoComplete="off"
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white text-center text-xl tracking-[0.5em] placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••"
                  value={joinPin}
                  onChange={(e) => setJoinPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  disabled={loading}
                />
              </div>
              {error && (
                <p className="text-red-400 text-sm" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading || !canSubmit}
                className="w-full py-3 px-4 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '확인 중…' : '검사 하기'}
              </button>
            </form>
            <p className="mt-6 text-center">
              <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm">
                홈으로
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
