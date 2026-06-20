'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchPortalDashboard } from '@/lib/clientPortalApi';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import {
  clearClientPortalSession,
  readClientPortalSession,
} from '@/lib/clientPortalSession';
import { persistJoinAssessmentSession } from '@/lib/joinAssessmentSession';

type PortalAssessment = {
  assessmentId: string;
  title: string;
  welcomeMessage: string;
  usageEndDate?: string;
  testList: { testId: string; name: string }[];
  accessCode: string;
};

function PortalLoading() {
  return (
    <div className="min-h-screen bg-gray-900 pt-24 flex justify-center">
      <p className="text-slate-400">내 검사실을 불러오는 중…</p>
    </div>
  );
}

function ClientPortalContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [assessments, setAssessments] = useState<PortalAssessment[]>([]);

  const load = useCallback(async () => {
    const session = readClientPortalSession();
    if (!session?.portalToken) {
      router.replace('/portal/login/');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await fetchPortalDashboard(session.portalToken);
      setDisplayName(data.displayName || '내담자');
      setAccessCode(data.accessCode || session.portal.accessCode);
      setAssessments(data.assessments || []);
    } catch (err) {
      clearClientPortalSession();
      setError(err instanceof Error ? err.message : '세션이 만료되었습니다.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const openAssessment = (a: PortalAssessment) => {
    persistJoinAssessmentSession(a.accessCode, {
      assessmentId: a.assessmentId,
      title: a.title,
      welcomeMessage: a.welcomeMessage,
      usageEndDate: a.usageEndDate || '',
      testList: a.testList,
    });
    router.push(`/join/dashboard?accessCode=${encodeURIComponent(a.accessCode)}`);
  };

  if (loading) return <PortalLoading />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 pt-24 px-4">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/join/" className="text-blue-400 hover:text-blue-300">
            다시 로그인
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="pt-24 pb-12 px-4">
        <main className="max-w-2xl mx-auto space-y-6">
          <div className="bg-slate-800/80 rounded-2xl border border-slate-600 p-6 shadow-xl">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h1 className="text-xl font-bold text-white">내 검사실</h1>
                <p className="text-slate-300 text-sm mt-1">{displayName}님, 환영합니다.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearClientPortalSession();
                  router.push('/portal/login/');
                }}
                className="text-xs text-slate-400 hover:text-slate-200 underline"
              >
                로그아웃
              </button>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              검사 코드{' '}
              <span className="font-mono text-cyan-300">{formatAccessCodeDisplay(accessCode)}</span>
            </p>

            <h2 className="text-lg font-semibold text-white mb-3">배정된 검사</h2>
            {assessments.length === 0 ? (
              <p className="text-slate-400 text-sm">현재 배정된 검사가 없습니다.</p>
            ) : (
              <ul className="space-y-3">
                {assessments.map((a) => (
                  <li key={a.assessmentId}>
                    <button
                      type="button"
                      onClick={() => openAssessment(a)}
                      className="w-full text-left py-3 px-4 rounded-lg bg-slate-700/80 border border-slate-600 text-white hover:bg-slate-700 hover:border-slate-500 transition-colors"
                    >
                      <div className="flex justify-between gap-2">
                        <span className="font-medium">{a.title}</span>
                        <span className="text-slate-400 text-sm shrink-0">시작 →</span>
                      </div>
                      {a.welcomeMessage ? (
                        <p className="text-slate-400 text-xs mt-2 line-clamp-2">{a.welcomeMessage}</p>
                      ) : null}
                      <p className="text-slate-500 text-xs mt-1">
                        검사 {a.testList?.length ?? 0}개
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 text-sm text-slate-400">
            <p className="font-medium text-slate-300 mb-1">안내</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>새 검사가 배정되면 이 화면에 자동으로 표시됩니다.</li>
              <li>결과는 담당 전문가 확인 후 안내됩니다.</li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ClientPortalPage() {
  return (
    <Suspense fallback={<PortalLoading />}>
      <ClientPortalContent />
    </Suspense>
  );
}
