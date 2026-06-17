'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { supabaseAdmin } from './supabase'
import { createSupabaseServer } from './supabase/server'

export type DeviceSettings = {
  device_id: string
  active_power_limit_pct: number
  power_factor: number
  export_limit_kw: number | null
  reactive_power_mode: 'off' | 'fixed_pf' | 'q_u'
  grid_voltage_min_v: number
  grid_voltage_max_v: number
  grid_freq_min_hz: number
  grid_freq_max_hz: number
  soc_min_pct: number
  soc_max_pct: number
  battery_mode: 'auto' | 'forced_charge' | 'forced_discharge' | 'idle'
  updated_at: string | null
  updated_by: string | null
}

const DEFAULT_SETTINGS: Omit<DeviceSettings, 'device_id'> = {
  active_power_limit_pct: 100,
  power_factor: 1.0,
  export_limit_kw: null,
  reactive_power_mode: 'off',
  grid_voltage_min_v: 207,
  grid_voltage_max_v: 253,
  grid_freq_min_hz: 49.5,
  grid_freq_max_hz: 50.5,
  soc_min_pct: 20,
  soc_max_pct: 95,
  battery_mode: 'auto',
  updated_at: null,
  updated_by: null,
}

/** Citește parametrii unui device; întoarce valorile implicite dacă nu există încă rând. */
export async function loadDeviceSettings(deviceId: string): Promise<DeviceSettings> {
  const sb = supabaseAdmin()
  const { data, error } = await sb.from('device_settings').select('*').eq('device_id', deviceId).maybeSingle()
  if (error) throw error
  if (!data) return { device_id: deviceId, ...DEFAULT_SETTINGS }
  return data as DeviceSettings
}

const SettingsSchema = z
  .object({
    deviceId: z.uuid(),
    active_power_limit_pct: z.coerce.number().min(0).max(100),
    power_factor: z.coerce.number().min(0.8).max(1.0),
    export_limit_kw: z
      .union([z.literal(''), z.coerce.number().min(0)])
      .transform((v) => (v === '' ? null : v)),
    reactive_power_mode: z.enum(['off', 'fixed_pf', 'q_u']),
    grid_voltage_min_v: z.coerce.number().min(150).max(240),
    grid_voltage_max_v: z.coerce.number().min(240).max(300),
    grid_freq_min_hz: z.coerce.number().min(47).max(50),
    grid_freq_max_hz: z.coerce.number().min(50).max(53),
    soc_min_pct: z.coerce.number().min(0).max(100),
    soc_max_pct: z.coerce.number().min(0).max(100),
    battery_mode: z.enum(['auto', 'forced_charge', 'forced_discharge', 'idle']),
  })
  .refine((d) => d.grid_voltage_min_v < d.grid_voltage_max_v, {
    error: 'Tensiunea minimă trebuie să fie sub cea maximă.',
    path: ['grid_voltage_min_v'],
  })
  .refine((d) => d.grid_freq_min_hz < d.grid_freq_max_hz, {
    error: 'Frecvența minimă trebuie să fie sub cea maximă.',
    path: ['grid_freq_min_hz'],
  })
  .refine((d) => d.soc_min_pct < d.soc_max_pct, {
    error: 'SOC minim trebuie să fie sub SOC maxim.',
    path: ['soc_min_pct'],
  })

export type SettingsState = { ok?: boolean; error?: string } | undefined

/** Server Action: salvează parametrii unui device. Necesită sesiune autentificată. */
export async function updateDeviceSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  // Autorizare — server actions se tratează ca endpoint-uri publice (ghid Next.js).
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Nu ești autentificat. Reîncarcă pagina și loghează-te.' }

  const raw = Object.fromEntries(formData.entries())
  const parsed = SettingsSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Valori invalide.' }
  }
  const { deviceId, ...values } = parsed.data

  const sb = supabaseAdmin()
  const { error } = await sb
    .from('device_settings')
    .upsert(
      { device_id: deviceId, ...values, updated_at: new Date().toISOString(), updated_by: user.email },
      { onConflict: 'device_id' }
    )
  if (error) return { error: `Eroare la salvare: ${error.message}` }

  revalidatePath(`/devices/${deviceId}`)
  return { ok: true }
}
