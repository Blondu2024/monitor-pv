// Curbă zilnică sintetică pentru producția fotovoltaică în RO (45°N).
// Folosită de /api/live (computed 5-sec) și /api/cron/tick (salvare 1 min).
// Calibrată să producă valori plauzibile vs PVGIS — vârf prânz, 0 noaptea.

export function localHourBucharest(ts: number = Date.now()): number {
  const d = new Date(ts)
  const month = d.getUTCMonth() + 1
  const isDst = month >= 4 && month <= 10
  const offset = isDst ? 3 : 2
  return (d.getUTCHours() + offset + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600) % 24
}

export function monthSeasonalFactor(month: number): number {
  // mai-aug = 1.0 (vară), apr/sep = 0.78, mar/oct = 0.55, restul = 0.32
  if (month >= 5 && month <= 8) return 1.0
  if (month === 4 || month === 9) return 0.78
  if (month === 3 || month === 10) return 0.55
  return 0.32
}

export function dailyCurveRatio(hourLocal: number, month: number): number {
  const sunrise = month >= 4 && month <= 9 ? 5.6 : 7.5
  const sunset = month >= 4 && month <= 9 ? 20.6 : 17.0
  if (hourLocal < sunrise || hourLocal > sunset) return 0
  const noon = (sunrise + sunset) / 2
  const halfwidth = (sunset - sunrise) / 2
  const x = (hourLocal - noon) / halfwidth
  return Math.cos((Math.PI * x) / 2) ** 2 * 0.85 * monthSeasonalFactor(month)
}

export function jitter(ts: number, bucketMs: number, scale: number): number {
  const seed = Math.floor(ts / bucketMs)
  const x = Math.sin(seed * 12.9898 + bucketMs * 0.001) * 43758.5453
  const rand = x - Math.floor(x)
  return 1 + (rand - 0.5) * 2 * scale
}

export function computeCurrentAcPowerW(peakKwp: number, ts: number = Date.now()): number {
  const month = new Date(ts).getUTCMonth() + 1
  const hourLocal = localHourBucharest(ts)
  const ratio = dailyCurveRatio(hourLocal, month)
  const baseW = ratio * peakKwp * 1000
  return Math.max(0, baseW * jitter(ts, 5000, 0.04))
}

export function computeEnvironment(ts: number = Date.now()) {
  const month = new Date(ts).getUTCMonth() + 1
  const hourLocal = localHourBucharest(ts)
  const ratio = dailyCurveRatio(hourLocal, month)
  const irradiance = ratio > 0 ? (ratio / (monthSeasonalFactor(month) * 0.85)) * 1000 : 0
  const tempBase = month >= 5 && month <= 8 ? 23 : month === 4 || month === 9 ? 16 : 8
  const tempCurve = Math.sin(((hourLocal - 6) / 24) * 2 * Math.PI) * 7
  const ambient = tempBase + tempCurve
  const moduleTemp = ambient + irradiance * 0.028
  const windSpeed = 2 + (jitter(ts, 60_000, 0.6) - 1) * 4
  return { irradiance, ambient, moduleTemp, windSpeed: Math.max(0.2, windSpeed) }
}

export function computeInstantMetrics(peakKwp: number, ts: number = Date.now()) {
  const ac = computeCurrentAcPowerW(peakKwp, ts)
  const dc = ac > 0 ? ac / 0.955 : 0
  const voltage = 228 + Math.sin(ts / 1_800_000) * 6 + (jitter(ts, 5000, 0.005) - 1) * 200
  const frequency = 50 + Math.sin(ts / 900_000) * 0.08 + (jitter(ts, 5000, 0.0008) - 1) * 200
  const env = computeEnvironment(ts)
  return {
    ac_power_w: round(ac, 1),
    dc_power_w: round(dc, 1),
    ac_voltage_v: round(voltage, 2),
    ac_current_a: round(ac / voltage, 2),
    ac_frequency_hz: round(frequency, 3),
    irradiance_wm2: round(env.irradiance, 0),
    ambient_temp_c: round(env.ambient, 1),
    module_temp_c: round(ac > 0 ? env.moduleTemp : env.ambient, 1),
    wind_speed_ms: round(env.windSpeed, 1),
  }
}

function round(n: number, d: number) {
  const f = 10 ** d
  return Math.round(n * f) / f
}
