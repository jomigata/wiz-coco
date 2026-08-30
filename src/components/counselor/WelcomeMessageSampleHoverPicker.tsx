'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { WELCOME_MESSAGE_SAMPLES } from '@/lib/welcomeMessageSamples';

type Props = {
  onPick: (text: string) => void;
  disabled?: boolean;
  tooltipPlacement?: 'top' | 'bottom';
};

type TooltipAnchor = {
  label: string;
  top: number;
  left: number;
  width: number;
};

/** 안내 문구 샘플 — 마우스 오버 시 툴팁(포털), 클릭 시 textarea에 적용 */
export default function WelcomeMessageSampleHoverPicker({
  onPick,
  disabled,
  tooltipPlacement = 'top',
}: Props) {
  const [anchor, setAnchor] = useState<TooltipAnchor | null>(null);
  const activeSample = WELCOME_MESSAGE_SAMPLES.find((s) => s.label === anchor?.label) ?? null;

  const showForButton = (label: string, el: HTMLButtonElement) => {
    const rect = el.getBoundingClientRect();
    setAnchor({
      label,
      top: rect.top,
      left: rect.right,
      width: Math.min(window.innerWidth - 16, 448),
    });
  };

  const hide = () => setAnchor(null);

  useEffect(() => {
    if (!anchor) return undefined;
    const onScrollOrResize = () => hide();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [anchor]);

  const tooltipNode =
    activeSample && anchor ? (
      <div
        role="tooltip"
        className="pointer-events-none fixed z-[250] rounded-lg border border-sky-500/40 bg-slate-950 p-3 text-left shadow-2xl"
        style={{
          width: anchor.width,
          top: tooltipPlacement === 'top' ? anchor.top - 8 : anchor.top + 28,
          left: anchor.left,
          transform: tooltipPlacement === 'top' ? 'translate(-100%, -100%)' : 'translate(-100%, 0)',
        }}
      >
        <p className="mb-1.5 text-[11px] font-semibold text-sky-300">{activeSample.label}</p>
        <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-200">{activeSample.text}</p>
      </div>
    ) : null;

  return (
    <>
      <div
        className="relative flex flex-wrap items-center justify-end gap-1 text-xs text-slate-500"
        onMouseLeave={hide}
      >
        <span>예)</span>
        {WELCOME_MESSAGE_SAMPLES.map((sample, index) => (
          <React.Fragment key={sample.label}>
            {index > 0 ? <span aria-hidden>,</span> : null}
            <button
              type="button"
              disabled={disabled}
              onMouseEnter={(e) => showForButton(sample.label, e.currentTarget)}
              onFocus={(e) => showForButton(sample.label, e.currentTarget)}
              onBlur={hide}
              onClick={() => onPick(sample.text)}
              className="text-sky-300 transition hover:text-sky-200 disabled:opacity-50"
            >
              {sample.label}
            </button>
          </React.Fragment>
        ))}
      </div>
      {typeof document !== 'undefined' && tooltipNode ? createPortal(tooltipNode, document.body) : null}
    </>
  );
}
