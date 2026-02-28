'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { ChartDataPoint } from '@/types'
import type { TimeRange, ChartType } from '@/types/market'

const TIME_RANGES: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL']

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

  useEffect(() => {
    setIsLoading(true)
    fetch(`/api/market/chart/${ticker}?range=${range}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json.data ?? [])
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [ticker, range])

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return

    let cancelled = false
    let observer: ResizeObserver | null = null

    async function renderChart() {
      const { createChart, ColorType } = await import('lightweight-charts')
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
        width: chartContainerRef.current.clientWidth,
        height: window.innerWidth < 768 ? 300 : 400,
        timeScale: { borderColor },
        rightPriceScale: { borderColor },
      })

      chartRef.current = chart

      const chartData = data.map((d) => ({
        time: (typeof d.time === 'number' ? d.time : d.time) as Time,
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

      chart.timeScale().fitContent()

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
        chartRef.current.remove()
        chartRef.current = null
      }
    }
  }, [data, chartType])

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
        <div ref={chartContainerRef} className="w-full h-[300px] md:h-[400px]" />
      )}
    </div>
  )
}
