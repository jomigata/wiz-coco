'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { bulkCreateClientPortals } from '@/lib/clientPortalApi';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { normalizeRecipientPhone, formatPhoneWhileTyping, formatPhoneDisplay, isValidKrMobilePhone } from '@/lib/phoneFormat';
import { FORM_INPUT, FORM_LABEL } from '@/lib/assessmentFormUi';
import { getAssessmentOrgLabel } from '@/lib/assessmentSortOptions';
import type { CounselorAssessment } from '@/lib/assessmentApi';
import {
  downloadGroupRecipientSampleCsv,
  downloadGroupRecipientSampleTxt,
  getGroupRecipientSamplePreviewText,
} from '@/lib/groupRecipientSampleDownload';
import {
  mergeRecipients,
  parseRecipientFile,
  type RecipientRow,
} from '@/lib/recipientImport';
import CounselorActionCompleteModal, {
  type CounselorDispatchCompleteSummary,
} from '@/components/counselor/CounselorActionCompleteModal';
import CounselorNotifyConfirmDialog from '@/components/counselor/CounselorNotifyConfirmDialog';
import type { NotifyRecipientContact } from '@/lib/counselorNotifyChannels';
import { isValidEmailAddress } from '@/lib/emailValidation';

type TargetSortKey = 'input' | 'name' | 'phone' | 'email' | 'invalid';
type TargetSortDir = 'asc' | 'desc';

type ImportedFileBatch = {
  batchId: string;
  name: string;
  rows: RecipientRow[];
};

/** 파일 hover 미리보기 — 최대 표시 인원(초과분은 … 추가 n명) */
const FILE_RECIPIENT_PREVIEW_MAX_VISIBLE = 14;
/** 파일명 기준 말풍선 가로 오프셋(글자 수) */
const FILE_PREVIEW_OFFSET_CH = 4;
const FILE_PREVIEW_COLUMN_TITLE = '이름 · 휴대폰 · 이메일';
const FILE_PREVIEW_VIEWPORT_PAD_PX = 12;
/** `ch` → px (뷰포트 클램프용 근사) */
const FILE_PREVIEW_CH_PX = 8;

type FilePreviewAnchor = {
  fileName: string;
  left: number;
  top: number;
  bottom: number;
  placement: 'above' | 'below';
};

function formatRecipientPreviewLine(row: RecipientRow): string {
  const name = row.displayName.trim();
  const phone = formatPhoneDisplay((row.phone || '').trim());
  const email = (row.email || '').trim();
  return [name, phone, email].map((p) => p || '—').join(' · ');
}

function clampFilePreviewTooltipStyle(
  anchor: FilePreviewAnchor,
  widthCh: number,
): React.CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pad = FILE_PREVIEW_VIEWPORT_PAD_PX;
  const contentPx = widthCh * FILE_PREVIEW_CH_PX + 20;
  const maxWidthPx = Math.max(160, Math.min(contentPx, vw - pad * 2));

  let leftPx = anchor.left + FILE_PREVIEW_OFFSET_CH * FILE_PREVIEW_CH_PX;
  if (leftPx + maxWidthPx > vw - pad) {
    leftPx = Math.max(pad, vw - pad - maxWidthPx);
  }
  if (leftPx < pad) leftPx = pad;

  const maxTooltipH = Math.min(208, Math.floor(vh * 0.42));
  let placement = anchor.placement;
  let topPx = placement === 'below' ? anchor.bottom + 2 : anchor.top - 2;
  let transform: string | undefined = placement === 'above' ? 'translateY(-100%)' : undefined;

  if (placement === 'below' && anchor.bottom + 2 + maxTooltipH > vh - pad) {
    if (anchor.top - maxTooltipH > pad) {
      placement = 'above';
      topPx = anchor.top - 2;
      transform = 'translateY(-100%)';
    } else {
      topPx = Math.max(pad, vh - pad - maxTooltipH);
      transform = undefined;
    }
  } else if (placement === 'above' && anchor.top - maxTooltipH < pad) {
    topPx = anchor.bottom + 2;
    transform = undefined;
  }

  return {
    position: 'fixed',
    left: leftPx,
    top: topPx,
    transform,
    width: 'max-content',
    minWidth: `min(${widthCh}ch, ${maxWidthPx}px)`,
    maxWidth: maxWidthPx,
  };
}

type DisplayFileBatch = {
  name: string;
  rows: RecipientRow[];
  batchIds: string[];
  displayIndex: number;
};

function groupFileBatchesByName(batches: ImportedFileBatch[]): DisplayFileBatch[] {
  const order: string[] = [];
  const map = new Map<string, { name: string; rows: RecipientRow[]; batchIds: string[] }>();
  for (const batch of batches) {
    let group = map.get(batch.name);
    if (!group) {
      group = { name: batch.name, rows: [], batchIds: [] };
      map.set(batch.name, group);
      order.push(batch.name);
    }
    group.batchIds.push(batch.batchId);
    group.rows = mergeRecipients(group.rows, batch.rows);
  }
  return order.map((name, index) => {
    const group = map.get(name)!;
    return { ...group, displayIndex: index + 1 };
  });
}

export type AssessmentAddRecipientContext = {
  assessmentId: string;
  accessCode: string;
  cohortName: string;
  title: string;
  createdAt: string;
  totalIssuedCount: number;
  testList: { testId: string; name: string }[];
};

type AddRecipientSuccessInfo = { sent: boolean };

type Props = {
  open: boolean;
  onClose: () => void;
  context: AssessmentAddRecipientContext | null;
  onSuccess?: (info: AddRecipientSuccessInfo) => void;
};

function buildContextFromAssessment(a: CounselorAssessment): AssessmentAddRecipientContext {
  const testComplete = a.testCompleteCount ?? a.emailsCompletedAllTestsCount ?? 0;
  const testIncomplete = a.testIncompleteCount ?? a.emailsNotCompletedAllTestsCount ?? 0;
  const dispatchSent = a.dispatchSentCount ?? 0;
  const dispatchFailed = a.dispatchFailedCount ?? 0;
  const totalIssuedCount = Math.max(testComplete + testIncomplete, dispatchSent + dispatchFailed);

  return {
    assessmentId: a.id,
    accessCode: a.accessCode,
    cohortName: getAssessmentOrgLabel(a),
    title: (a.title || '—').trim(),
    createdAt: a.createdAt,
    totalIssuedCount,
    testList: a.testList || [],
  };
}

export { buildContextFromAssessment };

function MiniStat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-white/10 bg-slate-900/50 px-2 py-1">
      <span className="text-sm font-semibold text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-200">{children}</span>
    </span>
  );
}

function TargetRowContactDisplay({ row }: { row: RecipientRow }) {
  const phone = formatPhoneDisplay((row.phone || '').trim());
  const email = (row.email || '').trim();
  const invalid = targetRowInvalid(row);
  if (invalid && !phone && !email) {
    return <span className="text-red-400"> (부적합)</span>;
  }
  const parts: string[] = [];
  if (phone) parts.push(phone);
  if (email) parts.push(email);
  if (parts.length === 0) {
    return <span className="text-red-400"> (부적합)</span>;
  }
  return (
    <span className="text-slate-300">
      {' · '}
      {parts.join(' · ')}
      {invalid ? <span className="text-red-400"> (부적합)</span> : null}
    </span>
  );
}

function targetRowInvalid(row: RecipientRow): boolean {
  const phone = normalizeRecipientPhone(row.phone);
  const email = (row.email || '').trim();
  if (!phone && !email) return true;
  if (phone && !isValidKrMobilePhone(phone)) return true;
  if (email && !isValidEmailAddress(email)) return true;
  return false;
}

function formatExcludedInvalidSummary(invalid: RecipientRow[]): string {
  if (!invalid.length) return '';
  const names = invalid.slice(0, 4).map((r) => r.displayName.trim() || '—');
  const namePart = names.join(', ');
  const overflow = invalid.length > 4 ? ` 외 ${invalid.length - 4}명` : '';
  return `부적합 ${invalid.length}명 제외 (${namePart}${overflow})`;
}

function buildAddRecipientDispatchSummary(opts: {
  addSendNow: boolean;
  targetCount: number;
  createdCount?: number;
  excludedInvalid: RecipientRow[];
}): CounselorDispatchCompleteSummary {
  const { addSendNow, targetCount, createdCount, excludedInvalid } = opts;
  const excludedText =
    excludedInvalid.length > 0 ? formatExcludedInvalidSummary(excludedInvalid) : undefined;
  return {
    targetCount,
    notifySent: addSendNow,
    addedCount: createdCount ?? targetCount,
    excludedText,
  };
}

const EDIT_INLINE_INPUT_SHARED =
  'w-full min-w-0 flex-1 rounded-lg border bg-[#101f38]/90 px-2 py-1 text-xs transition-[color,border-color,box-shadow] focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-55 sm:text-sm';

/** 수정 중 — 부적합이면 빨간 글자·테두리, 해소되면 흰 글자로 복귀 */
function editInlineInputClass(invalid: boolean): string {
  if (invalid) {
    return `${EDIT_INLINE_INPUT_SHARED} border-red-500/55 text-red-400 placeholder:text-red-400/45 focus:border-red-400 focus:ring-red-500/25`;
  }
  return `${EDIT_INLINE_INPUT_SHARED} border-white/10 text-white placeholder:text-slate-500 focus:border-sky-400/50 focus:ring-sky-500/30`;
}

/** `mergeRecipients`와 동일 — 목록 인덱스·삭제 매칭용 */
function recipientRowMergeKey(row: RecipientRow): string {
  return `${row.displayName.trim()}|${normalizeRecipientPhone(row.phone)}`.toLowerCase();
}

function recipientPreviewPhoneInvalid(row: RecipientRow): boolean {
  const raw = (row.phone || '').trim();
  if (!raw) return false;
  if (raw.includes('@')) return true;
  const normalized = normalizeRecipientPhone(row.phone);
  if (!normalized) return true;
  return !isValidKrMobilePhone(normalized);
}

function recipientPreviewEmailInvalid(row: RecipientRow): boolean {
  const email = (row.email || '').trim();
  if (!email) return false;
  return !isValidEmailAddress(email);
}

function recipientPreviewMissingContact(row: RecipientRow): boolean {
  return !normalizeRecipientPhone(row.phone) && !(row.email || '').trim();
}

function editDraftFieldInvalidFlags(draft: RecipientRow): {
  name: boolean;
  phone: boolean;
  email: boolean;
} {
  const phoneRaw = (draft.phone || '').trim();
  const emailRaw = (draft.email || '').trim();
  // 수정 중 — 비어 있으면 적합 색(흰색). 값이 있는데 형식만 틀릴 때만 빨간색
  const phone = phoneRaw ? recipientPreviewPhoneInvalid(draft) : false;
  const email = emailRaw ? recipientPreviewEmailInvalid(draft) : false;
  return { name: false, phone, email };
}

function FilePreviewRecipientLine({ row }: { row: RecipientRow }) {
  const name = row.displayName.trim() || '—';
  const phoneRaw = (row.phone || '').trim();
  const normalizedPhone = normalizeRecipientPhone(row.phone);
  const phoneDisplay = phoneRaw
    ? normalizedPhone
      ? formatPhoneDisplay(normalizedPhone)
      : phoneRaw
    : '—';
  const emailRaw = (row.email || '').trim();
  const emailDisplay = emailRaw ? emailRaw.toLowerCase() : '—';

  const missingContact = recipientPreviewMissingContact(row);
  const phoneInvalid = phoneRaw ? recipientPreviewPhoneInvalid(row) : missingContact;
  const emailInvalid = emailRaw ? recipientPreviewEmailInvalid(row) : missingContact;

  return (
    <span className="whitespace-nowrap font-mono text-[11px] leading-snug sm:text-xs">
      <span className="text-slate-200">{name}</span>
      <span className="text-slate-500"> · </span>
      <span className={phoneInvalid ? 'text-red-400' : 'text-slate-200'}>{phoneDisplay}</span>
      <span className="text-slate-500"> · </span>
      <span className={emailInvalid ? 'text-red-400' : 'text-slate-200'}>{emailDisplay}</span>
    </span>
  );
}

export default function AssessmentAddRecipientModal({
  open,
  onClose,
  context,
  onSuccess,
}: Props) {
  const [draftName, setDraftName] = useState('');
  const [draftPhone, setDraftPhone] = useState('');
  const [draftEmail, setDraftEmail] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const bulkRecipientFileRef = useRef<HTMLInputElement>(null);
  const [pendingRows, setPendingRows] = useState<RecipientRow[]>([]);
  const [addSendNow, setAddSendNow] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [progressRecipientCount, setProgressRecipientCount] = useState(0);
  const [addComplete, setAddComplete] = useState<{
    title: string;
    message?: string;
    sent: boolean;
    error?: boolean;
    loading?: boolean;
    hint?: string;
    notice?: string;
    dispatchSummary?: CounselorDispatchCompleteSummary;
  } | null>(null);
  const [addError, setAddError] = useState('');
  const [invalidBulkDeleteOffer, setInvalidBulkDeleteOffer] = useState(false);
  const [fileBatches, setFileBatches] = useState<ImportedFileBatch[]>([]);
  const [filePreviewAnchor, setFilePreviewAnchor] = useState<FilePreviewAnchor | null>(null);
  const [samplePreviewKind, setSamplePreviewKind] = useState<'txt' | 'csv' | null>(null);
  const [notifyConfirmOpen, setNotifyConfirmOpen] = useState(false);
  const [targetSortKey, setTargetSortKey] = useState<TargetSortKey>('input');
  const [targetSortDir, setTargetSortDir] = useState<TargetSortDir>('asc');
  const [editingRowKey, setEditingRowKey] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<RecipientRow>({
    displayName: '',
    phone: '',
    email: '',
  });
  /** 개별·파일 추가 후 부적합이 있을 때 부적합 열 정렬 — 세션당 1회 */
  const autoInvalidSortAppliedRef = useRef(false);

  const samplePreviewText = useMemo(() => getGroupRecipientSamplePreviewText(), []);
  const samplePreviewLayout = useMemo(() => {
    const lines = samplePreviewText.split('\n');
    const widthCh = Math.min(72, Math.max(24, ...lines.map((l) => l.length)));
    return { widthCh };
  }, [samplePreviewText]);

  const importedFileRows = useMemo(
    () => fileBatches.flatMap((batch) => batch.rows),
    [fileBatches],
  );

  const combinedRows = useMemo(
    () => mergeRecipients(pendingRows, importedFileRows),
    [pendingRows, importedFileRows],
  );

  const invalidRecipientCount = useMemo(
    () => combinedRows.filter((r) => targetRowInvalid(r)).length,
    [combinedRows],
  );

  const validRecipientCount = useMemo(
    () => combinedRows.filter((r) => !targetRowInvalid(r)).length,
    [combinedRows],
  );

  const displayFileBatches = useMemo(() => groupFileBatchesByName(fileBatches), [fileBatches]);

  const filePreviewTooltip = useMemo(() => {
    if (!filePreviewAnchor) return null;
    const batch = displayFileBatches.find((b) => b.name === filePreviewAnchor.fileName);
    if (!batch || batch.rows.length === 0) return null;
    const visibleRows = batch.rows.slice(0, FILE_RECIPIENT_PREVIEW_MAX_VISIBLE);
    const overflowCount = batch.rows.length - visibleRows.length;
    const previewWidthCh =
      Math.max(
        12,
        FILE_PREVIEW_COLUMN_TITLE.length,
        ...visibleRows.map((row) => formatRecipientPreviewLine(row).length),
      ) + 1;
    const style =
      typeof window !== 'undefined'
        ? clampFilePreviewTooltipStyle(filePreviewAnchor, previewWidthCh)
        : {};
    return { batch, visibleRows, overflowCount, previewWidthCh, style };
  }, [filePreviewAnchor, displayFileBatches]);

  const bulkFileStatusLabel = useMemo(() => {
    if (fileBatches.length === 0) return '선택된 파일 없음';
    const names = Array.from(new Set(fileBatches.map((b) => b.name)));
    if (names.length === 1) return names[0];
    return `${names.length}개 파일 · ${names.join(', ')}`;
  }, [fileBatches]);

  const indexedTargetRows = useMemo(
    () => combinedRows.map((row, originalIndex) => ({ row, originalIndex })),
    [combinedRows],
  );

  const displayedTargetRows = useMemo(() => {
    if (targetSortKey === 'input') return indexedTargetRows;
    const list = [...indexedTargetRows];
    const mult = targetSortDir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      if (targetSortKey === 'invalid') {
        const ai = targetRowInvalid(a.row) ? 0 : 1;
        const bi = targetRowInvalid(b.row) ? 0 : 1;
        if (ai !== bi) return mult * (ai - bi);
        return a.originalIndex - b.originalIndex;
      }
      let av = '';
      let bv = '';
      if (targetSortKey === 'name') {
        av = a.row.displayName.trim();
        bv = b.row.displayName.trim();
      } else if (targetSortKey === 'phone') {
        av = normalizeRecipientPhone(a.row.phone);
        bv = normalizeRecipientPhone(b.row.phone);
      } else {
        av = (a.row.email || '').trim().toLowerCase();
        bv = (b.row.email || '').trim().toLowerCase();
      }
      return mult * av.localeCompare(bv, 'ko');
    });
    return list;
  }, [indexedTargetRows, targetSortKey, targetSortDir]);

  const toggleTargetSort = (key: Exclude<TargetSortKey, 'input'>) => {
    if (targetSortKey === key) {
      setTargetSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setTargetSortKey(key);
      setTargetSortDir('asc');
    }
  };

  const applyInitialInvalidSortIfNeeded = (merged: RecipientRow[]) => {
    if (autoInvalidSortAppliedRef.current) return;
    if (!merged.some((r) => targetRowInvalid(r))) return;
    autoInvalidSortAppliedRef.current = true;
    setTargetSortKey('invalid');
    setTargetSortDir('asc');
  };

  const targetSortArrow = (key: Exclude<TargetSortKey, 'input'>) => {
    if (targetSortKey !== key) return '↕';
    return targetSortDir === 'asc' ? '▲' : '▼';
  };

  const notifyRecipients = useMemo<NotifyRecipientContact[]>(
    () =>
      combinedRows
        .filter((r) => !targetRowInvalid(r))
        .map((r) => ({
          displayName: r.displayName,
          phone: r.phone,
          email: r.email,
          groupName: context?.cohortName,
          affiliation: context?.title,
        })),
    [combinedRows, context?.cohortName, context?.title],
  );

  const notifyConfirmExtraLines = useMemo(() => {
    const invalid = combinedRows.filter((r) => targetRowInvalid(r));
    if (!invalid.length) return [];
    return [`${formatExcludedInvalidSummary(invalid)} — 발송 제외`];
  }, [combinedRows]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => nameInputRef.current?.focus(), 120);
    return () => window.clearTimeout(t);
  }, [open, context?.assessmentId]);

  useEffect(() => {
    if (invalidBulkDeleteOffer && invalidRecipientCount === 0) {
      setInvalidBulkDeleteOffer(false);
    }
  }, [invalidBulkDeleteOffer, invalidRecipientCount]);

  useEffect(() => {
    if (invalidRecipientCount === 0) {
      autoInvalidSortAppliedRef.current = false;
    }
  }, [invalidRecipientCount]);

  const resetForm = () => {
    setDraftName('');
    setDraftPhone('');
    setDraftEmail('');
    setPendingRows([]);
    setAddSendNow(true);
    setAddError('');
    setInvalidBulkDeleteOffer(false);
    setFileBatches([]);
    setFilePreviewAnchor(null);
    setSamplePreviewKind(null);
    setTargetSortKey('input');
    setTargetSortDir('asc');
    setEditingRowKey(null);
    autoInvalidSortAppliedRef.current = false;
    setProgressRecipientCount(0);
  };

  const handleClose = () => {
    if (addLoading) return;
    resetForm();
    onClose();
  };

  const handleAddDraftRow = () => {
    const name = draftName.trim();
    const phone = normalizeRecipientPhone(draftPhone);
    const email = draftEmail.trim().toLowerCase();
    if (!name) {
      setInvalidBulkDeleteOffer(false);
      setAddError('이름을 입력해 주세요.');
      return;
    }
    setAddError('');
    setInvalidBulkDeleteOffer(false);
    const newRow = { displayName: name, phone: phone ? formatPhoneDisplay(phone) : '', email };
    const nextPending = [...pendingRows, newRow];
    applyInitialInvalidSortIfNeeded(mergeRecipients(nextPending, importedFileRows));
    setPendingRows(nextPending);
    setDraftName('');
    setDraftPhone('');
    setDraftEmail('');
  };

  const removeTargetRow = (combinedIndex: number) => {
    const target = combinedRows[combinedIndex];
    if (!target) return;
    const key = recipientRowMergeKey(target);
    if (editingRowKey === key) setEditingRowKey(null);
    setPendingRows((prev) => prev.filter((r) => recipientRowMergeKey(r) !== key));
    setFileBatches((prev) =>
      prev
        .map((batch) => ({
          ...batch,
          rows: batch.rows.filter((r) => recipientRowMergeKey(r) !== key),
        }))
        .filter((batch) => batch.rows.length > 0),
    );
  };

  const normalizeEditedRecipientRow = (draft: RecipientRow): RecipientRow => {
    const displayName = draft.displayName.trim();
    const phoneNorm = normalizeRecipientPhone(draft.phone);
    const phone = phoneNorm ? formatPhoneDisplay(phoneNorm) : draft.phone.trim();
    const email = draft.email.trim().toLowerCase();
    return { displayName, phone, email };
  };

  const updateTargetRow = (combinedIndex: number, draft: RecipientRow) => {
    const target = combinedRows[combinedIndex];
    if (!target) return;
    const key = recipientRowMergeKey(target);
    const normalized = normalizeEditedRecipientRow(draft);
    if (!normalized.displayName) {
      setAddError('이름을 입력해 주세요.');
      return;
    }
    setAddError('');
    setPendingRows((prev) =>
      prev.map((r) => (recipientRowMergeKey(r) === key ? normalized : r)),
    );
    setFileBatches((prev) =>
      prev.map((batch) => ({
        ...batch,
        rows: batch.rows.map((r) => (recipientRowMergeKey(r) === key ? normalized : r)),
      })),
    );
    setEditingRowKey(null);
  };

  const startEditTargetRow = (row: RecipientRow) => {
    if (addLoading) return;
    setEditingRowKey(recipientRowMergeKey(row));
    setEditDraft({
      displayName: row.displayName,
      phone: row.phone,
      email: row.email,
    });
    setAddError('');
  };

  const cancelEditTargetRow = () => {
    setEditingRowKey(null);
    setEditDraft({ displayName: '', phone: '', email: '' });
  };

  const handleAddRecipientFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setAddError('');
    setInvalidBulkDeleteOffer(false);
    try {
      const additions: ImportedFileBatch[] = [];
      for (const file of Array.from(fileList)) {
        const parsed = await parseRecipientFile(file);
        additions.push({
          batchId: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          name: file.name,
          rows: parsed,
        });
      }
      const nextBatches = [...fileBatches, ...additions];
      const nextImported = nextBatches.flatMap((batch) => batch.rows);
      applyInitialInvalidSortIfNeeded(mergeRecipients(pendingRows, nextImported));
      setFileBatches(nextBatches);
    } catch (err) {
      setInvalidBulkDeleteOffer(false);
      setAddError(err instanceof Error ? err.message : '파일을 읽지 못했습니다.');
    }
  };

  const openFilePreview = (fileName: string, anchor: HTMLElement) => {
    const rect = anchor.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placement = spaceBelow < 200 && spaceAbove > spaceBelow ? 'above' : 'below';
    setFilePreviewAnchor({
      fileName,
      left: rect.left,
      top: rect.top,
      bottom: rect.bottom,
      placement,
    });
  };

  const removeFileBatchesByName = (fileName: string) => {
    setFileBatches((prev) => prev.filter((b) => b.name !== fileName));
    setFilePreviewAnchor((prev) => (prev?.fileName === fileName ? null : prev));
  };

  const removeAllInvalidRecipients = () => {
    setPendingRows((prev) => prev.filter((r) => !targetRowInvalid(r)));
    setFileBatches((prev) =>
      prev
        .map((batch) => ({
          ...batch,
          rows: batch.rows.filter((r) => !targetRowInvalid(r)),
        }))
        .filter((batch) => batch.rows.length > 0),
    );
    setAddError('');
    setInvalidBulkDeleteOffer(false);
  };

  const handleSubmit = () => {
    if (!context) return;
    const rows = combinedRows;
    if (rows.length === 0) {
      setInvalidBulkDeleteOffer(false);
      setAddError('개별 입력 또는 파일에서 내담자 1명 이상을 추가해 주세요.');
      return;
    }
    const validRows = rows.filter((r) => !targetRowInvalid(r));
    if (validRows.length === 0) {
      setInvalidBulkDeleteOffer(false);
      setAddError('유효한 내담자가 없습니다. 연락처(휴대폰·이메일)를 확인해 주세요.');
      return;
    }
    setAddError('');
    setInvalidBulkDeleteOffer(false);
    if (addSendNow) {
      setNotifyConfirmOpen(true);
      return;
    }
    void executeSubmit(undefined);
  };

  const executeSubmit = async (notifyChannels: ('email' | 'phone')[] | undefined) => {
    if (!context) return;
    const rows = combinedRows;
    const validRows = rows.filter((r) => !targetRowInvalid(r));
    const excludedInvalid = rows.filter((r) => targetRowInvalid(r));
    const cohortName = (context.cohortName || context.title || '내담자').trim();
    const targetCount = validRows.length;
    const dispatchSummary = buildAddRecipientDispatchSummary({
      addSendNow,
      targetCount,
      createdCount: targetCount,
      excludedInvalid,
    });

    setProgressRecipientCount(targetCount);
    setNotifyConfirmOpen(false);
    setAddLoading(true);
    setAddError('');
    setInvalidBulkDeleteOffer(false);
    setAddComplete({
      title: addSendNow ? '발송 완료' : '추가 완료',
      sent: addSendNow,
      dispatchSummary,
    });

    try {
      await bulkCreateClientPortals({
        assessmentId: context.assessmentId,
        cohortName,
        title: context.title || cohortName,
        testList: context.testList,
        rows: validRows.map((r) => ({
          displayName: r.displayName.trim(),
          phone: normalizeRecipientPhone(r.phone) || undefined,
          email: (r.email || '').trim().toLowerCase() || undefined,
          queueNotify: addSendNow,
        })),
        queueNotify: addSendNow,
        notifyChannels: addSendNow ? notifyChannels : undefined,
      });
      onSuccess?.({ sent: addSendNow });
    } catch (err) {
      setAddComplete((prev) =>
        prev
          ? {
              ...prev,
              title: addSendNow ? '발송 실패' : '추가 실패',
              message: err instanceof Error ? err.message : '내담자 추가에 실패했습니다.',
              error: true,
            }
          : null,
      );
    } finally {
      setAddLoading(false);
    }
  };

  const handleCompleteConfirm = () => {
    setAddComplete(null);
    resetForm();
    onClose();
  };

  if (!open || !context) return null;

  const groupTitleLine = `${context.cohortName} / ${context.title}`;

  const handleDraftKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddDraftRow();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-4"
      onClick={handleClose}
    >
      <div
        className="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-visible rounded-2xl border border-sky-400/20 bg-gradient-to-b from-[#0f1a2e] to-[#0a1220] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-sky-400/20 bg-gradient-to-r from-sky-600/25 via-sky-500/15 to-transparent px-4 py-3 sm:px-5">
          <h3 className="text-base font-bold text-white sm:text-lg">내담자 추가</h3>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 truncate text-sm font-medium text-sky-100/90" title={groupTitleLine}>
              {groupTitleLine}
            </p>
            <MiniStat label="상담코드">
              <span className="font-mono text-cyan-300">{formatAccessCodeDisplay(context.accessCode)}</span>
            </MiniStat>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-visible px-4 py-3 sm:px-5 sm:py-4">
          <div className="grid gap-4 lg:grid-cols-12 lg:items-stretch">
            <section className="flex flex-col overflow-visible rounded-2xl border border-sky-400/15 bg-gradient-to-br from-[#101f38]/90 via-[#0f1a30]/95 to-[#0a1220]/90 p-4 shadow-inner shadow-black/20 lg:col-span-7">
              <div className="mb-3 border-b border-white/10 pb-2">
                <h4 className="text-sm font-bold tracking-tight text-sky-100">개별 입력</h4>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-stretch">
                <div className="flex min-w-0 flex-col gap-3">
                  <div>
                    <label htmlFor="add-recipient-name" className={FORM_LABEL}>
                      이름<span className="text-yellow-400">(필수)</span>
                    </label>
                    <input
                      ref={nameInputRef}
                      id="add-recipient-name"
                      type="text"
                      className={`${FORM_INPUT} w-full !px-2`}
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      onKeyDown={handleDraftKeyDown}
                      disabled={addLoading}
                      placeholder="홍길동"
                      maxLength={20}
                    />
                  </div>
                  <div>
                    <label htmlFor="add-recipient-phone" className={FORM_LABEL}>
                      휴대폰(선택)
                    </label>
                    <input
                      id="add-recipient-phone"
                      type="tel"
                      inputMode="numeric"
                      className={`${FORM_INPUT} w-full tabular-nums !px-2`}
                      value={draftPhone}
                      onChange={(e) => setDraftPhone(formatPhoneWhileTyping(e.target.value))}
                      onKeyDown={handleDraftKeyDown}
                      disabled={addLoading}
                      placeholder="010-1234-5678"
                    />
                  </div>
                  <div>
                    <label htmlFor="add-recipient-email" className={FORM_LABEL}>
                      이메일(선택)
                    </label>
                    <input
                      id="add-recipient-email"
                      type="email"
                      className={`${FORM_INPUT} w-full !px-2`}
                      value={draftEmail}
                      onChange={(e) => setDraftEmail(e.target.value)}
                      onKeyDown={handleDraftKeyDown}
                      disabled={addLoading}
                      placeholder="name@example.com"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddDraftRow}
                  disabled={addLoading}
                  className="min-h-[8.5rem] w-full shrink-0 rounded-xl border border-sky-400/20 bg-gradient-to-r from-sky-600/25 via-sky-500/15 to-transparent px-5 text-sm font-semibold text-sky-50 shadow-md shadow-sky-950/30 transition hover:from-sky-600/35 hover:via-sky-500/25 disabled:opacity-50 sm:w-24"
                >
                  <span className="flex flex-col items-center leading-tight">
                    <span>개별</span>
                    <span>추가</span>
                  </span>
                </button>
              </div>
            </section>

            <section className="flex flex-col overflow-visible rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-[#0f1f36]/90 via-[#0d1830]/95 to-[#0a1220]/90 p-4 shadow-inner shadow-black/20 lg:col-span-5">
              <div className="mb-3 border-b border-white/10 pb-2">
                <h4 className="text-sm font-bold tracking-tight text-emerald-100">파일 일괄 추가</h4>
                <p className="mt-0.5 text-xs text-slate-400">CSV·Excel — 이름(필수), 휴대폰(선택), 이메일(선택)</p>
                <p className="mt-1 text-sm font-semibold text-amber-300">복수 파일 가능</p>
              </div>
              <div className="rounded-xl border border-dashed border-white/15 bg-black/25 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <input
                  ref={bulkRecipientFileRef}
                  type="file"
                  multiple
                  accept=".csv,.txt,.tsv,.xlsx,.xls,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  disabled={addLoading}
                  onChange={(e) => {
                    void handleAddRecipientFiles(e.target.files);
                    e.target.value = '';
                  }}
                  className="sr-only"
                />
                <button
                  type="button"
                  disabled={addLoading}
                  onClick={() => bulkRecipientFileRef.current?.click()}
                  className="shrink-0 rounded-lg bg-emerald-700/90 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:opacity-50"
                >
                  파일 선택
                </button>
                <p
                  className="min-w-0 flex-1 text-sm text-slate-400 truncate"
                  title={bulkFileStatusLabel}
                >
                  {bulkFileStatusLabel}
                </p>
              </div>
              </div>
              <div
                className="relative z-20 mt-2 overflow-visible"
                onMouseLeave={() => setSamplePreviewKind(null)}
              >
                <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
                  <span className="text-slate-400">샘플받기</span>
                  <button
                    type="button"
                    onClick={downloadGroupRecipientSampleTxt}
                    onMouseEnter={() => setSamplePreviewKind('txt')}
                    onFocus={() => setSamplePreviewKind('txt')}
                    onBlur={() => setSamplePreviewKind(null)}
                    className="text-sky-300 transition hover:text-sky-200"
                  >
                    (텍스트파일)
                  </button>
                  <button
                    type="button"
                    onClick={downloadGroupRecipientSampleCsv}
                    onMouseEnter={() => setSamplePreviewKind('csv')}
                    onFocus={() => setSamplePreviewKind('csv')}
                    onBlur={() => setSamplePreviewKind(null)}
                    className="text-sky-300 transition hover:text-sky-200"
                  >
                    (엑셀파일)
                  </button>
                </div>
                {samplePreviewKind && samplePreviewText && samplePreviewLayout ? (
                  <div
                    className="pointer-events-none absolute bottom-full right-0 z-[200] mb-1.5 w-full rounded-lg border border-sky-500/40 bg-slate-950 p-2.5 text-left shadow-2xl sm:w-max"
                    role="tooltip"
                    style={{ width: `min(100%, ${samplePreviewLayout.widthCh}ch)` }}
                  >
                    <p className="mb-1 text-xs font-semibold text-sky-300">
                      {samplePreviewKind === 'txt' ? '샘플 텍스트 미리보기' : '샘플 엑셀(CSV) 미리보기'}
                    </p>
                    <pre className="max-h-32 overflow-y-auto whitespace-pre-wrap break-words font-mono text-xs leading-snug text-slate-200">
                      {samplePreviewText}
                    </pre>
                  </div>
                ) : null}
              </div>
              {displayFileBatches.length > 0 ? (
                <div className="relative z-20 mt-3 space-y-2">
                  {displayFileBatches.map((batch) => (
                      <div
                        key={batch.name}
                        className="relative overflow-visible rounded-lg border border-emerald-500/20 bg-emerald-950/20 px-2.5 py-2"
                        onMouseLeave={() =>
                          setFilePreviewAnchor((prev) => (prev?.fileName === batch.name ? null : prev))
                        }
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 flex-1 text-sm leading-snug text-emerald-100">
                            <span className="font-semibold tabular-nums">{batch.displayIndex}.</span>{' '}
                            <span
                              className="cursor-help break-all underline decoration-dotted decoration-emerald-400/60 underline-offset-2"
                              onMouseEnter={(e) => openFilePreview(batch.name, e.currentTarget)}
                              onFocus={(e) => openFilePreview(batch.name, e.currentTarget)}
                              onBlur={() => setFilePreviewAnchor(null)}
                              tabIndex={0}
                              role="button"
                              aria-label={`${batch.name} 파일 내용 미리보기`}
                            >
                              {batch.name}
                            </span>
                            <span className="text-emerald-300/90">
                              {' '}
                              · 총 {batch.rows.length.toLocaleString('ko-KR')}명
                            </span>
                          </p>
                          <button
                            type="button"
                            onClick={() => removeFileBatchesByName(batch.name)}
                            className="shrink-0 font-medium text-red-400 hover:text-red-300"
                            disabled={addLoading}
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : null}
            </section>
          </div>

          {addError ? (
            <div
              className="rounded-lg border border-red-500/35 bg-red-950/35 px-3 py-2 text-sm leading-relaxed text-red-200"
              role="alert"
            >
              {addError}
            </div>
          ) : null}

          <div className="rounded-xl border border-white/[0.08] bg-[#0d1830]/60 p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                <h4 className={FORM_LABEL}>추가 목록</h4>
                <span className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  <button
                    type="button"
                    className="inline-flex items-center gap-0.5 hover:text-sky-200"
                    onClick={() => toggleTargetSort('name')}
                  >
                    이름
                    <span className="text-[10px] text-slate-500">{targetSortArrow('name')}</span>
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-0.5 hover:text-sky-200"
                    onClick={() => toggleTargetSort('phone')}
                  >
                    핸드폰
                    <span className="text-[10px] text-slate-500">{targetSortArrow('phone')}</span>
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-0.5 hover:text-sky-200"
                    onClick={() => toggleTargetSort('email')}
                  >
                    이메일
                    <span className="text-[10px] text-slate-500">{targetSortArrow('email')}</span>
                  </button>
                  {combinedRows.length > 0 && invalidRecipientCount > 0 ? (
                    <>
                      <button
                        type="button"
                        className="inline-flex items-center gap-0.5 text-[11px] font-medium text-red-400 hover:text-red-200"
                        onClick={() => toggleTargetSort('invalid')}
                      >
                        부적합 항목
                        <span className="text-[10px] text-red-400/80">{targetSortArrow('invalid')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={removeAllInvalidRecipients}
                        disabled={addLoading}
                        className="ml-2 pl-1 text-sm font-semibold text-white underline decoration-white/50 underline-offset-2 transition-colors hover:text-sky-200 hover:decoration-sky-300/70 disabled:opacity-50 disabled:hover:text-white"
                      >
                        부적합 일괄삭제 - ({invalidRecipientCount.toLocaleString('ko-KR')}개)
                      </button>
                    </>
                  ) : null}
                </span>
              </div>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-sm font-semibold text-slate-300">
                총 {combinedRows.length}명
              </span>
            </div>
            {combinedRows.length === 0 ? (
              <p className="py-3 text-center text-sm text-slate-400">
                개별 입력 후 「개별 추가」를 누르거나 파일을 첨부해 주세요.
              </p>
            ) : (
              <ul className="max-h-40 space-y-1 overflow-y-auto pr-1">
                {displayedTargetRows.map(({ row, originalIndex }) => {
                  const rowKey = recipientRowMergeKey(row);
                  const isEditing = editingRowKey === rowKey;
                  const editInvalid = isEditing ? editDraftFieldInvalidFlags(editDraft) : null;
                  return (
                  <li
                    key={`target-${rowKey}-${originalIndex}`}
                    className={`flex justify-between gap-2 rounded-md border border-white/5 bg-slate-900/40 px-2.5 py-1.5 text-sm leading-snug ${
                      isEditing ? 'items-center' : 'items-start'
                    }`}
                  >
                    {isEditing ? (
                      <div className="grid min-w-0 flex-1 grid-cols-1 gap-1.5 sm:grid-cols-3">
                        <input
                          type="text"
                          value={editDraft.displayName}
                          onChange={(e) =>
                            setEditDraft((d) => ({ ...d, displayName: e.target.value }))
                          }
                          placeholder="이름"
                          className={editInlineInputClass(editInvalid?.name ?? false)}
                          disabled={addLoading}
                        />
                        <input
                          type="tel"
                          value={editDraft.phone}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              phone: formatPhoneWhileTyping(e.target.value),
                            }))
                          }
                          placeholder="휴대폰"
                          className={editInlineInputClass(editInvalid?.phone ?? false)}
                          disabled={addLoading}
                        />
                        <input
                          type="email"
                          value={editDraft.email}
                          onChange={(e) =>
                            setEditDraft((d) => ({ ...d, email: e.target.value }))
                          }
                          placeholder="이메일"
                          className={editInlineInputClass(editInvalid?.email ?? false)}
                          disabled={addLoading}
                        />
                      </div>
                    ) : (
                      <span className="min-w-0 break-words text-white">
                        <span className="font-medium">{row.displayName}</span>
                        <TargetRowContactDisplay row={row} />
                      </span>
                    )}
                    <div className="flex shrink-0 items-center gap-1.5 self-center">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => updateTargetRow(originalIndex, editDraft)}
                            disabled={addLoading}
                            className="rounded border border-emerald-500/40 bg-emerald-950/40 px-2 py-0.5 text-xs font-medium text-emerald-200 hover:bg-emerald-900/50 disabled:opacity-50"
                          >
                            저장
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditTargetRow}
                            disabled={addLoading}
                            className="rounded border border-white/15 px-2 py-0.5 text-xs text-slate-400 hover:text-white disabled:opacity-50"
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEditTargetRow(row)}
                            disabled={addLoading}
                            className="rounded border border-sky-500/35 bg-sky-950/40 px-2 py-0.5 text-xs font-medium text-sky-200 hover:bg-sky-900/50 disabled:opacity-50"
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => removeTargetRow(originalIndex)}
                            disabled={addLoading}
                            className="rounded border border-red-500/35 bg-red-950/40 px-2 py-0.5 text-xs font-medium text-red-200 hover:bg-red-900/50 disabled:opacity-50"
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-sky-400/20 bg-gradient-to-r from-sky-600/25 via-sky-500/15 to-transparent px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-normal text-white">나의코드·비밀번호가 자동 발급됩니다.</p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={addLoading || validRecipientCount === 0}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-900/25 transition-colors hover:bg-emerald-500 disabled:opacity-50"
              >
                {addLoading ? '추가 중…' : '코드 발송'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={addLoading}
                className="rounded-lg border border-white/10 bg-slate-700/80 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-600 disabled:opacity-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      </div>
      <CounselorActionCompleteModal
        open={Boolean(addComplete)}
        title={addComplete?.title ?? ''}
        message={addComplete?.message}
        error={addComplete?.error}
        dispatchSummary={addComplete?.dispatchSummary}
        onConfirm={handleCompleteConfirm}
        zIndexClass="z-[150]"
      />
      <CounselorNotifyConfirmDialog
        open={notifyConfirmOpen}
        kind="add_recipient"
        hideChannels
        recipients={notifyRecipients}
        addRecipientExtraLines={notifyConfirmExtraLines}
        loading={false}
        confirmLabel="코드 발송"
        onConfirm={(channels) => void executeSubmit(channels)}
        onCancel={() => setNotifyConfirmOpen(false)}
      />
      {filePreviewTooltip &&
      filePreviewAnchor &&
      typeof document !== 'undefined'
        ? createPortal(
            <div
              role="tooltip"
              className="pointer-events-none fixed z-[400] rounded-lg border border-sky-500/40 bg-slate-950 p-2.5 text-left shadow-2xl"
              style={filePreviewTooltip.style}
            >
              <p className="mb-1.5 whitespace-nowrap border-b border-white/10 pb-1 text-xs font-semibold text-sky-300">
                {FILE_PREVIEW_COLUMN_TITLE}
              </p>
              <ul className="max-h-52 space-y-0.5 overflow-y-auto overflow-x-auto">
                {filePreviewTooltip.visibleRows.map((row, idx) => (
                  <li key={`preview-${filePreviewTooltip.batch.name}-${idx}-${row.displayName}-${row.phone}`}>
                    <FilePreviewRecipientLine row={row} />
                  </li>
                ))}
              </ul>
              {filePreviewTooltip.overflowCount > 0 ? (
                <p className="mt-1.5 text-xs font-medium text-slate-400">
                  … (추가{filePreviewTooltip.overflowCount.toLocaleString('ko-KR')}명)
                </p>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
