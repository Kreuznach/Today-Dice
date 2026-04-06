import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '오늘의 주사위',
  description: '오늘의 운을 10초 만에 확인하는 1일 1회 AI 주사위 대결',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full bg-gray-50 font-sans antialiased">
        {/* Toss WebView 최적화: 최대 너비 제한, 세로 스크롤 */}
        <div className="mx-auto max-w-md min-h-screen bg-white flex flex-col">
          {children}
        </div>
      </body>
    </html>
  )
}
