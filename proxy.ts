import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy-session'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Rulează pe toate rutele EXCEPTÂND:
     * - _next/static (fișiere statice)
     * - _next/image (optimizare imagini)
     * - favicon.ico, icon.svg, fișiere imagine
     * Notă: lăsăm /api în matcher ca să protejăm și endpoint-urile de date;
     * /api/cron e tratat ca public în updateSession (auth Bearer separat).
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
