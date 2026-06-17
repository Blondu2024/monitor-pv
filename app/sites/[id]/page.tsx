import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Measurement = {
  device_id: string
  ts: string
  ac_power_w: number | null
  ac_voltage_v: number | null
  ac_current_a: number | null
  ac_frequency_hz: number | null
  energy_today_wh: number | null
  energy_total_wh: number | null
  module_temp_c: number | null
  ambient_temp_c: number | null
  irradiance_wm2: number | null
  grid_import_w: number | null
  grid_export_w: number | null
  soc_percent: number | null
  battery_power_w: number | null
  battery_voltage_v: number | null
}

type Device = {
  id: string
  kind: 'inverter' | 'meter' | 'battery'
  manufacturer: string
  model: string
  serial_number: string
  status: 'online' | 'offline' | 'warning' | 'error'
  rated_power_kw: number | null
  modbus_slave_id: number | null
}

type Alarm = {
  id: string
  device_id: string | null
  severity: 'info' | 'warning' | 'critical'
  code: string
  message: string
  status: 'active' | 'acknowledged' | 'cleared'
  created_at: string
}

export default async function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = supabaseAdmin()
  const siteRes = await sb.from('sites').select('id,name,city,address,gps_lat,gps_lng,peak_power_kwp,client_name,commissioned_at').eq('id', id).maybeSingle()
  if (siteRes.error) throw siteRes.error
  if (!siteRes.data) notFound()
  const site = siteRes.data as { id: string; name: string; city: string | null; address: string | null; gps_lat: number; gps_lng: number; peak_power_kwp: number; client_name: string | null; commissioned_at: string | null }

  const [devicesRes, alarmsRes] = await Promise.all([
    sb.from('devices').select('id,kind,manufacturer,model,serial_number,status,rated_power_kw,modbus_slave_id').eq('site_id', id),
    sb.from('alarms').select('id,device_id,severity,code,message,status,created_at').eq('site_id', id).order('created_at', { ascending: false }).limit(10),
  ])
  if (devicesRes.error) throw devicesRes.error
  if (alarmsRes.error) throw alarmsRes.error
  const devices = (devicesRes.data ?? []) as Device[]
  const alarms = (alarmsRes.data ?? []) as Alarm[]

  const latestByDevice = new Map<string, Measurement>()
  if (devices.length > 0) {
    const since = new Date(Date.now() - 24 * 3_600_000).toISOString()
    const measRes = await sb
      .from('measurements')
      .select('device_id,ts,ac_power_w,ac_voltage_v,ac_current_a,ac_frequency_hz,energy_today_wh,energy_total_wh,module_temp_c,ambient_temp_c,irradiance_wm2,grid_import_w,grid_export_w,soc_percent,battery_power_w,battery_voltage_v')
      .in('device_id', devices.map((d) => d.id))
      .gte('ts', since)
      .order('ts', { ascending: false })
      .limit(2000)
    if (measRes.error) throw measRes.error
    for (const m of (measRes.data ?? []) as Measurement[]) {
      if (!latestByDevice.has(m.device_id)) latestByDevice.set(m.device_id, m)
    }
  }

  const inverters = devices.filter((d) => d.kind === 'inverter')
  const meters = devices.filter((d) => d.kind === 'meter')
  const batteries = devices.filter((d) => d.kind === 'battery')

  const totalPowerW = inverters.reduce((sum, d) => sum + (latestByDevice.get(d.id)?.ac_power_w ?? 0), 0)
  const totalEnergyTodayWh = inverters.reduce((sum, d) => sum + (latestByDevice.get(d.id)?.energy_today_wh ?? 0), 0)
  const activeAlarmsCount = alarms.filter((a) => a.status === 'active').length

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto px-4 sm:px-8 py-8 gap-6">
      <Link href="/sites" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 inline-flex items-center gap-1 w-fit">
        ‹ Înapoi la site-uri
      </Link>

      <header className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{site.name}</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {site.city} {site.address && `· ${site.address}`}
            </p>
            <p className="text-xs text-zinc-400 mt-1">GPS {site.gps_lat.toFixed(4)}, {site.gps_lng.toFixed(4)}</p>
            {site.client_name && <p className="text-xs text-zinc-400 mt-1">Client: {site.client_name}</p>}
            {site.commissioned_at && <p className="text-xs text-zinc-400 mt-1">Punere în funcțiune: {new Date(site.commissioned_at).toLocaleDateString('ro-RO')}</p>}
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold text-amber-600 dark:text-amber-400 tabular-nums">{site.peak_power_kwp}<span className="text-base font-normal text-zinc-500 ml-1">kWp</span></p>
            <p className="text-xs text-zinc-500 mt-1">putere instalată</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Stat label="Putere acum" value={`${(totalPowerW / 1000).toFixed(1)}`} unit="kW" />
          <Stat label="Energie azi" value={`${(totalEnergyTodayWh / 1000).toFixed(1)}`} unit="kWh" />
          <Stat label="Device-uri" value={`${devices.length}`} unit={devices.length === 1 ? 'unitate' : 'unități'} />
          <Stat label="Alarme active" value={`${activeAlarmsCount}`} unit={activeAlarmsCount === 1 ? 'alarmă' : 'alarme'} color={activeAlarmsCount > 0 ? 'red' : 'zinc'} />
        </div>
      </header>

      {inverters.length > 0 && (
        <DeviceSection title="Invertoare" subtitle="Conversie DC → AC, polling Modbus RS485" devices={inverters} latestByDevice={latestByDevice} renderMetrics={renderInverterMetrics} />
      )}
      {meters.length > 0 && (
        <DeviceSection title="Contoare" subtitle="Măsurare import / export rețea" devices={meters} latestByDevice={latestByDevice} renderMetrics={renderMeterMetrics} />
      )}
      {batteries.length > 0 && (
        <DeviceSection title="Baterii" subtitle="Stocare locală + management SOC" devices={batteries} latestByDevice={latestByDevice} renderMetrics={renderBatteryMetrics} />
      )}

      {alarms.length > 0 && (
        <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6">
          <h2 className="text-sm font-medium text-zinc-500 mb-3">Alarme pe acest site</h2>
          <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
            {alarms.map((a) => (
              <li key={a.id}>
                <Link href={`/alarms/${a.id}`} className="py-3 flex items-start gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 -mx-2 px-2 rounded-lg transition-colors">
                  <SeverityBadge severity={a.severity} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{a.code}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{a.message}</p>
                  </div>
                  <p className="text-[10px] text-zinc-400 shrink-0">{new Date(a.created_at).toLocaleString('ro-RO', { dateStyle: 'short', timeStyle: 'short' })}</p>
                  <span className="self-center text-zinc-300 dark:text-zinc-600">›</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function DeviceSection({
  title,
  subtitle,
  devices,
  latestByDevice,
  renderMetrics,
}: {
  title: string
  subtitle: string
  devices: Device[]
  latestByDevice: Map<string, Measurement>
  renderMetrics: (d: Device, m: Measurement | undefined) => React.ReactNode
}) {
  return (
    <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-sm font-medium">{title} <span className="text-zinc-400">({devices.length})</span></h2>
        <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {devices.map((d) => {
          const m = latestByDevice.get(d.id)
          const lastSeen = m ? secondsAgo(m.ts) : null
          return (
            <div key={d.id} className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="text-sm font-medium">{d.manufacturer} {d.model}</p>
                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5">S/N {d.serial_number}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Modbus ID {d.modbus_slave_id ?? '—'} {d.rated_power_kw ? `· ${d.rated_power_kw} kW nominal` : ''}</p>
                </div>
                <DeviceStatusDot status={d.status} lastSeen={lastSeen} />
              </div>
              {renderMetrics(d, m)}
              <Link
                href={`/devices/${d.id}`}
                className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
              >
                Parametri dispozitiv
                <span aria-hidden>›</span>
              </Link>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function renderInverterMetrics(_d: Device, m: Measurement | undefined) {
  if (!m) return <p className="text-xs text-zinc-400">Fără măsurători în ultimele 24h</p>
  return (
    <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-zinc-100 dark:border-zinc-800">
      <Metric value={m.ac_power_w != null ? `${(m.ac_power_w / 1000).toFixed(2)}` : '—'} unit="kW" label="AC" />
      <Metric value={m.ac_voltage_v != null ? `${m.ac_voltage_v.toFixed(0)}` : '—'} unit="V" label="tensiune" />
      <Metric value={m.module_temp_c != null ? `${m.module_temp_c.toFixed(0)}` : '—'} unit="°C" label="modul" />
    </div>
  )
}

function renderMeterMetrics(_d: Device, m: Measurement | undefined) {
  if (!m) return <p className="text-xs text-zinc-400">Fără măsurători în ultimele 24h</p>
  return (
    <div className="grid grid-cols-2 gap-2 text-center pt-3 border-t border-zinc-100 dark:border-zinc-800">
      <Metric value={m.grid_export_w != null ? `${(m.grid_export_w / 1000).toFixed(2)}` : '—'} unit="kW" label="export rețea" color="green" />
      <Metric value={m.grid_import_w != null ? `${(m.grid_import_w / 1000).toFixed(2)}` : '—'} unit="kW" label="import rețea" color={m.grid_import_w && m.grid_import_w > 0 ? 'red' : 'zinc'} />
    </div>
  )
}

function renderBatteryMetrics(_d: Device, m: Measurement | undefined) {
  if (!m) return <p className="text-xs text-zinc-400">Fără măsurători în ultimele 24h</p>
  const charging = (m.battery_power_w ?? 0) < 0
  return (
    <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-zinc-100 dark:border-zinc-800">
      <Metric value={m.soc_percent != null ? `${m.soc_percent.toFixed(0)}` : '—'} unit="%" label="SOC" color="blue" />
      <Metric value={m.battery_power_w != null ? `${Math.abs(m.battery_power_w / 1000).toFixed(2)}` : '—'} unit="kW" label={charging ? 'încărcare' : 'descărcare'} color={charging ? 'green' : 'amber'} />
      <Metric value={m.battery_voltage_v != null ? `${m.battery_voltage_v.toFixed(1)}` : '—'} unit="V" label="tensiune" />
    </div>
  )
}

function Stat({ label, value, unit, color }: { label: string; value: string; unit: string; color?: 'red' | 'zinc' }) {
  return (
    <div>
      <p className="text-[11px] text-zinc-500 uppercase">{label}</p>
      <p className={`text-lg font-semibold tabular-nums ${color === 'red' ? 'text-red-600 dark:text-red-400' : ''}`}>{value} <span className="text-xs font-normal text-zinc-500">{unit}</span></p>
    </div>
  )
}

function Metric({ value, unit, label, color }: { value: string; unit: string; label: string; color?: 'red' | 'green' | 'amber' | 'blue' | 'zinc' }) {
  const colorMap = {
    red: 'text-red-600 dark:text-red-400',
    green: 'text-green-600 dark:text-green-400',
    amber: 'text-amber-600 dark:text-amber-400',
    blue: 'text-blue-600 dark:text-blue-400',
    zinc: '',
  } as const
  return (
    <div>
      <p className={`text-sm font-semibold tabular-nums ${color ? colorMap[color] : ''}`}>
        {value}<span className="text-[10px] font-normal text-zinc-500 ml-0.5">{unit}</span>
      </p>
      <p className="text-[10px] text-zinc-500 mt-0.5">{label}</p>
    </div>
  )
}

function DeviceStatusDot({ status, lastSeen }: { status: string; lastSeen: number | null }) {
  const colorMap: Record<string, string> = {
    online: 'bg-green-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    offline: 'bg-zinc-400',
  }
  return (
    <div className="text-right">
      <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide">
        <span className={`w-2 h-2 rounded-full ${colorMap[status] ?? 'bg-zinc-400'}`}></span>
        {status}
      </span>
      {lastSeen != null && <p className="text-[10px] text-zinc-400 mt-0.5">{formatLastSeen(lastSeen)}</p>}
    </div>
  )
}

function SeverityBadge({ severity }: { severity: 'info' | 'warning' | 'critical' }) {
  const styleMap = {
    info: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
    warning: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
    critical: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300',
  } as const
  return <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${styleMap[severity]} uppercase shrink-0`}>{severity}</span>
}

function secondsAgo(ts: string): number {
  return Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
}

function formatLastSeen(sec: number): string {
  if (sec < 60) return `${sec}s în urmă`
  if (sec < 3600) return `${Math.floor(sec / 60)} min în urmă`
  if (sec < 86400) return `${Math.floor(sec / 3600)} h în urmă`
  return `${Math.floor(sec / 86400)} zile în urmă`
}
