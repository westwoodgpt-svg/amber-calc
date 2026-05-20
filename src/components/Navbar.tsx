'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const LINKS = [
  { href: '/',        label: 'Калькулятор', short: 'Расчёт' },
  { href: '/orders',  label: 'Заявки',      short: 'Заявки' },
  { href: '/lot',     label: 'Состав лота', short: 'Лот' },
  { href: '/history', label: 'История',     short: 'История' },
  { href: '/help',    label: 'Инструкция',  short: 'Помощь' },
]

export default function Navbar() {
  const path = usePathname()
  const [open, setOpen] = useState(false)

  // Close menu on route change
  useEffect(() => { setOpen(false) }, [path])

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <span>🟡</span>
          <span>Amber Calc</span>
        </div>

        {/* Desktop links */}
        <div className="navbar-links desktop-only">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={`nav-link ${path === l.href ? 'active' : ''}`}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Mobile: compact links + hamburger overflow */}
        <div className="navbar-mobile mobile-only">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={`nav-link-mobile ${path === l.href ? 'active' : ''}`}>
              {l.short}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile dropdown overlay (if needed for very narrow) */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setOpen(false)}
        />
      )}
    </>
  )
}
