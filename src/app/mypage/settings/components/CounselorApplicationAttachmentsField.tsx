'use client';

import React, { useRef } from 'react';
import {
  COUNSELOR_APPLICATION_MAX_FILES,
  COUNSELOR_APPLICATION_MAX_FILE_SIZE_MB,
  type CounselorAttachmentItem,
} from '@/types/counselorApplication';
import { formatCounselorFileSize, validateCounselorApplicationFile } from '@/lib/counselorApplicationFiles';

const labelCls = 'block text-blue-200 text-xs mb-1';

interface Props {
  items: CounselorAttachmentItem[];
  onChange: (items: CounselorAttachmentItem[]) => void;
  disabled?: boolean;
  readOnly?: boolean;
  /** 승인 완료 후 — 파일명만 표시 (업로드·삭제·용량 안내 숨김) */
  namesOnly?: boolean;
  error?: string;
  onError?: (message: string) => void;
}

export default function CounselorApplicationAttachmentsField({
  items,
  onChange,
  disabled = false,
  readOnly = false,
  namesOnly = false,
  error,
  onError,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePickFiles = (fileList: FileList | null) => {
    if (!fileList?.length || readOnly || disabled) return;

    const next = [...items];
    for (const file of Array.from(fileList)) {
      if (next.length >= COUNSELOR_APPLICATION_MAX_FILES) {
        onError?.(`첨부 파일은 최대 ${COUNSELOR_APPLICATION_MAX_FILES}개까지 가능합니다.`);
        break;
      }
      const validationError = validateCounselorApplicationFile(file);
      if (validationError) {
        onError?.(validationError);
        continue;
      }
      next.push({ source: 'local', file, localId: crypto.randomUUID() });
    }
    onChange(next);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeItem = (index: number) => {
    if (readOnly || disabled) return;
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className={labelCls}>
        {namesOnly ? '제출된 첨부 파일' : `첨부 파일 (최대 ${COUNSELOR_APPLICATION_MAX_FILES}개 · 파일당 ${COUNSELOR_APPLICATION_MAX_FILE_SIZE_MB}MB)`}
      </label>
      {!namesOnly && (
        <p className="text-blue-300/70 text-xs mb-2">
          PDF, JPG, PNG, DOC, DOCX, HWP — 자격증·재직증명 등 관련 서류를 첨부해 주세요.
        </p>
      )}

      {items.length > 0 && (
        <ul className={`space-y-2 ${namesOnly ? '' : 'mb-3'}`}>
          {items.map((item, index) => {
            const name = item.source === 'saved' ? item.attachment.name : item.file.name;
            const size = item.source === 'saved' ? item.attachment.size : item.file.size;
            const url = item.source === 'saved' ? item.attachment.url : undefined;
            const key = item.source === 'saved' ? item.attachment.id : item.localId;

            return (
              <li
                key={key}
                className={`flex items-center gap-2 text-sm ${
                  namesOnly
                    ? 'text-blue-100'
                    : 'rounded-lg border border-slate-200 bg-white/5 px-3 py-2'
                }`}
              >
                {!namesOnly && (
                  <span className="text-lg shrink-0" aria-hidden>
                    📎
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  {namesOnly ? (
                    <span className="truncate block" title={name}>
                      · {name}
                    </span>
                  ) : url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-300 hover:text-emerald-200 truncate block"
                      title={name}
                    >
                      {name}
                    </a>
                  ) : (
                    <span className="text-white truncate block" title={name}>
                      {name}
                    </span>
                  )}
                  {!namesOnly && (
                    <span className="text-blue-300/60 text-xs">{formatCounselorFileSize(size)}</span>
                  )}
                </div>
                {!readOnly && !disabled && !namesOnly && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="shrink-0 text-red-300 hover:text-red-200 text-xs px-2 py-1 rounded border border-red-500/30"
                  >
                    삭제
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!readOnly && !namesOnly && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.hwp,application/pdf,image/*"
            className="hidden"
            disabled={disabled || items.length >= COUNSELOR_APPLICATION_MAX_FILES}
            onChange={(e) => handlePickFiles(e.target.files)}
          />
          <button
            type="button"
            disabled={disabled || items.length >= COUNSELOR_APPLICATION_MAX_FILES}
            onClick={() => inputRef.current?.click()}
            className="px-3 py-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 text-sm hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            파일 선택 ({items.length}/{COUNSELOR_APPLICATION_MAX_FILES})
          </button>
        </div>
      )}

      {(readOnly || namesOnly) && items.length === 0 && (
        <p className="text-blue-300/60 text-sm">첨부된 파일이 없습니다.</p>
      )}

      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
}
