import './globals.css'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import ScrollToTop from '../components/ScrollToTop'
import LocalStorageInitializer from '@/components/LocalStorageInitializer'
import BrowserCleanupProvider from '@/components/BrowserCleanupProvider'
import { Noto_Sans_KR } from 'next/font/google'
import ClientLayoutHandler from '@/components/ClientLayoutHandler'
import AuthNavigationGuard from '@/components/AuthNavigationGuard'
import RouteTransitionShell from '@/components/RouteTransitionShell'
import AppChrome from '@/components/AppChrome'

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
  variable: '--font-noto-sans-kr',
})

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
      <body className={notoSansKr.variable}>
        <LocalStorageInitializer />
        <BrowserCleanupProvider />
        <Suspense fallback={null}>
          <AuthNavigationGuard />
        </Suspense>
        <ClientLayoutHandler />
        <AppChrome>
          <Suspense fallback={null}>
            <RouteTransitionShell>{children}</RouteTransitionShell>
          </Suspense>
        </AppChrome>
        <ScrollToTop />
      </body>
    </html>
  )
} 