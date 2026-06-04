'use client'

import { useEffect, useRef, useState } from 'react'

export type LiveData = {
  now: number
  totalPowerKw: number
  totalEnergyTodayKwh: number
  performanceRatioPct: number | null
  activeAlarms: number
  irradianceWm2: number
  ambientTempC: number
  perSite: Array<{ id: string; name: string; powerKw: number; energyKwh: number; peakKwp: number }>
}

type Tick = { ts: number; powerKw: number }

export default function LiveDashboard({ initial }: { initial: LiveData }) {
  const [data, setData] = useState<LiveData>(initial)
  const [ticks, setTicks] = useState<Tick[]>([{ ts: initial.now, powerKw: initial.totalPowerKw }])
  const [secondsAgo, setSecondsAgo] = useState(0)
  const lastFetchRef = useRef<number>(initial.now)

  useEffect(() => {
    let cancelled = false
    const poll = async () => {
      try {
        const res = await fetch('/api/live', { cache: 'no-store' })
        if (!res.ok || cancelled) return
        const d = (await res.json()) as LiveData
        if (cancelled) return
        setData(d)
        lastFetchRef.current = d.now
        setTicks((prev) => {
          const next = [...prev, { ts: d.now, powerKw: d.totalPowerKw }]
          return next.slice(-60)
        })
      } catch {}
    }
    void poll()
    const interval = setInterval(poll, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastFetchRef.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const prCritical = data.performanceRatioPct != null && data.performanceRatioPct < 80

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 text-xs flex-wrap">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-green-700 dark:text-green-400 font-medium">LIVE</span>
        <span className="text-zinc-500">· refresh 5s · ultimul tick {secondsAgo}s ago</span>
        <span className="text-zinc-500">· iradianță {data.irradianceWm2} W/m²</span>
        <span className="text-zinc-500">· ambient {data.ambientTempC}°C</span>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Kpi label="Producție azi" value={data.totalEnergyTodayKwh.toFixed(1)} unit="kWh" color="amber" />
        <Kpi label="Putere acum" value={data.totalPowerKw.toFixed(1)} unit="kW" color="green" />
        <Kpi
          label="Performance Ratio"
          tooltip="Raport între producția reală și producția estimată din modelul PVGIS pentru aceleași condiții (iradianță, temperatură, geometrie). Sub 80% = posibilă problemă: murdărie panouri, umbrire, defect string."
          value={data.performanceRatioPct != null ? `${data.performanceRatioPct}` : '—'}
          unit={data.performanceRatioPct != null ? '%' : 'noaptea'}
          color={prCritical ? 'red' : 'blue'}
        />
        <Kpi label="Alarme active" value={`${data.activeAlarms}`} unit={data.activeAlarms === 1 ? 'alarmă' : 'alarme'} color={data.activeAlarms > 0 ? 'red' : 'zinc'} />
      </section>

      <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-zinc-500">Putere live · ultimele {ticks.length * 5}s</h2>
          <span className="text-xs text-zinc-400 tabular-nums">{data.totalPowerKw.toFixed(1)} kW</span>
        </div>
        <LiveSparkline ticks={ticks} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {data.perSite.map((s) => (
          <SiteCardLive key={s.id} site={s} />
        ))}
      </section>
    </div>
  )
}

function Kpi({ label, value, unit, color, tooltip }: { label: string; value: string; unit: string; color: 'amber' | 'green' | 'blue' | 'red' | 'zinc'; tooltip?: string }) {
  const colorMap = {
    amber: 'text-amber-600 dark:text-amber-400',
    green: 'text-green-600 dark:text-green-400',
    blue: 'text-blue-600 dark:text-blue-400',
    red: 'text-red-600 dark:text-red-400',
    zinc: 'text-zinc-600 dark:text-zinc-400',
  } as const
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 relative group">
      <p className="text-xs text-zinc-500 uppercase tracking-wide flex items-center gap-1">
        {label}
        {tooltip && (
          <span
            title={tooltip}
            className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 text-[9px] font-bold cursor-help"
          >
            i
          </span>
        )}
      </p>
      <p className={`mt-2 text-3xl font-semibold tabular-nums ${colorMap[color]}`}>
        {value}<span className="ml-1 text-base font-normal text-zinc-500">{unit}</span>
      </p>
    </div>
  )
}

function SiteCardLive({ site }: { site: { id: string; name: string; powerKw: number; energyKwh: number; peakKwp: number } }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      <h3 className="font-medium text-sm">{site.name}</h3>
      <p className="text-xs text-zinc-500 mt-0.5">{site.peakKwp} kWp instalat</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[11px] text-zinc-500 uppercase">Putere</p>
          <p className="text-lg font-semibold tabular-nums">{site.powerKw.toFixed(1)} <span className="text-xs font-normal text-zinc-500">kW</span></p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-500 uppercase">Azi</p>
          <p className="text-lg font-semibold tabular-nums">{site.energyKwh.toFixed(1)} <span className="text-xs font-normal text-zinc-500">kWh</span></p>
        </div>
      </div>
    </div>
  )
}

function LiveSparkline({ ticks }: { ticks: Tick[] }) {
  if (ticks.length < 2) {
    return <div className="h-24 flex items-center justify-center text-xs text-zinc-400">Așteaptă date live...</div>
  }
  const width = 100
  const height = 100
  const max = Math.max(0.5, ...ticks.map((t) => t.powerKw))
  const pts = ticks.map((t, i) => {
    const x = (i / (ticks.length - 1)) * width
    const y = height - (t.powerKw / max) * (height * 0.85) - 8
    return { x, y }
  })
  const pathD = 'M ' + pts.map((p) => `${p.x},${p.y}`).join(' L ')
  const fillD = `${pathD} L ${width},${height} L 0,${height} Z`
  const last = pts[pts.length - 1]
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-24">
      <defs>
        <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(34,197,94)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="rgb(34,197,94)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill="url(#sparkfill)" />
      <path d={pathD} fill="none" stroke="rgb(34,197,94)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <circle cx={last.x} cy={last.y} r="2.5" fill="rgb(34,197,94)" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
