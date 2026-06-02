const PVGIS_BASE = 'https://re.jrc.ec.europa.eu/api/v5_3/seriescalc'

export type PvgisHour = {
  time: string
  P: number
  'G(i)': number
  H_sun: number
  T2m: number
  WS10m: number
  Int: number
}

export type PvgisResponse = {
  inputs: Record<string, unknown>
  outputs: {
    hourly: PvgisHour[]
  }
  meta?: Record<string, unknown>
}

export type PvgisFetchOptions = {
  lat: number
  lng: number
  peakPowerKwp: number
  lossPercent?: number
  startYear?: number
  endYear?: number
}

export async function fetchPvgis(opts: PvgisFetchOptions): Promise<PvgisResponse> {
  const params = new URLSearchParams({
    lat: String(opts.lat),
    lon: String(opts.lng),
    pvcalculation: '1',
    peakpower: String(opts.peakPowerKwp),
    loss: String(opts.lossPercent ?? 14),
    outputformat: 'json',
    startyear: String(opts.startYear ?? 2023),
    endyear: String(opts.endYear ?? 2023),
  })
  const url = `${PVGIS_BASE}?${params.toString()}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`PVGIS ${res.status}: ${body.slice(0, 200)}`)
  }
  return (await res.json()) as PvgisResponse
}

export function parsePvgisTime(time: string): Date {
  // PVGIS format: YYYYMMDD:HHMM (UTC)
  const y = Number(time.slice(0, 4))
  const mo = Number(time.slice(4, 6))
  const d = Number(time.slice(6, 8))
  const h = Number(time.slice(9, 11))
  const mi = Number(time.slice(11, 13))
  return new Date(Date.UTC(y, mo - 1, d, h, mi))
}
