'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Target } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useGymAnalytics } from '@/hooks/use-gym-analytics'

interface RetentionRateChartProps {
  gymId: string | null
}

export default function RetentionRateChart({ gymId }: RetentionRateChartProps) {
  const { data: analytics, isLoading, error } = useGymAnalytics(gymId, 30)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Retention Rate
          </CardTitle>
          <CardDescription>Member retention and churn analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Retention Rate
          </CardTitle>
          <CardDescription>Member retention and churn analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>Unable to load chart data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const retentionData = [
    { name: 'Retained', value: analytics.retentionRate, color: '#10b981' },
    { name: 'Churned', value: 100 - analytics.retentionRate, color: '#ef4444' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Retention Rate
        </CardTitle>
        <CardDescription>Member retention and churn analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>Current Retention</span>
            <span className="font-medium">{analytics.retentionRate.toFixed(1)}%</span>
          </div>
          
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={retentionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {retentionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-medium">{analytics.retentionRate.toFixed(1)}%</div>
              <div className="text-muted-foreground">Retained</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-medium">{(100 - analytics.retentionRate).toFixed(1)}%</div>
              <div className="text-muted-foreground">Churned</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
