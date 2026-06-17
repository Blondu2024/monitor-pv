'use client'

import { useActionState } from 'react'
import { updateDeviceSettings, type DeviceSettings, type SettingsState } from '@/lib/device-settings'

type Kind = 'inverter' | 'meter' | 'battery'

export default function DeviceSettingsForm({
  deviceId,
  kind,
  settings,
}: {
  deviceId: string
  kind: Kind
  settings: DeviceSettings
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateDeviceSettings, undefined)

  if (kind === 'meter') {
    return (
      <p className="text-sm text-zinc-500">
        Contoarele de energie sunt dispozitive de măsurare (read-only) și nu expun parametri de control.
      </p>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="deviceId" value={deviceId} />
      {/* câmpurile irelevante kind-ului sunt trimise cu valorile curente ca să respecte schema */}

      {kind === 'inverter' ? (
        <>
          <fieldset className="flex flex-col gap-4">
            <legend className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">Control putere</legend>
            <Field label="Limitare putere activă" unit="%" name="active_power_limit_pct" type="number" defaultValue={settings.active_power_limit_pct} min={0} max={100} step={1} hint="Plafon producție (P-limit). 100% = fără limitare." />
            <Field label="Factor de putere (cos φ)" unit="" name="power_factor" type="number" defaultValue={settings.power_factor} min={0.8} max={1} step={0.01} hint="0.80–1.00. Controlează puterea reactivă injectată." />
            <Field label="Limită injecție rețea" unit="kW" name="export_limit_kw" type="number" defaultValue={settings.export_limit_kw ?? ''} min={0} step={0.1} hint="Gol = fără limită (zero-export dezactivat)." optional />
            <Select label="Mod putere reactivă" name="reactive_power_mode" defaultValue={settings.reactive_power_mode} options={[['off', 'Dezactivat'], ['fixed_pf', 'cos φ fix'], ['q_u', 'Q(U) — reglaj tensiune']]} />
          </fieldset>

          <fieldset className="flex flex-col gap-4">
            <legend className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">Praguri protecție rețea (EN 50549)</legend>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tensiune min" unit="V" name="grid_voltage_min_v" type="number" defaultValue={settings.grid_voltage_min_v} min={150} max={240} step={1} />
              <Field label="Tensiune max" unit="V" name="grid_voltage_max_v" type="number" defaultValue={settings.grid_voltage_max_v} min={240} max={300} step={1} />
              <Field label="Frecvență min" unit="Hz" name="grid_freq_min_hz" type="number" defaultValue={settings.grid_freq_min_hz} min={47} max={50} step={0.1} />
              <Field label="Frecvență max" unit="Hz" name="grid_freq_max_hz" type="number" defaultValue={settings.grid_freq_max_hz} min={50} max={53} step={0.1} />
            </div>
          </fieldset>
          {/* baterie: trimitem default-urile ca hidden ca să satisfacă schema */}
          <input type="hidden" name="soc_min_pct" value={settings.soc_min_pct} />
          <input type="hidden" name="soc_max_pct" value={settings.soc_max_pct} />
          <input type="hidden" name="battery_mode" value={settings.battery_mode} />
        </>
      ) : (
        <>
          <fieldset className="flex flex-col gap-4">
            <legend className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">Management baterie</legend>
            <div className="grid grid-cols-2 gap-3">
              <Field label="SOC minim" unit="%" name="soc_min_pct" type="number" defaultValue={settings.soc_min_pct} min={0} max={100} step={1} hint="Sub acest nivel bateria nu se mai descarcă." />
              <Field label="SOC maxim" unit="%" name="soc_max_pct" type="number" defaultValue={settings.soc_max_pct} min={0} max={100} step={1} hint="Peste acest nivel se oprește încărcarea." />
            </div>
            <Select label="Mod de operare" name="battery_mode" defaultValue={settings.battery_mode} options={[['auto', 'Automat (auto-consum)'], ['forced_charge', 'Încărcare forțată'], ['forced_discharge', 'Descărcare forțată'], ['idle', 'Inactiv']]} />
          </fieldset>
          {/* invertor: hidden defaults pt schema */}
          <input type="hidden" name="active_power_limit_pct" value={settings.active_power_limit_pct} />
          <input type="hidden" name="power_factor" value={settings.power_factor} />
          <input type="hidden" name="export_limit_kw" value={settings.export_limit_kw ?? ''} />
          <input type="hidden" name="reactive_power_mode" value={settings.reactive_power_mode} />
          <input type="hidden" name="grid_voltage_min_v" value={settings.grid_voltage_min_v} />
          <input type="hidden" name="grid_voltage_max_v" value={settings.grid_voltage_max_v} />
          <input type="hidden" name="grid_freq_min_hz" value={settings.grid_freq_min_hz} />
          <input type="hidden" name="grid_freq_max_hz" value={settings.grid_freq_max_hz} />
        </>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium text-sm px-4 py-2.5 transition-colors"
        >
          {pending ? 'Se salvează…' : 'Salvează parametrii'}
        </button>
        {state?.ok ? <span className="text-sm text-green-600 dark:text-green-400">✓ Parametri salvați și aplicați</span> : null}
        {state?.error ? <span className="text-sm text-red-600 dark:text-red-400">{state.error}</span> : null}
      </div>
    </form>
  )
}

function Field({
  label,
  unit,
  name,
  type,
  defaultValue,
  min,
  max,
  step,
  hint,
  optional,
}: {
  label: string
  unit: string
  name: string
  type: string
  defaultValue: number | string
  min?: number
  max?: number
  step?: number
  hint?: string
  optional?: boolean
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label} {unit ? <span className="text-zinc-400 font-normal">({unit})</span> : null}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        min={min}
        max={max}
        step={step}
        required={!optional}
        className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
      />
      {hint ? <span className="text-[11px] text-zinc-400">{hint}</span> : null}
    </label>
  )
}

function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string
  name: string
  defaultValue: string
  options: Array<[string, string]>
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
      >
        {options.map(([val, lbl]) => (
          <option key={val} value={val}>
            {lbl}
          </option>
        ))}
      </select>
    </label>
  )
}
