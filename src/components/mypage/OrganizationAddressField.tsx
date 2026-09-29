'use client';

import React, { useState } from 'react';
import { formatDaumPostcodeAddress, openDaumPostcodeSearch } from '@/lib/daumPostcode';

type Props = {
  value: string;
  onChange: (value: string) => void;
  labelClassName?: string;
  fieldClassName?: string;
  placeholder?: string;
};

export default function OrganizationAddressField({
  value,
  onChange,
  labelClassName = 'block text-blue-200 text-xs mb-1',
  fieldClassName =
    'w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-blue-100 placeholder-blue-300/40 focus:outline-none focus:border-purple-400/60 focus:bg-white/15 transition-colors text-sm',
  placeholder = '주소를 입력하거나 주소 찾기를 사용하세요',
}: Props) {
  const [searchError, setSearchError] = useState('');
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    setSearchError('');
    setSearching(true);
    try {
      await openDaumPostcodeSearch((data) => {
        onChange(formatDaumPostcodeAddress(data));
      });
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : '주소 찾기를 열 수 없습니다.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <label className={labelClassName}>주소</label>
        <button
          type="button"
          onClick={() => void handleSearch()}
          disabled={searching}
          className="shrink-0 rounded-md border border-white/25 bg-black px-2.5 py-1 text-[11px] font-medium text-white/90 hover:bg-white/10 disabled:opacity-50"
        >
          {searching ? '불러오는 중…' : '주소 찾기'}
        </button>
      </div>
      <textarea
        className={`${fieldClassName} min-h-[4.5rem] resize-y`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
      />
      <p className="mt-1 text-[10px] text-slate-500">주소 찾기로 기본 주소를 넣은 뒤, 상세 주소(동·호 등)는 직접 이어서 입력할 수 있습니다.</p>
      {searchError ? (
        <p className="mt-1 text-[11px] text-red-300" role="alert">
          {searchError}
        </p>
      ) : null}
    </div>
  );
}
