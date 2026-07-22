'use client';

import React from 'react';
import { WELCOME_MESSAGE_SAMPLES } from '@/lib/welcomeMessageSamples';

type Props = {
  onPick: (text: string) => void;
  disabled?: boolean;
  /** true면 라벨 옆 한 줄(내담자 목록 첨부·샘플 스타일) */
  inline?: boolean;
};

/** 안내 메시지 — 샘플 1·2·3 적용 */
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
    <div className="mb-2 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-400">샘플</span>
        {sampleLinks}
      </div>
      <details className="group rounded-lg border border-white/[0.08] bg-[#101f38]/50 text-xs text-slate-400 open:border-sky-400/20">
        <summary className="cursor-pointer list-none px-2.5 py-1.5 text-slate-500 transition-colors hover:text-slate-300 [&::-webkit-details-marker]:hidden">
          샘플 문구 미리보기
          <span className="ml-1 text-[10px] text-slate-600 group-open:hidden">▼</span>
          <span className="ml-1 hidden text-[10px] text-slate-600 group-open:inline">▲</span>
        </summary>
        <ul className="space-y-2 border-t border-white/[0.06] px-2.5 py-2">
          {WELCOME_MESSAGE_SAMPLES.map((sample) => (
            <li key={sample.label}>
              <span className="font-medium text-sky-300/90">{sample.label}</span>
              <p className="mt-0.5 leading-relaxed text-slate-400">{sample.text}</p>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPick(sample.text)}
                className="mt-1 text-[11px] text-sky-400 underline-offset-2 hover:text-sky-300 hover:underline disabled:opacity-50"
              >
                이 문구 사용
              </button>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
