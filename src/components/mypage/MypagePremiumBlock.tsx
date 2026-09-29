'use client';

import React from 'react';

type Props = {
  index?: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function MypagePremiumBlock({
  index,
  title,
  description,
  icon,
  headerAction,
  children,
  className = '',
}: Props) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-sky-400/18 bg-gradient-to-br from-[#1a3358]/95 via-[#152a48]/92 to-[#0f1d33]/95 shadow-[0_28px_72px_-36px_rgba(0,0,0,0.9)] ring-1 ring-inset ring-sky-400/10 ${className}`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-sky-400/12 bg-gradient-to-r from-sky-600/18 via-sky-500/8 to-violet-600/10 px-5 py-3.5">
        <div className="min-w-0">
          {index ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300/55">{index}</p>
          ) : null}
          <div className="mt-1 flex items-center gap-2">
            {icon ? <span className="text-sky-300/90">{icon}</span> : null}
            <h3 className="text-sm font-semibold tracking-tight text-white">{title}</h3>
          </div>
          {description ? <p className="mt-1 text-xs leading-relaxed text-slate-400">{description}</p> : null}
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

export function MypagePremiumBlockGrid({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}
