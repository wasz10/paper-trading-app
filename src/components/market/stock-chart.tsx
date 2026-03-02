'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDollars } from '@/lib/utils'
import type { ChartDataPoint } from '@/types'
import type { TimeRange, ChartType } from '@/types/market'

const TIME_RANGES: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL']
const INTRADAY_RANGES = new Set<TimeRange>(['1D', '1W'])

/** Returns ET offset in hours (-4 for EDT, -5 for EST) */
function getETOffset(date: Date): number {
  const year = date.getUTCFullYear()
  // 2nd Sunday of March (EDT starts at 2 AM EST = 7 AM UTC)
  const mar1 = new Date(Date.UTC(year, 2, 1))
  const marSecondSun = 8 + ((7 - mar1.getUTCDay()) % 7)
  const edtStart = Date.UTC(year, 2, marSecondSun, 7, 0, 0)
  // 1st Sunday of November (EDT ends at 2 AM EDT = 6 AM UTC)
  const nov1 = new Date(Date.UTC(year, 10, 1))
  const novFirstSun = 1 + ((7 - nov1.getUTCDay()) % 7)
  const edtEnd = Date.UTC(year, 10, novFirstSun, 6, 0, 0)

  const ts = date.getTime()
  return ts >= edtStart && ts < edtEnd ? -4 : -5
}

function formatChartTime(time: string | number, range: TimeRange): string {
  if (INTRADAY_RANGES.has(range)) {
    const date = new Date((time as number) * 1000)
    const datePart = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' })
    const timePart = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' })
    return `${datePart}, ${timePart} ET`
  }
  const date = new Date(time as string)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface StockChartProps {
  ticker: string
}

export function StockChart({ ticker }: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof import('lightweight-charts').createChart> | null>(null)
  const [range, setRange] = useState<TimeRange>('1M')
  const [chartType, setChartType] = useState<ChartType>('area')
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hoverInfo, setHoverInfo] = useState<{ price: number; time: string } | null>(null)

  const rangeRef = useRef(range)
  rangeRef.current = range

  const latestPrice = data.length > 0 ? data[data.length - 1].close : null
  const latestTime = data.length > 0 ? formatChartTime(data[data.length - 1].time, range) : ''

  const handleCrosshairMove = useCallback((param: { time?: unknown; seriesData?: Map<unknown, unknown> }) => {
    if (!param.time || !param.seriesData || param.seriesData.size === 0) {
      setHoverInfo(null)
      return
    }

    let price: number | null = null
    for (const val of param.seriesData.values()) {
      const v = val as Record<string, number>
      if (v.close != null) { price = v.close; break }
      if (v.value != null) { price = v.value; break }
    }

    if (price != null) {
      setHoverInfo({
        price,
        time: formatChartTime(param.time as string | number, rangeRef.current),
      })
    }
  }, [])

  useEffect(() => {
    let active = true
    setIsLoading(true)
    const controller = new AbortController()
    fetch(`/api/market/chart/${ticker}?range=${range}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Chart API error: ${res.status}`)
        return res.json()
      })
      .then((json) => {
        if (active) setData(json.data ?? [])
      })
      .catch((err) => {
        if (active && (err as Error).name !== 'AbortError') setData([])
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [ticker, range])

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return

    let cancelled = false
    let observer: ResizeObserver | null = null

    async function renderChart() {
      const { createChart, ColorType, CrosshairMode } = await import('lightweight-charts')
      type Time = import('lightweight-charts').Time

      if (cancelled || !chartContainerRef.current) return

      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }

      const isPositive = data.length >= 2 && data[data.length - 1].close >= data[0].close
      const color = isPositive ? '#22c55e' : '#ef4444'
      const isDark = document.documentElement.classList.contains('dark')
      const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'
      const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
      const textColor = isDark ? '#9ca3af' : '#6b7280'

      const isIntraday = INTRADAY_RANGES.has(rangeRef.current)

      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor,
          attributionLogo: false,
        },
        grid: {
          vertLines: { color: gridColor },
          horzLines: { color: gridColor },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: {
            color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
            style: 3,
            width: 1,
            labelVisible: false,
          },
          horzLine: {
            color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
            style: 3,
            width: 1,
            labelVisible: true,
          },
        },
        width: chartContainerRef.current.clientWidth,
        height: window.innerWidth < 768 ? 300 : 400,
        timeScale: {
          borderColor,
          timeVisible: isIntraday,
          secondsVisible: false,
          ...(isIntraday && {
            tickMarkFormatter: (time: number) => {
              const date = new Date(time * 1000)
              return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                timeZone: 'America/New_York',
              })
            },
          }),
        },
        rightPriceScale: { borderColor },
      })

      chartRef.current = chart

      const chartData = data.map((d) => ({
        time: d.time as Time,
        value: d.close,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }))

      if (chartType === 'candlestick') {
        const series = chart.addCandlestickSeries({
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderUpColor: '#22c55e',
          borderDownColor: '#ef4444',
          wickUpColor: '#22c55e',
          wickDownColor: '#ef4444',
        })
        series.setData(
          chartData
            .filter((d) => d.open != null && d.high != null && d.low != null)
            .map((d) => ({
              time: d.time,
              open: d.open!,
              high: d.high!,
              low: d.low!,
              close: d.close,
            }))
        )
      } else {
        const series = chart.addAreaSeries({
          lineColor: color,
          topColor: `${color}40`,
          bottomColor: `${color}05`,
          lineWidth: 2,
        })
        series.setData(chartData.map((d) => ({ time: d.time, value: d.value })))
      }

      // For 1D, show full trading day (4 AM – 8 PM ET) with empty space for future hours
      if (rangeRef.current === '1D' && data.length > 0) {
        const lastTs = data[data.length - 1].time as number
        const lastDate = new Date(lastTs * 1000)
        const etOffsetHours = getETOffset(lastDate)

        const utcMidnight = Date.UTC(
          lastDate.getUTCFullYear(),
          lastDate.getUTCMonth(),
          lastDate.getUTCDate()
        )
        const dayStartUnix = Math.floor((utcMidnight + (4 - etOffsetHours) * 3600_000) / 1000)
        const dayEndUnix = Math.floor((utcMidnight + (20 - etOffsetHours) * 3600_000) / 1000)

        // Estimate bar interval from data (default 5 min if insufficient data)
        const barInterval = data.length >= 2
          ? Math.abs((data[1].time as number) - (data[0].time as number)) || 300
          : 300

        // Add empty space on the right for remaining hours in the trading day
        const remainingSeconds = dayEndUnix - lastTs
        if (remainingSeconds > 0) {
          const rightOffset = Math.ceil(remainingSeconds / barInterval)
          chart.timeScale().applyOptions({ rightOffset })
        }

        chart.timeScale().setVisibleRange({
          from: dayStartUnix as Time,
          to: dayEndUnix as Time,
        })
      } else {
        chart.timeScale().fitContent()
      }

      chart.subscribeCrosshairMove(handleCrosshairMove)

      observer = new ResizeObserver(() => {
        if (chartContainerRef.current) {
          chart.applyOptions({ width: chartContainerRef.current.clientWidth })
        }
      })
      observer.observe(chartContainerRef.current)
    }

    renderChart()

    return () => {
      cancelled = true
      observer?.disconnect()
      if (chartRef.current) {
        chartRef.current.unsubscribeCrosshairMove(handleCrosshairMove)
        chartRef.current.remove()
        chartRef.current = null
      }
    }
  }, [data, chartType, handleCrosshairMove])

  const displayPrice = hoverInfo ? hoverInfo.price : latestPrice
  const displayTime = hoverInfo ? hoverInfo.time : latestTime

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1">
          {TIME_RANGES.map((r) => (
            <Button
              key={r}
              variant={range === r ? 'default' : 'ghost'}
              size="sm"
              className="h-9 px-2.5 text-xs"
              onClick={() => setRange(r)}
            >
              {r}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 text-xs"
          onClick={() => setChartType(chartType === 'area' ? 'candlestick' : 'area')}
        >
          {chartType === 'area' ? 'Candlestick' : 'Line'}
        </Button>
      </div>
      {isLoading ? (
        <Skeleton className="w-full h-[300px] md:h-[400px]" />
      ) : (
        <div className="relative">
          {displayPrice != null && (
            <div className="absolute top-2 left-2 z-10 pointer-events-none">
              <span className="text-sm font-semibold text-foreground">
                {formatDollars(displayPrice)}
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                {displayTime}
              </span>
            </div>
          )}
          <div ref={chartContainerRef} className="w-full h-[300px] md:h-[400px]" />
        </div>
      )}
    </div>
  )
}
