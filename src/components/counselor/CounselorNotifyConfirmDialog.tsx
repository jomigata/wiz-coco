'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { fetchMyCredits } from '@/lib/commerceApi';
import {
  defaultNotifyChannelSelection,
  formatNotifyPointSummary,
  notifyChannelsToPayload,
  validateNotifyChannelSelection,
  type NotifyChannelSelection,
  type NotifyRecipientContact,
} from '@/lib/counselorNotifyChannels';
import {
  POINT_COST_PORTAL_RECIPIENT,
  formatPoints,
  resolvePointsBalance,
} from '@/lib/pointsCatalog';

export type CounselorNotifyConfirmKind =
  | 'remind'
  | 'resend'
  | 'push'
  | 'add_recipient'
  | 'care';

type Props = {
  open: boolean;
  kind: CounselorNotifyConfirmKind;
  title?: string;
  description?: string;
  recipients: NotifyRecipientContact[];
  confirmLabel?: string;
  loading?: boolean;
  /** true면 발송 채널 선택 UI 숨김 — 휴대폰 자동 선택 */
  hideChannels?: boolean;
  onConfirm: (channels: ('phone')[]) => void;
  onCancel: () => void;
};

const KIND_LABELS: Record<CounselorNotifyConfirmKind, string> = {
  remind: '미실시 알림 발송 확인',
  resend: '나의코드 전달 확인',
  push: '검사 보내기 확인',
  add_recipient: '내담자 추가·발송 확인',
  care: '숙제 보내기 확인',
};

export default function CounselorNotifyConfirmDialog({
  open,
  kind,
  title,
  description,
  recipients,
  confirmLabel = '발송',
  loading = false,
  hideChannels = false,
  onConfirm,
  onCancel,
}: Props) {
  const [channels, setChannels] = useState<NotifyChannelSelection>(() =>
    defaultNotifyChannelSelection(recipients),
  );
  const [balancePoints, setBalancePoints] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const summaryTargetOnly = hideChannels && (kind === 'push' || kind === 'care');

  useEffect(() => {
    if (!open) return;
    setChannels(defaultNotifyChannelSelection(recipients));
    setBalanceLoading(true);
    fetchMyCredits(5)
      .then((data) => setBalancePoints(resolvePointsBalance(data, 'assessment')))
      .catch(() => setBalancePoints(0))
      .finally(() => setBalanceLoading(false));
  }, [open, recipients]);

  const effectiveChannels = hideChannels ? defaultNotifyChannelSelection(recipients) : channels;

  const validationError = useMemo(
    () => validateNotifyChannelSelection(effectiveChannels, recipients),
    [effectiveChannels, recipients],
  );

  const pointSummary = useMemo(
    () =>
      formatNotifyPointSummary(recipients, effectiveChannels, balancePoints, {
        perRecipient: kind === 'add_recipient',
        targetOnly: summaryTargetOnly,
      }),
    [recipients, effectiveChannels, balancePoints, kind, summaryTargetOnly],
  );

  const insufficient = pointSummary.usePoints > balancePoints;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0f1a2e] to-[#0a1220] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-white/10 px-5 py-4">
          <h3 className="text-base font-semibold text-white">{title || KIND_LABELS[kind]}</h3>
          {description ? (
            <p className="mt-1 text-sm text-slate-400">{description}</p>
          ) : kind === 'add_recipient' ? (
            <p className="mt-1 text-sm text-slate-400">
              내담자 1명 추가 시 {formatPoints(POINT_COST_PORTAL_RECIPIENT)}가 차감됩니다. 휴대폰으로
              발송됩니다.
            </p>
          ) : hideChannels ? (
            <p className="mt-1 text-sm text-slate-400">
              등록된 휴대폰 번호로 나의코드·안내가 발송됩니다.
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-400">
              휴대폰 발송(
              <span className="text-amber-300">{formatPoints(POINT_COST_PORTAL_RECIPIENT)}</span>
              /건)을 확인해 주세요.
            </p>
          )}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 text-sm">
          {!hideChannels ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">발송 채널</p>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-[#121f38]/80 px-3 py-3">
                <input
                  type="checkbox"
                  className="mt-1 rounded accent-amber-400"
                  checked={channels.phone}
                  onChange={(e) => setChannels({ phone: e.target.checked })}
                  disabled={loading}
                />
                <span>
                  <span className="font-semibold text-white">휴대폰</span>
                  <span className="text-amber-300">
                    {' '}
                    ({formatPoints(POINT_COST_PORTAL_RECIPIENT)}/건)
                  </span>
                </span>
              </label>
            </div>
          ) : null}

          <div className="rounded-xl border border-sky-500/20 bg-sky-950/25 px-3 py-3">
            <p className="text-xs font-semibold text-sky-200/90">발송 요약</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              {pointSummary.detailLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            {!summaryTargetOnly ? (
              <p className="mt-3 border-t border-white/10 pt-3 text-sm font-semibold tabular-nums text-amber-100">
                {pointSummary.footerLine}
              </p>
            ) : null}
            {balanceLoading ? (
              <p className="mt-2 text-xs text-slate-500">포인트 잔액 확인 중…</p>
            ) : insufficient ? (
              <p className="mt-2 text-xs text-red-300">
                보유 포인트가 부족합니다. 충전 후 다시 시도해 주세요.
              </p>
            ) : null}
          </div>

          {!summaryTargetOnly && recipients.length > 0 && recipients.length <= 8 ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                대상 ({recipients.length}명)
              </p>
              <ul className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300">
                {recipients.map((r, idx) => (
                  <li key={`${r.displayName}-${idx}`} className="truncate">
                    {r.displayName || '내담자'}
                    {r.phone?.trim() ? ` · ${r.phone.trim()}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {validationError ? (
            <p className="text-sm text-amber-300" role="alert">
              {validationError}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            disabled={loading || Boolean(validationError) || insufficient || balanceLoading}
            onClick={() => onConfirm(notifyChannelsToPayload(effectiveChannels))}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? '처리 중…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
