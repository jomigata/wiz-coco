'use client';

import Link from 'next/link';
import { appChromeClasses } from '@/components/layout/appChromeTheme';
import WizcocoLogo from '@/components/WizcocoLogo';

export default function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className={`fixed bottom-0 inset-x-0 z-40 ${appChromeClasses.footerHeight} ${appChromeClasses.footer}`}
      role="contentinfo"
    >
      <div className="h-full max-w-[1800px] mx-auto px-3 sm:px-5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white/90 ring-1 ring-white/15">
            <WizcocoLogo className="block h-full w-full object-contain" alt="" />
          </span>
          <span className="truncate text-[10px] sm:text-[11px] text-slate-500">
            © {year} WizCoCo
          </span>
        </div>
        <nav
          className="flex shrink-0 items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-slate-500"
          aria-label="법적 고지"
        >
          <Link href="/privacy/" className="hover:text-slate-300 transition-colors whitespace-nowrap">
            개인정보처리방침
          </Link>
          <span className="text-white/10 select-none" aria-hidden>
            |
          </span>
          <Link href="/terms/" className="hover:text-slate-300 transition-colors whitespace-nowrap">
            이용약관
          </Link>
        </nav>
      </div>
    </footer>
  );
}
