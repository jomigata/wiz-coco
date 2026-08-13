'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { pushWithAuthSession } from '@/utils/authSessionLifecycle';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';
import { getAssessment, updateAssessment, type CounselorAssessment } from '@/lib/assessmentApi';
import {
  readCachedAssessmentDetail,
  writeCachedAssessmentDetail,
} from '@/lib/counselorSessionCache';
import { rememberCounselorAssessmentContext } from '@/lib/counselorNestedNav';
import { counselorAssessmentTestOptions } from '@/data/counselorAssessmentTests';
import { COUNSELING_CODE_TYPES, type CounselingCodeType } from '@/data/counselingCodeTypes';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import AssessmentSettingsFields from '@/components/counselor/AssessmentSettingsFields';
import CounselorActionProgressOverlay from '@/components/counselor/CounselorActionProgressOverlay';
import { FORM_INPUT, FORM_LABEL } from '@/lib/assessmentFormUi';

interface AssessmentEditFormProps {
  assessmentId: string;
}

export default function AssessmentEditForm({ assessmentId }: AssessmentEditFormProps) {
  const router = useRouter();
  const { user, authPending, showLoginRequired } = useAuthResolved();
  const [loadingData, setLoadingData] = useState(() => !readCachedAssessmentDetail(assessmentId));
  const [loadError, setLoadError] = useState('');
  const [initial, setInitial] = useState<CounselorAssessment | null>(
    () => readCachedAssessmentDetail(assessmentId),
  );

  const [title, setTitle] = useState(() => readCachedAssessmentDetail(assessmentId)?.title || '');
  const [welcomeMessage, setWelcomeMessage] = useState(
    () => readCachedAssessmentDetail(assessmentId)?.welcomeMessage || '',
  );
  const [usageEndDate, setUsageEndDate] = useState(
    () => (readCachedAssessmentDetail(assessmentId)?.usageEndDate || '').trim(),
  );
  const [codeCategory, setCodeCategory] = useState<CounselingCodeType>(() => {
    const cached = readCachedAssessmentDetail(assessmentId)?.codeCategory?.trim();
    const valid = COUNSELING_CODE_TYPES.some((t) => t.value === cached);
    return (valid ? cached : 'group') as CounselingCodeType;
  });
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(() => {
    const cached = readCachedAssessmentDetail(assessmentId);
    return new Set((cached?.testList || []).map((t) => t.testId).filter(Boolean));
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const leftColRef = useRef<HTMLDivElement>(null);
  const [rightColHeight, setRightColHeight] = useState<number | null>(null);

  useEffect(() => {
    if (authPending || !user) {
      if (showLoginRequired) setLoadingData(false);
      return;
    }
    let cancelled = false;
    const hasCache = Boolean(readCachedAssessmentDetail(assessmentId));
    if (!hasCache) setLoadingData(true);
    setLoadError('');
    getAssessment(assessmentId)
      .then((data) => {
        if (cancelled) return;
        writeCachedAssessmentDetail(assessmentId, data);
        rememberCounselorAssessmentContext(assessmentId);
        setInitial(data);
        setTitle(data.title || '');
        setWelcomeMessage(data.welcomeMessage || '');
        setUsageEndDate((data.usageEndDate || '').trim());
        const category = (data.codeCategory || '').trim();
        const validCategory = COUNSELING_CODE_TYPES.some((t) => t.value === category);
        setCodeCategory((validCategory ? category : 'group') as CounselingCodeType);
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

  useEffect(() => {
    const leftCol = leftColRef.current;
    if (!leftCol) return;

    const syncRightHeight = () => {
      if (window.matchMedia('(min-width: 1280px)').matches) {
        setRightColHeight(leftCol.offsetHeight);
      } else {
        setRightColHeight(null);
      }
    };

    syncRightHeight();
    const observer = new ResizeObserver(syncRightHeight);
    observer.observe(leftCol);
    window.addEventListener('resize', syncRightHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncRightHeight);
    };
  }, [title, welcomeMessage, usageEndDate, codeCategory, initial, selectedTestIds.size]);

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
    if (!codeCategory) {
      setError('상담유형을 선택해 주세요.');
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
        codeCategory,
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

  if (authPending || (loadingData && !initial)) {
    return <AuthLoadingState className="py-8" />;
  }
  if (showLoginRequired) {
    return <AuthRequiredState className="max-w-2xl" />;
  }
  if (loadError || !initial) {
    return (
      <div className="rounded-lg bg-red-900/20 border border-red-600/50 p-4 text-red-300">
        {loadError || '상담코드를 찾을 수 없습니다.'}
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {loadingData && initial ? (
        <p className="text-sm text-sky-300/80" role="status">
          저장된 정보를 표시 중… 최신 내용을 불러오고 있습니다.
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:items-start">
        <div ref={leftColRef} className="flex flex-col">
          <CounselorPageSection
            title={
              <span className="inline-flex flex-wrap items-center gap-2">
                상담코드
                <span className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-sm font-normal text-cyan-200">
                  {formatAccessCodeDisplay(initial.accessCode)}
                </span>
              </span>
            }
            relaxed
            bodyClassName="!pb-3"
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-code-category" className={`${FORM_LABEL} mb-1.5`}>
                  상담유형 <span className="text-red-400">*</span>
                </label>
                <select
                  id="edit-code-category"
                  className={`${FORM_INPUT} py-2 text-sm`}
                  value={codeCategory}
                  onChange={(e) => setCodeCategory(e.target.value as CounselingCodeType)}
                  disabled={loading}
                  required
                >
                  {COUNSELING_CODE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label} — {t.description}
                    </option>
                  ))}
                </select>
              </div>
              <AssessmentSettingsFields
                sections="meta"
                compact
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
            </div>
          </CounselorPageSection>
        </div>

        <div
          className="min-h-0 xl:flex xl:flex-col"
          style={rightColHeight != null ? { height: rightColHeight } : undefined}
        >
          <CounselorPageSection
            title="포함할 검사"
            relaxed
            className="flex min-h-0 flex-1 flex-col overflow-hidden xl:h-full"
            bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden !pb-3"
          >
            <AssessmentSettingsFields
              sections="tests"
              compact
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
      </div>

      {error ? (
        <p className="text-red-400 text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? '저장 중…' : '변경 저장'}
        </button>
        <button
          type="button"
          onClick={() => pushWithAuthSession(router, '/counselor/assessments')}
          disabled={loading}
          className="rounded-lg border border-white/15 bg-slate-800/80 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700/80 disabled:opacity-50"
        >
          취소
        </button>
      </div>
      <CounselorActionProgressOverlay
        open={loading}
        title="저장 진행 중…"
        message="상담코드 설정을 저장하고 있습니다."
      />
    </form>
  );
}
