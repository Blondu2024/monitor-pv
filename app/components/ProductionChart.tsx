'use client'

import ReactECharts from 'echarts-for-react'

type Point = { hour: string; power_kw: number }

export default function ProductionChart({ data }: { data: Point[] }) {
  const xs = data.map((p) =>
    new Date(p.hour).toLocaleString('ro-RO', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
  )
  const ys = data.map((p) => p.power_kw)

  const option = {
    grid: { left: 48, right: 24, top: 32, bottom: 48 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: (params: { name: string; value: number }[]) => {
        const p = params[0]
        return `${p.name}<br/><b>${p.value.toFixed(1)} kW</b>`
      },
    },
    xAxis: {
      type: 'category',
      data: xs,
      axisLine: { lineStyle: { color: '#888' } },
      axisLabel: { color: '#888', fontSize: 11, rotate: -45 },
    },
    yAxis: {
      type: 'value',
      name: 'kW',
      axisLine: { lineStyle: { color: '#888' } },
      axisLabel: { color: '#888', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(128,128,128,0.15)' } },
    },
    series: [
      {
        name: 'Producție',
        type: 'line',
        data: ys,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color: '#f59e0b' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(245, 158, 11, 0.35)' },
              { offset: 1, color: 'rgba(245, 158, 11, 0)' },
            ],
          },
        },
      },
    ],
  }

  return <ReactECharts option={option} style={{ height: 320, width: '100%' }} notMerge={true} lazyUpdate={true} />
}
