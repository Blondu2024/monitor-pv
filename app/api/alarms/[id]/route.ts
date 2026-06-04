import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Body = { action: 'acknowledge' | 'clear' }

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = (await req.json().catch(() => null)) as Body | null
  if (!body || (body.action !== 'acknowledge' && body.action !== 'clear')) {
    return NextResponse.json({ error: 'invalid action' }, { status: 400 })
  }

  const sb = supabaseAdmin()
  const now = new Date().toISOString()
  const update =
    body.action === 'acknowledge'
      ? { status: 'acknowledged', acknowledged_at: now }
      : { status: 'cleared', cleared_at: now }

  const res = await sb.from('alarms').update(update).eq('id', id).select('id,status').maybeSingle()
  if (res.error) return NextResponse.json({ error: res.error.message }, { status: 500 })
  if (!res.data) return NextResponse.json({ error: 'alarm not found' }, { status: 404 })

  return NextResponse.json({ ok: true, alarm: res.data })
}
