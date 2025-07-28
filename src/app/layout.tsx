import './globals.css'
import type { Metadata } from 'next'
import ScrollToTop from '../components/ScrollToTop'
import LocalStorageInitializer from '@/components/LocalStorageInitializer'
import BrowserCleanupProvider from '@/components/BrowserCleanupProvider'
import { Inter } from 'next/font/google'
import ClientLayoutHandler from '@/components/ClientLayoutHandler'

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
        <ScrollToTop />
      </body>
    </html>
  )
} 