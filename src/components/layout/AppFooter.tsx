'use client';

import Link from 'next/link';
import WizcocoLogo from '@/components/WizcocoLogo';
import BusinessLegalBlock from '@/components/layout/BusinessLegalBlock';
import { APP_FOOTER_BG, APP_FOOTER_HEIGHT_CLASS } from '@/lib/appChromeLayout';

export default function AppFooter() {
  return (
    <footer
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 ${APP_FOOTER_BG} shadow-[0_-4px_20px_rgba(30,60,100,0.06)] backdrop-blur-md`}
    >
      <div className="mx-auto w-full max-w-[1800px] px-4 sm:px-6">
        <div
          className={`flex ${APP_FOOTER_HEIGHT_CLASS} items-center justify-between gap-3`}
        >
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/90 ring-1 ring-white/15">
              <WizcocoLogo className="block h-full w-full object-contain" alt="" />
            </span>
            <span className="truncate text-[11px] text-slate-500">
              © {new Date().getFullYear()} WizCoCo
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-[11px] text-slate-500">
            <Link href="/company/" className="hover:text-slate-700 transition-colors">
              사업자정보
            </Link>
            <span className="text-slate-700" aria-hidden>
              ·
            </span>
            <Link href="/privacy/" className="hover:text-slate-700 transition-colors">
              개인정보처리방침
            </Link>
            <span className="text-slate-700" aria-hidden>
              ·
            </span>
            <Link href="/terms/" className="hover:text-slate-700 transition-colors">
              이용약관
            </Link>
          </div>
        </div>
        <div className="hidden border-t border-slate-200/60 py-2 sm:block">
          <BusinessLegalBlock variant="compact" />
        </div>
      </div>
    </footer>
  );
}
