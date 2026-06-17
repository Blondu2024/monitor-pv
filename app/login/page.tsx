import type { Metadata } from 'next'
import LoginForm from './LoginForm'

export const metadata: Metadata = {
  title: 'Autentificare · Monitor-PV',
  description: 'Acces securizat la platforma de monitorizare fotovoltaică.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <SunLogo />
          <h1 className="text-xl font-semibold tracking-tight">
            Monitor<span className="text-amber-500">·</span>PV
          </h1>
          <p className="text-sm text-zinc-500">
            Autentifică-te pentru a accesa dashboard-ul de monitorizare.
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
          <LoginForm next={next} />
        </div>

        <p className="text-center text-xs text-zinc-400">
          Acces restricționat operatorilor. Conturile sunt create de administrator.
        </p>
      </div>
    </div>
  )
}

function SunLogo() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
