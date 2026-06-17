import { supabaseAdmin } from './supabase'
import { computeCurrentAcPowerW } from './live-curve'

export type SeriesPoint = { label: string; value: number }
export type ProductionSeries = {
  range: 'day' | 'week' | 'month' | 'year'
  unit: 'kW' | 'kWh'
  title: string
  source: 'măsurători DB' | 'model PVGIS'
  points: SeriesPoint[]
}

const RO = 'ro-RO'

/** Orar: putere medie kW pe oră, ultimele 24h (din DB). */
async function getHourly(): Promise<ProductionSeries> {
  const sb = supabaseAdmin()
  const { data, error } = await sb.rpc('production_hourly', { p_hours: 24 })
  if (error) throw error
  const points = (data ?? []).map((r: { bucket: string; kw: number }) => ({
    label: new Date(r.bucket).toLocaleTimeString(RO, { hour: '2-digit', minute: '2-digit' }),
    value: r.kw ?? 0,
  }))
  return { range: 'day', unit: 'kW', title: 'Producție orară · ultimele 24h', source: 'măsurători DB', points }
}

/** Zilnic: energie kWh pe zi (din DB), pentru fereastra dată. */
async function getDaily(days: number, range: 'week' | 'month', title: string): Promise<ProductionSeries> {
  const sb = supabaseAdmin()
  const { data, error } = await sb.rpc('production_daily', { p_days: days })
  if (error) throw error
  const points = (data ?? []).map((r: { bucket: string; kwh: number }) => ({
    label: new Date(r.bucket).toLocaleDateString(RO, { day: '2-digit', month: '2-digit' }),
    value: r.kwh ?? 0,
  }))
  return { range, unit: 'kWh', title, source: 'măsurători DB', points }
}

/**
 * Anual: energie kWh pe lună, ultimele 12 luni — calculată din modelul PVGIS
 * (avem ~6 săptămâni de măsurători reale; modelul oferă referința pe 12 luni).
 */
async function getYearlyModel(): Promise<ProductionSeries> {
  const sb = supabaseAdmin()
  const { data: sites, error } = await sb.from('sites').select('peak_power_kwp')
  if (error) throw error
  const totalPeakKwp = (sites ?? []).reduce((s, r) => s + (r.peak_power_kwp ?? 0), 0)

  const now = new Date()
  const points: SeriesPoint[] = []
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth() // 0-based
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    // Energie zilnică reprezentativă (Wh) pe ziua 15, prin însumarea puterii orare.
    const repDay = new Date(year, month, 15)
    let dailyWh = 0
    for (let h = 0; h < 24; h++) {
      const ts = new Date(repDay.getFullYear(), repDay.getMonth(), repDay.getDate(), h, 0, 0).getTime()
      dailyWh += computeCurrentAcPowerW(totalPeakKwp, ts) // W ținut 1h = Wh
    }
    const monthlyKwh = Math.round((dailyWh * daysInMonth) / 1000)
    points.push({
      label: monthDate.toLocaleDateString(RO, { month: 'short', year: '2-digit' }),
      value: monthlyKwh,
    })
  }
  return { range: 'year', unit: 'kWh', title: 'Producție lunară · ultimele 12 luni', source: 'model PVGIS', points }
}

export async function getProduction(range: string): Promise<ProductionSeries> {
  switch (range) {
    case 'week':
      return getDaily(7, 'week', 'Producție zilnică · ultimele 7 zile')
    case 'month':
      return getDaily(30, 'month', 'Producție zilnică · ultimele 30 zile')
    case 'year':
      return getYearlyModel()
    case 'day':
    default:
      return getHourly()
  }
}
