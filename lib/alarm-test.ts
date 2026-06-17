'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from './supabase'
import { createSupabaseServer } from './supabase/server'
import { sendAlertEmail } from './email'

export type TestAlertState = { ok?: boolean; message?: string; error?: string } | undefined

/**
 * Server Action de demonstrație: creează o alarmă critică reală pe un invertor
 * și trimite emailul de alertă. Folosit la susținere ca să arate fluxul complet.
 */
export async function sendTestAlert(): Promise<TestAlertState> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Trebuie să fii autentificat.' }

  const sb = supabaseAdmin()
  const devRes = await sb.from('devices').select('id,site_id,manufacturer,model').eq('kind', 'inverter').limit(1).maybeSingle()
  if (devRes.error || !devRes.data) return { error: 'Nu am găsit un invertor pentru test.' }
  const device = devRes.data

  const siteRes = await sb.from('sites').select('name').eq('id', device.site_id).maybeSingle()
  const siteName = siteRes.data?.name ?? '—'

  const message = 'TEST — Temperatură modul 78.5°C, peste pragul critic (75°C, cap 4.5)'
  const ins = await sb
    .from('alarms')
    .insert({ device_id: device.id, site_id: device.site_id, severity: 'critical', code: 'TEMP_HIGH', message, status: 'active' })
  if (ins.error) return { error: `Eroare la creare alarmă: ${ins.error.message}` }

  const email = await sendAlertEmail({
    severity: 'critical',
    code: 'TEMP_HIGH',
    message,
    siteName,
    deviceName: `${device.manufacturer} ${device.model}`,
    ts: new Date().toISOString(),
  })

  revalidatePath('/')
  return {
    ok: true,
    message: email.ok
      ? 'Alarmă de test creată și email trimis ✓ (verifică inbox-ul)'
      : `Alarmă creată, dar emailul a eșuat: ${email.error}`,
  }
}
