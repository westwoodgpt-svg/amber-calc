import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Amber Calc — Калькулятор распределения',
  description: 'Распределение отгрузки по долям с учётом упаковки и накопительного баланса',
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
