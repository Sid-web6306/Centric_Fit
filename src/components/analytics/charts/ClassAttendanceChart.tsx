'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useGymAnalytics } from '@/hooks/use-gym-analytics'

interface ClassAttendanceChartProps {
  gymId: string | null
}

export default function ClassAttendanceChart({ gymId }: ClassAttendanceChartProps) {
  const { data: analytics, isLoading, error } = useGymAnalytics(gymId, 30)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Class Attendance
          </CardTitle>
          <CardDescription>Attendance rates for gym classes</CardDescription>
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
            <Calendar className="w-5 h-5" />
            Class Attendance
          </CardTitle>
          <CardDescription>Attendance rates for gym classes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>Unable to load chart data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Generate mock class attendance data
  const classData = [
    { name: 'Yoga', attendance: 85, capacity: 20 },
    { name: 'HIIT', attendance: 92, capacity: 15 },
    { name: 'Spin', attendance: 78, capacity: 25 },
    { name: 'Pilates', attendance: 88, capacity: 12 },
    { name: 'CrossFit', attendance: 95, capacity: 18 }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Class Attendance
        </CardTitle>
        <CardDescription>Attendance rates for gym classes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>Overall Class Attendance</span>
            <span className="font-medium">
              {Math.round(classData.reduce((acc, cls) => acc + cls.attendance, 0) / classData.length)}%
            </span>
          </div>
          
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={classData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
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
              <Bar dataKey="attendance" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Attendance %" />
            </BarChart>
          </ResponsiveContainer>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-medium">{classData.length}</div>
              <div className="text-muted-foreground">Total classes</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-medium">
                {Math.max(...classData.map(c => c.attendance))}%
              </div>
              <div className="text-muted-foreground">Best attendance</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
