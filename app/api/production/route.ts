import { NextResponse } from 'next/server'
import { getProduction } from '@/lib/production'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const range = new URL(request.url).searchParams.get('range') ?? 'day'
  try {
    const series = await getProduction(range)
    return NextResponse.json(series)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'eroare' }, { status: 500 })
  }
}
