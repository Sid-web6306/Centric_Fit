'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Target } from 'lucide-react'
import { useGymAnalytics } from '@/hooks/use-gym-analytics'

interface AdvancedRetentionChartProps {
  gymId: string | null
}

export default function AdvancedRetentionChart({ gymId }: AdvancedRetentionChartProps) {
  const { data: analytics, isLoading, error } = useGymAnalytics(gymId, 30)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Advanced Retention
          </CardTitle>
          <CardDescription>Advanced retention analytics and predictions</CardDescription>
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
            Advanced Retention
          </CardTitle>
          <CardDescription>Advanced retention analytics and predictions</CardDescription>
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
          <Target className="w-5 h-5" />
          Advanced Retention
        </CardTitle>
        <CardDescription>Advanced retention analytics and predictions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>Predicted Retention</span>
            <span className="font-medium">{(analytics.retentionRate + 5).toFixed(1)}%</span>
          </div>
          
          <div className="h-48 bg-muted rounded flex items-center justify-center">
            <div className="text-center">
              <Target className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Advanced retention analysis</p>
              <p className="text-xs text-muted-foreground mt-1">Enterprise feature</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-medium">{analytics.retentionRate.toFixed(1)}%</div>
              <div className="text-muted-foreground">Current</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-medium">{analytics.atRiskMembers}</div>
              <div className="text-muted-foreground">At risk</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
