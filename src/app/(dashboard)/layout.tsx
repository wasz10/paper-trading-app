import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Header } from '@/components/layout/header'
import { ProfileInitializer } from '@/components/layout/profile-initializer'
import { PushPrompt } from '@/components/notifications/push-prompt'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, token_balance')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  return (
    <div className="min-h-screen bg-background">
      <ProfileInitializer
        displayName={profile.display_name}
        tokenBalance={profile.token_balance}
      />
      <Sidebar />
      <div className="md:pl-64">
        <Header />
        <PushPrompt />
        <main className="p-4 md:p-6 pb-20 md:pb-6">{children}</main>
      </div>
      <BottomNav />
    </div>
  )
}
