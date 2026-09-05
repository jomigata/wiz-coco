import React from 'react';
import type { ChannelDetailPart, DispatchStatusView } from '@/lib/dispatchRecipientDisplay';

function detailPartClassName(part: ChannelDetailPart): string | undefined {
  if (part.failed) return '!text-red-400 font-medium';
  if (part.text.startsWith('이메일')) return 'text-white';
  return undefined;
}

export default function DispatchStatusText({ value }: { value: DispatchStatusView }) {
  const { mainText, detailParts, className, title } = value;

  return (
    <span className={className} title={title}>
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
    </span>
  );
}
