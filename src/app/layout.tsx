import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Amber Calc — Калькулятор контейнеров',
  description: 'Подбор контейнеров с янтарём по целевому весу',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <div className="layout">
          <Navbar />
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  )
}
