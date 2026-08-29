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
import CounselorQuickSendTestPickerModal from '@/components/counselor/CounselorQuickSendTestPickerModal';
import AuthLink from '@/components/auth/AuthLink';
import { counselorAssessmentTestOptions } from '@/data/counselorAssessmentTests';
import {
  COUNSELOR_SEND_TEMPLATES,
  QUICK_SEND_MESSAGE,
  resolveTemplateTestList,
  type CounselorSendTemplateId,
} from '@/data/counselorSendTemplates';
import { fetchMyCredits } from '@/lib/commerceApi';
import { GROUP_RECIPIENT_MAX } from '@/lib/groupRecipientLimits';
import {
  downloadGroupRecipientSampleCsv,
  downloadGroupRecipientSampleTxt,
  getGroupRecipientSamplePreviewText,
} from '@/lib/groupRecipientSampleDownload';
import {
  formatRecipientRowsPreview,
  mergeRecipients,
  parseRecipientFile,
  type RecipientRow,
} from '@/lib/recipientImport';

const INPUT =
  'w-full rounded-lg border border-white/15 bg-[#121f38]/95 px-3 py-2.5 text-base text-slate-100 placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/35 focus:border-sky-400/55 disabled:opacity-55';

const EMPTY_ROW: RecipientRow = { displayName: '', email: '', phone: '' };

function templateCardBorder(active: boolean): string {
  return active
    ? 'border-white bg-sky-500/15'
    : 'border-white/10 bg-[#121f38]/80 hover:border-white';
}

type Props = {
  variant?: 'page' | 'modal';
  onClose?: () => void;
  onIssued?: () => void;
  fullFormHref?: string;
  onShowFullForm?: () => void;
};

export default function CounselorQuickSendForm({
  variant = 'page',
  onClose,
  onIssued,
  fullFormHref = '/counselor/assessments/new?full=1',
  onShowFullForm,
}: Props) {
  const router = useRouter();
  const { user, authPending, showLoginRequired } = useAuthResolved();
  const [templateId, setTemplateId] = useState<CounselorSendTemplateId | null>(null);
  const [customCohortName, setCustomCohortName] = useState('');
  const [customCohortFocused, setCustomCohortFocused] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState(QUICK_SEND_MESSAGE);
  const [showWelcomeHint, setShowWelcomeHint] = useState(false);
  const [customTestIds, setCustomTestIds] = useState<Set<string>>(() => new Set(['generic']));
  const [testPickerOpen, setTestPickerOpen] = useState(false);
  const [manualRows, setManualRows] = useState<RecipientRow[]>([{ ...EMPTY_ROW }]);
  const [fileRows, setFileRows] = useState<RecipientRow[]>([]);
  const [fileLabel, setFileLabel] = useState('');
  const [samplePreviewKind, setSamplePreviewKind] = useState<'txt' | 'csv' | null>(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<{ assessmentId: string } | null>(null);
  const [error, setError] = useState('');
  const [firstSendTrialEligible, setFirstSendTrialEligible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const welcomeTextareaRef = useRef<HTMLTextAreaElement>(null);
  const customCohortTextareaRef = useRef<HTMLTextAreaElement>(null);
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
  const customSelectedTests = useMemo(
    () => counselorAssessmentTestOptions.filter((t) => customTestIds.has(t.testId)),
    [customTestIds],
  );
  const testList = useMemo(() => {
    if (!template) return [];
    if (templateId === 'custom') {
      return counselorAssessmentTestOptions
        .filter((t) => customTestIds.has(t.testId))
        .map((t) => ({ testId: t.testId, name: t.name }));
    }
    return resolveTemplateTestList(template);
  }, [template, templateId, customTestIds]);
  const recipients = useMemo(() => mergeRecipients(manualRows, fileRows), [manualRows, fileRows]);

  const filePreviewText = useMemo(
    () => (fileRows.length > 0 ? formatRecipientRowsPreview(fileRows) : ''),
    [fileRows],
  );

  const filePreviewLayout = useMemo(() => {
    if (!filePreviewText) return null;
    const lines = filePreviewText.split('\n');
    const lineCount = lines.length;
    const longestLine = lines.reduce((max, line) => Math.max(max, line.length), 0);
    const widthCh = Math.min(Math.max(longestLine + 2, 28), 120);
    return { widthCh, lineCount };
  }, [filePreviewText]);

  const samplePreviewText = useMemo(
    () => (samplePreviewKind ? getGroupRecipientSamplePreviewText() : ''),
    [samplePreviewKind],
  );

  const samplePreviewLayout = useMemo(() => {
    if (!samplePreviewText) return null;
    const lines = samplePreviewText.split('\n');
    const lineCount = lines.length;
    const longestLine = lines.reduce((max, line) => Math.max(max, line.length), 0);
    const widthCh = Math.min(Math.max(longestLine + 2, 32), 120);
    return { widthCh, lineCount };
  }, [samplePreviewText]);

  const finish = (assessmentId: string) => {
    const href = assessmentId
      ? `/counselor/assessments/progress?assessmentId=${encodeURIComponent(assessmentId)}`
      : '/counselor/assessments';
    if (variant === 'modal') {
      onClose?.();
      onIssued?.();
    }
    pushWithAuthSession(router, href);
  };

  const handleSendConfirm = () => {
    const assessmentId = sendSuccess?.assessmentId || '';
    setSendSuccess(null);
    finish(assessmentId);
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
    if (templateId === 'custom' && customTestIds.size === 0) {
      setError('포함할 검사를 하나 이상 선택해 주세요.');
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
        ? templateLabel.slice(0, 200)
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
      setSendSuccess({ assessmentId });
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
      className="flex min-h-0 flex-1"
      description={
        firstSendTrialEligible
          ? '첫 1명 보내기는 검사 크레딧을 차감하지 않습니다. 1. 검사 선택 → 2. 이름·연락처 입력 → 3. 보내기'
          : '1. 검사 선택 → 2. 이름·연락처 입력 → 3. 보내기'
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
            {COUNSELOR_SEND_TEMPLATES.map((item, templateIndex) => {
              const active = templateId === item.id;
              const recommend = firstSendTrialEligible && item.id === 'stress';
              const templateOrder = templateIndex + 1;

              if (item.customOrgInput) {
                return (
                  <div
                    key={item.id}
                    className={`flex aspect-square flex-col rounded-xl border px-3 py-3 text-center transition-colors ${templateCardBorder(active)}`}
                  >
                    <span className="shrink-0 text-[10px] font-semibold tabular-nums text-slate-500">
                      {templateOrder}
                    </span>
                    <div
                      className="relative min-h-0 flex-1 cursor-text"
                      onClick={() => {
                        setTemplateId('custom');
                        customCohortTextareaRef.current?.focus();
                      }}
                    >
                      {!customCohortName.trim() && !customCohortFocused ? (
                        <span
                          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center leading-snug"
                          aria-hidden
                        >
                          <span className="text-base font-semibold text-slate-400">기관/단체/그룹명</span>
                          <span className="mt-1 text-sm font-medium text-slate-300">입력하기</span>
                        </span>
                      ) : null}
                      <textarea
                        ref={customCohortTextareaRef}
                        value={customCohortName}
                        onChange={(e) => {
                          setCustomCohortName(e.target.value);
                          setTemplateId('custom');
                        }}
                        onFocus={() => {
                          setCustomCohortFocused(true);
                          setTemplateId('custom');
                        }}
                        onBlur={() => setCustomCohortFocused(false)}
                        maxLength={120}
                        rows={3}
                        disabled={loading}
                        className={`relative h-full w-full resize-none overflow-hidden break-words bg-transparent text-center text-sm font-bold leading-snug caret-white outline-none ${
                          active ? 'text-white' : 'text-slate-200'
                        }`}
                        aria-label="기관/단체/그룹명"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setTemplateId('custom');
                        setTestPickerOpen(true);
                      }}
                      className="mt-1 shrink-0 text-center text-sm font-semibold leading-snug text-sky-300 underline-offset-2 hover:text-sky-200 hover:underline disabled:opacity-50"
                    >
                      검사 선택
                      {customTestIds.size > 0 ? ` (${customTestIds.size}개)` : ''}
                    </button>
                    {customSelectedTests.length > 0 ? (
                      <ul className="mt-1 max-h-16 space-y-0.5 overflow-hidden text-[10px] leading-tight text-slate-400">
                        {customSelectedTests.slice(0, 2).map((t, idx) => (
                          <li key={t.testId} className="truncate">
                            {idx + 1}. {t.name}
                          </li>
                        ))}
                        {customSelectedTests.length > 2 ? (
                          <li>
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => {
                                setTemplateId('custom');
                                setTestPickerOpen(true);
                              }}
                              className="text-sky-300 underline-offset-2 hover:text-sky-200 hover:underline disabled:opacity-50"
                            >
                              +{customSelectedTests.length - 2} 확인
                            </button>
                          </li>
                        ) : null}
                      </ul>
                    ) : null}
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={loading}
                  onClick={() => setTemplateId(item.id)}
                  className={`flex aspect-square flex-col items-center justify-center rounded-xl border px-3 py-4 text-center transition-colors ${templateCardBorder(active)} ${
                    active ? 'text-white' : 'text-slate-200'
                  }`}
                >
                  <span className="mb-1 text-[10px] font-semibold tabular-nums text-slate-500">
                    {templateOrder}
                  </span>
                  <span className="block text-base font-bold leading-snug">
                    {item.name}
                    {recommend ? (
                      <span className="ml-1 block text-[10px] font-medium text-emerald-300 sm:inline">
                        첫 보내기 추천
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1 block text-xs text-slate-400">{item.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-200">2. 누구에게 보낼까요?</p>
          <div className="mb-1.5 hidden gap-3 text-xs text-slate-400 sm:grid sm:grid-cols-3">
            <span>이름</span>
            <span>휴대폰</span>
            <span>이메일</span>
          </div>
          <div className="space-y-2">
            {manualRows.map((row, idx) => (
              <div key={idx} className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs text-slate-400 sm:hidden">이름</span>
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
                      placeholder="이름"
                      autoComplete="name"
                      disabled={loading}
                      aria-label="이름"
                    />
                    {manualRows.length > 1 || row.displayName.trim() ? (
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        disabled={loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:bg-white/10 hover:text-red-300 disabled:opacity-50"
                        aria-label="이름 줄 삭제"
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

          <div className="relative z-20 mt-4 flex flex-col gap-2 overflow-visible border-t border-white/10 pt-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.tsv,.xlsx,.xls,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="relative" onMouseLeave={() => setSamplePreviewKind(null)}>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg border border-white/10 bg-[#101f38]/80 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800/80"
                  disabled={loading}
                >
                  텍스트/엑셀 파일 첨부하기
                </button>
                <span className="text-sm text-slate-400">샘플받기</span>
                <button
                  type="button"
                  onClick={downloadGroupRecipientSampleTxt}
                  onMouseEnter={() => setSamplePreviewKind('txt')}
                  onFocus={() => setSamplePreviewKind('txt')}
                  onBlur={() => setSamplePreviewKind(null)}
                  className="text-sm text-sky-300 transition hover:text-sky-200"
                  disabled={loading}
                >
                  (텍스트파일)
                </button>
                <button
                  type="button"
                  onClick={downloadGroupRecipientSampleCsv}
                  onMouseEnter={() => setSamplePreviewKind('csv')}
                  onFocus={() => setSamplePreviewKind('csv')}
                  onBlur={() => setSamplePreviewKind(null)}
                  className="text-sm text-sky-300 transition hover:text-sky-200"
                  disabled={loading}
                >
                  (엑셀파일)
                </button>
              </div>
              {samplePreviewKind && samplePreviewText && samplePreviewLayout ? (
                <div
                  className="pointer-events-none absolute bottom-full left-0 z-[120] mb-1.5 w-full rounded-lg border border-sky-500/40 bg-slate-950 p-3 text-left shadow-2xl"
                  role="tooltip"
                  style={{
                    width: `min(100%, ${samplePreviewLayout.widthCh}ch)`,
                  }}
                >
                  <p className="mb-2 text-xs font-semibold text-sky-300">
                    {samplePreviewKind === 'txt' ? '샘플 텍스트 미리보기' : '샘플 엑셀(CSV) 미리보기'}
                  </p>
                  <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-slate-200">
                    {samplePreviewText}
                  </pre>
                </div>
              ) : null}
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              첨부파일은 1개만 가능합니다. 최대 {GROUP_RECIPIENT_MAX.toLocaleString('ko-KR')}명
            </p>
            {fileLabel ? (
              <div
                className="rounded-lg border border-sky-500/25 bg-sky-950/25 px-3 py-2.5"
                role="status"
                aria-live="polite"
              >
                <p className="text-xs font-medium text-sky-300/90">첨부된 파일</p>
                <div className="relative mt-1 max-w-full">
                  <p
                    className="inline cursor-help break-all text-sm font-medium leading-snug text-white underline decoration-dotted decoration-sky-400/60 underline-offset-4"
                    onMouseEnter={() => setShowFilePreview(true)}
                    onMouseLeave={() => setShowFilePreview(false)}
                    onFocus={() => setShowFilePreview(true)}
                    onBlur={() => setShowFilePreview(false)}
                    tabIndex={0}
                    role="button"
                    aria-label={`${fileLabel} 파일 내용 미리보기`}
                  >
                    {fileLabel}
                  </p>
                  {showFilePreview && filePreviewText && filePreviewLayout ? (
                    <div
                      className="pointer-events-none absolute bottom-full left-0 z-[120] mb-2 w-max max-w-full rounded-lg border border-sky-500/40 bg-slate-950 p-3 text-left shadow-2xl"
                      role="tooltip"
                      style={{
                        width: `min(100%, ${filePreviewLayout.widthCh}ch)`,
                      }}
                    >
                      <p className="mb-2 text-xs font-semibold text-sky-300">파일 내용 미리보기</p>
                      <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-slate-200">
                        {filePreviewText}
                        {filePreviewText.length >= 4000 ? '\n… (일부만 표시)' : ''}
                      </pre>
                    </div>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  파일에서{' '}
                  <span className="font-semibold tabular-nums text-emerald-300">
                    {fileRows.length.toLocaleString('ko-KR')}
                  </span>
                  명 인식
                  {fileRows.length === 0 ? (
                    <span className="text-amber-300/90"> · 유효한 행이 없습니다</span>
                  ) : null}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <div
              className="relative"
              onMouseEnter={() => setShowWelcomeHint(true)}
              onMouseLeave={() => setShowWelcomeHint(false)}
            >
              <button
                type="button"
                disabled={loading}
                onClick={() => welcomeTextareaRef.current?.focus()}
                className="text-left text-xs font-medium text-slate-400 underline-offset-2 transition hover:text-slate-200 hover:underline disabled:opacity-50"
              >
                안내 문구
              </button>
              {showWelcomeHint ? (
                <div
                  className="pointer-events-none absolute left-0 bottom-full z-30 mb-1.5 w-[min(100vw-2rem,20rem)] rounded-lg border border-sky-500/40 bg-slate-950 p-3 text-left shadow-2xl"
                  role="tooltip"
                >
                  <p className="text-xs leading-relaxed text-slate-200">
                    내담자에게 보내는 안내 문구입니다. 아래 입력란에서 직접 수정하거나, 샘플을
                    클릭해 적용할 수 있습니다.
                  </p>
                </div>
              ) : null}
            </div>
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
        open={loading || Boolean(sendSuccess)}
        phase={sendSuccess ? 'success' : 'loading'}
        title={sendSuccess ? '발송 완료' : '보내는 중…'}
        message={
          sendSuccess
            ? '검사 링크 발송이 완료되었습니다. 확인을 누르면 상담진행 현황으로 이동합니다.'
            : `${Math.max(recipients.length, 1)}명의 내담자에게 검사진행 링크를 보내고 있습니다.`
        }
        notice={
          !sendSuccess ? '발송량에 따라 발송에 시간이 다소 소요될 수 있습니다.' : undefined
        }
        onConfirm={sendSuccess ? handleSendConfirm : undefined}
      />
      <CounselorQuickSendTestPickerModal
        open={testPickerOpen}
        selectedTestIds={customTestIds}
        onClose={() => setTestPickerOpen(false)}
        onConfirm={setCustomTestIds}
      />
    </CounselorPageSection>
  );
}
