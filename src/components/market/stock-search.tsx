'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Search } from 'lucide-react'
import type { SearchResult } from '@/types'

export function StockSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        })
        if (!res.ok) { setResults([]); return }
        const json = await res.json()
        setResults(json.data ?? [])
        setIsOpen(true)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search stocks..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
          onFocus={() => results.length > 0 && setIsOpen(true)}
        />
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover shadow-md max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-2 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              No results found
            </div>
          ) : (
            results.map((result) => (
              <button
                key={result.ticker}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-accent text-left transition-colors min-h-[44px]"
                onClick={() => {
                  router.push(`/stock/${result.ticker}`)
                  setIsOpen(false)
                  setQuery('')
                }}
              >
                <div className="min-w-0 flex-1">
                  <span className="font-medium">{result.ticker}</span>
                  <span className="ml-2 text-sm text-muted-foreground truncate inline-block max-w-[150px] sm:max-w-[250px] align-bottom">
                    {result.name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{result.exchange}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
