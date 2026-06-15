'use client';

import React from 'react';
import type { CounselorApplicationAttachment } from '@/types/counselorApplication';
import { formatCounselorFileSize } from '@/lib/counselorApplicationFiles';

interface Props {
  attachments: CounselorApplicationAttachment[];
  emptyLabel?: string;
}

export default function CounselorApplicationAttachmentList({
  attachments,
  emptyLabel = '첨부 파일 없음',
}: Props) {
  if (!attachments.length) {
    return <p className="text-slate-400 text-sm">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-1.5">
      {attachments.map((file) => (
        <li key={file.id}>
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-sky-300 hover:text-sky-200 underline-offset-2 hover:underline"
          >
            <span aria-hidden>📎</span>
            <span className="truncate max-w-[16rem]" title={file.name}>
              {file.name}
            </span>
            <span className="text-slate-500 text-xs shrink-0">({formatCounselorFileSize(file.size)})</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
