'use client';

import React, { useState } from 'react';
import { WELCOME_MESSAGE_SAMPLES } from '@/lib/welcomeMessageSamples';

type Props = {
  onPick: (text: string) => void;
  disabled?: boolean;
  tooltipPlacement?: 'top' | 'bottom';
};

/** 안내 문구 샘플 — 마우스 오버 시 툴팁, 클릭 시 textarea에 적용 */
export default function WelcomeMessageSampleHoverPicker({
  onPick,
  disabled,
  tooltipPlacement = 'top',
}: Props) {
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const activeSample = WELCOME_MESSAGE_SAMPLES.find((s) => s.label === activeLabel) ?? null;

  const tooltipClass =
    tooltipPlacement === 'top'
      ? 'absolute right-0 bottom-full z-30 mb-1.5'
      : 'absolute right-0 top-full z-30 mt-1.5';

  return (
    <div
      className="relative flex flex-wrap items-center justify-end gap-1 text-xs text-slate-500"
      onMouseLeave={() => setActiveLabel(null)}
    >
      <span>예)</span>
      {WELCOME_MESSAGE_SAMPLES.map((sample, index) => (
        <React.Fragment key={sample.label}>
          {index > 0 ? <span aria-hidden>,</span> : null}
          <button
            type="button"
            disabled={disabled}
            onMouseEnter={() => setActiveLabel(sample.label)}
            onFocus={() => setActiveLabel(sample.label)}
            onBlur={() => setActiveLabel(null)}
            onClick={() => onPick(sample.text)}
            className="text-sky-300 transition hover:text-sky-200 disabled:opacity-50"
          >
            {sample.label}
          </button>
        </React.Fragment>
      ))}
      {activeSample ? (
        <div
          className={`pointer-events-none ${tooltipClass} w-[min(100vw-2rem,28rem)] rounded-lg border border-sky-500/40 bg-slate-950 p-3 text-left shadow-2xl`}
          role="tooltip"
        >
          <p className="mb-1.5 text-[11px] font-semibold text-sky-300">{activeSample.label}</p>
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-200">{activeSample.text}</p>
        </div>
      ) : null}
    </div>
  );
}
