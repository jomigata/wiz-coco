'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import CompletedTestList from '@/components/join/CompletedTestList';
import { lookupPublicAssessment, PublicAssessment } from '@/lib/assessmentApi';
import { isValidAccessCodeInput, normalizeAccessCodeInput } from '@/lib/accessCodeFormat';

const JOIN_STORAGE_KEY = 'wizcoco_join_assessment';
const JOIN_EMAIL_KEY = 'wizcoco_join_client_email';

export default function ClientDashboardPage() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState('');

  const [assessment, setAssessment] = useState<PublicAssessment | null>(null);
  const [clientEmail, setClientEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emailInput, setEmailInput] = useState('');

  const code = normalizeAccessCodeInput(accessCode);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      setAccessCode((params.get('accessCode') || '').trim());
    } catch {
      setAccessCode('');
    }
  }, []);

  const loadAssessment = useCallback(() => {
    if (!isValidAccessCodeInput(code)) {
      setError('잘못된 검사 코드입니다.');
      setLoading(false);
      return;
    }
    let joinPin = '';
    try {
      const raw = typeof window !== 'undefined' ? sessionStorage.getItem(JOIN_STORAGE_KEY) : null;
      if (raw) {
        const p = JSON.parse(raw) as { accessCode?: string; joinPin?: string };
        if (normalizeAccessCodeInput(p.accessCode || '') === code) {
          joinPin = (p.joinPin || '').replace(/\D/g, '').slice(0, 4);
        }
      }
    } catch {
      // ignore
    }
    setLoading(true);
    setError('');
    lookupPublicAssessment(code, joinPin)
      .then((data) => {
        setAssessment(data);
        try {
          sessionStorage.setItem(
            JOIN_STORAGE_KEY,
            JSON.stringify({
              accessCode: code,
              joinPin,
              assessmentId: data.assessmentId,
              title: data.title,
              welcomeMessage: data.welcomeMessage,
              testList: data.testList,
            })
          );
        } catch {
          // ignore
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : '불러오기 실패'))
      .finally(() => setLoading(false));
  }, [code]);

  useEffect(() => {
    loadAssessment();
  }, [loadAssessment]);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(JOIN_EMAIL_KEY);
      if (saved) {
        setEmailInput(saved);
        setClientEmail(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSetEmail = () => {
    const trimmed = (emailInput || '').trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) return;
    setClientEmail(trimmed);
    try {
      sessionStorage.setItem(JOIN_EMAIL_KEY, trimmed);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="fixed top-0 left-0 right-0 z-50">
          <Navigation />
        </div>
        <div className="pt-24 flex justify-center">
          <p className="text-slate-400">불러오는 중…</p>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="fixed top-0 left-0 right-0 z-50">
          <Navigation />
        </div>
        <div className="pt-24 px-4">
          <div className="max-w-lg mx-auto text-center">
            <p className="text-red-400 mb-4">{error || '검사코드 정보를 불러올 수 없습니다.'}</p>
            <Link href="/join" className="text-blue-400 hover:text-blue-300">
              검사 코드 다시 입력
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navigation />
      </div>
      <div className="pt-24 pb-12 px-4">
        <main className="max-w-2xl mx-auto space-y-6">
          <div className="bg-slate-800/80 rounded-2xl border border-slate-600 p-6 shadow-xl">
            <h1 className="text-xl font-bold text-white mb-2">{assessment.title}</h1>
            {assessment.welcomeMessage && (
              <p className="text-slate-300 whitespace-pre-wrap mb-6">{assessment.welcomeMessage}</p>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">내 이메일</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="example@email.com"
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onBlur={handleSetEmail}
                />
                <button type="button" onClick={handleSetEmail} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                  적용
                </button>
              </div>
              <p className="text-slate-500 text-xs mt-1">검사 제출 및 완료 목록에 사용됩니다.</p>
            </div>

            <h2 className="text-lg font-semibold text-white mb-3">수행할 검사</h2>
            {assessment.testList.length === 0 ? (
              <p className="text-slate-400 text-sm">등록된 검사가 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {assessment.testList.map((t) => (
                  <li key={t.testId}>
                    <Link
                      href={`/join/test?accessCode=${encodeURIComponent(code)}&testId=${encodeURIComponent(t.testId)}`}
                      className="block py-3 px-4 rounded-lg bg-slate-700/80 border border-slate-600 text-white hover:bg-slate-700 hover:border-slate-500 transition-colors"
                    >
                      <span className="font-medium">{t.name || t.testId}</span>
                      <span className="text-slate-400 text-sm ml-2">시작하기 →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <CompletedTestList clientEmail={clientEmail} onRefresh={loadAssessment} />
        </main>

        <p className="text-center mt-6">
          <Link href="/join" className="text-blue-400 hover:text-blue-300 text-sm">
            다른 검사 코드 입력
          </Link>
        </p>
      </div>
    </div>
  );
}

