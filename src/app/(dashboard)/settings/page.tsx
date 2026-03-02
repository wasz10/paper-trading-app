'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { LogOut, Save, Loader2, GraduationCap } from 'lucide-react'
import type { TutorialStyle } from '@/components/tutorial/tutorial-switcher'

const TUTORIAL_STYLE_OPTIONS: { value: TutorialStyle; label: string }[] = [
  { value: 'checklist', label: 'Dashboard Card' },
  { value: 'walkthrough', label: 'Guided Walkthrough' },
  { value: 'quest-log', label: 'Quest Log' },
  { value: 'banner', label: 'Page Banners' },
  { value: 'off', label: 'Off' },
]

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'America/Anchorage', label: 'Alaska (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HT)' },
]

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [timezone, setTimezone] = useState('America/New_York')
  const [showDisplayName, setShowDisplayName] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [tutorialStyle, setTutorialStyle] = useState<TutorialStyle>('banner')

  // Load tutorial style from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tutorial_style') as TutorialStyle | null
    if (saved && saved !== tutorialStyle) setTutorialStyle(saved)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)

      const { data: profile } = await supabase
        .from('users')
        .select('display_name, timezone, show_display_name')
        .eq('id', user.id)
        .single()

      if (profile) {
        setDisplayName(profile.display_name ?? '')
        setTimezone(profile.timezone ?? 'America/New_York')
        setShowDisplayName(profile.show_display_name ?? true)
      }

      setIsLoading(false)
    }

    loadProfile()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    if (!userId) return

    const trimmedName = displayName.trim()
    if (!trimmedName) {
      toast.error('Display name cannot be empty')
      return
    }

    if (trimmedName.length < 3) {
      toast.error('Display name must be at least 3 characters')
      return
    }

    setIsSaving(true)

    // Check uniqueness
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('display_name', trimmedName)
      .neq('id', userId)
      .single()

    if (existing) {
      toast.error('That display name is already taken')
      setIsSaving(false)
      return
    }

    const { error } = await supabase
      .from('users')
      .update({
        display_name: trimmedName,
        timezone,
        show_display_name: showDisplayName,
      })
      .eq('id', userId)

    setIsSaving(false)

    if (error) {
      toast.error('Failed to save settings')
    } else {
      toast.success('Settings saved')
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your display name and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-medium">
              Display Name
            </label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={20}
              placeholder="Your display name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="timezone" className="text-sm font-medium">
              Timezone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label htmlFor="showLeaderboard" className="text-sm font-medium">
                Show on Leaderboard
              </label>
              <p className="text-xs text-muted-foreground">
                Display your name on the public leaderboard
              </p>
            </div>
            <button
              id="showLeaderboard"
              role="switch"
              aria-checked={showDisplayName}
              onClick={() => setShowDisplayName(!showDisplayName)}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                showDisplayName ? 'bg-primary' : 'bg-input'
              }`}
            >
              <span
                className={`pointer-events-none block h-6 w-6 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                  showDisplayName ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Tutorial Style
          </CardTitle>
          <CardDescription>Choose how tutorial quests appear in the app</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {TUTORIAL_STYLE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  tutorialStyle === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-accent'
                }`}
              >
                <input
                  type="radio"
                  name="tutorial_style"
                  value={option.value}
                  checked={tutorialStyle === option.value}
                  onChange={() => {
                    setTutorialStyle(option.value)
                    localStorage.setItem('tutorial_style', option.value)
                  }}
                  className="sr-only"
                />
                <div
                  className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    tutorialStyle === option.value
                      ? 'border-primary'
                      : 'border-muted-foreground'
                  }`}
                >
                  {tutorialStyle === option.value && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <span className="text-sm font-medium">{option.label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Sign out of your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full"
          >
            {isLoggingOut ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            {isLoggingOut ? 'Signing out...' : 'Sign Out'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
