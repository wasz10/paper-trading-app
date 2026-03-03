import { NextRequest, NextResponse } from 'next/server'
import { hmacHex } from '@/lib/crypto'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const sitePassword = process.env.SITE_PASSWORD
    if (!sitePassword) {
      return NextResponse.json({ error: 'Gate not configured' }, { status: 500 })
    }

    // Rate limit by IP — 5 attempts per minute
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const { allowed, retryAfterMs } = checkRateLimit(`gate:${ip}`, 5, 60_000)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
        }
      )
    }

    const body = await request.json()
    const { password } = body

    if (!password || password !== sitePassword) {
      return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
    }

    const cookieValue = await hmacHex(sitePassword, 'paper-trade-gate')

    const response = NextResponse.json({ ok: true })
    response.cookies.set('site-password-ok', cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
