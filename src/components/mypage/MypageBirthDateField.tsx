'use client';

import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const YEAR_SPAN = 100;
const PANEL_MAX_WIDTH = 320;
const VIEWPORT_PAD = 8;
const GAP = 8;

export function parseBirthDateIso(iso: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

export function formatBirthDateDisplay(iso: string): string {
  const p = parseBirthDateIso(iso);
  if (!p) return '';
  return `${p.year}. ${String(p.month).padStart(2, '0')}. ${String(p.day).padStart(2, '0')}.`;
}

function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function clampDay(year: number, month: number, day: number): number {
  const max = new Date(year, month, 0).getDate();
  return Math.min(Math.max(1, day), max);
}

function defaultParts(referenceYear = new Date().getFullYear()): { year: number; month: number; day: number } {
  return { year: referenceYear - 30, month: 1, day: 1 };
}

interface MypageBirthDateFieldProps {
  value: string;
  onChange: (iso: string) => void;
  label?: string;
  labelClassName?: string;
  fieldClassName?: string;
  placeholder?: string;
}

export default function MypageBirthDateField({
  value,
  onChange,
  label = '생년월일',
  labelClassName = 'block text-blue-200 text-xs mb-1',
  fieldClassName =
    'w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-blue-100 placeholder-blue-300/40 focus:outline-none focus:border-purple-400/60 focus:bg-white/15 transition-colors text-sm',
  placeholder = '연도 · 월 · 일 선택',
}: MypageBirthDateFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const yearSelectRef = useRef<HTMLSelectElement>(null);
  const listboxId = useId();
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(
    () => Array.from({ length: YEAR_SPAN + 1 }, (_, i) => currentYear - i),
    [currentYear],
  );

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const [draft, setDraft] = useState(() => parseBirthDateIso(value) ?? defaultParts(currentYear));
  const [yearInput, setYearInput] = useState(String(draft.year));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) return;
    const p = parseBirthDateIso(value);
    if (p) {
      setDraft(p);
      setYearInput(String(p.year));
    }
  }, [value, open]);

  const updatePanelPosition = useCallback(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(PANEL_MAX_WIDTH, Math.max(rect.width, vw - VIEWPORT_PAD * 2));
    let left = rect.left;
    left = Math.max(VIEWPORT_PAD, Math.min(left, vw - width - VIEWPORT_PAD));

    const panelHeight = panel?.offsetHeight ?? 420;
    const maxTop = vh - VIEWPORT_PAD - panelHeight;
    let top = rect.bottom + GAP;
    if (top > maxTop) {
      const aboveTop = rect.top - GAP - panelHeight;
      top = aboveTop >= VIEWPORT_PAD ? aboveTop : Math.max(VIEWPORT_PAD, maxTop);
    }

    setPanelStyle({
      position: 'fixed',
      top,
      left,
      width,
      zIndex: 10050,
      maxHeight: vh - VIEWPORT_PAD * 2,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePanelPosition();
    const panel = panelRef.current;
    const ro = panel ? new ResizeObserver(() => updatePanelPosition()) : null;
    if (panel && ro) ro.observe(panel);
    window.addEventListener('scroll', updatePanelPosition, true);
    window.addEventListener('resize', updatePanelPosition);
    return () => {
      ro?.disconnect();
      window.removeEventListener('scroll', updatePanelPosition, true);
      window.removeEventListener('resize', updatePanelPosition);
    };
  }, [open, updatePanelPosition, draft.month, draft.year]);

  useEffect(() => {
    if (!open) return;
    const p = parseBirthDateIso(value);
    setDraft(p ?? defaultParts(currentYear));
    setYearInput(String((p ?? defaultParts(currentYear)).year));

    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, value, currentYear]);

  useEffect(() => {
    if (!open || !yearSelectRef.current) return;
    const opt = yearSelectRef.current.querySelector(`option[value="${draft.year}"]`);
    if (opt instanceof HTMLOptionElement) {
      opt.scrollIntoView({ block: 'nearest' });
    }
  }, [open, draft.year]);

  const applyDraft = (next: { year: number; month: number; day: number }) => {
    const day = clampDay(next.year, next.month, next.day);
    const normalized = { year: next.year, month: next.month, day };
    setDraft(normalized);
    setYearInput(String(normalized.year));
    onChange(toIso(normalized.year, normalized.month, normalized.day));
  };

  const commitYearInput = () => {
    const raw = yearInput.trim();
    if (!raw) {
      setYearInput(String(draft.year));
      return;
    }
    const y = Number(raw);
    if (!Number.isFinite(y) || y < currentYear - YEAR_SPAN || y > currentYear) {
      setYearInput(String(draft.year));
      return;
    }
    applyDraft({ ...draft, year: y });
  };

  const daysInMonth = new Date(draft.year, draft.month, 0).getDate();
  const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토'];

  const panel = open ? (
    <div
      ref={panelRef}
      id={listboxId}
      role="dialog"
      aria-label="생년월일 선택"
      style={panelStyle}
      className="overflow-y-auto overscroll-contain rounded-xl border border-purple-400/25 bg-[#0f1d33] p-3 shadow-xl shadow-black/40"
    >
      <div className="mb-3 space-y-2">
        <p className="text-[11px] font-medium text-slate-400">연도</p>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={currentYear - YEAR_SPAN}
            max={currentYear}
            value={yearInput}
            onChange={(e) => setYearInput(e.target.value)}
            onBlur={commitYearInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitYearInput();
              }
            }}
            className="w-24 shrink-0 rounded-lg border border-white/15 bg-white/10 px-2 py-1.5 text-sm text-slate-100 focus:border-purple-400/60 focus:outline-none"
            aria-label="연도 직접 입력"
            placeholder="YYYY"
          />
          <select
            ref={yearSelectRef}
            value={draft.year}
            onChange={(e) => applyDraft({ ...draft, year: Number(e.target.value) })}
            className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/10 px-2 py-1.5 text-sm text-slate-100 focus:border-purple-400/60 focus:outline-none [color-scheme:dark]"
            aria-label="연도 목록에서 선택"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-3">
        <p className="mb-2 text-[11px] font-medium text-slate-400">월</p>
        <div className="grid grid-cols-4 gap-1">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
            <button
              key={month}
              type="button"
              onClick={() => applyDraft({ ...draft, month })}
              className={`rounded-md px-1 py-1 text-xs transition-colors ${
                draft.month === month ? 'bg-purple-500/90 text-white' : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              {month}월
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-medium text-slate-400">일</p>
        <div className="grid grid-cols-7 gap-0.5">
          {weekdayLabels.map((d) => (
            <div key={d} className="py-0.5 text-center text-[10px] text-slate-500">
              {d}
            </div>
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => {
                applyDraft({ ...draft, day });
                setOpen(false);
              }}
              className={`rounded-md py-1 text-xs transition-colors ${
                draft.day === day ? 'bg-sky-500/90 text-white' : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex justify-end border-t border-white/10 pt-2">
        <button
          type="button"
          className="rounded-md px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
          onClick={() => setOpen(false)}
        >
          닫기
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div ref={rootRef} className="relative">
      {label ? <label className={labelClassName}>{label}</label> : null}
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={listboxId}
        onClick={() => setOpen((v) => !v)}
        className={`${fieldClassName} flex w-full items-center justify-between text-left cursor-pointer`}
      >
        <span className={value ? 'text-white' : 'text-white/40'}>
          {value ? formatBirthDateDisplay(value) : placeholder}
        </span>
        <svg className="h-4 w-4 shrink-0 text-purple-300/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      {mounted && panel ? createPortal(panel, document.body) : null}
    </div>
  );
}
