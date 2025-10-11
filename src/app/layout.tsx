import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { DarkModeToggle } from '@/components/ui/dark-mode-toggle'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'StockAlert - 주식 알림 앱',
  description: '관심 주식의 등락률 조건을 설정하고 자동으로 알림을 받아보세요.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <div className="relative">
          {/* 다크모드 토글 */}
          <div className="fixed top-4 right-4 z-50">
            <DarkModeToggle />
          </div>
          {children}
        </div>
      </body>
    </html>
  )
}
