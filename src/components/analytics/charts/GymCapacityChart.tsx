'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useGymAnalytics } from '@/hooks/use-gym-analytics'

interface GymCapacityChartProps {
  gymId: string | null
}

export default function GymCapacityChart({ gymId }: GymCapacityChartProps) {
  const { data: analytics, isLoading, error } = useGymAnalytics(gymId, 30)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Gym Capacity
          </CardTitle>
          <CardDescription>Real-time gym capacity utilization</CardDescription>
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
            <Users className="w-5 h-5" />
            Gym Capacity
          </CardTitle>
          <CardDescription>Real-time gym capacity utilization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>Unable to load chart data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Generate mock capacity data based on peak hours
  const capacityData = analytics.peakHours.map(hour => ({
    hour: `${hour.hour}:00`,
    capacity: Math.min(100, (hour.count / 50) * 100), // Assuming 50 is max capacity
    visitors: hour.count
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Gym Capacity
        </CardTitle>
        <CardDescription>Real-time gym capacity utilization</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>Average Daily Capacity</span>
            <span className="font-medium">{analytics.averageDailyCapacity.toFixed(1)}%</span>
          </div>
          
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={capacityData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="hour" 
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
                dataKey="capacity" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
                name="Capacity %" 
              />
            </LineChart>
          </ResponsiveContainer>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-medium">{analytics.averageDailyCapacity.toFixed(1)}%</div>
              <div className="text-muted-foreground">Avg capacity</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-medium">{analytics.peakHours[0]?.count || 0}</div>
              <div className="text-muted-foreground">Peak visitors</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
