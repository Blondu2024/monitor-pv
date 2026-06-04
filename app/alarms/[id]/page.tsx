import Link from 'next/link'
import { notFound } from 'next/navigation'
import { loadAlarmDetail } from '@/lib/queries'
import AlarmContextChart from '@/app/components/AlarmContextChart'
import AlarmActions from './AlarmActions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const LUCRARE_REF: Record<string, { section: string; quote: string }> = {
  PERF_LOW: {
    section: 'cap 4.5.2 + cap 3.3',
    quote: 'Randament scăzut: η_real < η_min (prag 0.80). Detecție prin comparație cu modelul teoretic PVGIS — eroare > 20% declanșează alarmă. Cauze tipice: murdărie panouri, umbrire, defect string, MPPT-uri sub-optimale.',
  },
  TEMP_HIGH: {
    section: 'cap 4.5.1',
    quote: 'Supratemperatură modul: T_panou > T_max. T_max = 65°C avertizare, 75°C critic. Temperaturile peste prag reduc randamentul (~0.4%/°C peste 25°C STC) și accelerează degradarea celulelor.',
  },
  GRID_VOLTAGE_HIGH: {
    section: 'cap 4.5.1',
    quote: 'Tensiune rețea peste prag (253V = +10% din 230V nominal). Risc deconectare invertor conform standard EN 50549. Cauze: rețea slabă la oră de injecție masivă, distanță mare la transformator.',
  },
  GRID_VOLTAGE_LOW: {
    section: 'cap 4.5.1',
    quote: 'Tensiune rețea sub prag (207V = −10% din 230V nominal). Risc instabilitate invertor.',
  },
  OFFLINE: {
    section: 'cap 4.5.1',
    quote: 'Pierdere conexiune cu device-ul: t_curent − t_ultim > T_max. Praguri tipice: 10–30s rapid, 1–5 min standard.',
  },
}

export default async function AlarmDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const detail = await loadAlarmDetail(id)
  if (!detail) notFound()

  const { alarm, device, site, threshold, contextPoints, contextMetric } = detail
  const ref = LUCRARE_REF[alarm.code] ?? {
    section: 'cap 4.5',
    quote: 'Sistem de alarmare și notificări — clasificare informativ / avertizare / critic, canale email + dashboard.',
  }

  const metricLabel =
    contextMetric === 'ac_power_w' ? 'Putere AC' :
    contextMetric === 'module_temp_c' ? 'Temperatură modul' :
    contextMetric === 'ac_voltage_v' ? 'Tensiune AC' : '—'
  const metricUnit =
    contextMetric === 'ac_power_w' ? 'W' :
    contextMetric === 'module_temp_c' ? '°C' :
    contextMetric === 'ac_voltage_v' ? 'V' : ''

  const thresholdLines: Array<{ label: string; value: number; color: 'red' | 'amber' | 'blue'; style?: 'dashed' | 'solid' }> = []
  if (threshold) {
    if (contextMetric === 'module_temp_c') {
      thresholdLines.push({ label: 'warning', value: threshold.module_temp_warning_c, color: 'amber' })
      thresholdLines.push({ label: 'critic', value: threshold.module_temp_critical_c, color: 'red' })
    } else if (contextMetric === 'ac_voltage_v') {
      thresholdLines.push({ label: 'min', value: threshold.voltage_min_v, color: 'red', style: 'dashed' })
      thresholdLines.push({ label: 'max', value: threshold.voltage_max_v, color: 'red', style: 'dashed' })
    } else if (contextMetric === 'ac_power_w' && device?.rated_power_kw) {
      thresholdLines.push({ label: 'rated', value: device.rated_power_kw * 1000, color: 'blue', style: 'dashed' })
    }
  }

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

  const createdAt = new Date(alarm.created_at).toLocaleString('ro-RO', { dateStyle: 'medium', timeStyle: 'medium' })

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto px-4 sm:px-8 py-8 gap-6">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 inline-flex items-center gap-1 w-fit">
        ‹ Înapoi la dashboard
      </Link>

      <header className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-4">
        <div className="flex items-start gap-3 flex-wrap">
          <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${sevStyle[alarm.severity]} uppercase`}>{alarm.severity}</span>
          <div className="flex-1 min-w-[200px]">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{alarm.code}</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">{alarm.message}</p>
          </div>
          <div className="text-right text-xs">
            <p className={`font-medium ${statusStyle[alarm.status]} uppercase`}>{alarm.status}</p>
            <p className="text-zinc-400 mt-1">declanșată {createdAt}</p>
          </div>
        </div>

        <AlarmActions alarmId={alarm.id} status={alarm.status} />
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Site">
          {site ? (
            <>
              <p className="text-sm font-medium">{site.name}</p>
              <p className="text-xs text-zinc-500 mt-1">{site.city} · {site.peak_power_kwp} kWp instalat</p>
              {site.client_name && <p className="text-xs text-zinc-400 mt-1">{site.client_name}</p>}
              <p className="text-xs text-zinc-400 mt-1">GPS {site.gps_lat.toFixed(4)}, {site.gps_lng.toFixed(4)}</p>
            </>
          ) : (
            <p className="text-sm text-zinc-500">Alarm la nivel general (fără site asociat)</p>
          )}
        </Card>
        <Card title="Device">
          {device ? (
            <>
              <p className="text-sm font-medium">{device.manufacturer} {device.model}</p>
              <p className="text-xs text-zinc-500 mt-1">Tip: {device.kind} · S/N {device.serial_number}</p>
              {device.rated_power_kw && <p className="text-xs text-zinc-400 mt-1">Putere nominală: {device.rated_power_kw} kW</p>}
              <p className="text-xs text-zinc-400 mt-1">Status: {device.status}</p>
            </>
          ) : (
            <p className="text-sm text-zinc-500">Alarm fără device specific</p>
          )}
        </Card>
      </section>

      {contextMetric && contextPoints.length > 1 && (
        <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6">
          <h2 className="text-sm font-medium text-zinc-500 mb-2">Context · {metricLabel} ±12h în jurul alarmei</h2>
          <AlarmContextChart
            points={contextPoints}
            metricLabel={metricLabel}
            metricUnit={metricUnit}
            thresholds={thresholdLines}
            alarmTs={alarm.created_at}
          />
        </section>
      )}

      <section className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-4 sm:p-6">
        <h2 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">📖 Referință lucrare — {ref.section}</h2>
        <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">{ref.quote}</p>
        <p className="text-xs text-blue-700 dark:text-blue-400 mt-3">
          Lucrare: „Monitorizarea sistemelor fotovoltaice" — Profire Radu, Universitatea „Dunărea de Jos" Galați, 2026 · Coordonator Ş.l. dr. ing. Arthur Bogdan Codreş
        </p>
      </section>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      <h3 className="text-xs text-zinc-500 uppercase tracking-wide mb-2">{title}</h3>
      {children}
    </div>
  )
}
