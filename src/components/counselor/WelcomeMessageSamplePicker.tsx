'use client';

import React, { useMemo, useState } from 'react';
import { WELCOME_MESSAGE_SAMPLES } from '@/lib/welcomeMessageSamples';

type Props = {
  onPick: (text: string) => void;
  disabled?: boolean;
  /** true면 라벨 옆 한 줄(내담자 목록 첨부·샘플 스타일) */
  inline?: boolean;
};

/** 안내 메시지 — 샘플 1·2·3: hover 미리보기, click 고정 입력 */
export default function WelcomeMessageSamplePicker({ onPick, disabled, inline }: Props) {
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  const hoveredSample = useMemo(
    () => WELCOME_MESSAGE_SAMPLES.find((sample) => sample.label === hoveredLabel) ?? null,
    [hoveredLabel],
  );

  const sampleLinks = WELCOME_MESSAGE_SAMPLES.map((sample) => (
    <button
      key={sample.label}
      type="button"
      disabled={disabled}
      onMouseEnter={() => setHoveredLabel(sample.label)}
      onMouseLeave={() => setHoveredLabel(null)}
      onFocus={() => setHoveredLabel(sample.label)}
      onBlur={() => setHoveredLabel(null)}
      onClick={() => onPick(sample.text)}
      className="text-sm text-sky-300 transition hover:text-sky-200 disabled:opacity-50"
    >
      {sample.label}
    </button>
  ));

  const hoverPreview = hoveredSample ? (
    <div
      className={`rounded-lg border border-sky-500/30 bg-slate-950/90 px-3 py-2.5 text-left text-xs leading-relaxed text-slate-200 shadow-lg ${inline ? 'mt-2 w-full' : 'mt-2'}`}
      role="tooltip"
    >
      <p className="mb-1 text-[11px] font-semibold text-sky-300/90">{hoveredSample.label} 미리보기</p>
      <p>{hoveredSample.text}</p>
    </div>
  ) : null;

  if (inline) {
    return (
      <div className="flex min-w-[12rem] flex-col items-end">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="text-sm text-slate-400">샘플</span>
          {sampleLinks}
        </div>
        {hoverPreview}
      </div>
    );
  }

  return (
    <div className="mb-2 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-400">샘플</span>
        {sampleLinks}
      </div>
      {hoverPreview}
    </div>
  );
}
