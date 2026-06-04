'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import type { Map as LeafletMap } from 'leaflet'

export type SiteMarker = {
  id: string
  name: string
  gps_lat: number
  gps_lng: number
  status: 'ok' | 'warning' | 'critical'
  peakKwp: number
  activeAlarms: number
  city: string | null
}

const COLOR: Record<SiteMarker['status'], string> = {
  ok: '#22c55e',
  warning: '#f59e0b',
  critical: '#dc2626',
}

export default function SitesMap({ markers }: { markers: SiteMarker[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false
    ;(async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !containerRef.current) return
      const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView([45.95, 25.5], 6.4)
      mapRef.current = map
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 18,
      }).addTo(map)
      for (const m of markers) {
        const color = COLOR[m.status]
        const icon = L.divIcon({
          html: `<span style="display:block;width:20px;height:20px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></span>`,
          className: 'monitor-pv-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })
        const popup = `<div style="font-family:system-ui,sans-serif;min-width:160px"><div style="font-weight:600;font-size:13px;color:#111">${m.name}</div><div style="font-size:11px;color:#666;margin-top:4px">${m.city ?? ''} · ${m.peakKwp} kWp</div><div style="font-size:11px;color:${color};margin-top:6px;font-weight:500">${m.activeAlarms} alarmă${m.activeAlarms === 1 ? '' : 'e'} activă${m.activeAlarms === 1 ? '' : 'e'}</div><a href="/sites/${m.id}" style="display:inline-block;margin-top:8px;font-size:11px;color:#2563eb;text-decoration:underline">deschide detaliile ›</a></div>`
        L.marker([m.gps_lat, m.gps_lng], { icon }).addTo(map).bindPopup(popup)
      }
    })()
    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [markers])

  return <div ref={containerRef} className="h-[420px] w-full rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-0" />
}
