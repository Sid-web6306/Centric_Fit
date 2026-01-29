'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard } from 'lucide-react'
import { useGymAnalytics } from '@/hooks/use-gym-analytics'

interface PaymentAnalyticsChartProps {
  gymId: string | null
}

export default function PaymentAnalyticsChart({ gymId }: PaymentAnalyticsChartProps) {
  const { data: analytics, isLoading, error } = useGymAnalytics(gymId, 30)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Analytics
          </CardTitle>
          <CardDescription>Payment processing and revenue analytics</CardDescription>
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
            <CreditCard className="w-5 h-5" />
            Payment Analytics
          </CardTitle>
          <CardDescription>Payment processing and revenue analytics</CardDescription>
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
          <CreditCard className="w-5 h-5" />
          Payment Analytics
        </CardTitle>
        <CardDescription>Payment processing and revenue analytics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>Success Rate</span>
            <span className="font-medium">98.5%</span>
          </div>
          
          <div className="h-48 bg-muted rounded flex items-center justify-center">
            <div className="text-center">
              <CreditCard className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Payment analytics dashboard</p>
              <p className="text-xs text-muted-foreground mt-1">Revenue feature</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-medium">${analytics.monthlyRecurringRevenue.toLocaleString()}</div>
              <div className="text-muted-foreground">MRR</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-medium">98.5%</div>
              <div className="text-muted-foreground">Success rate</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
