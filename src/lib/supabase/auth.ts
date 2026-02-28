import { createClient } from './client'

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient()
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUpWithEmail(email: string, password: string) {
  const supabase = createClient()
  return supabase.auth.signUp({ email, password })
}

export async function signInWithGoogle() {
  const supabase = createClient()
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/callback`,
    },
  })
}

export async function signOut() {
  const supabase = createClient()
  return supabase.auth.signOut()
}

export async function getUser() {
  const supabase = createClient()
  return supabase.auth.getUser()
}
