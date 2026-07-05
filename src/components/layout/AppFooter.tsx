'use client';

import Link from 'next/link';
import WizcocoLogo from '@/components/WizcocoLogo';
import {
  APP_FOOTER_HEIGHT_CLASS,
  APP_FOOTER_SURFACE,
} from '@/components/layout/appChromeTheme';

export default function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className={`fixed bottom-0 inset-x-0 z-40 border-t border-white/[0.06] ${APP_FOOTER_SURFACE} shadow-[0_-12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md`}
      aria-label="사이트 하단"
    >
      <div
        className={`mx-auto flex ${APP_FOOTER_HEIGHT_CLASS} w-full max-w-[1800px] items-center justify-between gap-3 px-4 sm:px-6`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/90 ring-1 ring-white/10">
            <WizcocoLogo className="block h-full w-full object-contain" alt="" />
          </span>
          <span className="truncate text-[11px] text-slate-500 sm:text-xs">
            © {year} WizCoCo · Psychological Care
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-[11px] text-slate-500 sm:gap-3 sm:text-xs">
          <Link href="/privacy/" className="hover:text-slate-300 transition-colors">
            개인정보처리방침
          </Link>
          <span className="text-slate-700" aria-hidden>
            ·
          </span>
          <Link href="/terms/" className="hover:text-slate-300 transition-colors">
            이용약관
          </Link>
        </div>
      </div>
    </footer>
  );
}
