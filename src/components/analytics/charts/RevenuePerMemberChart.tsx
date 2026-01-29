'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useGymAnalytics } from '@/hooks/use-gym-analytics'

interface RevenuePerMemberChartProps {
  gymId: string | null
}

export default function RevenuePerMemberChart({ gymId }: RevenuePerMemberChartProps) {
  const { data: analytics, isLoading, error } = useGymAnalytics(gymId, 30)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Revenue Per Member
          </CardTitle>
          <CardDescription>Average revenue per member analysis</CardDescription>
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
            Revenue Per Member
          </CardTitle>
          <CardDescription>Average revenue per member analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>Unable to load chart data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Generate mock revenue per member data based on revenue trends
  const revenuePerMemberData = analytics.revenueTrend.map(item => ({
    month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    revenuePerMember: analytics.activeMembers > 0 ? Math.round(item.amount / analytics.activeMembers) : 0,
    totalRevenue: item.amount
  }))

  const avgRevenuePerMember = revenuePerMemberData.reduce((acc, item) => acc + item.revenuePerMember, 0) / revenuePerMemberData.length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Revenue Per Member
        </CardTitle>
        <CardDescription>Average revenue per member analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>Avg Revenue Per Member</span>
            <span className="font-medium">${Math.round(avgRevenuePerMember)}</span>
          </div>
          
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenuePerMemberData}>
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
                formatter={(value?: number) => value ? [`$${value}`, 'Revenue/Member'] : ['$0', 'Revenue/Member']}
              />
              <Bar dataKey="revenuePerMember" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue Per Member" />
            </BarChart>
          </ResponsiveContainer>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-medium">${Math.round(avgRevenuePerMember)}</div>
              <div className="text-muted-foreground">Avg per member</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-medium">{analytics.activeMembers}</div>
              <div className="text-muted-foreground">Active members</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
