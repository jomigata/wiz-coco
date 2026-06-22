'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { pushWithAuthSession } from '@/utils/authSessionLifecycle';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';
import { getAssessment, updateAssessment, type CounselorAssessment } from '@/lib/assessmentApi';
import { counselorAssessmentTestOptions } from '@/data/counselorAssessmentTests';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';

interface AssessmentEditFormProps {
  assessmentId: string;
}

export default function AssessmentEditForm({ assessmentId }: AssessmentEditFormProps) {
  const router = useRouter();
  const { user, authPending, showLoginRequired } = useAuthResolved();
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [initial, setInitial] = useState<CounselorAssessment | null>(null);

  const [title, setTitle] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [usageEndDate, setUsageEndDate] = useState('');
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authPending || !user) {
      if (showLoginRequired) setLoadingData(false);
      return;
    }
    let cancelled = false;
    setLoadingData(true);
    setLoadError('');
    getAssessment(assessmentId)
      .then((data) => {
        if (cancelled) return;
        setInitial(data);
        setTitle(data.title || '');
        setWelcomeMessage(data.welcomeMessage || '');
        setUsageEndDate((data.usageEndDate || '').trim());
        const ids = new Set((data.testList || []).map((t) => t.testId).filter(Boolean));
        setSelectedTestIds(ids);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : '불러오기 실패');
      })
      .finally(() => {
        if (!cancelled) setLoadingData(false);
      });
    return () => {
      cancelled = true;
    };
  }, [assessmentId, authPending, user, showLoginRequired]);

  const canSubmit = Boolean(user) && !authPending && !loading && !loadingData && initial;

  const toggleTest = (testId: string) => {
    setSelectedTestIds((prev) => {
      const next = new Set(prev);
      if (next.has(testId)) next.delete(testId);
      else next.add(testId);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!initial) return;
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('안내 제목을 입력해 주세요.');
      return;
    }
    const testList = counselorAssessmentTestOptions
      .filter((t) => selectedTestIds.has(t.testId))
      .map((t) => ({ testId: t.testId, name: t.name }));
    setLoading(true);
    try {
      await updateAssessment(assessmentId, {
        title: trimmedTitle,
        targetAudience: initial.issueType === 'individual' ? '개인' : '그룹',
        welcomeMessage: welcomeMessage.trim(),
        usageEndDate: usageEndDate.trim(),
        testList,
      });
      pushWithAuthSession(router, '/counselor/assessments');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (authPending || loadingData) {
    return <AuthLoadingState className="py-8" />;
  }
  if (showLoginRequired) {
    return <AuthRequiredState className="max-w-2xl" />;
  }
  if (loadError || !initial) {
    return (
      <div className="rounded-lg bg-red-900/20 border border-red-600/50 p-4 text-red-300">
        {loadError || '검사코드를 찾을 수 없습니다.'}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => pushWithAuthSession(router, '/counselor/assessments')}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            목록으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="rounded-lg bg-slate-800/80 border border-slate-600 p-4 text-sm text-slate-300 space-y-2">
        <div>
          <span className="text-slate-400">검사코드</span>{' '}
          <span className="font-mono text-cyan-400 tracking-wider">{formatAccessCodeDisplay(initial.accessCode)}</span>
        </div>
        <p className="text-slate-500 text-xs">검사코드는 발급 후 변경할 수 없습니다.</p>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">
          안내 제목 <span className="text-red-400">*</span>
        </label>
        <input
          id="title"
          type="text"
          required
          maxLength={200}
          className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
        />
      </div>

      <div>
        <span className="block text-sm font-medium text-slate-300 mb-2">유형</span>
        <p className="text-white text-sm">
          {initial.issueType === 'individual' ? '개별 발급' : '공동 이용'}
        </p>
        <p className="text-slate-500 text-xs mt-1">발급 유형은 변경할 수 없습니다.</p>
      </div>

      <div>
        <label htmlFor="usageEndDate" className="block text-sm font-medium text-slate-300 mb-2">
          검사코드 사용최종일 (선택)
        </label>
        <input
          id="usageEndDate"
          type="date"
          className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={usageEndDate}
          onChange={(e) => setUsageEndDate(e.target.value)}
          disabled={loading}
        />
        <p className="text-slate-500 text-xs mt-1">비워두면 무기한 사용 가능합니다.</p>
      </div>

      <div>
        <label htmlFor="welcomeMessage" className="block text-sm font-medium text-slate-300 mb-2">
          안내 메시지 (선택)
        </label>
        <textarea
          id="welcomeMessage"
          rows={4}
          className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          placeholder="내담자에게 보여줄 환영/안내 문구"
          value={welcomeMessage}
          onChange={(e) => setWelcomeMessage(e.target.value)}
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">포함할 검사 선택</label>
        <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-600 bg-slate-800/80 p-3 space-y-2">
          {counselorAssessmentTestOptions.map((t) => (
            <label key={t.testId} className="flex items-center gap-3 p-2 rounded hover:bg-slate-700/50 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTestIds.has(t.testId)}
                onChange={() => toggleTest(t.testId)}
                disabled={loading}
                className="rounded text-blue-500"
              />
              <span className="text-white">{t.name}</span>
              <span className="text-slate-500 text-sm">({t.testId})</span>
            </label>
          ))}
        </div>
        <p className="text-slate-500 text-xs mt-1">
          이미 제출된 결과가 있어도 안내·검사 구성은 수정할 수 있습니다. 삭제 시에는 목록에서 제거됩니다.
        </p>
      </div>

      {error && (
        <p className="text-red-400 text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className="px-5 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '저장 중…' : '변경 저장'}
        </button>
        <button
          type="button"
          onClick={() => pushWithAuthSession(router, '/counselor/assessments')}
          disabled={loading}
          className="px-5 py-2.5 rounded-lg font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
        >
          취소
        </button>
      </div>
    </form>
  );
}
