'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  content: React.ReactNode;
  children: React.ReactNode;
  /** false면 hover 툴팁 없음 */
  enabled?: boolean;
  placement?: 'top' | 'bottom';
  align?: 'center' | 'start';
  wrapperClassName?: string;
  tooltipClassName?: string;
} & Pick<React.HTMLAttributes<HTMLSpanElement>, 'onClick'>;

/** 목록 테이블 — sticky 헤더·overflow에 가리지 않도록 body 포털 툴팁 */
export default function CounselorListHoverTooltip({
  content,
  children,
  enabled = true,
  placement = 'top',
  align = 'center',
  wrapperClassName = '',
  tooltipClassName = '',
  onClick,
}: Props) {
  const tooltipId = useId();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const left = align === 'start' ? rect.left : rect.left + rect.width / 2;
    const top = placement === 'top' ? rect.top - 8 : rect.bottom + 8;
    setPos({ top, left });
  }, [align, placement]);

  const show = () => {
    if (!enabled) return;
    updatePosition();
    setVisible(true);
  };

  const hide = () => setVisible(false);

  useEffect(() => {
    if (!visible) return undefined;
    const onChange = () => updatePosition();
    window.addEventListener('scroll', onChange, true);
    window.addEventListener('resize', onChange);
    return () => {
      window.removeEventListener('scroll', onChange, true);
      window.removeEventListener('resize', onChange);
    };
  }, [visible, updatePosition]);

  const transform =
    placement === 'top'
      ? align === 'start'
        ? 'translate(0, -100%)'
        : 'translate(-50%, -100%)'
      : align === 'start'
        ? 'translate(0, 0)'
        : 'translate(-50%, 0)';

  const tooltipNode =
    enabled && visible ? (
      <div
        id={tooltipId}
        role="tooltip"
        className={`pointer-events-none fixed z-[250] max-w-xs rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium leading-snug text-slate-800 shadow-md ${tooltipClassName}`}
        style={{
          left: pos.left,
          top: pos.top,
          transform,
        }}
      >
        {content}
      </div>
    ) : null;

  return (
    <>
      <span
        ref={anchorRef}
        className={`inline-flex ${wrapperClassName}`.trim()}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={onClick}
        aria-describedby={visible && enabled ? tooltipId : undefined}
      >
        {children}
      </span>
      {typeof document !== 'undefined' && tooltipNode ? createPortal(tooltipNode, document.body) : null}
    </>
  );
}
