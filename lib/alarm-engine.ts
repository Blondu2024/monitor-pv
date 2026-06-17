import type { SupabaseClient } from '@supabase/supabase-js'
import { sendAlertEmail } from './email'

type Measurement = {
  device_id: string
  ts: string
  ac_voltage_v?: number | null
  ac_frequency_hz?: number | null
  module_temp_c?: number | null
  soc_percent?: number | null
}

type Threshold = {
  module_temp_warning_c: number
  module_temp_critical_c: number
  voltage_min_v: number
  voltage_max_v: number
  frequency_min_hz: number
  frequency_max_hz: number
  soc_min_percent: number
}

const DEFAULT_THRESHOLD: Threshold = {
  module_temp_warning_c: 65,
  module_temp_critical_c: 75,
  voltage_min_v: 207,
  voltage_max_v: 253,
  frequency_min_hz: 49.5,
  frequency_max_hz: 50.5,
  soc_min_percent: 20,
}

export type NewAlarm = {
  device_id: string
  site_id: string | null
  severity: 'info' | 'warning' | 'critical'
  code: string
  message: string
}

/** Evaluează o listă de măsurători vs praguri și întoarce alarmele candidate. */
export function evaluate(
  measurements: Measurement[],
  deviceSite: Map<string, string>,
  thresholdBySite: Map<string, Threshold>
): NewAlarm[] {
  const out: NewAlarm[] = []
  for (const m of measurements) {
    const siteId = deviceSite.get(m.device_id) ?? null
    const t = (siteId && thresholdBySite.get(siteId)) || DEFAULT_THRESHOLD

    if (m.module_temp_c != null) {
      if (m.module_temp_c > t.module_temp_critical_c)
        out.push({ device_id: m.device_id, site_id: siteId, severity: 'critical', code: 'TEMP_HIGH', message: `Temperatură modul ${m.module_temp_c.toFixed(1)}°C — peste pragul critic (${t.module_temp_critical_c}°C)` })
      else if (m.module_temp_c > t.module_temp_warning_c)
        out.push({ device_id: m.device_id, site_id: siteId, severity: 'warning', code: 'TEMP_HIGH', message: `Temperatură modul ${m.module_temp_c.toFixed(1)}°C — peste pragul de avertizare (${t.module_temp_warning_c}°C)` })
    }

    if (m.ac_voltage_v != null && m.ac_voltage_v > 0) {
      if (m.ac_voltage_v > t.voltage_max_v)
        out.push({ device_id: m.device_id, site_id: siteId, severity: 'critical', code: 'GRID_VOLTAGE_HIGH', message: `Tensiune rețea ${m.ac_voltage_v.toFixed(0)}V — peste maxim admis (${t.voltage_max_v}V, EN 50549)` })
      else if (m.ac_voltage_v < t.voltage_min_v)
        out.push({ device_id: m.device_id, site_id: siteId, severity: 'critical', code: 'GRID_VOLTAGE_LOW', message: `Tensiune rețea ${m.ac_voltage_v.toFixed(0)}V — sub minim admis (${t.voltage_min_v}V, EN 50549)` })
    }

    if (m.ac_frequency_hz != null && m.ac_frequency_hz > 0) {
      if (m.ac_frequency_hz > t.frequency_max_hz || m.ac_frequency_hz < t.frequency_min_hz)
        out.push({ device_id: m.device_id, site_id: siteId, severity: 'critical', code: 'GRID_FREQ_OUT', message: `Frecvență rețea ${m.ac_frequency_hz.toFixed(2)}Hz — în afara intervalului admis (${t.frequency_min_hz}–${t.frequency_max_hz}Hz)` })
    }

    if (m.soc_percent != null) {
      if (m.soc_percent < t.soc_min_percent)
        out.push({ device_id: m.device_id, site_id: siteId, severity: 'warning', code: 'BATTERY_SOC_LOW', message: `Nivel baterie ${m.soc_percent.toFixed(0)}% — sub pragul minim (${t.soc_min_percent}%)` })
    }
  }
  return out
}

/**
 * Rulează motorul: evaluează măsurătorile, creează alarme noi (cu deduplicare vs
 * alarmele active de același cod+device) și trimite email la cele critice.
 */
export async function runAlarmEngine(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: SupabaseClient<any, any, any>,
  measurements: Measurement[]
): Promise<{ created: number; emailed: number }> {
  const [devicesRes, sitesRes, thrRes, activeRes] = await Promise.all([
    sb.from('devices').select('id,site_id,manufacturer,model'),
    sb.from('sites').select('id,name'),
    sb.from('alarm_thresholds').select('site_id,module_temp_warning_c,module_temp_critical_c,voltage_min_v,voltage_max_v,frequency_min_hz,frequency_max_hz,soc_min_percent'),
    sb.from('alarms').select('device_id,code').eq('status', 'active'),
  ])

  const deviceSite = new Map<string, string>()
  const deviceName = new Map<string, string>()
  for (const d of devicesRes.data ?? []) {
    deviceSite.set(d.id, d.site_id)
    deviceName.set(d.id, `${d.manufacturer} ${d.model}`)
  }
  const siteName = new Map<string, string>((sitesRes.data ?? []).map((s) => [s.id, s.name]))
  const thresholdBySite = new Map<string, Threshold>((thrRes.data ?? []).map((t) => [t.site_id, t as Threshold]))
  const activeKeys = new Set((activeRes.data ?? []).map((a) => `${a.device_id}:${a.code}`))

  const candidates = evaluate(measurements, deviceSite, thresholdBySite)

  // Deduplicare: nu re-crea o alarmă deja activă pentru același device+cod.
  const seen = new Set(activeKeys)
  const fresh: NewAlarm[] = []
  for (const c of candidates) {
    const k = `${c.device_id}:${c.code}`
    if (seen.has(k)) continue
    seen.add(k)
    fresh.push(c)
  }
  if (fresh.length === 0) return { created: 0, emailed: 0 }

  const ins = await sb.from('alarms').insert(fresh.map((f) => ({ ...f, status: 'active' })))
  if (ins.error) return { created: 0, emailed: 0 }

  let emailed = 0
  for (const f of fresh.filter((f) => f.severity === 'critical')) {
    const res = await sendAlertEmail({
      severity: f.severity,
      code: f.code,
      message: f.message,
      siteName: (f.site_id && siteName.get(f.site_id)) || '—',
      deviceName: deviceName.get(f.device_id) || '—',
      ts: new Date().toISOString(),
    })
    if (res.ok) emailed++
  }

  return { created: fresh.length, emailed }
}
