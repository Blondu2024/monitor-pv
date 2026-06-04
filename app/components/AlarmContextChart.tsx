'use client'

import ReactECharts from 'echarts-for-react'

type Point = { ts: string; value: number | null }

type Threshold = {
  label: string
  value: number
  color: 'red' | 'amber' | 'blue'
  style?: 'solid' | 'dashed'
}

export default function AlarmContextChart({
  points,
  metricLabel,
  metricUnit,
  thresholds,
  alarmTs,
}: {
  points: Point[]
  metricLabel: string
  metricUnit: string
  thresholds: Threshold[]
  alarmTs: string
}) {
  const xs = points.map((p) => new Date(p.ts).toLocaleString('ro-RO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }))
  const ys = points.map((p) => (p.value == null ? null : Number(p.value)))

  const colorHex: Record<Threshold['color'], string> = {
    red: '#dc2626',
    amber: '#f59e0b',
    blue: '#3b82f6',
  }

  const markLines = thresholds.map((t) => ({
    yAxis: t.value,
    name: t.label,
    lineStyle: { color: colorHex[t.color], width: 1.5, type: t.style === 'dashed' ? 'dashed' : 'solid' },
    label: { formatter: `${t.label} ${t.value}${metricUnit}`, color: colorHex[t.color], position: 'insideEndTop' as const, fontSize: 10 },
  }))

  const alarmIdx = points.findIndex((p) => p.ts === alarmTs || new Date(p.ts).getTime() >= new Date(alarmTs).getTime())

  const option = {
    grid: { left: 56, right: 24, top: 24, bottom: 56 },
    tooltip: {
      trigger: 'axis',
      formatter: (params: { name: string; value: number }[]) => {
        const p = params[0]
        return `${p.name}<br/><b>${p.value?.toFixed?.(1) ?? '—'} ${metricUnit}</b>`
      },
    },
    xAxis: {
      type: 'category',
      data: xs,
      axisLine: { lineStyle: { color: '#888' } },
      axisLabel: { color: '#888', fontSize: 10, rotate: -45 },
    },
    yAxis: {
      type: 'value',
      name: metricUnit,
      axisLine: { lineStyle: { color: '#888' } },
      axisLabel: { color: '#888', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(128,128,128,0.15)' } },
    },
    series: [
      {
        name: metricLabel,
        type: 'line',
        data: ys,
        smooth: true,
        showSymbol: false,
        connectNulls: false,
        lineStyle: { width: 2, color: '#3b82f6' },
        markLine: {
          symbol: 'none',
          silent: true,
          data: [
            ...markLines,
            ...(alarmIdx >= 0
              ? [{
                  xAxis: xs[alarmIdx],
                  lineStyle: { color: '#dc2626', width: 1, type: 'dotted' as const },
                  label: { formatter: '⚠ alarmă', color: '#dc2626', fontSize: 10, position: 'insideStartTop' as const },
                }]
              : []),
          ],
        },
      },
    ],
  }

  return <ReactECharts option={option} style={{ height: 280, width: '100%' }} notMerge={true} lazyUpdate={true} />
}
