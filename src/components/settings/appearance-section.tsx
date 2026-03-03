'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useProfileStore } from '@/stores/profile-store'
import { toast } from 'sonner'
import { Loader2, Moon, Sun, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BadgeFramePicker } from '@/components/settings/badge-frame-picker'

interface OwnedTheme {
  id: string
  name: string
  icon: string
  shortName: string | null
}

const THEME_PREVIEWS: Record<string, { label: string; color: string }> = {
  classic: { label: 'Classic', color: 'bg-neutral-800' },
  midnight: { label: 'Midnight Blue', color: 'bg-blue-800' },
  sunset: { label: 'Sunset Orange', color: 'bg-orange-700' },
  forest: { label: 'Forest Green', color: 'bg-green-800' },
}

export function AppearanceSection() {
  const { theme: colorMode, setTheme: setColorMode } = useTheme()
  const activeTheme = useProfileStore((s) => s.activeTheme)
  const setActiveTheme = useProfileStore((s) => s.setActiveTheme)
  const [ownedThemes, setOwnedThemes] = useState<OwnedTheme[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isApplying, setIsApplying] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    async function fetchOwnedThemes() {
      try {
        const res = await fetch('/api/shop/items')
        const json = await res.json()
        if (json.data) {
          const themes: OwnedTheme[] = json.data
            .filter((item: { category: string; owned: boolean }) => item.category === 'theme' && item.owned)
            .map((item: { id: string; name: string; icon: string }) => ({
              id: item.id,
              name: item.name,
              icon: item.icon,
              shortName: item.id.replace('theme_', ''),
            }))
          setOwnedThemes(themes)
        }
      } catch {
        // Silently fail — user can still use classic theme
      } finally {
        setIsLoading(false)
      }
    }

    fetchOwnedThemes()
  }, [])

  async function handleThemeSelect(shortName: string | null) {
    const previousTheme = activeTheme
    setIsApplying(shortName ?? 'classic')

    try {
      const res = await fetch('/api/profile/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: shortName }),
      })
      const json = await res.json()

      if (json.data?.success) {
        setActiveTheme(shortName)
        if (shortName) {
          document.documentElement.setAttribute('data-theme', shortName)
        } else {
          document.documentElement.removeAttribute('data-theme')
        }
        const label = shortName ? THEME_PREVIEWS[shortName]?.label ?? shortName : 'Classic'
        toast.success(`Theme changed to ${label}`)
      } else if (json.error) {
        toast.error(json.error)
        // Revert on failure
        setActiveTheme(previousTheme)
      }
    } catch {
      toast.error('Failed to change theme')
      setActiveTheme(previousTheme)
    } finally {
      setIsApplying(null)
    }
  }

  const allThemes: { shortName: string | null; label: string; icon: string; color: string }[] = [
    { shortName: null, label: 'Classic', icon: '🎨', color: THEME_PREVIEWS.classic.color },
    ...ownedThemes.map((t) => ({
      shortName: t.shortName,
      label: t.name,
      icon: t.icon,
      color: THEME_PREVIEWS[t.shortName ?? '']?.color ?? 'bg-neutral-700',
    })),
  ]

  if (!mounted) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Appearance
        </CardTitle>
        <CardDescription>Customize the look and feel of the app</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dark / Light Mode Toggle */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Color Mode</label>
          <div className="flex gap-2">
            <button
              onClick={() => setColorMode('light')}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                colorMode === 'light'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:bg-accent'
              )}
            >
              <Sun className="h-4 w-4" />
              Light
            </button>
            <button
              onClick={() => setColorMode('dark')}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                colorMode === 'dark'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:bg-accent'
              )}
            >
              <Moon className="h-4 w-4" />
              Dark
            </button>
          </div>
        </div>

        {/* Theme Picker */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Theme</label>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading themes...
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {allThemes.map((t) => {
                const isActive = activeTheme === t.shortName
                const isCurrentlyApplying = isApplying === (t.shortName ?? 'classic')

                return (
                  <button
                    key={t.shortName ?? 'classic'}
                    onClick={() => handleThemeSelect(t.shortName)}
                    disabled={isActive || isApplying !== null}
                    className={cn(
                      'relative flex flex-col items-center gap-2 rounded-lg border p-4 text-sm font-medium transition-colors',
                      isActive
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-accent',
                      (isActive || isApplying !== null) && 'cursor-default'
                    )}
                  >
                    <div className={cn('h-8 w-8 rounded-full', t.color)} />
                    <span className="text-xs">{t.label}</span>
                    {isCurrentlyApplying && (
                      <Loader2 className="absolute top-2 right-2 h-3 w-3 animate-spin" />
                    )}
                    {isActive && !isCurrentlyApplying && (
                      <span className="absolute top-2 right-2 text-[10px] text-primary font-semibold">
                        Active
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
          {!isLoading && ownedThemes.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Purchase themes from the Token Shop to unlock more options.
            </p>
          )}
        </div>

        {/* Badge Frame Picker */}
        <BadgeFramePicker />
      </CardContent>
    </Card>
  )
}
