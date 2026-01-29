'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useGymAnalytics } from '@/hooks/use-gym-analytics'

interface DailyCheckinsChartProps {
  gymId: string | null
}

export default function DailyCheckinsChart({ gymId }: DailyCheckinsChartProps) {
  const { data: analytics, isLoading, error } = useGymAnalytics(gymId, 30)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Daily Check-ins
          </CardTitle>
          <CardDescription>Number of member check-ins per day</CardDescription>
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
            <Activity className="w-5 h-5" />
            Daily Check-ins
          </CardTitle>
          <CardDescription>Number of member check-ins per day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>Unable to load chart data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Daily Check-ins
        </CardTitle>
        <CardDescription>Number of member check-ins per day</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>Today's Check-ins</span>
            <span className="font-medium">{analytics.todayCheckins}</span>
          </div>
          
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.attendanceTrend.slice(-7).map(item => ({
              date: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
              checkins: item.checkins,
              fullDate: item.date
            }))}>
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
                labelFormatter={(value, payload) => {
                  if (payload && payload[0]) {
                    return new Date(payload[0].payload.fullDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    })
                  }
                  return value
                }}
              />
              <Bar dataKey="checkins" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Check-ins" />
            </BarChart>
          </ResponsiveContainer>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-medium">{analytics.averageVisitsPerMember.toFixed(1)}</div>
              <div className="text-muted-foreground">Avg visits/member</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-medium">{analytics.attendanceRate.toFixed(1)}%</div>
              <div className="text-muted-foreground">Attendance rate</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
