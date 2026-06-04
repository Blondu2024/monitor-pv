import { supabaseAdmin } from './supabase'
import { computeCurrentAcPowerW, computeEnvironment } from './live-curve'
import type { LiveData } from '@/app/components/LiveDashboard'

export async function computeLiveData(): Promise<LiveData> {
  const sb = supabaseAdmin()
  const [sitesRes, devicesRes, latestEnergyRes, alarmsRes] = await Promise.all([
    sb.from('sites').select('id,name,peak_power_kwp').order('name'),
    sb.from('devices').select('id,site_id,kind,manufacturer').eq('kind', 'inverter'),
    sb.from('measurements').select('device_id,energy_today_wh,ts').order('ts', { ascending: false }).limit(50),
    sb.from('alarms').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  if (sitesRes.error) throw sitesRes.error
  if (devicesRes.error) throw devicesRes.error

  const now = Date.now()
  const sites = sitesRes.data ?? []
  const devices = devicesRes.data ?? []
  const latestEnergy = new Map<string, number>()
  for (const m of latestEnergyRes.data ?? []) {
    if (!latestEnergy.has(m.device_id)) latestEnergy.set(m.device_id, m.energy_today_wh ?? 0)
  }

  let totalPowerW = 0
  let totalEnergyTodayWh = 0
  const perSite = sites.map((s) => {
    const siteDevices = devices.filter((d) => d.site_id === s.id)
    let sitePowerW = 0
    let siteEnergyWh = 0
    for (const d of siteDevices) {
      sitePowerW += computeCurrentAcPowerW(s.peak_power_kwp / 2, now)
      siteEnergyWh += latestEnergy.get(d.id) ?? 0
    }
    totalPowerW += sitePowerW
    totalEnergyTodayWh += siteEnergyWh
    return {
      id: s.id,
      name: s.name,
      powerKw: Math.round((sitePowerW / 1000) * 10) / 10,
      energyKwh: Math.round((siteEnergyWh / 1000) * 10) / 10,
      peakKwp: s.peak_power_kwp,
    }
  })

  const totalPeakKwp = sites.reduce((sum, s) => sum + s.peak_power_kwp, 0)
  const env = computeEnvironment(now)
  const expectedPowerW = (env.irradiance / 1000) * totalPeakKwp * 1000 * 0.86
  const performanceRatio = expectedPowerW > 100 ? Math.min(1.05, totalPowerW / expectedPowerW) : null

  return {
    now,
    totalPowerKw: Math.round((totalPowerW / 1000) * 10) / 10,
    totalEnergyTodayKwh: Math.round((totalEnergyTodayWh / 1000) * 10) / 10,
    performanceRatioPct: performanceRatio != null ? Math.round(performanceRatio * 100) : null,
    activeAlarms: alarmsRes.count ?? 0,
    irradianceWm2: Math.round(env.irradiance),
    ambientTempC: Math.round(env.ambient * 10) / 10,
    perSite,
  }
}
