'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { pushWithAuthSession } from '@/utils/authSessionLifecycle';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';
import { bulkCreateClientPortals } from '@/lib/clientPortalApi';
import { prependCounselorAssessmentToListCache, type CounselorAssessment } from '@/lib/assessmentApi';
import { formatPhoneDisplay, normalizeRecipientPhone } from '@/lib/phoneFormat';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import CounselorActionProgressOverlay from '@/components/counselor/CounselorActionProgressOverlay';
import WelcomeMessageSampleHoverPicker from '@/components/counselor/WelcomeMessageSampleHoverPicker';
import AuthLink from '@/components/auth/AuthLink';
import {
  COUNSELOR_SEND_TEMPLATES,
  QUICK_SEND_MESSAGE,
  resolveTemplateTestList,
  type CounselorSendTemplateId,
} from '@/data/counselorSendTemplates';
import { fetchMyCredits } from '@/lib/commerceApi';
import { GROUP_RECIPIENT_MAX } from '@/lib/groupRecipientLimits';
import {
  mergeRecipients,
  parseRecipientFile,
  type RecipientRow,
} from '@/lib/recipientImport';

const INPUT =
  'w-full rounded-lg border border-white/15 bg-[#121f38]/95 px-3 py-2.5 text-base text-slate-100 placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/35 focus:border-sky-400/55 disabled:opacity-55';

const EMPTY_ROW: RecipientRow = { displayName: '', email: '', phone: '' };

type Props = {
  variant?: 'page' | 'modal';
  onClose?: () => void;
  onIssued?: () => void;
  fullFormHref?: string;
  onShowFullForm?: () => void;
};

export default function CounselorQuickSendForm({
  variant = 'page',
  onIssued,
  fullFormHref = '/counselor/assessments/new?full=1',
  onShowFullForm,
}: Props) {
  const router = useRouter();
  const { user, authPending, showLoginRequired } = useAuthResolved();
  const [templateId, setTemplateId] = useState<CounselorSendTemplateId | null>(null);
  const [customCohortName, setCustomCohortName] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState(QUICK_SEND_MESSAGE);
  const [manualRows, setManualRows] = useState<RecipientRow[]>([{ ...EMPTY_ROW }]);
  const [fileRows, setFileRows] = useState<RecipientRow[]>([]);
  const [fileLabel, setFileLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [firstSendTrialEligible, setFirstSendTrialEligible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const welcomeTextareaRef = useRef<HTMLTextAreaElement>(null);
  const recipientNameRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!user) return;
    fetchMyCredits(5)
      .then((data) => {
        const eligible = Boolean(data.firstSendTrialEligible);
        setFirstSendTrialEligible(eligible);
        if (eligible) setTemplateId('stress');
      })
      .catch(() => setFirstSendTrialEligible(false));
  }, [user]);

  const template = COUNSELOR_SEND_TEMPLATES.find((t) => t.id === templateId) ?? null;
  const testList = template ? resolveTemplateTestList(template) : [];
  const recipients = useMemo(() => mergeRecipients(manualRows, fileRows), [manualRows, fileRows]);

  const finish = (assessmentId: string) => {
    if (variant === 'modal') {
      onIssued?.();
      return;
    }
    const href = assessmentId
      ? `/counselor/assessments/progress?assessmentId=${encodeURIComponent(assessmentId)}`
      : '/counselor/assessments';
    pushWithAuthSession(router, href);
  };

  const updateRow = (index: number, field: keyof RecipientRow, value: string) => {
    setManualRows((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: field === 'phone' ? formatPhoneDisplay(value) || value : value,
      };
      return next;
    });
  };

  const addRow = (focusNewRow = false) => {
    setManualRows((prev) => {
      const next = [...prev, { ...EMPTY_ROW }];
      if (focusNewRow) {
        const newIdx = next.length - 1;
        setTimeout(() => recipientNameRefs.current[newIdx]?.focus(), 0);
      }
      return next;
    });
  };

  const handleNameBlur = (index: number, value: string) => {
    const name = value.trim();
    if (!name) return;
    setManualRows((prev) => {
      if (index !== prev.length - 1) return prev;
      return [...prev, { ...EMPTY_ROW }];
    });
  };

  const removeRow = (index: number) => {
    setManualRows((prev) => {
      if (prev.length <= 1) return [{ ...EMPTY_ROW }];
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleRecipientFieldKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || loading) return;
    e.preventDefault();
    addRow(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileLabel(file.name);
    try {
      const parsed = await parseRecipientFile(file);
      setFileRows(parsed);
      setError('');
    } catch {
      setFileRows([]);
      setFileLabel('');
      setError('파일을 읽지 못했습니다. CSV·텍스트·엑셀 형식을 확인해 주세요.');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!template || testList.length === 0) {
      setError('검사 세트를 하나 골라 주세요.');
      return;
    }
    if (templateId === 'custom' && !customCohortName.trim()) {
      setError('기관/단체/그룹명을 입력해 주세요.');
      return;
    }
    if (recipients.length === 0) {
      setError('내담자 1명 이상(이름·이메일 또는 휴대폰)을 입력하거나 명단을 첨부해 주세요.');
      return;
    }
    if (recipients.length > GROUP_RECIPIENT_MAX) {
      setError(`한 번에 최대 ${GROUP_RECIPIENT_MAX.toLocaleString('ko-KR')}명까지 보낼 수 있습니다.`);
      return;
    }

    const invalid = recipients.find((r) => {
      const emailNorm = r.email.trim();
      const phoneNorm = normalizeRecipientPhone(r.phone);
      if (emailNorm && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) return true;
      return !phoneNorm && !emailNorm;
    });
    if (invalid) {
      if (invalid.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invalid.email.trim())) {
        setError(`「${invalid.displayName}」님의 이메일 형식을 확인해 주세요.`);
      } else {
        setError(`「${invalid.displayName}」님의 휴대폰 또는 이메일을 입력해 주세요.`);
      }
      return;
    }

    const message = welcomeMessage.trim() || QUICK_SEND_MESSAGE;
    const firstName = recipients[0].displayName.trim();
    const cohortName =
      templateId === 'custom'
        ? customCohortName.trim().slice(0, 120)
        : firstName.slice(0, 120);
    const templateLabel =
      templateId === 'custom'
        ? customCohortName.trim() || '맞춤'
        : template.name;
    const title =
      recipients.length > 1
        ? `${templateLabel} · ${recipients.length}명`.slice(0, 200)
        : `${templateLabel} · ${firstName}`.slice(0, 200);

    setLoading(true);
    try {
      const result = await bulkCreateClientPortals({
        cohortName,
        title,
        welcomeMessage: message,
        testList,
        codeCategory: templateId === 'custom' ? 'group' : 'individual',
        rows: recipients.map((r) => ({
          displayName: r.displayName.trim(),
          phone: normalizeRecipientPhone(r.phone) || undefined,
          email: r.email.trim() || undefined,
          queueNotify: true,
        })),
        queueNotify: true,
      });

      const assessmentId = result.assessmentId || '';
      const accessCode = result.joinAccessCode || result.created?.[0]?.joinAccessCode || '';
      const createdCount = result.created?.length ?? recipients.length;
      if (assessmentId && accessCode) {
        const optimistic: CounselorAssessment = {
          id: assessmentId,
          accessCode,
          counselorId: user?.uid || '',
          title,
          issueType: 'individual',
          targetAudience: '개인',
          welcomeMessage: message,
          testList,
          createdAt: new Date().toISOString(),
          cohortName,
          codeCategory: templateId === 'custom' ? 'group' : 'individual',
          dispatchSentCount: createdCount,
          dispatchFailedCount: 0,
          testCompleteCount: 0,
          testIncompleteCount: createdCount,
        };
        prependCounselorAssessmentToListCache(optimistic);
      }
      if (result.credits?.trial) {
        setFirstSendTrialEligible(false);
      }
      finish(assessmentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : '보내기에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (authPending) {
    return <AuthLoadingState className="py-8" message="로그인 정보를 로딩중…" />;
  }
  if (showLoginRequired) {
    return (
      <AuthRequiredState description="로그인한 상태에서 검사를 보낼 수 있습니다." />
    );
  }

  const fullLink = onShowFullForm ? (
    <button
      type="button"
      onClick={onShowFullForm}
      className="text-xs text-sky-400 hover:text-sky-300"
    >
      여러 명·엑셀로 보내기
    </button>
  ) : (
    <AuthLink href={fullFormHref} className="text-xs text-sky-400 hover:text-sky-300">
      여러 명·엑셀로 보내기
    </AuthLink>
  );

  return (
    <CounselorPageSection
      title="검사 보내기"
      dense
      description={
        firstSendTrialEligible
          ? '첫 1명 보내기는 검사 크레딧을 차감하지 않습니다. 세트 고르기 → 이름·연락처 → 보내기.'
          : '세트 고르기 → 이름·연락처 → 보내기. 내담자는 가입하지 않습니다.'
      }
      toolbar={fullLink}
    >
      {firstSendTrialEligible ? (
        <p className="mx-auto mb-3 max-w-2xl rounded-lg border border-emerald-500/25 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200">
          첫 검사 보내기는 무료입니다. 「스트레스」는 3분 마음 체크(6문항)로 부담 없이 시작할 수 있습니다.
        </p>
      ) : null}
      <form onSubmit={handleSend} className="mx-auto flex max-w-2xl flex-col gap-5 p-1">
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-200">1. 어떤 검사인가요?</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {COUNSELOR_SEND_TEMPLATES.map((item) => {
              const active = templateId === item.id;
              const recommend = firstSendTrialEligible && item.id === 'stress';

              if (item.customOrgInput) {
                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border px-3 py-4 transition-colors ${
                      active
                        ? 'border-sky-400/60 bg-sky-500/20'
                        : 'border-white/12 bg-[#121f38]/80 hover:border-sky-400/30'
                    }`}
                  >
                    <div className="relative min-h-[2.75rem]">
                      {!customCohortName.trim() ? (
                        <span
                          className="pointer-events-none absolute inset-0 flex items-center text-sm font-semibold text-slate-600"
                          aria-hidden
                        >
                          기관/단체/그룹명
                        </span>
                      ) : null}
                      <input
                        type="text"
                        value={customCohortName}
                        onChange={(e) => {
                          setCustomCohortName(e.target.value);
                          setTemplateId('custom');
                        }}
                        onFocus={() => setTemplateId('custom')}
                        maxLength={120}
                        disabled={loading}
                        className={`relative w-full bg-transparent text-base font-bold outline-none ${
                          active ? 'text-white' : 'text-slate-200'
                        }`}
                        aria-label="기관/단체/그룹명"
                      />
                    </div>
                    <span className="mt-1 block text-xs text-slate-400">{item.description}</span>
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={loading}
                  onClick={() => setTemplateId(item.id)}
                  className={`rounded-xl border px-3 py-4 text-left transition-colors ${
                    active
                      ? 'border-sky-400/60 bg-sky-500/20 text-white'
                      : 'border-white/12 bg-[#121f38]/80 text-slate-200 hover:border-sky-400/30'
                  }`}
                >
                  <span className="block text-base font-bold leading-snug">
                    {item.name}
                    {recommend ? (
                      <span className="ml-1 text-[10px] font-medium text-emerald-300">첫 보내기 추천</span>
                    ) : null}
                  </span>
                  <span className="mt-1 block text-xs text-slate-400">{item.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-200">2. 누구에게 보낼까요?</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="shrink-0 text-xs text-sky-300 transition hover:text-sky-200 disabled:opacity-50"
            >
              명단 첨부하기
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,.tsv,.xlsx,.xls,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="mb-1.5 hidden gap-3 text-xs text-slate-400 sm:grid sm:grid-cols-3">
            <span>이름</span>
            <span>휴대폰</span>
            <span>이메일</span>
          </div>
          {fileLabel ? (
            <p className="mb-2 text-xs text-sky-300/90">
              첨부: {fileLabel}
              {fileRows.length > 0 ? ` · ${fileRows.length.toLocaleString('ko-KR')}명` : ''}
            </p>
          ) : null}
          <div className="space-y-2">
            {manualRows.map((row, idx) => (
              <div key={idx} className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs text-slate-400">이름 {idx + 1}</span>
                  <div className="relative">
                    <input
                      ref={(el) => {
                        recipientNameRefs.current[idx] = el;
                      }}
                      className={`${INPUT} pr-9`}
                      value={row.displayName}
                      onChange={(e) => updateRow(idx, 'displayName', e.target.value)}
                      onBlur={(e) => handleNameBlur(idx, e.target.value)}
                      onKeyDown={handleRecipientFieldKeyDown}
                      placeholder={`이름 ${idx + 1}`}
                      autoComplete="name"
                      disabled={loading}
                      aria-label={`이름 ${idx + 1}`}
                    />
                    {manualRows.length > 1 || row.displayName.trim() ? (
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        disabled={loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:bg-white/10 hover:text-red-300 disabled:opacity-50"
                        aria-label={`이름 ${idx + 1} 줄 삭제`}
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs text-slate-400 sm:hidden">휴대폰</span>
                  <input
                    className={INPUT}
                    value={row.phone}
                    onChange={(e) => updateRow(idx, 'phone', e.target.value)}
                    onKeyDown={handleRecipientFieldKeyDown}
                    placeholder="010-0000-0000"
                    inputMode="tel"
                    autoComplete="tel"
                    disabled={loading}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs text-slate-400 sm:hidden">이메일</span>
                  <input
                    className={INPUT}
                    type="email"
                    value={row.email}
                    onChange={(e) => updateRow(idx, 'email', e.target.value)}
                    onKeyDown={handleRecipientFieldKeyDown}
                    placeholder="name@example.com"
                    autoComplete="email"
                    disabled={loading}
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <p className="text-xs font-medium text-slate-400">안내 문구</p>
            <WelcomeMessageSampleHoverPicker
              disabled={loading}
              tooltipPlacement="top"
              onPick={(text) => setWelcomeMessage(text)}
            />
          </div>
          <textarea
            ref={welcomeTextareaRef}
            rows={3}
            className={`${INPUT} mt-2 min-h-[4.5rem] resize-y text-sm leading-relaxed`}
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder="내담자에게 보여줄 안내 문구"
            disabled={loading}
          />
        </div>

        {error ? (
          <p className="text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {loading ? '보내는 중…' : '3. 보내기'}
        </button>
      </form>
      <CounselorActionProgressOverlay
        open={loading}
        title="보내는 중…"
        message={`${Math.max(recipients.length, 1)}명의 내담자에게 검사진행 링크를 보내고 있습니다.`}
      />
    </CounselorPageSection>
  );
}
