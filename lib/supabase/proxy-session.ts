import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/** Pagini publice (fără autentificare). Restul aplicației e protejat. */
const PUBLIC_PATHS = [
  '/login',
  '/about',
  '/privacy',
  '/terms',
  '/security',
  '/faq',
  '/api-docs',
  '/ghid',
]

/** Endpoint-uri API publice (cron-ul Vercel se autentifică separat cu Bearer). */
const PUBLIC_API = ['/api/cron']

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) return true
  if (PUBLIC_API.some((p) => pathname.startsWith(p))) return true
  return false
}

/**
 * Reîmprospătează sesiunea Supabase la fiecare request și redirecționează
 * utilizatorii neautentificați către /login pentru rutele protejate.
 *
 * Pattern canonic Supabase SSR adaptat pentru file-convention `proxy.ts`
 * (Next.js 16 a redenumit `middleware` → `proxy`).
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: nu pune cod între createServerClient și getUser() — poate cauza
  // sesiuni greu de depanat (recomandare oficială Supabase).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Neautentificat pe rută protejată → redirect la /login (cu ?next=)
  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    const redirect = NextResponse.redirect(url)
    // păstrează cookie-urile reîmprospătate pe răspunsul de redirect
    supabaseResponse.cookies.getAll().forEach((c) => redirect.cookies.set(c))
    return redirect
  }

  // Autentificat dar pe /login → trimite-l în dashboard
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    const redirect = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((c) => redirect.cookies.set(c))
    return redirect
  }

  return supabaseResponse
}
