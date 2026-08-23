'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type TabItem = {
  href: string
  label: string
  match: (pathname: string) => boolean
  icon: (active: boolean) => ReactNode
}

const ICON = {
  stroke: (active: boolean) => (active ? '#6366F1' : '#8B95A1'),
  fill: (active: boolean) => (active ? '#6366F1' : 'none'),
}

const TABS: TabItem[] = [
  {
    href: '/',
    label: '홈',
    match: (pathname) => pathname === '/',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4.5 10.5 12 4.5l7.5 6V19a1.5 1.5 0 0 1-1.5 1.5h-3.75v-5.25h-4.5V20.5H6A1.5 1.5 0 0 1 4.5 19v-8.5Z"
          stroke={ICON.stroke(active)}
          fill={active ? 'rgba(99,102,241,0.12)' : 'none'}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/ranking',
    label: '랭킹',
    match: (pathname) => pathname.startsWith('/ranking'),
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M7 19V11.5M12 19V5.5M17 19v-5"
          stroke={ICON.stroke(active)}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M5.5 19.5h13"
          stroke={ICON.stroke(active)}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: '/my-records',
    label: '내 정보',
    match: (pathname) => pathname.startsWith('/my-records'),
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle
          cx="12"
          cy="8.5"
          r="3"
          stroke={ICON.stroke(active)}
          fill={active ? 'rgba(99,102,241,0.12)' : 'none'}
          strokeWidth="1.8"
        />
        <path
          d="M6 18.5c.8-2.6 3-4 6-4s5.2 1.4 6 4"
          stroke={ICON.stroke(active)}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
]

const HIDDEN_PREFIXES = ['/play', '/result']

export default function FloatingTabBar() {
  const pathname = usePathname() ?? '/'
  const hidden = HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
  if (hidden) return null

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md px-4"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      aria-label="주요 화면"
    >
      <div className="pointer-events-auto flex items-center justify-around rounded-full border border-gray-100 bg-white/95 px-2 py-1.5 shadow-[0_8px_28px_rgba(15,23,42,0.14)] backdrop-blur-md">
        {TABS.map((tab) => {
          const active = tab.match(pathname)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={[
                'flex min-w-[72px] flex-col items-center gap-0.5 rounded-full px-4 py-1.5 transition-colors',
                active ? 'bg-indigo-50' : 'bg-transparent',
              ].join(' ')}
            >
              {tab.icon(active)}
              <span
                className={[
                  'text-[11px] font-semibold leading-none',
                  active ? 'text-indigo-500' : 'text-gray-400',
                ].join(' ')}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
