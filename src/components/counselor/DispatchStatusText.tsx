import React from 'react';
import type { DispatchStatusView } from '@/lib/dispatchRecipientDisplay';

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
              <span className={part.failed ? '!text-red-400 font-medium' : undefined}>{part.text}</span>
            </React.Fragment>
          ))}
          {')'}
        </>
      ) : null}
    </span>
  );
}
