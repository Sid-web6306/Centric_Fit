'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useGymAnalytics } from '@/hooks/use-gym-analytics'

interface MemberGrowthChartProps {
  gymId: string | null
}

export default function MemberGrowthChart({ gymId }: MemberGrowthChartProps) {
  const { data: analytics, isLoading, error } = useGymAnalytics(gymId, 30)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Member Growth
          </CardTitle>
          <CardDescription>Member acquisition and growth trends</CardDescription>
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
            <TrendingUp className="w-5 h-5" />
            Member Growth
          </CardTitle>
          <CardDescription>Member acquisition and growth trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>Unable to load chart data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Transform member trend data
  const growthData = analytics.memberTrend.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    total: item.count,
    new: item.new,
    fullDate: item.date
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Member Growth
        </CardTitle>
        <CardDescription>Member acquisition and growth trends</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>Growth Rate</span>
            <span className="font-medium">{analytics.memberGrowthRate.toFixed(1)}%</span>
          </div>
          
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
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
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 3 }}
                name="Total Members" 
              />
              <Line 
                type="monotone" 
                dataKey="new" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 3 }}
                name="New Members" 
              />
            </LineChart>
          </ResponsiveContainer>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-medium">{analytics.totalMembers}</div>
              <div className="text-muted-foreground">Total members</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-medium">{analytics.newMembersThisMonth}</div>
              <div className="text-muted-foreground">New this month</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
