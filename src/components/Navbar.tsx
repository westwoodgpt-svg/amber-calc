'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const path = usePathname()
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span>🟡</span>
        <span>Amber Calc</span>
      </div>
      <div className="navbar-links">
        <Link href="/" className={`nav-link ${path === '/' ? 'active' : ''}`}>
          Калькулятор
        </Link>
        <Link href="/orders" className={`nav-link ${path === '/orders' ? 'active' : ''}`}>
          Заявки
        </Link>
        <Link href="/lot" className={`nav-link ${path === '/lot' ? 'active' : ''}`}>
          Состав лота
        </Link>
        <Link href="/history" className={`nav-link ${path === '/history' ? 'active' : ''}`}>
          История
        </Link>
        <Link href="/help" className={`nav-link ${path === '/help' ? 'active' : ''}`}>
          Инструкция
        </Link>
      </div>
    </nav>
  )
}
