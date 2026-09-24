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
  POINT_COST_INITIAL_RECIPIENT_DISPATCH,
  POINT_COST_RESEND_PHONE,
  formatPoints,
  resolvePointsBalance,
} from '@/lib/pointsCatalog';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';

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
  /** add_recipient — 부적합 제외 등 추가 한 줄 안내 */
  addRecipientExtraLines?: string[];
  onConfirm: (channels: ('email' | 'phone')[]) => void;
  onCancel: () => void;
};

const KIND_LABELS: Record<CounselorNotifyConfirmKind, string> = {
  remind: '미실시 알림 발송 확인',
  resend: '나의코드 전달 확인',
  push: '검사 보내기 확인',
  add_recipient: '내담자 추가 · 발송 확인',
  care: '숙제 보내기 확인',
};

function AddRecipientConfirmSummary({
  targetCount,
  groupName,
  affiliation,
  usePoints,
  balancePoints,
  balanceLoading,
  extras,
  insufficient,
}: {
  targetCount: number;
  groupName: string;
  affiliation: string;
  usePoints: number;
  balancePoints: number;
  balanceLoading: boolean;
  extras: string[];
  insufficient: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-sky-400/25 bg-gradient-to-br from-[#0c1628] via-[#0a1220] to-[#060d18] shadow-lg shadow-black/30 ring-1 ring-white/5">
      <div className="border-b border-sky-500/20 bg-gradient-to-r from-sky-600/30 via-sky-500/10 to-emerald-600/10 px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sky-300/90">발송 요약</p>
      </div>
      <div className="space-y-3 p-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-sky-500/20 bg-sky-950/35 px-2.5 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-400/90">대상</p>
            <p className="mt-0.5 text-base font-bold tabular-nums text-white">{targetCount}명</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">그룹</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-slate-100" title={groupName}>
              {groupName}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">소속</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-slate-100" title={affiliation}>
              {affiliation}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 to-slate-900/30 px-3.5 py-3">
          <p className="text-[11px] font-semibold text-emerald-300/90">발송 내용</p>
          <p className="mt-1.5 leading-relaxed">
            <span className="text-sm font-semibold text-white">나의코드</span>
            <span className="text-xs text-slate-300">와 </span>
            <span className="text-sm font-semibold text-white">비밀번호</span>
            <span className="text-xs text-slate-300">
              를 등록된 이메일과 휴대폰으로 전달합니다.
            </span>
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">
            발송 성공 시{' '}
            <span className="font-semibold tabular-nums text-amber-200/90">
              {formatPoints(POINT_COST_INITIAL_RECIPIENT_DISPATCH)}(1명당)
            </span>{' '}
            차감합니다.
          </p>
        </div>

        {balanceLoading ? (
          <div
            className="flex items-center justify-center gap-2.5 rounded-xl border border-sky-400/30 bg-sky-950/50 px-3 py-3"
            role="status"
            aria-live="polite"
          >
            <span
              className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-sky-400/30 border-t-sky-200"
              aria-hidden="true"
            />
            <span className="text-sm font-medium text-sky-100">포인트 잔액 확인 중…</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-amber-400/25 bg-gradient-to-br from-amber-950/50 to-amber-900/15 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-300/80">예상 차감</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-amber-50">
                {formatPoints(usePoints)}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">잔여 포인트</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-white">
                {formatPoints(balancePoints)}
              </p>
            </div>
          </div>
        )}

        {extras.map((line) => (
          <div
            key={line}
            className="rounded-xl border border-amber-500/30 bg-amber-950/30 px-3 py-2.5 text-xs leading-relaxed text-amber-100/95"
          >
            {line}
          </div>
        ))}

        {insufficient && !balanceLoading ? (
          <p className="rounded-lg border border-red-500/35 bg-red-950/40 px-3 py-2 text-sm text-red-200" role="alert">
            보유 포인트가 부족합니다. 충전 후 다시 시도해 주세요.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function CounselorNotifyConfirmDialog({
  open,
  kind,
  title,
  description,
  recipients,
  confirmLabel = '발송',
  loading = false,
  hideChannels = false,
  addRecipientExtraLines,
  onConfirm,
  onCancel,
}: Props) {
  const [channels, setChannels] = useState<NotifyChannelSelection>(() =>
    defaultNotifyChannelSelection(recipients),
  );
  const [balancePoints, setBalancePoints] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const channelUiHidden = hideChannels || kind === 'add_recipient';
  const pushCareSummary = kind === 'push' || kind === 'care';

  useEffect(() => {
    if (!open) return;
    setChannels(defaultNotifyChannelSelection(recipients));
    setBalanceLoading(true);
    fetchMyCredits(5)
      .then((data) => setBalancePoints(resolvePointsBalance(data, 'assessment')))
      .catch(() => setBalancePoints(0))
      .finally(() => setBalanceLoading(false));
  }, [open, recipients]);

  const effectiveChannels = channelUiHidden ? defaultNotifyChannelSelection(recipients) : channels;

  const validationError = useMemo(
    () => validateNotifyChannelSelection(effectiveChannels, recipients),
    [effectiveChannels, recipients],
  );

  const pointSummary = useMemo(
    () =>
      formatNotifyPointSummary(recipients, effectiveChannels, balancePoints, {
        perRecipient: kind === 'add_recipient',
        resend: kind === 'resend',
        remind: kind === 'remind',
        targetOnly: kind === 'add_recipient',
      }),
    [recipients, effectiveChannels, balancePoints, kind],
  );

  const summaryLines = useMemo(() => {
    if (kind === 'add_recipient') {
      return [];
    }
    if (pushCareSummary) {
      const lines: string[] = [`대상: ${recipients.length}명`];
      for (const r of recipients) {
        const name = (r.displayName || '내담자').trim();
        lines.push(`이름: ${name}`);
        const code = formatAccessCodeDisplay(r.myCode || '');
        if (code && code !== '—') lines.push(`나의코드: ${code}`);
      }
      return lines;
    }
    return pointSummary.detailLines;
  }, [kind, pushCareSummary, recipients, pointSummary.detailLines]);

  const addRecipientMeta = useMemo(() => {
    if (kind !== 'add_recipient') return null;
    const r = recipients[0];
    return {
      groupName: (r?.groupName || '').trim() || '—',
      affiliation: (r?.affiliation || '').trim() || '—',
      extras: (addRecipientExtraLines || []).map((s) => s.trim()).filter(Boolean),
    };
  }, [kind, recipients, addRecipientExtraLines]);

  const showPointFooter = pushCareSummary || (kind !== 'add_recipient' && !channelUiHidden);

  const insufficient = pointSummary.usePoints > balancePoints;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={() => {
        if (!loading) onCancel();
      }}
    >
      <div
        className={`flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-2xl ${
          kind === 'add_recipient'
            ? 'border-sky-400/25 bg-gradient-to-b from-[#0f1a2e] via-[#0a1220] to-[#060d18] ring-1 ring-sky-500/10'
            : 'border-white/10 bg-gradient-to-b from-[#0f1a2e] to-[#0a1220]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={
            kind === 'add_recipient'
              ? 'border-b border-sky-400/20 bg-gradient-to-r from-sky-600/30 via-sky-500/10 to-transparent px-5 py-4'
              : 'border-b border-white/10 px-5 py-4'
          }
        >
          <h3 className="text-base font-bold tracking-tight text-white sm:text-lg">
            {title || KIND_LABELS[kind]}
          </h3>
          {description ? (
            <p className="mt-1 text-sm text-slate-400">{description}</p>
          ) : kind === 'add_recipient' ? (
            <p className="mt-1.5 text-sm leading-relaxed text-sky-100/80">
              선택한 내담자에게 접속 정보를 발송합니다.
            </p>
          ) : channelUiHidden ? (
            <p className="mt-1 text-sm text-slate-400">
              등록된 연락처로 나의코드·안내가 발송됩니다.
            </p>
          ) : kind === 'resend' ? (
            <p className="mt-1 text-sm text-slate-400">
              최초 전달(미발송·전체 실패)은 성공 시{' '}
              <span className="text-amber-300">
                {formatPoints(POINT_COST_INITIAL_RECIPIENT_DISPATCH)}
              </span>
              /명 · 재전송 1회 무료 · 2회째{' '}
              <span className="text-amber-300">{formatPoints(POINT_COST_RESEND_PHONE)}</span>/명
            </p>
          ) : kind === 'remind' ? (
            <p className="mt-1 text-sm text-slate-400">
              미실시 알림 1회 무료 · 2회째부터 성공 시{' '}
              <span className="text-amber-300">{formatPoints(POINT_COST_RESEND_PHONE)}</span>/명
              (전 채널 실패 시 차감분 환불)
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-400">
              이메일·휴대폰 발송 성공 시 내담자 1명당{' '}
              <span className="text-amber-300">
                {formatPoints(POINT_COST_INITIAL_RECIPIENT_DISPATCH)}
              </span>
              가 차감됩니다.
            </p>
          )}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 text-sm">
          {!channelUiHidden ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">발송 채널</p>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-[#121f38]/80 px-3 py-3">
                <input
                  type="checkbox"
                  className="mt-1 rounded accent-sky-400"
                  checked={channels.email}
                  onChange={(e) => setChannels((prev) => ({ ...prev, email: e.target.checked }))}
                  disabled={loading}
                />
                <span>
                  <span className="font-semibold text-white">이메일</span>
                  <span className="text-slate-400"> (0포인트)</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-[#121f38]/80 px-3 py-3">
                <input
                  type="checkbox"
                  className="mt-1 rounded accent-amber-400"
                  checked={channels.phone}
                  onChange={(e) => setChannels((prev) => ({ ...prev, phone: e.target.checked }))}
                  disabled={loading}
                />
                <span>
                  <span className="font-semibold text-white">휴대폰</span>
                  <span className="text-amber-300">
                    {' '}
                    (
                    {kind === 'resend' || kind === 'remind'
                      ? `2회째 ${formatPoints(POINT_COST_RESEND_PHONE)}`
                      : '0포인트'}
                    /건)
                  </span>
                </span>
              </label>
            </div>
          ) : null}

          {kind === 'add_recipient' && addRecipientMeta ? (
            <AddRecipientConfirmSummary
              targetCount={recipients.length}
              groupName={addRecipientMeta.groupName}
              affiliation={addRecipientMeta.affiliation}
              usePoints={pointSummary.usePoints}
              balancePoints={balancePoints}
              balanceLoading={balanceLoading}
              extras={addRecipientMeta.extras}
              insufficient={insufficient}
            />
          ) : (
          <div className="rounded-xl border border-sky-500/20 bg-sky-950/25 px-3 py-3">
            <p className="text-xs font-semibold text-sky-200/90">발송 요약</p>
            <ul className="mt-2 space-y-1.5 text-sm leading-snug text-slate-200">
              {summaryLines.map((line) => (
                <li key={line} className="break-words">
                  {line}
                </li>
              ))}
            </ul>
            {showPointFooter ? (
              <p className="mt-3 border-t border-white/10 pt-3 text-sm font-semibold tabular-nums text-amber-100">
                {pointSummary.footerLine}
              </p>
            ) : null}
            {balanceLoading ? (
              <p
                className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-sky-400/25 bg-sky-950/40 px-3 py-2.5 text-sm font-medium text-sky-100"
                role="status"
                aria-live="polite"
              >
                <span
                  className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-sky-400/30 border-t-sky-300"
                  aria-hidden="true"
                />
                포인트 잔액 확인 중…
              </p>
            ) : insufficient ? (
              <p className="mt-2 text-xs text-red-300">
                보유 포인트가 부족합니다. 충전 후 다시 시도해 주세요.
              </p>
            ) : null}
          </div>
          )}

          {validationError ? (
            <p className="text-sm text-amber-300" role="alert">
              {validationError}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-white/10 bg-black/20 px-5 py-4">
          <button
            type="button"
            disabled={loading || Boolean(validationError) || insufficient || balanceLoading}
            onClick={() => onConfirm(notifyChannelsToPayload(effectiveChannels))}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-colors disabled:opacity-50 ${
              kind === 'add_recipient'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-emerald-950/40 hover:from-emerald-500 hover:to-emerald-400'
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {loading ? '처리 중…' : confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10 disabled:opacity-50"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
