'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function AlarmActions({ alarmId, status }: { alarmId: string; status: 'active' | 'acknowledged' | 'cleared' }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'ack' | 'clear' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handle = async (action: 'acknowledge' | 'clear') => {
    setLoading(action === 'acknowledge' ? 'ack' : 'clear')
    setError(null)
    try {
      const res = await fetch(`/api/alarms/${alarmId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: 'unknown' }))
        setError(j.error || `HTTP ${res.status}`)
      } else {
        router.refresh()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'request failed')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading !== null || status !== 'active'}
          onClick={() => handle('acknowledge')}
          className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {loading === 'ack' ? 'Procesează...' : 'Acknowledge'}
        </button>
        <button
          type="button"
          disabled={loading !== null || status === 'cleared'}
          onClick={() => handle('clear')}
          className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-800 dark:bg-zinc-200 dark:hover:bg-zinc-100 dark:text-zinc-900 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {loading === 'clear' ? 'Procesează...' : 'Clear'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
