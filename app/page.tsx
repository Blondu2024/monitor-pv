import Link from 'next/link'
import { loadDashboard, type Alarm } from '@/lib/queries'
import { computeLiveData } from '@/lib/live'
import ProductionRangeChart from './components/ProductionRangeChart'
import LiveDashboard from './components/LiveDashboard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Home() {
  const [data, live] = await Promise.all([loadDashboard(), computeLiveData()])
  const totalPeakKwp = data.sites.reduce((sum, s) => sum + s.peak_power_kwp, 0)

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 gap-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Monitor-PV</h1>
          <span className="text-sm text-zinc-500">· {data.sites.length} site-uri · {totalPeakKwp.toFixed(1)} kWp instalat</span>
        </div>
        <p className="text-sm text-zinc-500">
          Sistem monitorizare PV — invertoare Huawei + Growatt, contoare DTSU666, baterii Huawei LUNA. Date orare istorice din PVGIS (JRC EU), valori live computate la 5 sec.
        </p>
      </header>

      <aside className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-4 text-xs flex flex-col sm:flex-row gap-3 sm:items-center">
        <span className="text-amber-600 dark:text-amber-400 shrink-0 font-semibold">ℹ Sursa datelor</span>
        <p className="text-amber-900 dark:text-amber-100 leading-relaxed">
          Istoricul (30 zile orare) provine din <a href="https://re.jrc.ec.europa.eu/pvg_tools/en/" target="_blank" rel="noopener" className="underline font-medium">PVGIS v5_3 — JRC European Commission</a> pentru coordonatele reale ale celor 3 site-uri RO. Valorile „live" (refresh 5s) sunt computate sintetic din curba PVGIS pentru ora curentă + jitter ±4%. Cronul Vercel salvează măsurători noi în baza de date la fiecare minut.
        </p>
      </aside>

      <LiveDashboard initial={live} />

      <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6">
        <ProductionRangeChart />
      </section>

      <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6">
        <h2 className="text-sm font-medium text-zinc-500 mb-3">Alarme recente</h2>
        {data.recentAlarms.length === 0 ? (
          <p className="text-sm text-zinc-500">Nicio alarmă înregistrată.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
            {data.recentAlarms.map((a) => (
              <AlarmRow key={a.id} alarm={a} siteName={data.sites.find((s) => s.id === a.site_id)?.name ?? '—'} />
            ))}
          </ul>
        )}
      </section>

      <footer className="text-xs text-zinc-500 border-t border-zinc-200 dark:border-zinc-800 pt-4">
        Lucrare licență Profire Radu · Automatică și Informatică Aplicată · Galați 2026 · Coordonator Ş.l. dr. ing. Arthur Bogdan Codreş
      </footer>
    </div>
  )
}

function AlarmRow({ alarm, siteName }: { alarm: Alarm; siteName: string }) {
  const sevStyle: Record<string, string> = {
    info: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
    warning: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
    critical: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300',
  }
  const statusStyle: Record<string, string> = {
    active: 'text-red-600 dark:text-red-400',
    acknowledged: 'text-amber-600 dark:text-amber-400',
    cleared: 'text-zinc-500',
  }
  const when = new Date(alarm.created_at).toLocaleString('ro-RO', { dateStyle: 'short', timeStyle: 'short' })
  return (
    <li>
      <Link
        href={`/alarms/${alarm.id}`}
        className="py-3 flex items-start gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 -mx-2 px-2 rounded-lg transition-colors"
      >
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${sevStyle[alarm.severity]} uppercase`}>{alarm.severity}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {alarm.code} · <span className="font-normal text-zinc-600 dark:text-zinc-400">{siteName}</span>
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">{alarm.message}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-xs ${statusStyle[alarm.status]}`}>{alarm.status}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">{when}</p>
        </div>
        <span className="self-center text-zinc-300 dark:text-zinc-600">›</span>
      </Link>
    </li>
  )
}
