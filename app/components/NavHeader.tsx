'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/auth'

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/sites', label: 'Site-uri' },
  { href: '/ghid', label: 'Ghid' },
]

export default function NavHeader({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname()
  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-14 flex items-center justify-between gap-4">
        <Link href={userEmail ? '/' : '/login'} className="flex items-center gap-2 group">
          <SunLogo />
          <span className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Monitor<span className="text-amber-500">·</span>PV</span>
        </Link>

        {userEmail ? (
          <div className="flex items-center gap-1 sm:gap-2">
            <nav className="flex items-center gap-1">
              {NAV.map((item) => {
                const active = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <div className="flex items-center gap-2 pl-2 sm:pl-3 ml-1 sm:ml-2 border-l border-zinc-200 dark:border-zinc-800">
              <span className="hidden md:inline text-xs text-zinc-500 max-w-[14rem] truncate" title={userEmail}>
                {userEmail}
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  Ieșire
                </button>
              </form>
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white transition-colors"
          >
            Autentificare
          </Link>
        )}
      </div>
    </header>
  )
}

function SunLogo() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <circle cx="12" cy="12" r="4.5" fill="#f59e0b" />
      <g stroke="#f59e0b" strokeWidth="1.75" strokeLinecap="round">
        <line x1="12" y1="2" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="2" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="22" y2="12" />
        <line x1="4.93" y1="4.93" x2="7.05" y2="7.05" />
        <line x1="16.95" y1="16.95" x2="19.07" y2="19.07" />
        <line x1="4.93" y1="19.07" x2="7.05" y2="16.95" />
        <line x1="16.95" y1="7.05" x2="19.07" y2="4.93" />
      </g>
    </svg>
  )
}
