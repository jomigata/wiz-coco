'use client';

import React from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  tone?: 'dark' | 'light';
  'aria-label'?: string;
};

export default function CounselorListSearchInput({
  value,
  onChange,
  placeholder,
  className = '',
  tone = 'dark',
  'aria-label': ariaLabel = '목록 검색',
}: Props) {
  const light = tone === 'light';
  return (
    <div className={`relative min-w-[12rem] flex-1 sm:max-w-md ${className}`}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <svg
          className={`h-5 w-5 ${light ? 'text-slate-400' : 'text-sky-300'}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={
          light
            ? 'w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400/30'
            : 'w-full rounded-md border border-white/15 bg-[#101f38]/95 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50'
        }
      />
    </div>
  );
}
