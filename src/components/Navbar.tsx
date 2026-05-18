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
        <Link href="/distribution" className={`nav-link ${path === '/distribution' ? 'active' : ''}`}>
          Распределение
        </Link>
        <Link href="/history" className={`nav-link ${path === '/history' ? 'active' : ''}`}>
          История
        </Link>
      </div>
    </nav>
  )
}
