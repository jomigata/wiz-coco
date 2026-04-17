import './globals.css'
import type { Metadata } from 'next'
import ScrollToTop from '../components/ScrollToTop'
import LocalStorageInitializer from '@/components/LocalStorageInitializer'
import BrowserCleanupProvider from '@/components/BrowserCleanupProvider'
import { Inter } from 'next/font/google'
import ClientLayoutHandler from '@/components/ClientLayoutHandler'
import Link from 'next/link'
import WizcocoLogo from '@/components/WizcocoLogo'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '심리케어',
  description: '새로운 사람들과 만나는 것을 즐길까요?',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <LocalStorageInitializer />
        <BrowserCleanupProvider />
        <ClientLayoutHandler />
        {children}
        <footer className="border-t border-white bg-indigo-900">
          <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex shrink-0 rounded-xl bg-white/90 p-1">
                <WizcocoLogo className="block h-12 w-12 shrink-0 object-contain" alt="Wizcoco 로고" />
              </span>
              <div className="text-sm text-emerald-200/90">
                <div className="font-medium text-emerald-100">Wizcoco</div>
                <div className="text-xs text-emerald-500/90">Psychological Care</div>
              </div>
            </div>
            <div className="text-xs text-emerald-500/90 flex items-center gap-3">
              <Link href="/privacy/" className="hover:text-emerald-300 underline-offset-2 hover:underline">
                개인정보처리방침
              </Link>
              <span className="text-emerald-800">·</span>
              <Link href="/terms/" className="hover:text-emerald-300 underline-offset-2 hover:underline">
                이용약관
              </Link>
            </div>
          </div>
        </footer>
        <ScrollToTop />
      </body>
    </html>
  )
} 