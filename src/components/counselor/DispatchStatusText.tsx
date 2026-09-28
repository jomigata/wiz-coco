import React from 'react';
import type { ChannelDetailPart, DispatchStatusView } from '@/lib/dispatchRecipientDisplay';

function detailPartClassName(part: ChannelDetailPart): string | undefined {
  if (part.failed) return '!text-red-400 font-medium';
  if (part.text.startsWith('이메일')) return 'text-white';
  if (part.text.startsWith('알림톡') || part.text.startsWith('문자')) return 'text-amber-300';
  return undefined;
}

export default function DispatchStatusText({ value }: { value: DispatchStatusView }) {
  const { mainText, detailParts, className, title } = value;
  const showReason =
    title &&
    (mainText === '실패' || mainText.endsWith('실패') || mainText.includes('일부'));

  return (
    <span className={className} title={showReason ? undefined : title}>
      {mainText}
      {detailParts.length > 0 ? (
        <>
          {' ('}
          {detailParts.map((part, index) => (
            <React.Fragment key={`${part.text}-${index}`}>
              {index > 0 ? '·' : null}
              <span className={detailPartClassName(part)}>{part.text}</span>
            </React.Fragment>
          ))}
          {')'}
        </>
      ) : null}
      {showReason ? (
        <span className="mt-0.5 block text-[11px] font-normal leading-snug text-red-300/95">
          {title}
        </span>
      ) : null}
    </span>
  );
}
