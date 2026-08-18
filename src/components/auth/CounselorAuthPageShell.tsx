'use client';

import React from 'react';
import { LOADING_MESSAGE } from '@/lib/loadingMessage';

type Props = {
  children: React.ReactNode;
  loading?: boolean;
  loadingMessage?: string;
};

export function CounselorAuthLoading({ message = LOADING_MESSAGE }: { message?: string }) {
  return (
    <div className="min-h-screen bg-[#060a12] flex flex-col">
      <div className="h-20" />
      <div className="flex-grow flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sky-300 text-lg">{message}</p>
        </div>
      </div>
    </div>
  );
}

export default function CounselorAuthPageShell({ children, loading, loadingMessage }: Props) {
  if (loading) {
    return <CounselorAuthLoading message={loadingMessage} />;
  }

  return (
    <div className="min-h-screen bg-[#060a12] flex flex-col">
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="counselor-auth-grid" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#counselor-auth-grid)" />
        </svg>
      </div>
      <div className="relative z-10 flex-grow flex items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  );
}

export const counselorAuthCardClass =
  'max-w-sm w-full space-y-5 bg-[#182438]/90 p-6 rounded-xl border border-white/[0.14] shadow-xl shadow-black/30';

export const counselorAuthInputClass =
  'w-full px-3 py-2.5 text-sm border border-white/15 bg-[#121f38]/95 placeholder-slate-500 text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400/60';

export const counselorAuthButtonClass =
  'w-full py-2.5 text-sm font-medium rounded-md text-white bg-sky-600 border border-sky-500/40 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 disabled:opacity-60';

export const counselorAuthLinkClass =
  'text-sky-400 hover:text-sky-300 underline-offset-2 hover:underline';
