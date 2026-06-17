'use client'

import { useEffect, useState } from 'react'
import ReactECharts from 'echarts-for-react'

type SeriesPoint = { label: string; value: number }
type ProductionSeries = {
  range: 'day' | 'week' | 'month' | 'year'
  unit: 'kW' | 'kWh'
  title: string
  source: string
  points: SeriesPoint[]
}

const TABS: Array<{ key: ProductionSeries['range']; label: string }> = [
  { key: 'day', label: 'Orar' },
  { key: 'week', label: 'Săptămânal' },
  { key: 'month', label: 'Lunar' },
  { key: 'year', label: 'Anual' },
]

export default function ProductionRangeChart() {
  const [range, setRange] = useState<ProductionSeries['range']>('day')
  const [series, setSeries] = useState<ProductionSeries | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(`/api/production?range=${range}`)
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(new Error(j.error || 'Eroare')))))
      .then((data: ProductionSeries) => {
        if (!cancelled) setSeries(data)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [range])

  const isPower = series?.unit === 'kW'
  const option = series
    ? {
        grid: { left: 52, right: 24, top: 24, bottom: 56 },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: isPower ? 'cross' : 'shadow' },
          formatter: (params: { name: string; value: number }[]) => {
            const p = params[0]
            return `${p.name}<br/><b>${(p.value ?? 0).toLocaleString('ro-RO')} ${series.unit}</b>`
          },
        },
        xAxis: {
          type: 'category',
          data: series.points.map((p) => p.label),
          axisLine: { lineStyle: { color: '#888' } },
          axisLabel: { color: '#888', fontSize: 11, rotate: series.points.length > 12 ? -45 : 0 },
        },
        yAxis: {
          type: 'value',
          name: series.unit,
          axisLine: { lineStyle: { color: '#888' } },
          axisLabel: { color: '#888', fontSize: 11 },
          splitLine: { lineStyle: { color: 'rgba(128,128,128,0.15)' } },
        },
        series: [
          {
            name: 'Producție',
            type: isPower ? 'line' : 'bar',
            data: series.points.map((p) => p.value),
            smooth: isPower,
            showSymbol: false,
            itemStyle: { color: '#f59e0b', borderRadius: isPower ? 0 : [3, 3, 0, 0] },
            lineStyle: { width: 2, color: '#f59e0b' },
            areaStyle: isPower
              ? {
                  color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                      { offset: 0, color: 'rgba(245, 158, 11, 0.35)' },
                      { offset: 1, color: 'rgba(245, 158, 11, 0)' },
                    ],
                  },
                }
              : undefined,
          },
        ],
      }
    : null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-medium">{series?.title ?? 'Producție'}</h2>
          {series ? (
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Sursă: {series.source}
              {series.source === 'model PVGIS' ? ' (referință 12 luni — măsurători reale doar pe ultimele săptămâni)' : ''}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setRange(t.key)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                range === t.key
                  ? 'bg-white dark:bg-zinc-950 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative" style={{ height: 320 }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-400">Se încarcă…</div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-red-500 text-center px-4">
            Nu s-au putut încărca datele: {error}
          </div>
        ) : option ? (
          <ReactECharts option={option} style={{ height: 320, width: '100%' }} notMerge lazyUpdate />
        ) : null}
      </div>
    </div>
  )
}
