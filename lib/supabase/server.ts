import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Supabase client legat de cookie-urile request-ului (sesiune autentificată).
 * Folosit în Server Components, Server Actions și Route Handlers ca să citească
 * sesiunea utilizatorului din cookie-ul httpOnly setat la login.
 */
export async function createSupabaseServer() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // În Server Components scrierea de cookie-uri aruncă — e ok, sesiunea
          // se reîmprospătează din proxy. Prindem și ignorăm.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            /* called from a Server Component — refresh handled by proxy */
          }
        },
      },
    }
  )
}
