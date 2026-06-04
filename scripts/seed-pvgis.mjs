// Seed Monitor-PV cu date reale PVGIS (JRC EU) pentru 3 site-uri RO,
// 4 device-uri/site (2 invertoare + 1 contor + 1 baterie), 30 zile orare.
// Rulare: node --env-file=.env.local scripts/seed-pvgis.mjs

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Lipsesc NEXT_PUBLIC_SUPABASE_URL sau SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const SITES = [
  {
    name: 'Galați — Centrala PV Demonstrativă 1',
    address: 'Strada Brăilei 169',
    city: 'Galați',
    gps_lat: 45.4353,
    gps_lng: 28.0080,
    peak_power_kwp: 7.2,
    client_name: 'SC Solar Galați SRL',
    commissioned_at: '2024-03-15',
  },
  {
    name: 'București — Hală Industrială PV-2',
    address: 'Bd. Theodor Pallady 42',
    city: 'București',
    gps_lat: 44.4268,
    gps_lng: 26.1025,
    peak_power_kwp: 10.0,
    client_name: 'TechHub București SA',
    commissioned_at: '2024-07-22',
  },
  {
    name: 'Cluj — Centrală Acoperiș PV-3',
    address: 'Calea Turzii 178',
    city: 'Cluj-Napoca',
    gps_lat: 46.7712,
    gps_lng: 23.6236,
    peak_power_kwp: 5.5,
    client_name: 'Cluj Industries SRL',
    commissioned_at: '2024-05-10',
  },
]

const DEVICE_TEMPLATES = [
  {
    kind: 'inverter',
    manufacturer: 'Huawei',
    model: 'SUN2000-6KTL-M1',
    modbus_slave_id: 1,
    serial_prefix: 'HWS2000',
  },
  {
    kind: 'inverter',
    manufacturer: 'Growatt',
    model: 'MIN 6000TL-X',
    modbus_slave_id: 2,
    serial_prefix: 'GRWMIN',
  },
  {
    kind: 'meter',
    manufacturer: 'Chint',
    model: 'DTSU666-H',
    modbus_slave_id: 3,
    serial_prefix: 'DTSU',
  },
  {
    kind: 'battery',
    manufacturer: 'Huawei',
    model: 'LUNA2000-10kWh',
    modbus_slave_id: 4,
    serial_prefix: 'LUNA',
  },
]

const PVGIS_YEAR = 2023
const HOURS_TO_SEED = 30 * 24

function sbHeaders() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  }
}

async function sbInsert(table, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: sbHeaders(),
    body: JSON.stringify(rows),
  })
  if (!res.ok) {
    throw new Error(`Supabase ${table} insert ${res.status}: ${(await res.text()).slice(0, 500)}`)
  }
  return res.json()
}

async function sbDeleteAll(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=not.is.null`, {
    method: 'DELETE',
    headers: sbHeaders(),
  })
  if (!res.ok && res.status !== 404) {
    throw new Error(`Supabase ${table} delete ${res.status}: ${(await res.text()).slice(0, 200)}`)
  }
}

async function sbDeleteAllBy(table, key) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${key}=not.is.null`, {
    method: 'DELETE',
    headers: sbHeaders(),
  })
  if (!res.ok && res.status !== 404) {
    throw new Error(`Supabase ${table} delete ${res.status}: ${(await res.text()).slice(0, 200)}`)
  }
}

const MEASUREMENT_COLUMNS = [
  'device_id', 'ts',
  'ac_power_w', 'dc_power_w', 'ac_voltage_v', 'ac_current_a', 'ac_frequency_hz',
  'energy_today_wh', 'energy_total_wh',
  'module_temp_c', 'ambient_temp_c', 'irradiance_wm2', 'wind_speed_ms',
  'grid_import_w', 'grid_export_w',
  'soc_percent', 'battery_power_w', 'battery_voltage_v',
]

function fullMeasurementRow(partial) {
  const row = {}
  for (const k of MEASUREMENT_COLUMNS) row[k] = partial[k] ?? null
  return row
}

async function sbInsertChunked(table, rows, chunk = 500) {
  const all = []
  for (let i = 0; i < rows.length; i += chunk) {
    const part = rows.slice(i, i + chunk)
    const inserted = await sbInsert(table, part)
    all.push(...inserted)
    process.stdout.write(`  ${table}: ${all.length}/${rows.length}\r`)
  }
  console.log(`  ${table}: ${all.length} inserate                    `)
  return all
}

async function fetchPvgisHourly(site) {
  const params = new URLSearchParams({
    lat: String(site.gps_lat),
    lon: String(site.gps_lng),
    pvcalculation: '1',
    peakpower: String(site.peak_power_kwp),
    loss: '14',
    outputformat: 'json',
    startyear: String(PVGIS_YEAR),
    endyear: String(PVGIS_YEAR),
  })
  const url = `https://re.jrc.ec.europa.eu/api/v5_3/seriescalc?${params}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`PVGIS ${res.status} pt ${site.city}: ${(await res.text()).slice(0, 300)}`)
  const data = await res.json()
  return data.outputs.hourly
}

function parsePvgisTime(time) {
  const y = Number(time.slice(0, 4))
  const mo = Number(time.slice(4, 6))
  const d = Number(time.slice(6, 8))
  const h = Number(time.slice(9, 11))
  const mi = Number(time.slice(11, 13))
  return new Date(Date.UTC(y, mo - 1, d, h, mi))
}

function buildMeasurementsForSite(site, devices, pvgisHours) {
  const recent = pvgisHours.slice(-HOURS_TO_SEED)
  if (recent.length === 0) throw new Error(`PVGIS gol pt ${site.city}`)

  const lastPvgisHour = parsePvgisTime(recent[recent.length - 1].time).getTime()
  const now = Date.now()
  const nowHour = Math.floor(now / 3_600_000) * 3_600_000
  const shift = nowHour - lastPvgisHour

  const inv1 = devices.find((d) => d.manufacturer === 'Huawei' && d.kind === 'inverter')
  const inv2 = devices.find((d) => d.manufacturer === 'Growatt' && d.kind === 'inverter')
  const meter = devices.find((d) => d.kind === 'meter')
  const battery = devices.find((d) => d.kind === 'battery')

  const rows = []
  let energyTodayInv1 = 0
  let energyTodayInv2 = 0
  let energyTotalInv1 = site.peak_power_kwp * 1200 * 1000 * 0.5
  let energyTotalInv2 = site.peak_power_kwp * 1200 * 1000 * 0.5
  let prevDay = -1
  let soc = 50

  for (const h of recent) {
    const tsUtc = parsePvgisTime(h.time).getTime() + shift
    const ts = new Date(tsUtc).toISOString()
    const localHour = new Date(tsUtc).getUTCHours()
    const localDay = new Date(tsUtc).getUTCDate()
    if (localDay !== prevDay) {
      energyTodayInv1 = 0
      energyTodayInv2 = 0
      prevDay = localDay
    }

    const totalAcW = Number(h.P) || 0
    const irrad = Number(h['G(i)']) || 0
    const ambient = Number(h.T2m) || 15
    const wind = Number(h.WS10m) || 0
    const moduleTemp = ambient + irrad * 0.028

    const jitter1 = 0.97 + (Math.sin(tsUtc / 3_600_000) + 1) * 0.03
    const jitter2 = 2 - jitter1
    const inv1Ac = totalAcW * 0.5 * jitter1
    const inv2Ac = totalAcW * 0.5 * jitter2
    const eff = 0.955
    const inv1Dc = inv1Ac > 0 ? inv1Ac / eff : 0
    const inv2Dc = inv2Ac > 0 ? inv2Ac / eff : 0
    const voltage = 228 + Math.sin(tsUtc / 1_800_000) * 6
    const freq = 50 + Math.sin(tsUtc / 900_000) * 0.08

    energyTodayInv1 += inv1Ac
    energyTodayInv2 += inv2Ac
    energyTotalInv1 += inv1Ac
    energyTotalInv2 += inv2Ac

    rows.push(fullMeasurementRow({
      device_id: inv1.id,
      ts,
      ac_power_w: round(inv1Ac, 1),
      dc_power_w: round(inv1Dc, 1),
      ac_voltage_v: round(voltage, 2),
      ac_current_a: round(inv1Ac / voltage, 2),
      ac_frequency_hz: round(freq, 3),
      energy_today_wh: round(energyTodayInv1, 0),
      energy_total_wh: round(energyTotalInv1, 0),
      module_temp_c: inv1Ac > 0 ? round(moduleTemp, 1) : round(ambient, 1),
      ambient_temp_c: round(ambient, 1),
      irradiance_wm2: round(irrad, 0),
      wind_speed_ms: round(wind, 1),
    }))

    rows.push(fullMeasurementRow({
      device_id: inv2.id,
      ts,
      ac_power_w: round(inv2Ac, 1),
      dc_power_w: round(inv2Dc, 1),
      ac_voltage_v: round(voltage + 0.5, 2),
      ac_current_a: round(inv2Ac / voltage, 2),
      ac_frequency_hz: round(freq, 3),
      energy_today_wh: round(energyTodayInv2, 0),
      energy_total_wh: round(energyTotalInv2, 0),
      module_temp_c: inv2Ac > 0 ? round(moduleTemp + 1.2, 1) : round(ambient, 1),
      ambient_temp_c: round(ambient, 1),
      irradiance_wm2: round(irrad, 0),
      wind_speed_ms: round(wind, 1),
    }))

    const totalProductionW = inv1Ac + inv2Ac
    const householdLoadW = householdLoadByHour(localHour, site.peak_power_kwp)
    const netW = totalProductionW - householdLoadW
    const gridExportW = netW > 0 ? netW : 0
    const gridImportW = netW < 0 ? -netW : 0

    rows.push(fullMeasurementRow({
      device_id: meter.id,
      ts,
      grid_import_w: round(gridImportW, 1),
      grid_export_w: round(gridExportW, 1),
      ac_voltage_v: round(voltage, 2),
      ac_frequency_hz: round(freq, 3),
    }))

    const batteryDeltaW = clamp(netW, -3000, 3000)
    const batteryEnergyWh = batteryDeltaW
    const capacityWh = 10_000
    const newSoc = clamp(soc + (batteryEnergyWh / capacityWh) * 100, 10, 95)
    const batteryPowerW = batteryDeltaW > 0 ? -Math.abs(batteryDeltaW) : Math.abs(batteryDeltaW)
    soc = newSoc

    rows.push(fullMeasurementRow({
      device_id: battery.id,
      ts,
      soc_percent: round(soc, 1),
      battery_power_w: round(batteryPowerW, 1),
      battery_voltage_v: round(48 + (soc - 50) * 0.04, 2),
      module_temp_c: round(ambient + 4, 1),
    }))
  }

  return rows
}

function householdLoadByHour(h, sizeFactor) {
  const baseline = 600 + sizeFactor * 80
  const morningPeak = h >= 6 && h <= 9 ? 1500 : 0
  const eveningPeak = h >= 18 && h <= 22 ? 2200 : 0
  const noise = ((h * 31) % 7) * 60
  return baseline + morningPeak + eveningPeak + noise
}

function fullAlarmRow(p) {
  return {
    site_id: p.site_id ?? null,
    device_id: p.device_id ?? null,
    severity: p.severity,
    code: p.code,
    message: p.message,
    status: p.status ?? 'active',
    created_at: p.created_at ?? new Date().toISOString(),
    acknowledged_at: p.acknowledged_at ?? null,
    acknowledged_by: p.acknowledged_by ?? null,
    cleared_at: p.cleared_at ?? null,
  }
}

function buildSampleAlarms(siteId, devices) {
  const inv1 = devices.find((d) => d.manufacturer === 'Huawei' && d.kind === 'inverter')
  const meter = devices.find((d) => d.kind === 'meter')
  const now = Date.now()
  return [
    fullAlarmRow({
      site_id: siteId,
      device_id: inv1.id,
      severity: 'warning',
      code: 'PERF_LOW',
      message: 'Randament real 76% sub pragul 80% (comparație cu PVGIS).',
      status: 'active',
      created_at: new Date(now - 3 * 3_600_000).toISOString(),
    }),
    fullAlarmRow({
      site_id: siteId,
      device_id: inv1.id,
      severity: 'info',
      code: 'TEMP_HIGH',
      message: 'Temperatura modulului 62°C, aproape de pragul de avertizare (65°C).',
      status: 'acknowledged',
      created_at: new Date(now - 26 * 3_600_000).toISOString(),
      acknowledged_at: new Date(now - 24 * 3_600_000).toISOString(),
    }),
    fullAlarmRow({
      site_id: siteId,
      device_id: meter.id,
      severity: 'critical',
      code: 'GRID_VOLTAGE_HIGH',
      message: 'Tensiune rețea 256V depășește pragul 253V — risc deconectare invertor.',
      status: 'cleared',
      created_at: new Date(now - 5 * 24 * 3_600_000).toISOString(),
      cleared_at: new Date(now - 5 * 24 * 3_600_000 + 1_800_000).toISOString(),
    }),
  ]
}

function round(n, decimals) {
  const f = 10 ** decimals
  return Math.round(n * f) / f
}
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}

async function main() {
  console.log('Step 0/5: Cleanup tabele (idempotent re-run)')
  await sbDeleteAllBy('measurements', 'id')
  await sbDeleteAll('alarms')
  await sbDeleteAllBy('alarm_thresholds', 'site_id')
  await sbDeleteAll('devices')
  await sbDeleteAll('sites')
  console.log('  cleanup ok')

  console.log('Step 1/5: Insert sites')
  const sitesIns = await sbInsert('sites', SITES)

  console.log('Step 2/5: Insert devices + alarm thresholds')
  const allDevicesBySite = {}
  for (const site of sitesIns) {
    const devices = DEVICE_TEMPLATES.map((t, i) => ({
      site_id: site.id,
      kind: t.kind,
      manufacturer: t.manufacturer,
      model: t.model,
      serial_number: `${t.serial_prefix}-${site.id.slice(0, 8)}-${i}`,
      modbus_slave_id: t.modbus_slave_id,
      rated_power_kw: t.kind === 'inverter' ? site.peak_power_kwp / 2 : t.kind === 'battery' ? 5 : null,
      status: 'online',
    }))
    const ins = await sbInsert('devices', devices)
    allDevicesBySite[site.id] = ins
    await sbInsert('alarm_thresholds', [{ site_id: site.id }])
  }
  console.log(`  ${sitesIns.length} site-uri, ${Object.values(allDevicesBySite).flat().length} device-uri, ${sitesIns.length} threshold-uri`)

  console.log('Step 3/5: Pull PVGIS pentru fiecare site (poate dura ~30 sec)')
  const measurementsPerSite = []
  for (const site of sitesIns) {
    process.stdout.write(`  PVGIS ${site.city}... `)
    const hours = await fetchPvgisHourly(site)
    console.log(`${hours.length} ore an ${PVGIS_YEAR}`)
    const devices = allDevicesBySite[site.id]
    measurementsPerSite.push(...buildMeasurementsForSite(site, devices, hours))
  }
  console.log(`  Total măsurători generate: ${measurementsPerSite.length}`)

  console.log('Step 4/5: Insert măsurători în Supabase')
  await sbInsertChunked('measurements', measurementsPerSite, 500)

  console.log('Step 5/5: Insert alarme sample (3/site × 3 site-uri = 9)')
  const alarms = []
  for (const site of sitesIns) {
    alarms.push(...buildSampleAlarms(site.id, allDevicesBySite[site.id]))
  }
  await sbInsert('alarms', alarms)

  console.log('\nSeed completat cu succes.')
}

main().catch((e) => {
  console.error('SEED FAILED:', e)
  process.exit(1)
})
