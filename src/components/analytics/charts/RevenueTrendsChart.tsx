'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useGymAnalytics } from '@/hooks/use-gym-analytics'

interface RevenueTrendsChartProps {
  gymId: string | null
}

export default function RevenueTrendsChart({ gymId }: RevenueTrendsChartProps) {
  const { data: analytics, isLoading, error } = useGymAnalytics(gymId, 30)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Revenue Trends
          </CardTitle>
          <CardDescription>Monthly recurring revenue and trends</CardDescription>
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
            <DollarSign className="w-5 h-5" />
            Revenue Trends
          </CardTitle>
          <CardDescription>Monthly recurring revenue and trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>Unable to load chart data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Transform revenue trend data
  const revenueData = analytics.revenueTrend.map(item => ({
    month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    revenue: item.amount,
    fullMonth: item.month
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Revenue Trends
        </CardTitle>
        <CardDescription>Monthly recurring revenue and trends</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>Monthly Recurring Revenue</span>
            <span className="font-medium">${analytics.monthlyRecurringRevenue.toLocaleString()}</span>
          </div>
          
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
              />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
                formatter={(value?: number) => value ? [`$${value.toLocaleString()}`, 'Revenue'] : ['$0', 'Revenue']}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.3}
                strokeWidth={2}
                name="Revenue" 
              />
            </AreaChart>
          </ResponsiveContainer>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-medium">${analytics.monthlyRecurringRevenue.toLocaleString()}</div>
              <div className="text-muted-foreground">MRR</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-medium">
                ${analytics.monthlyRecurringRevenue > 0 && analytics.activeMembers > 0 
                  ? Math.round(analytics.monthlyRecurringRevenue / analytics.activeMembers) 
                  : 0}
              </div>
              <div className="text-muted-foreground">Avg per member</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
