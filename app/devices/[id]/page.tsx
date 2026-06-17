import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { loadDeviceSettings } from '@/lib/device-settings'
import DeviceSettingsForm from './DeviceSettingsForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Device = {
  id: string
  site_id: string
  kind: 'inverter' | 'meter' | 'battery'
  manufacturer: string
  model: string
  serial_number: string
  status: 'online' | 'offline' | 'warning' | 'error'
  rated_power_kw: number | null
  modbus_slave_id: number | null
}

const KIND_LABEL: Record<Device['kind'], string> = {
  inverter: 'Invertor',
  meter: 'Contor',
  battery: 'Baterie',
}

export default async function DevicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = supabaseAdmin()

  const deviceRes = await sb
    .from('devices')
    .select('id,site_id,kind,manufacturer,model,serial_number,status,rated_power_kw,modbus_slave_id')
    .eq('id', id)
    .maybeSingle()
  if (deviceRes.error) throw deviceRes.error
  if (!deviceRes.data) notFound()
  const device = deviceRes.data as Device

  const [siteRes, settings] = await Promise.all([
    sb.from('sites').select('id,name,city').eq('id', device.site_id).maybeSingle(),
    loadDeviceSettings(id),
  ])
  const site = siteRes.data as { id: string; name: string; city: string | null } | null

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto px-4 sm:px-8 py-8 gap-6">
      <Link
        href={site ? `/sites/${site.id}` : '/sites'}
        className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 inline-flex items-center gap-1 w-fit"
      >
        ‹ Înapoi la {site?.name ?? 'site-uri'}
      </Link>

      <header className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
              {KIND_LABEL[device.kind]}
            </span>
            <h1 className="text-2xl font-semibold tracking-tight mt-0.5">
              {device.manufacturer} {device.model}
            </h1>
            <p className="text-[11px] text-zinc-500 font-mono mt-1">S/N {device.serial_number}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Modbus slave ID {device.modbus_slave_id ?? '—'}
              {device.rated_power_kw ? ` · ${device.rated_power_kw} kW nominal` : ''}
            </p>
          </div>
          <StatusDot status={device.status} />
        </div>
      </header>

      <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-5">
        <div>
          <h2 className="text-sm font-medium">Parametri dispozitiv</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Setări de control scrise în registrele dispozitivului. Modificările sunt persistate și auditate.
          </p>
        </div>

        <DeviceSettingsForm deviceId={device.id} kind={device.kind} settings={settings} />

        <p className="text-[11px] text-zinc-400 border-t border-zinc-200 dark:border-zinc-800 pt-3">
          {settings.updated_at
            ? `Ultima modificare: ${new Date(settings.updated_at).toLocaleString('ro-RO', { dateStyle: 'short', timeStyle: 'short' })}${settings.updated_by ? ` · de ${settings.updated_by}` : ''}`
            : 'Parametri la valorile implicite (nemodificați încă).'}
        </p>
      </section>

      <aside className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-4 text-xs text-amber-900 dark:text-amber-100 leading-relaxed">
        <span className="font-semibold text-amber-600 dark:text-amber-400">ℹ Notă tehnică</span> — într-o
        integrare reală, salvarea parametrilor declanșează o scriere Modbus (function code 0x10) către
        registrele dispozitivului. În acest demo, valorile sunt persistate în baza de date și ar fi citite de
        worker-ul de polling la următoarea sincronizare.
      </aside>
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    online: 'bg-green-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    offline: 'bg-zinc-400',
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide">
      <span className={`w-2 h-2 rounded-full ${colorMap[status] ?? 'bg-zinc-400'}`}></span>
      {status}
    </span>
  )
}
