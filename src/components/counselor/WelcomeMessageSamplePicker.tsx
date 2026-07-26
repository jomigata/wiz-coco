'use client';

import React from 'react';
import { WELCOME_MESSAGE_SAMPLES } from '@/lib/welcomeMessageSamples';

type Props = {
  onPick: (text: string) => void;
  disabled?: boolean;
  /** true면 라벨 옆 한 줄(내담자 목록 첨부·샘플 스타일) */
  inline?: boolean;
};

/** 안내 메시지 — 샘플 1·2·3 클릭 시 textarea에 적용 */
export default function WelcomeMessageSamplePicker({ onPick, disabled, inline }: Props) {
  const sampleLinks = WELCOME_MESSAGE_SAMPLES.map((sample) => (
    <button
      key={sample.label}
      type="button"
      disabled={disabled}
      onClick={() => onPick(sample.text)}
      className="text-sm text-sky-300 transition hover:text-sky-200 disabled:opacity-50"
    >
      {sample.label}
    </button>
  ));

  if (inline) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-400">샘플</span>
        {sampleLinks}
      </div>
    );
  }

  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <span className="text-sm text-slate-400">샘플</span>
      {sampleLinks}
    </div>
  );
}
