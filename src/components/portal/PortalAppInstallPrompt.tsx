'use client';

import Link from 'next/link';
import React from 'react';
import {
  isPortalStandaloneDisplay,
  PORTAL_APP_INSTALL_HINT,
  PORTAL_WEB_MANIFEST_PATH,
} from '@/lib/portalAppInstall';

type Props = {
  compact?: boolean;
  className?: string;
};

export default function PortalAppInstallPrompt({ compact = false, className = '' }: Props) {
  if (isPortalStandaloneDisplay()) return null;

  return (
    <div
      className={`rounded-xl border border-cyan-500/35 bg-gradient-to-br from-cyan-950/40 to-slate-900/60 p-4 text-left ${className}`}
    >
      <p className="text-sm font-semibold text-cyan-100">앱으로 더 편하게 보기</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">{PORTAL_APP_INSTALL_HINT}</p>
      {!compact ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-slate-400">
          <li>iPhone: Safari 공유 → 「홈 화면에 추가」</li>
          <li>Android: Chrome 메뉴 → 「앱 설치」 또는 「홈 화면에 추가」</li>
        </ul>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/portal/"
          className="inline-flex rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500"
        >
          내 검사실 열기
        </Link>
        <Link
          href={PORTAL_WEB_MANIFEST_PATH}
          className="inline-flex rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
        >
          앱 정보
        </Link>
      </div>
    </div>
  );
}
