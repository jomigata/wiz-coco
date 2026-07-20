'use client';

import React from 'react';
import { WELCOME_MESSAGE_SAMPLES } from '@/lib/welcomeMessageSamples';

type Props = {
  onPick: (text: string) => void;
  disabled?: boolean;
};

/** 안내 메시지 입력란 위 — 예시 1·2·3 미리보기·적용 */
export default function WelcomeMessageSamplePicker({ onPick, disabled }: Props) {
  return (
    <div className="mb-2 space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-slate-500">예시)</span>
        {WELCOME_MESSAGE_SAMPLES.map((sample) => (
          <button
            key={sample.label}
            type="button"
            disabled={disabled}
            onClick={() => onPick(sample.text)}
            className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs font-medium text-sky-200/90 transition-colors hover:border-sky-400/30 hover:bg-sky-500/10 disabled:opacity-50"
          >
            {sample.label.replace('예시 ', '')}
          </button>
        ))}
      </div>
      <details className="group rounded-lg border border-white/[0.08] bg-[#101f38]/50 text-xs text-slate-400 open:border-sky-400/20">
        <summary className="cursor-pointer list-none px-2.5 py-1.5 text-slate-500 transition-colors hover:text-slate-300 [&::-webkit-details-marker]:hidden">
          예시 문구 미리보기
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
