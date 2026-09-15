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
import { resolveCounselorAffiliationTitle } from '@/lib/counselorOrgInput';
import UsageEndDateField from '@/components/counselor/UsageEndDateField';
import { loadCounselorOperationAffiliation } from '@/lib/firestore/counselorRegistration';
import { fetchMyCredits } from '@/lib/commerceApi';
import { GROUP_RECIPIENT_MAX } from '@/lib/groupRecipientLimits';
import {
  downloadGroupRecipientSampleCsv,
  downloadGroupRecipientSampleTxt,
  getGroupRecipientSamplePreviewText,
} from '@/lib/groupRecipientSampleDownload';
import {
  PUBLIC_CLAIM_CHANNEL_PHONE_EMAIL,
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
  const [templateId, setTemplateId] = useState<CounselorSendTemplateId | null>('custom');
  const [groupName, setGroupName] = useState('');
  const [affiliationTitle, setAffiliationTitle] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState(DEFAULT_WELCOME_MESSAGE);
  const [usageEndDate, setUsageEndDate] = useState('');
  const [customTestIds, setCustomTestIds] = useState<Set<string>>(() => new Set(['generic']));
  const [testPickerOpen, setTestPickerOpen] = useState(false);
  const [manualRows, setManualRows] = useState<RecipientRow[]>([{ ...EMPTY_ROW }]);
  const [fileRows, setFileRows] = useState<RecipientRow[]>([]);
  const [fileLabel, setFileLabel] = useState('');
  const [samplePreviewKind, setSamplePreviewKind] = useState<'txt' | 'csv' | null>(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [sendOverlay, setSendOverlay] = useState<{ kind: 'pending' } | null>(null);
  const sendLocked = Boolean(sendOverlay);
  const [error, setError] = useState('');
  const issuePromiseRef = useRef<Promise<string> | null>(null);
  const pendingAssessmentIdRef = useRef('');
  const resolvedAssessmentIdRef = useRef('');
  const [firstSendTrialEligible, setFirstSendTrialEligible] = useState(false);
  const [counselorAffiliation, setCounselorAffiliation] = useState('');
  const publicClaimChannel = PUBLIC_CLAIM_CHANNEL_PHONE_EMAIL;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const welcomeTextareaRef = useRef<HTMLTextAreaElement>(null);
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
        setAffiliationTitle((prev) => (prev.trim() ? prev : affiliation));
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
    const params = new URLSearchParams();
    if (assessmentId) {
      params.set('assessmentId', assessmentId);
      params.set('addRecipient', '1');
    }
    const href = params.toString()
      ? `/counselor/assessments/progress?${params.toString()}`
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
      if (!groupName.trim()) {
        setError('그룹/기관명을 1자 이상 입력해 주세요.');
        return;
      }
      if (!affiliationTitle.trim()) {
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
      cohortName = groupName.trim().slice(0, 120);
      title = affiliationTitle.trim().slice(0, 200);
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
      setSendOverlay(null);
      if (assessmentId) {
        finish(assessmentId);
      }
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
      description="그룹·소속과 검사를 정한 뒤 전송 방법·안내를 설정하고 상담코드를 생성합니다."
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
          title="검사 선택"
          subtitle="이 상담코드에 포함할 검사를 고릅니다."
          compact
          bodyClassName="!p-3"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <button
              type="button"
              disabled={sendLocked}
              onClick={() => {
                setTemplateId('custom');
                setTestPickerOpen(true);
              }}
              className="group flex w-full shrink-0 flex-col items-center justify-center gap-2 self-stretch rounded-xl border border-sky-400/30 bg-gradient-to-br from-sky-600/25 via-indigo-600/15 to-slate-900/40 px-3 py-4 text-center shadow-lg shadow-sky-950/30 transition hover:border-sky-300/45 hover:from-sky-500/30 sm:w-1/3 sm:max-w-[33%]"
            >
              <span className="text-base font-bold text-white">검사 선택</span>
              <span className="text-sm text-sky-200/90">
                {customTestIds.size > 0
                  ? `${customTestIds.size}개 선택됨`
                  : '탭하여 목록 열기'}
              </span>
              <span className="text-xs font-medium text-sky-300/80">(수정)</span>
            </button>
            {customSelectedTests.length > 0 ? (
              <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto rounded-lg border border-white/10 bg-black/20 px-3 py-2.5">
                {customSelectedTests.map((t, idx) => (
                  <li key={t.testId} className="truncate text-[15px] font-medium leading-snug text-slate-100">
                    {idx + 1}. {t.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="flex flex-1 items-center text-sm text-slate-500">
                선택된 검사가 오른쪽에 표시됩니다.
              </p>
            )}
          </div>
        </CounselorSendStepBlock>

        <CounselorSendStepBlock
          step={2}
          title="상담코드 설정"
          subtitle="필수 정보를 입력하고 안내 문구를 설정하세요."
          compact
          allowOverflow
        >
          <div className="mb-3 grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-[#0d1830]/50 p-3 sm:grid-cols-2">
            <div>
              <label htmlFor="quick-send-group" className="mb-1.5 block text-sm font-semibold text-slate-200">
                그룹/기관명 <span className="text-red-400">*</span>
              </label>
              <input
                id="quick-send-group"
                type="text"
                value={groupName}
                onChange={(e) => {
                  setGroupName(e.target.value);
                  setTemplateId('custom');
                }}
                maxLength={120}
                disabled={sendLocked}
                placeholder="예: ○○초등학교"
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor="quick-send-affiliation" className="mb-1.5 block text-sm font-semibold text-slate-200">
                소속 <span className="text-red-400">*</span>
              </label>
              <input
                id="quick-send-affiliation"
                type="text"
                value={affiliationTitle}
                onChange={(e) => {
                  setAffiliationTitle(e.target.value);
                  setTemplateId('custom');
                }}
                maxLength={200}
                disabled={sendLocked}
                placeholder="예: 상담실 / 홍길동"
                className={INPUT}
              />
            </div>
          </div>
          <div className="mb-4">
            <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
              <label htmlFor="quick-send-usage-end" className="text-sm font-semibold text-slate-200">
                사용종료일 (선택)
              </label>
              <span className="text-xs text-slate-500">비워두면 무기한 사용 가능합니다.</span>
            </div>
            <UsageEndDateField
              id="quick-send-usage-end"
              value={usageEndDate}
              onChange={setUsageEndDate}
              disabled={sendLocked}
            />
          </div>
          <div className="overflow-visible">
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 overflow-visible">
              <label htmlFor="quick-send-welcome" className="text-sm font-semibold text-slate-200">
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
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/40 transition hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 disabled:opacity-50"
          >
            상담코드 생성
          </button>
        </CounselorSendStepBlock>
      </form>
      <CounselorActionProgressOverlay
        open={sendOverlay?.kind === 'pending'}
        phase="loading"
        title="생성 중…"
        message="잠시만 기다려 주세요."
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
