'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { counselorAssessmentTestOptions } from '@/data/counselorAssessmentTests';

type Props = {
  open: boolean;
  selectedTestIds: Set<string>;
  onClose: () => void;
  onConfirm: (selected: Set<string>) => void;
};

export default function CounselorQuickSendTestPickerModal({
  open,
  selectedTestIds,
  onClose,
  onConfirm,
}: Props) {
  const [draft, setDraft] = useState<Set<string>>(() => new Set(selectedTestIds));
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) return;
    setDraft(new Set(selectedTestIds));
    setQuery('');
  }, [open, selectedTestIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? counselorAssessmentTestOptions.filter(
          (t) => t.name.toLowerCase().includes(q) || t.testId.toLowerCase().includes(q),
        )
      : counselorAssessmentTestOptions;
    return [...base].sort((a, b) => {
      const aSelected = draft.has(a.testId) ? 0 : 1;
      const bSelected = draft.has(b.testId) ? 0 : 1;
      if (aSelected !== bSelected) return aSelected - bSelected;
      return a.name.localeCompare(b.name, 'ko');
    });
  }, [query, draft]);

  if (!open) return null;

  const toggle = (testId: string) => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(testId)) next.delete(testId);
      else next.add(testId);
      return next;
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col rounded-xl border border-white/15 bg-[#151c28] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-send-test-picker-title"
      >
        <div className="border-b border-white/10 px-5 py-4">
          <h3 id="quick-send-test-picker-title" className="text-lg font-semibold text-white">
            검사 구성 선택
          </h3>
          <p className="mt-1 text-sm text-slate-400">포함할 검사를 선택하세요.</p>
        </div>

        <div className="border-b border-white/10 px-5 py-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검사명 검색"
            className="w-full rounded-lg border border-white/15 bg-[#121f38]/95 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-white/40 focus:outline-none"
          />
          <p className="mt-2 text-xs text-sky-300">{draft.size}개 선택</p>
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          {filtered.length === 0 ? (
            <li className="px-2 py-6 text-center text-sm text-slate-500">검색 결과가 없습니다.</li>
          ) : (
            filtered.map((t) => (
              <li key={t.testId}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-slate-200 hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={draft.has(t.testId)}
                    onChange={() => toggle(t.testId)}
                    className="rounded border-white/20 text-sky-500"
                  />
                  <span className="min-w-0 flex-1">{t.name}</span>
                </label>
              </li>
            ))
          )}
        </ul>

        <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => {
              if (draft.size === 0) return;
              onConfirm(new Set(draft));
              onClose();
            }}
            disabled={draft.size === 0}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            확인 ({draft.size}개)
          </button>
        </div>
      </div>
    </div>
  );
}
