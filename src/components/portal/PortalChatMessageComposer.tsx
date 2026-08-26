'use client';

import React from 'react';
import DateTimeSpinFields, { defaultScheduledDate } from '@/components/ui/DateTimeSpinFields';

export type PortalChatComposerTheme = 'portal' | 'counselor';

type Props = {
  theme?: PortalChatComposerTheme;
  draft: string;
  onDraftChange: (value: string) => void;
  scheduleEnabled: boolean;
  onScheduleEnabledChange: (enabled: boolean) => void;
  scheduledDate: Date;
  onScheduledDateChange: (date: Date) => void;
  sending: boolean;
  onSend: () => void;
  placeholder?: string;
};

const themeClasses: Record<
  PortalChatComposerTheme,
  { button: string; textareaFocus: string }
> = {
  portal: {
    button: 'bg-cyan-700 hover:bg-cyan-600',
    textareaFocus: 'focus:border-cyan-500/50',
  },
  counselor: {
    button: 'bg-indigo-700 hover:bg-indigo-600',
    textareaFocus: 'focus:border-indigo-500/50',
  },
};

export default function PortalChatMessageComposer({
  theme = 'portal',
  draft,
  onDraftChange,
  scheduleEnabled,
  onScheduleEnabledChange,
  scheduledDate,
  onScheduledDateChange,
  sending,
  onSend,
  placeholder = '질문을 입력하세요 (Ctrl+Enter 전송, Enter 줄바꿈)',
}: Props) {
  const styles = themeClasses[theme];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
        <label className="inline-flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={scheduleEnabled}
            onChange={(e) => {
              onScheduleEnabledChange(e.target.checked);
              if (e.target.checked) {
                onScheduledDateChange(defaultScheduledDate());
              }
            }}
          />
          예약 전송
        </label>
      </div>
      {scheduleEnabled ? (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-500">예약 일시</p>
          <DateTimeSpinFields value={scheduledDate} onChange={onScheduledDateChange} />
        </div>
      ) : null}
      <div className="flex gap-2">
        <textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              onSend();
            }
          }}
          rows={3}
          placeholder={placeholder}
          className={`min-h-[72px] flex-1 resize-y rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none ${styles.textareaFocus}`}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={sending || !draft.trim()}
          className={`shrink-0 self-end rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${styles.button}`}
        >
          {sending ? '전송 중…' : scheduleEnabled ? '예약' : '보내기'}
        </button>
      </div>
    </div>
  );
}

export function PortalChatFixedComposerShell({
  children,
  maxWidthClass = 'max-w-3xl',
}: {
  children: React.ReactNode;
  maxWidthClass?: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-700/80 bg-gray-900/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
      <div className={`mx-auto ${maxWidthClass}`}>
        <div className="rounded-2xl border border-slate-600/80 bg-slate-800/95 p-4 shadow-2xl ring-1 ring-white/5">
          {children}
        </div>
      </div>
    </div>
  );
}
