import { loadDashboard, computeKpis, aggregateBySite, type Alarm } from '@/lib/queries'
import ProductionChart from './components/ProductionChart'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Home() {
  const data = await loadDashboard()
  const kpis = computeKpis(data)
  const bySite = aggregateBySite(data)

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 gap-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Monitor-PV</h1>
          <span className="text-sm text-zinc-500">· {data.sites.length} site-uri · {kpis.totalPeakKwp.toFixed(1)} kWp instalat</span>
        </div>
        <p className="text-sm text-zinc-500">
          Date orare din PVGIS (JRC EU) — Galați, București, Cluj-Napoca · invertoare Huawei + Growatt · contor DTSU666 · baterie Huawei LUNA
        </p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Kpi label="Producție azi" value={`${kpis.totalEnergyTodayKwh}`} unit="kWh" color="amber" />
        <Kpi label="Putere acum" value={`${kpis.totalPowerKw}`} unit="kW" color="green" />
        <Kpi label="Performance Ratio" value={kpis.performanceRatioPct != null ? `${kpis.performanceRatioPct}` : '—'} unit={kpis.performanceRatioPct != null ? '%' : 'noaptea'} color={kpis.performanceRatioPct != null && kpis.performanceRatioPct < 80 ? 'red' : 'blue'} />
        <Kpi label="Alarme active" value={`${kpis.activeAlarms}`} unit={kpis.activeAlarms === 1 ? 'alarmă' : 'alarme'} color={kpis.activeAlarms > 0 ? 'red' : 'zinc'} />
      </section>

      <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6">
        <h2 className="text-sm font-medium text-zinc-500 mb-2">Producție totală 24h (3 site-uri)</h2>
        <ProductionChart data={data.hourly24h} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {bySite.map((s) => (
          <SiteCard key={s.site.id} site={s.site} powerKw={s.powerW / 1000} energyKwh={s.energyTodayWh / 1000} alarms={s.alarms} />
        ))}
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

function Kpi({ label, value, unit, color }: { label: string; value: string; unit: string; color: 'amber' | 'green' | 'blue' | 'red' | 'zinc' }) {
  const colorMap: Record<string, string> = {
    amber: 'text-amber-600 dark:text-amber-400',
    green: 'text-green-600 dark:text-green-400',
    blue: 'text-blue-600 dark:text-blue-400',
    red: 'text-red-600 dark:text-red-400',
    zinc: 'text-zinc-600 dark:text-zinc-400',
  }
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      <p className="text-xs text-zinc-500 uppercase tracking-wide">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tabular-nums ${colorMap[color]}`}>
        {value}
        <span className="ml-1 text-base font-normal text-zinc-500">{unit}</span>
      </p>
    </div>
  )
}

function SiteCard({
  site,
  powerKw,
  energyKwh,
  alarms,
}: {
  site: { id: string; name: string; city: string | null; peak_power_kwp: number; client_name: string | null }
  powerKw: number
  energyKwh: number
  alarms: number
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-medium text-sm">{site.name}</h3>
          <p className="text-xs text-zinc-500">{site.city} · {site.peak_power_kwp} kWp</p>
          {site.client_name && <p className="text-xs text-zinc-400 mt-0.5">{site.client_name}</p>}
        </div>
        {alarms > 0 && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
            {alarms} alarm{alarms === 1 ? 'ă' : 'e'}
          </span>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[11px] text-zinc-500 uppercase">Putere</p>
          <p className="text-lg font-semibold tabular-nums">{powerKw.toFixed(1)} <span className="text-xs font-normal text-zinc-500">kW</span></p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-500 uppercase">Azi</p>
          <p className="text-lg font-semibold tabular-nums">{energyKwh.toFixed(1)} <span className="text-xs font-normal text-zinc-500">kWh</span></p>
        </div>
      </div>
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
    <li className="py-3 flex items-start gap-3">
      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${sevStyle[alarm.severity]} uppercase`}>{alarm.severity}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{alarm.code} · <span className="font-normal text-zinc-600 dark:text-zinc-400">{siteName}</span></p>
        <p className="text-xs text-zinc-500 mt-0.5">{alarm.message}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-xs ${statusStyle[alarm.status]}`}>{alarm.status}</p>
        <p className="text-[10px] text-zinc-400 mt-0.5">{when}</p>
      </div>
    </li>
  )
}
