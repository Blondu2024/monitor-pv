import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { computeInstantMetrics, computeCurrentAcPowerW } from '@/lib/live-curve'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const MEASUREMENT_COLUMNS = [
  'device_id', 'ts',
  'ac_power_w', 'dc_power_w', 'ac_voltage_v', 'ac_current_a', 'ac_frequency_hz',
  'energy_today_wh', 'energy_total_wh',
  'module_temp_c', 'ambient_temp_c', 'irradiance_wm2', 'wind_speed_ms',
  'grid_import_w', 'grid_export_w',
  'soc_percent', 'battery_power_w', 'battery_voltage_v',
] as const

function fullRow(partial: Record<string, unknown>) {
  const row: Record<string, unknown> = {}
  for (const k of MEASUREMENT_COLUMNS) row[k] = partial[k] ?? null
  return row
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sb = supabaseAdmin()
  const [sitesRes, devicesRes, latestEnergyRes] = await Promise.all([
    sb.from('sites').select('id,peak_power_kwp'),
    sb.from('devices').select('id,site_id,kind,manufacturer'),
    sb.from('measurements').select('device_id,energy_today_wh,energy_total_wh,ts').order('ts', { ascending: false }).limit(100),
  ])

  if (sitesRes.error) return NextResponse.json({ error: sitesRes.error.message }, { status: 500 })
  if (devicesRes.error) return NextResponse.json({ error: devicesRes.error.message }, { status: 500 })

  const sites = sitesRes.data ?? []
  const devices = devicesRes.data ?? []
  const latestByDevice = new Map<string, { energyToday: number; energyTotal: number; ts: string }>()
  for (const m of latestEnergyRes.data ?? []) {
    if (!latestByDevice.has(m.device_id)) {
      latestByDevice.set(m.device_id, {
        energyToday: m.energy_today_wh ?? 0,
        energyTotal: m.energy_total_wh ?? 0,
        ts: m.ts,
      })
    }
  }

  const now = Date.now()
  const ts = new Date(now).toISOString()
  const rows: Record<string, unknown>[] = []

  for (const site of sites) {
    const halfKwp = site.peak_power_kwp / 2
    const siteDevices = devices.filter((d) => d.site_id === site.id)
    const inverters = siteDevices.filter((d) => d.kind === 'inverter')
    let totalProductionW = 0

    for (const inv of inverters) {
      const metrics = computeInstantMetrics(halfKwp, now)
      const prev = latestByDevice.get(inv.id)
      const sameDay = prev ? new Date(prev.ts).getUTCDate() === new Date(now).getUTCDate() : false
      const elapsedH = prev ? Math.max(0, (now - new Date(prev.ts).getTime()) / 3_600_000) : 1 / 60
      const energyDeltaWh = metrics.ac_power_w * Math.min(elapsedH, 1 / 60)
      const energyTodayWh = sameDay ? (prev!.energyToday + energyDeltaWh) : energyDeltaWh
      const energyTotalWh = (prev?.energyTotal ?? 0) + energyDeltaWh

      rows.push(fullRow({
        device_id: inv.id,
        ts,
        ...metrics,
        energy_today_wh: Math.round(energyTodayWh),
        energy_total_wh: Math.round(energyTotalWh),
      }))
      totalProductionW += metrics.ac_power_w
    }

    const householdLoad = 800 + (site.peak_power_kwp * 110)
    const netW = totalProductionW - householdLoad
    const gridExport = netW > 0 ? Math.round(netW * 10) / 10 : 0
    const gridImport = netW < 0 ? Math.round(-netW * 10) / 10 : 0

    for (const meter of siteDevices.filter((d) => d.kind === 'meter')) {
      rows.push(fullRow({
        device_id: meter.id,
        ts,
        grid_import_w: gridImport,
        grid_export_w: gridExport,
        ac_voltage_v: 228 + Math.sin(now / 1_800_000) * 6,
        ac_frequency_hz: 50 + Math.sin(now / 900_000) * 0.08,
      }))
    }

    for (const battery of siteDevices.filter((d) => d.kind === 'battery')) {
      const prev = latestByDevice.get(battery.id)
      const prevSoc = prev ? 50 : 50
      const deltaW = Math.max(-3000, Math.min(3000, netW))
      const elapsedH = 1 / 60
      const newSoc = Math.max(10, Math.min(95, prevSoc + (deltaW * elapsedH / 10_000) * 100))
      rows.push(fullRow({
        device_id: battery.id,
        ts,
        soc_percent: Math.round(newSoc * 10) / 10,
        battery_power_w: deltaW > 0 ? -deltaW : Math.abs(deltaW),
        battery_voltage_v: Math.round((48 + (newSoc - 50) * 0.04) * 100) / 100,
        module_temp_c: Math.round((computeInstantMetrics(0, now).ambient_temp_c + 4) * 10) / 10,
      }))
    }
  }

  const insertRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/measurements`, {
    method: 'POST',
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(rows),
  })

  if (!insertRes.ok) {
    return NextResponse.json({ error: `Insert failed ${insertRes.status}: ${(await insertRes.text()).slice(0, 300)}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true, inserted: rows.length, ts })
}
