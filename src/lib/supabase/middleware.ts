import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

async function hmacHex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function updateSession(request: NextRequest) {
  // Site password gate — if SITE_PASSWORD is set, require cookie before any other logic
  const sitePassword = process.env.SITE_PASSWORD
  if (sitePassword) {
    const pathname = request.nextUrl.pathname
    if (
      pathname !== '/gate' &&
      !pathname.startsWith('/api/gate') &&
      !pathname.startsWith('/api/cron')
    ) {
      const cookie = request.cookies.get('site-password-ok')?.value
      const expected = await hmacHex(sitePassword, 'paper-trade-gate')
      if (cookie !== expected) {
        return NextResponse.redirect(new URL('/gate', request.url))
      }
    }
  }

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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protected routes — redirect to login if not authenticated
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/explore') ||
    pathname.startsWith('/stock') ||
    pathname.startsWith('/trade') ||
    pathname.startsWith('/rewards') ||
    pathname.startsWith('/leaderboard') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/onboarding')

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect logged-in users away from auth pages
  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup')

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
