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
      <head>
        <meta name="theme-color" content="#0ea5e9" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        {/* Firebase SDK (compat) */}
        <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js" defer></script>
        <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js" defer></script>
        <script
          defer
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('load', function() {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(function(e){console.error('SW 등록 실패', e)});
                }
                // Firebase 초기화 (이미 초기화된 경우 건너뜀)
                try {
                  var firebaseConfig = {
                    apiKey: 'AIzaSyApvsPuKjaqFIuTEmAiHiq6QdysBmbVW2o',
                    authDomain: 'stock-alert-eef16.firebaseapp.com',
                    projectId: 'stock-alert-eef16',
                    storageBucket: 'stock-alert-eef16.firebasestorage.app',
                    messagingSenderId: '616640051193',
                    appId: '1:616640051193:web:57e62401b94ef216636f28',
                    measurementId: 'G-TYQGK34CX1'
                  };
                  if (!window.firebase || !window.firebase.apps || window.firebase.apps.length === 0) {
                    window.firebase.initializeApp(firebaseConfig);
                  }
                } catch (e) { console.error('Firebase 초기화 오류', e); }
              });
            `,
          }}
        />
      </head>
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
