'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { pushWithAuthSession } from '@/utils/authSessionLifecycle';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';
import { getAssessment, updateAssessment, type CounselorAssessment } from '@/lib/assessmentApi';
import { counselorAssessmentTestOptions } from '@/data/counselorAssessmentTests';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import AssessmentSettingsFields from '@/components/counselor/AssessmentSettingsFields';
import { FORM_HINT } from '@/lib/assessmentFormUi';

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
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-2 xl:items-stretch">
        <div className="flex min-h-0 flex-col gap-4">
          <CounselorPageSection title="검사코드">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 font-mono text-base text-cyan-200">
                {formatAccessCodeDisplay(initial.accessCode)}
              </span>
              <span className="text-sm text-slate-400">
                {initial.issueType === 'individual' ? '검사코드(개별 발급)' : '일반코드(지원 종료)'}
              </span>
            </div>
            <p className={`${FORM_HINT} mt-2`}>검사코드·발급 유형은 변경할 수 없습니다.</p>
          </CounselorPageSection>

          <CounselorPageSection title="검사 정보" className="flex min-h-0 flex-col">
            <AssessmentSettingsFields
              sections="meta"
              title={title}
              onTitleChange={setTitle}
              welcomeMessage={welcomeMessage}
              onWelcomeMessageChange={setWelcomeMessage}
              usageEndDate={usageEndDate}
              onUsageEndDateChange={setUsageEndDate}
              selectedTestIds={selectedTestIds}
              onToggleTest={toggleTest}
              disabled={loading}
            />
          </CounselorPageSection>
        </div>

        <CounselorPageSection
          title="포함할 검사"
          className="flex min-h-0 flex-col xl:h-full"
          bodyClassName="flex min-h-0 flex-1 flex-col"
        >
          <AssessmentSettingsFields
            sections="tests"
            title={title}
            onTitleChange={setTitle}
            welcomeMessage={welcomeMessage}
            onWelcomeMessageChange={setWelcomeMessage}
            usageEndDate={usageEndDate}
            onUsageEndDateChange={setUsageEndDate}
            selectedTestIds={selectedTestIds}
            onToggleTest={toggleTest}
            disabled={loading}
          />
        </CounselorPageSection>
      </div>

      {error ? (
        <p className="text-red-400 text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-sky-600 px-5 py-2.5 text-base font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? '저장 중…' : '변경 저장'}
        </button>
        <button
          type="button"
          onClick={() => pushWithAuthSession(router, '/counselor/assessments')}
          disabled={loading}
          className="rounded-lg border border-white/15 bg-slate-800/80 px-5 py-2.5 text-base font-medium text-slate-200 transition hover:bg-slate-700/80 disabled:opacity-50"
        >
          취소
        </button>
      </div>
    </form>
  );
}
