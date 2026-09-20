'use client';

import React from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { COUNSELOR_APPROVAL_MEMO_SAMPLES } from '@/lib/counselorApprovalMemoSamples';

interface Props {
  open: boolean;
  action: 'approve' | 'reject';
  applicantName: string;
  bulkCount?: number;
  memo: string;
  busy?: boolean;
  onMemoChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CounselorApplicationReviewModal({
  open,
  action,
  applicantName,
  bulkCount = 1,
  memo,
  busy = false,
  onMemoChange,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  const isApprove = action === 'approve';
  const title =
    bulkCount > 1
      ? isApprove
        ? `선택 ${bulkCount}건 승인`
        : `선택 ${bulkCount}건 거부`
      : isApprove
        ? '상담사 승인'
        : '상담사 거부';

  const placeholder = isApprove
    ? '승인 축하 메시지, 이용 안내, 상담사 메뉴 사용법 등을 입력하세요. (선택)'
    : '거부 사유, 보완 요청 사항, 재신청 안내 등을 입력하세요. (선택)';

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/90 p-4">
      <div className="w-full max-w-lg rounded-xl border border-white/15 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {bulkCount === 1 && (
              <p className="mt-1 text-sm text-slate-400">신청자: {applicantName || '(이름 없음)'}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="text-slate-400 hover:text-white disabled:opacity-50"
            aria-label="닫기"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        <label className="mb-1 block text-sm font-medium text-slate-300">
          {isApprove ? '승인·안내 메모' : '거부·안내 메모'}
        </label>
        {isApprove && (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-400">샘플</span>
            {COUNSELOR_APPROVAL_MEMO_SAMPLES.map((sample) => {
              const selected = memo === sample.text;
              return (
                <button
                  key={sample.label}
                  type="button"
                  disabled={busy}
                  onClick={() => onMemoChange(sample.text)}
                  className={`rounded-md border px-2 py-0.5 text-sm transition disabled:opacity-50 ${
                    selected
                      ? 'border-sky-400/60 bg-sky-500/20 text-sky-200'
                      : 'border-white/10 bg-slate-800/80 text-sky-300 hover:border-sky-500/40 hover:text-sky-200'
                  }`}
                >
                  {sample.label}
                </button>
              );
            })}
          </div>
        )}
        <textarea
          value={memo}
          onChange={(e) => onMemoChange(e.target.value)}
          placeholder={placeholder}
          rows={5}
          disabled={busy}
          className="w-full rounded-lg border border-white/15 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60 disabled:opacity-60"
        />
        <p className="mt-2 text-xs text-slate-500">
          신청자는 마이페이지 설정에서 이 메모를 확인할 수 있습니다.
        </p>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 ${
              isApprove ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
            }`}
          >
            {isApprove ? <FaCheck className="h-4 w-4" /> : <FaTimes className="h-4 w-4" />}
            {busy ? '처리 중…' : isApprove ? '승인 확정' : '거부 확정'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg bg-slate-700 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-600 disabled:opacity-50"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
