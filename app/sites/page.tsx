import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import SitesMap, { type SiteMarker } from './SitesMap'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type SiteRow = {
  id: string
  name: string
  city: string | null
  gps_lat: number
  gps_lng: number
  peak_power_kwp: number
  client_name: string | null
}

type AlarmRow = { site_id: string | null; severity: 'info' | 'warning' | 'critical' }

export default async function SitesPage() {
  const sb = supabaseAdmin()
  const [sitesRes, alarmsRes, devicesRes] = await Promise.all([
    sb.from('sites').select('id,name,city,gps_lat,gps_lng,peak_power_kwp,client_name').order('name'),
    sb.from('alarms').select('site_id,severity').eq('status', 'active'),
    sb.from('devices').select('site_id,kind'),
  ])

  const sites = (sitesRes.data ?? []) as SiteRow[]
  const alarms = (alarmsRes.data ?? []) as AlarmRow[]
  const devices = (devicesRes.data ?? []) as Array<{ site_id: string; kind: string }>

  const statusBySite = new Map<string, { status: 'ok' | 'warning' | 'critical'; alarms: number; devices: number }>()
  for (const s of sites) statusBySite.set(s.id, { status: 'ok', alarms: 0, devices: 0 })
  for (const a of alarms) {
    if (!a.site_id) continue
    const entry = statusBySite.get(a.site_id)
    if (!entry) continue
    entry.alarms += 1
    if (a.severity === 'critical') entry.status = 'critical'
    else if (a.severity === 'warning' && entry.status !== 'critical') entry.status = 'warning'
  }
  for (const d of devices) {
    const entry = statusBySite.get(d.site_id)
    if (entry) entry.devices += 1
  }

  const markers: SiteMarker[] = sites.map((s) => {
    const st = statusBySite.get(s.id)!
    return {
      id: s.id,
      name: s.name,
      city: s.city,
      gps_lat: s.gps_lat,
      gps_lng: s.gps_lng,
      peakKwp: s.peak_power_kwp,
      status: st.status,
      activeAlarms: st.alarms,
    }
  })

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Site-uri monitorizate</h1>
        <p className="text-sm text-zinc-500">{sites.length} centrale PV pe teritoriul României · {sites.reduce((sum, s) => sum + s.peak_power_kwp, 0).toFixed(1)} kWp instalat total</p>
      </header>

      <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-sm font-medium text-zinc-500">Hartă România</h2>
          <div className="flex items-center gap-3 text-xs">
            <LegendDot color="bg-green-500" label="OK" />
            <LegendDot color="bg-amber-500" label="warning" />
            <LegendDot color="bg-red-500" label="critic" />
          </div>
        </div>
        <SitesMap markers={markers} />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites.map((site) => {
          const st = statusBySite.get(site.id)!
          return (
            <Link
              key={site.id}
              href={`/sites/${site.id}`}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-sm group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">{site.name}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">{site.city} · {site.peak_power_kwp} kWp</p>
                  {site.client_name && <p className="text-xs text-zinc-400 mt-0.5">{site.client_name}</p>}
                </div>
                <StatusBadge status={st.status} count={st.alarms} />
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                <span>{st.devices} device-uri</span>
                <span className="text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">deschide ›</span>
              </div>
            </Link>
          )
        })}
      </section>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
      <span className={`w-2.5 h-2.5 rounded-full ${color}`}></span>
      {label}
    </span>
  )
}

function StatusBadge({ status, count }: { status: 'ok' | 'warning' | 'critical'; count: number }) {
  if (status === 'ok') {
    return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 uppercase">OK</span>
  }
  const color = status === 'critical' ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
  return <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${color} uppercase`}>{count} alarm{count === 1 ? 'ă' : 'e'}</span>
}
