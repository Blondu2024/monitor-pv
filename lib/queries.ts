import { supabaseAdmin } from './supabase'

export type Site = {
  id: string
  name: string
  city: string | null
  peak_power_kwp: number
  gps_lat: number
  gps_lng: number
  client_name: string | null
}

export type Device = {
  id: string
  site_id: string
  kind: 'inverter' | 'meter' | 'battery'
  manufacturer: string
  model: string
  serial_number: string
  status: string
  rated_power_kw: number | null
}

export type Measurement = {
  device_id: string
  ts: string
  ac_power_w: number | null
  energy_today_wh: number | null
  irradiance_wm2: number | null
  module_temp_c: number | null
  ambient_temp_c: number | null
  soc_percent: number | null
  grid_export_w: number | null
  grid_import_w: number | null
}

export type Alarm = {
  id: string
  site_id: string | null
  device_id: string | null
  severity: 'info' | 'warning' | 'critical'
  code: string
  message: string
  status: 'active' | 'acknowledged' | 'cleared'
  created_at: string
}

export type DashboardData = {
  sites: Site[]
  devices: Device[]
  latestPerInverter: Map<string, Measurement>
  hourly24h: Array<{ hour: string; power_kw: number }>
  activeAlarmsCount: number
  recentAlarms: Alarm[]
}

export async function loadDashboard(): Promise<DashboardData> {
  const sb = supabaseAdmin()
  const [sitesRes, devicesRes, alarmsActiveRes, alarmsRecentRes] = await Promise.all([
    sb.from('sites').select('id,name,city,peak_power_kwp,gps_lat,gps_lng,client_name').order('name'),
    sb.from('devices').select('id,site_id,kind,manufacturer,model,serial_number,status,rated_power_kw'),
    sb.from('alarms').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    sb.from('alarms').select('id,site_id,device_id,severity,code,message,status,created_at').order('created_at', { ascending: false }).limit(8),
  ])

  if (sitesRes.error) throw sitesRes.error
  if (devicesRes.error) throw devicesRes.error
  if (alarmsActiveRes.error) throw alarmsActiveRes.error
  if (alarmsRecentRes.error) throw alarmsRecentRes.error

  const sites = (sitesRes.data ?? []) as Site[]
  const devices = (devicesRes.data ?? []) as Device[]
  const inverterIds = devices.filter((d) => d.kind === 'inverter').map((d) => d.id)

  const since24h = new Date(Date.now() - 24 * 3_600_000).toISOString()
  const meas24hRes = await sb
    .from('measurements')
    .select('device_id,ts,ac_power_w,energy_today_wh,irradiance_wm2,module_temp_c,ambient_temp_c,soc_percent,grid_export_w,grid_import_w')
    .in('device_id', inverterIds)
    .gte('ts', since24h)
    .order('ts', { ascending: false })
  if (meas24hRes.error) throw meas24hRes.error
  const meas24h = (meas24hRes.data ?? []) as Measurement[]

  const latestPerInverter = new Map<string, Measurement>()
  for (const m of meas24h) {
    if (!latestPerInverter.has(m.device_id)) latestPerInverter.set(m.device_id, m)
  }

  const hourlyMap = new Map<string, number>()
  for (const m of meas24h) {
    const hourKey = m.ts.slice(0, 13) + ':00:00.000Z'
    const w = m.ac_power_w ?? 0
    hourlyMap.set(hourKey, (hourlyMap.get(hourKey) ?? 0) + w)
  }
  const hourly24h = Array.from(hourlyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([hour, w]) => ({ hour, power_kw: Math.round((w / 1000) * 10) / 10 }))

  return {
    sites,
    devices,
    latestPerInverter,
    hourly24h,
    activeAlarmsCount: alarmsActiveRes.count ?? 0,
    recentAlarms: (alarmsRecentRes.data ?? []) as Alarm[],
  }
}

export function aggregateBySite(data: DashboardData) {
  const bySite = new Map<string, { site: Site; powerW: number; energyTodayWh: number; alarms: number }>()
  for (const site of data.sites) {
    bySite.set(site.id, { site, powerW: 0, energyTodayWh: 0, alarms: 0 })
  }
  for (const d of data.devices) {
    if (d.kind !== 'inverter') continue
    const latest = data.latestPerInverter.get(d.id)
    if (!latest) continue
    const entry = bySite.get(d.site_id)
    if (!entry) continue
    entry.powerW += latest.ac_power_w ?? 0
    entry.energyTodayWh += latest.energy_today_wh ?? 0
  }
  for (const a of data.recentAlarms) {
    if (a.status !== 'active' || !a.site_id) continue
    const entry = bySite.get(a.site_id)
    if (entry) entry.alarms += 1
  }
  return Array.from(bySite.values())
}

export function computeKpis(data: DashboardData) {
  let totalPowerW = 0
  let totalEnergyTodayWh = 0
  let totalPeakKwp = 0
  let irradAvg = 0
  let irradCount = 0
  for (const d of data.devices) {
    if (d.kind !== 'inverter') continue
    const latest = data.latestPerInverter.get(d.id)
    if (!latest) continue
    totalPowerW += latest.ac_power_w ?? 0
    totalEnergyTodayWh += latest.energy_today_wh ?? 0
    if (latest.irradiance_wm2 != null) {
      irradAvg += latest.irradiance_wm2
      irradCount++
    }
  }
  for (const s of data.sites) totalPeakKwp += s.peak_power_kwp

  const avgIrrad = irradCount > 0 ? irradAvg / irradCount : 0
  const expectedPowerW = (avgIrrad / 1000) * totalPeakKwp * 1000 * 0.86
  const performanceRatio = expectedPowerW > 100 ? Math.min(1.05, totalPowerW / expectedPowerW) : null

  return {
    totalPowerKw: Math.round((totalPowerW / 1000) * 10) / 10,
    totalEnergyTodayKwh: Math.round((totalEnergyTodayWh / 1000) * 10) / 10,
    performanceRatioPct: performanceRatio != null ? Math.round(performanceRatio * 100) : null,
    activeAlarms: data.activeAlarmsCount,
    totalPeakKwp,
  }
}
