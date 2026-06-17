import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase client pentru Client Components (browser). Citește/scrie cookie-urile
 * de sesiune din document.cookie. Folosit doar unde avem nevoie de auth pe client.
 */
export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
