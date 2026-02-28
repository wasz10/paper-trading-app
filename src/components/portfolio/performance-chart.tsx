'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function PerformanceChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Portfolio Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-[150px] text-sm text-muted-foreground">
          Portfolio history chart coming soon
        </div>
      </CardContent>
    </Card>
  )
}
