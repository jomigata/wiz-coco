'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { getPublicAssessment } from '@/lib/assessmentApi';
import {
  formatAccessCodeWhileTyping,
  isValidAccessCodeInput,
  normalizeAccessCodeInput,
} from '@/lib/accessCodeFormat';

const JOIN_STORAGE_KEY = 'wizcoco_join_assessment';

export default function AccessCodeInputPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = normalizeAccessCodeInput(code);
    if (!isValidAccessCodeInput(trimmed)) {
      setError('검사 코드 형식을 확인해 주세요. (예: KAN-724 또는 기존 6자리 코드)');
      return;
    }
    setLoading(true);
    try {
      const data = await getPublicAssessment(trimmed);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          JOIN_STORAGE_KEY,
          JSON.stringify({
            accessCode: trimmed,
            assessmentId: data.assessmentId,
            title: data.title,
            welcomeMessage: data.welcomeMessage,
            testList: data.testList,
          })
        );
      }
      router.push(`/join/dashboard?accessCode=${encodeURIComponent(trimmed)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '검사 코드를 확인해 주세요.');
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
              상담사에게 받은 검사코드를 입력하세요. 신규 코드는 영문 3자와 숫자(2~9, 3자리 이상) 사이에 하이픈(-)이 표시됩니다. 붙여 넣기 시 하이픈 없이 입력해도 됩니다. (기존 6자리 코드도 사용 가능)
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
                  maxLength={32}
                  autoComplete="off"
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white text-center text-lg tracking-wider placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: KAN-724"
                  value={code}
                  onChange={(e) => setCode(formatAccessCodeWhileTyping(e.target.value))}
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
                disabled={loading || !isValidAccessCodeInput(normalizeAccessCodeInput(code))}
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
