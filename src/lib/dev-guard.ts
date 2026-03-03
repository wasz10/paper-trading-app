import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Guard for dev panel API routes.
 * Returns null if access is granted, or a NextResponse to send if denied.
 * Also returns the authenticated user ID on success.
 */
export async function checkDevAccess(): Promise<
  | { allowed: true; userId: string }
  | { allowed: false; response: NextResponse }
> {
  if (process.env.DEV_PANEL_ENABLED !== 'true') {
    return {
      allowed: false,
      response: NextResponse.json({ error: 'Dev panel disabled' }, { status: 403 }),
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      allowed: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  // If DEV_ALLOWED_EMAILS is set, restrict to those emails
  const allowedEmails = process.env.DEV_ALLOWED_EMAILS
  if (allowedEmails) {
    const emailList = allowedEmails.split(',').map((e) => e.trim().toLowerCase())
    if (!user.email || !emailList.includes(user.email.toLowerCase())) {
      return {
        allowed: false,
        response: NextResponse.json({ error: 'Dev panel disabled' }, { status: 403 }),
      }
    }
  }

  return { allowed: true, userId: user.id }
}
