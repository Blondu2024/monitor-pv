import { NextResponse } from 'next/server'
import { computeLiveData } from '@/lib/live'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const data = await computeLiveData()
    return NextResponse.json(data)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
