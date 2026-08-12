import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'StanPC 메인 도감',
  description: 'PC 부품 수집 도감',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
