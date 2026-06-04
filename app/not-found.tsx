import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="text-7xl font-bold text-amber-500/30 mb-4">404</div>
      <h1 className="text-xl font-semibold tracking-tight mb-2">Pagina nu există</h1>
      <p className="text-sm text-zinc-500 max-w-md mb-6">
        Resursa căutată nu mai e disponibilă sau adresa e greșită. Poate alarma sau site-ul a fost șters între timp.
      </p>
      <Link
        href="/"
        className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors"
      >
        ‹ Înapoi la dashboard
      </Link>
    </div>
  )
}
