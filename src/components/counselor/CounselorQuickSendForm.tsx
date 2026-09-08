'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { replaceWithAuthSession } from '@/utils/authSessionLifecycle';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';
import { bulkCreateClientPortals } from '@/lib/clientPortalApi';
import { prependCounselorAssessmentToListCache, type CounselorAssessment } from '@/lib/assessmentApi';
import {
  createPendingDispatchAssessmentId,
  finalizePendingDispatchIssue,
  registerPendingDispatchError,
  seedDispatchStatusBeforeIssue,
} from '@/lib/counselorDispatchSeed';
import { formatPhoneDisplay, normalizeRecipientPhone } from '@/lib/phoneFormat';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import CounselorSendStepBlock from '@/components/counselor/CounselorSendStepBlock';
import CounselorActionProgressOverlay from '@/components/counselor/CounselorActionProgressOverlay';
import WelcomeMessageSampleHoverPicker from '@/components/counselor/WelcomeMessageSampleHoverPicker';
import CounselorQuickSendTestPickerModal from '@/components/counselor/CounselorQuickSendTestPickerModal';
import AuthLink from '@/components/auth/AuthLink';
import { counselorAssessmentTestOptions } from '@/data/counselorAssessmentTests';
import {
  COUNSELOR_SEND_TEMPLATES,
  resolveTemplateTestList,
  resolveTemplateOrgFields,
  type CounselorSendTemplateId,
} from '@/data/counselorSendTemplates';
import { DEFAULT_WELCOME_MESSAGE } from '@/lib/welcomeMessageSamples';
import {
  CUSTOM_ORG_INPUT_DRAFT,
  focusCustomOrgTextarea,
  formatCustomOrgDisplay,
  isCustomOrgDraft,
  parseCustomOrgInput,
  resolveCounselorAffiliationTitle,
  resolveCustomOrgFocusFromClick,
} from '@/lib/counselorOrgInput';
import UsageEndDateField from '@/components/counselor/UsageEndDateField';
import { loadCounselorOperationAffiliation } from '@/lib/firestore/counselorRegistration';
import { fetchMyCredits } from '@/lib/commerceApi';
import { GROUP_RECIPIENT_MAX } from '@/lib/groupRecipientLimits';
import {
  downloadGroupRecipientSampleCsv,
  downloadGroupRecipientSampleTxt,
  getGroupRecipientSamplePreviewText,
} from '@/lib/groupRecipientSampleDownload';
import PublicClaimChannelField from '@/components/counselor/PublicClaimChannelField';
import {
  PUBLIC_CLAIM_CHANNEL_EMAIL,
  PUBLIC_CLAIM_CHANNEL_PHONE_EMAIL,
  type PublicClaimChannel,
} from '@/lib/publicClaimDelivery';
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
    ? 'border-sky-300/50 bg-gradient-to-br from-sky-500/25 via-sky-600/15 to-indigo-600/20 shadow-md shadow-sky-950/30 ring-1 ring-sky-400/30'
    : 'border-white/10 bg-[#121f38]/80 hover:border-sky-400/25 hover:bg-gradient-to-br hover:from-sky-950/20 hover:to-indigo-950/10';
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
  const [welcomeMessage, setWelcomeMessage] = useState(DEFAULT_WELCOME_MESSAGE);
  const [usageEndDate, setUsageEndDate] = useState('');
  const [customTestIds, setCustomTestIds] = useState<Set<string>>(() => new Set(['generic']));
  const [testPickerOpen, setTestPickerOpen] = useState(false);
  const [manualRows, setManualRows] = useState<RecipientRow[]>([{ ...EMPTY_ROW }]);
  const [fileRows, setFileRows] = useState<RecipientRow[]>([]);
  const [fileLabel, setFileLabel] = useState('');
  const [samplePreviewKind, setSamplePreviewKind] = useState<'txt' | 'csv' | null>(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [sendOverlay, setSendOverlay] = useState<{ kind: 'pending' } | { kind: 'done'; assessmentId: string } | null>(
    null,
  );
  const sendLocked = Boolean(sendOverlay);
  const [error, setError] = useState('');
  const issuePromiseRef = useRef<Promise<string> | null>(null);
  const pendingAssessmentIdRef = useRef('');
  const resolvedAssessmentIdRef = useRef('');
  const [firstSendTrialEligible, setFirstSendTrialEligible] = useState(false);
  const [counselorAffiliation, setCounselorAffiliation] = useState('');
  const [publicClaimChannel, setPublicClaimChannel] = useState<PublicClaimChannel>(
    PUBLIC_CLAIM_CHANNEL_EMAIL,
  );
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
        if (eligible) setTemplateId('free');
      })
      .catch(() => setFirstSendTrialEligible(false));
  }, [user]);

  useEffect(() => {
    if (!user?.uid) {
      setCounselorAffiliation('');
      return;
    }
    let cancelled = false;
    loadCounselorOperationAffiliation(user.uid, user.displayName || undefined)
      .then((affiliation) => {
        if (cancelled) return;
        setCounselorAffiliation(affiliation);
      })
      .catch(() => {
        if (!cancelled) {
          setCounselorAffiliation(
            resolveCounselorAffiliationTitle({ displayName: user.displayName || undefined }),
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user?.uid, user?.displayName]);

  const template = COUNSELOR_SEND_TEMPLATES.find((t) => t.id === templateId) ?? null;
  const isFreeTemplate = templateId === 'free';
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
    const longestLine = lines.reduce((max, line) => Math.max(max, line.length), 0);
    const widthCh = Math.min(Math.max(longestLine + 2, 32), 120);
    return { widthCh };
  }, [samplePreviewText]);

  const finish = (assessmentId: string) => {
    const href = isFreeTemplate
      ? '/counselor/assessments'
      : assessmentId
        ? `/counselor/assessments/progress?assessmentId=${encodeURIComponent(assessmentId)}`
        : '/counselor/assessments';
    replaceWithAuthSession(router, href);
    if (variant === 'modal') {
      onIssued?.();
    }
  };

  const handleSendConfirm = () => {
    const navId =
      resolvedAssessmentIdRef.current.trim() ||
      pendingAssessmentIdRef.current.trim();
    if (navId) finish(navId);
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
    if (e.key !== 'Enter' || sendOverlay) return;
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

    let affiliationForSend = counselorAffiliation;
    if (user?.uid && templateId !== 'custom') {
      try {
        affiliationForSend = await loadCounselorOperationAffiliation(
          user.uid,
          user.displayName || undefined,
        );
        setCounselorAffiliation(affiliationForSend);
      } catch {
        // 초기 로드 값으로 계속 진행
      }
    }

    if (templateId === 'custom') {
      const parsed = parseCustomOrgInput(customCohortName);
      if (!parsed.groupName.trim()) {
        setError('그룹/기관명을 1자 이상 입력해 주세요.');
        return;
      }
      if (!parsed.affiliation.trim()) {
        setError('소속을 입력해 주세요.');
        return;
      }
    }
    if (templateId === 'custom' && customTestIds.size === 0) {
      setError('포함할 검사를 하나 이상 선택해 주세요.');
      return;
    }
    if (templateId !== 'custom') {
      const orgPreview = resolveTemplateOrgFields(template, affiliationForSend);
      if (!orgPreview.title.trim()) {
        setError('소속(기관 상호명 또는 상담사 이름)을 프로필에 등록해 주세요.');
        return;
      }
    }
    const message = welcomeMessage.trim() || DEFAULT_WELCOME_MESSAGE;

    let cohortName = '';
    let title = '';
    if (templateId === 'custom') {
      const parsed = parseCustomOrgInput(customCohortName);
      cohortName = parsed.groupName.slice(0, 120);
      title = parsed.affiliation.slice(0, 200);
    } else {
      const org = resolveTemplateOrgFields(template, affiliationForSend);
      cohortName = org.cohortName;
      title = org.title;
    }

    const pendingId = createPendingDispatchAssessmentId();
    pendingAssessmentIdRef.current = pendingId;
    resolvedAssessmentIdRef.current = '';
    setSendOverlay({ kind: 'pending' });
    setError('');

    issuePromiseRef.current = (async () => {
      const result = await bulkCreateClientPortals({
        cohortName,
        title,
        welcomeMessage: message,
        usageEndDate: usageEndDate.trim() || undefined,
        testList,
        codeCategory: templateId === 'custom' ? 'group' : 'individual',
        publicClaimChannel,
        publicClaimOnly: true,
        rows: [],
        queueNotify: false,
      });

      const assessmentId = result.assessmentId || '';
      const accessCode = result.joinAccessCode || result.created?.[0]?.joinAccessCode || '';
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
          dispatchSentCount: 0,
          dispatchFailedCount: 0,
          testCompleteCount: 0,
          testIncompleteCount: 0,
          publicClaimChannel,
        };
        prependCounselorAssessmentToListCache(optimistic);
      }
      if (result.credits?.trial) {
        setFirstSendTrialEligible(false);
      }
      resolvedAssessmentIdRef.current = assessmentId;
      setSendOverlay({ kind: 'done', assessmentId: pendingId });
      return assessmentId;
    })().catch((err) => {
      const message = err instanceof Error ? err.message : '보내기에 실패했습니다.';
      registerPendingDispatchError(pendingId, message);
      setSendOverlay(null);
      setError(message);
      throw err;
    });
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
      title="상담코드 생성"
      dense
      className="flex min-h-0 flex-1"
      description="1. 검사 선택 → 2. 코드전송 방법·안내 → 3. 상담코드 생성"
      toolbar={fullLink}
    >
      {firstSendTrialEligible ? (
        <p className="mx-auto mb-3 max-w-2xl rounded-lg border border-emerald-500/25 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200">
          첫 검사 보내기는 무료입니다. 「무료검사」로 상담코드를 만들면 내담자가 직접 나의코드를 받을 수 있습니다.
        </p>
      ) : null}
      <form onSubmit={handleSend} className="mx-auto flex max-w-2xl flex-col gap-2.5 p-1">
        <CounselorSendStepBlock
          step={1}
          title="어떤 검사인가요?"
          subtitle="보낼 검사 유형을 선택하세요"
          compact
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {COUNSELOR_SEND_TEMPLATES.map((item, templateIndex) => {
              const active = templateId === item.id;
              const recommend = firstSendTrialEligible && item.id === 'free';
              const templateOrder = templateIndex + 1;

              if (item.customOrgInput) {
                const parsedCustom = parseCustomOrgInput(customCohortName);
                const customDisplay = formatCustomOrgDisplay(parsedCustom);
                const isDraft = isCustomOrgDraft(customCohortName);
                const showCustomPlaceholder = isDraft && !customCohortFocused;
                const showCustomSummary = !customCohortFocused && !isDraft && Boolean(customDisplay);
                const hideCustomText = showCustomPlaceholder || showCustomSummary;

                return (
                  <div
                    key={item.id}
                    className={`flex aspect-square flex-col rounded-xl border px-3 py-3 text-center transition-colors ${templateCardBorder(active)}`}
                  >
                    <span className="flex h-7 shrink-0 flex-col items-center justify-end">
                      <span className="text-[10px] font-semibold tabular-nums text-slate-500">
                        {templateOrder}
                      </span>
                      <span className="mt-1 block h-px w-full bg-white/15" aria-hidden />
                    </span>
                    <div
                      className="relative min-h-0 flex-1 cursor-text text-left"
                      onClick={() => {
                        setTemplateId('custom');
                        if (!customCohortName.trim()) {
                          focusCustomOrgTextarea(
                            customCohortTextareaRef.current,
                            customCohortName,
                            setCustomCohortName,
                            'group',
                          );
                        }
                      }}
                    >
                      {showCustomPlaceholder ? (
                        <span
                          className="pointer-events-none absolute inset-0 flex flex-col justify-center px-1 text-sm leading-snug text-slate-400"
                          aria-hidden
                        >
                          <span>{CUSTOM_ORG_INPUT_DRAFT.split('\n')[0]}</span>
                          <span className="mt-1">{CUSTOM_ORG_INPUT_DRAFT.split('\n')[1]}</span>
                        </span>
                      ) : showCustomSummary && customDisplay ? (
                        <span
                          className={`pointer-events-none absolute inset-0 flex items-center justify-center px-1 text-center text-sm font-bold leading-snug ${
                            active ? 'text-white' : 'text-slate-200'
                          }`}
                          aria-hidden
                        >
                          {customDisplay}
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
                          if (!customCohortName.trim()) {
                            focusCustomOrgTextarea(
                              customCohortTextareaRef.current,
                              customCohortName,
                              setCustomCohortName,
                              'group',
                            );
                          }
                        }}
                        onBlur={() => setCustomCohortFocused(false)}
                        onClick={(e) => {
                          const target = resolveCustomOrgFocusFromClick(e.currentTarget, e.clientY);
                          focusCustomOrgTextarea(
                            e.currentTarget,
                            customCohortName,
                            setCustomCohortName,
                            target,
                          );
                        }}
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter' || e.shiftKey) return;
                          const parsed = parseCustomOrgInput(customCohortName);
                          if (!parsed.groupName.trim()) return;
                          e.preventDefault();
                          focusCustomOrgTextarea(
                            customCohortTextareaRef.current,
                            customCohortName,
                            setCustomCohortName,
                            'affiliation',
                          );
                        }}
                        maxLength={320}
                        rows={4}
                        disabled={sendLocked}
                        className={`relative h-full w-full resize-none overflow-hidden break-words bg-transparent text-left text-sm leading-snug caret-white outline-none ${
                          hideCustomText
                            ? 'text-transparent'
                            : active
                              ? 'text-white'
                              : 'text-slate-200'
                        }`}
                        aria-label="그룹명 및 소속"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={sendLocked}
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
                              disabled={sendLocked}
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
                  disabled={sendLocked}
                  onClick={() => setTemplateId(item.id)}
                  className={`flex aspect-square flex-col items-center justify-center rounded-xl border px-3 py-4 text-center transition-colors ${templateCardBorder(active)} ${
                    active ? 'text-white' : 'text-slate-200'
                  }`}
                >
                  <span className="flex h-7 shrink-0 flex-col items-center justify-end">
                    <span className="mb-0 text-[10px] font-semibold tabular-nums text-slate-500">
                      {templateOrder}
                    </span>
                    <span className="mt-1 block h-px w-full bg-white/15" aria-hidden />
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
        </CounselorSendStepBlock>

        <CounselorSendStepBlock
          step={2}
          title="상담코드 설정"
          subtitle="코드전송 방법과 안내를 확인한 뒤 상담코드를 생성합니다"
          compact
          allowOverflow
        >
          <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-4">
            <p className="text-sm font-semibold text-emerald-100">내담자 없이 상담코드만 생성</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              생성된 상담코드를 내담자에게 알려 주면, 홈페이지{' '}
              <span className="font-medium text-white">무료 검사코드 받기</span>에서 이름(가명)·연락처를 입력해
              나의코드와 비밀번호를 받을 수 있습니다.
            </p>
          </div>
          <PublicClaimChannelField
            value={publicClaimChannel}
            onChange={setPublicClaimChannel}
            disabled={sendLocked}
            className="mb-3 mt-4"
            allowedChannels={[PUBLIC_CLAIM_CHANNEL_EMAIL, PUBLIC_CLAIM_CHANNEL_PHONE_EMAIL]}
          />
          <div className="mb-3">
            <label htmlFor="quick-send-usage-end" className="mb-1.5 block text-sm font-semibold text-slate-200">
              사용종료일 (선택)
            </label>
            <UsageEndDateField
              id="quick-send-usage-end"
              value={usageEndDate}
              onChange={setUsageEndDate}
              disabled={sendLocked}
            />
            <p className="mt-1.5 text-xs text-slate-500">비워두면 무기한 사용 가능합니다.</p>
          </div>
          <div className="overflow-visible">
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 overflow-visible">
              <label htmlFor="quick-send-welcome" className="text-xs font-medium text-slate-400">
                안내 문구
              </label>
              <WelcomeMessageSampleHoverPicker
                disabled={sendLocked}
                tooltipPlacement="top"
                onPick={(text) => setWelcomeMessage(text)}
              />
            </div>
            <textarea
              id="quick-send-welcome"
              ref={welcomeTextareaRef}
              rows={2}
              className={`${INPUT} min-h-[3.75rem] resize-y text-sm leading-relaxed`}
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="내담자에게 보여줄 안내 문구"
              disabled={sendLocked}
            />
          </div>

          {error ? (
            <p className="mt-2 text-sm text-red-300" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={sendLocked}
            className="mt-3 w-full rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/40 transition hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 disabled:opacity-50"
          >
            상담코드 생성
          </button>
        </CounselorSendStepBlock>
      </form>
      <CounselorActionProgressOverlay
        open={Boolean(sendOverlay)}
        phase={sendOverlay?.kind === 'done' ? 'success' : 'loading'}
        title={sendOverlay?.kind === 'done' ? '생성 완료' : '생성 중…'}
        message={
          sendOverlay?.kind === 'done'
            ? '상담코드가 생성되었습니다.'
            : '잠시만 기다려 주세요.'
        }
        hint={sendOverlay?.kind !== 'done' ? undefined : undefined}
        onConfirm={sendOverlay?.kind === 'done' ? handleSendConfirm : undefined}
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
