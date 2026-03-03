import { NextRequest, NextResponse } from 'next/server'

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

export async function POST(request: NextRequest) {
  try {
    const sitePassword = process.env.SITE_PASSWORD
    if (!sitePassword) {
      return NextResponse.json({ error: 'Gate not configured' }, { status: 500 })
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
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
