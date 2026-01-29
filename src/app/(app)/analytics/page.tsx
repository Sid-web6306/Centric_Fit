'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshCw, Download, BarChart3, TrendingUp, DollarSign, Brain } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { AnalyticsGuard, AccessDenied } from '@/components/rbac/rbac-guards'
import { 
  OperationalCharts, 
  GrowthCharts, 
  RevenueCharts, 
  AdvancedCharts 
} from '@/components/analytics/DynamicChartRenderer'
import { invalidateChartAccessCache } from '@/actions/chart-access.actions'

export default function AnalyticsPage() {
  const { user, profile } = useAuth()
  const gymId = profile?.gym_id

  const handleRefresh = async () => {
    if (gymId) {
      await invalidateChartAccessCache(gymId)
      window.location.reload()
    }
  }

  const handleUpgrade = () => {
    // Redirect to upgrade page
    window.location.href = `/upgrade`
  }

  if (!user || !gymId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Access Required</h3>
          <p className="text-muted-foreground">Please log in to view analytics</p>
        </div>
      </div>
    )
  }

  return (
    <AnalyticsGuard
      action="read"
      fallback={<AccessDenied message="You don't have permission to view analytics. This feature requires manager-level access or higher." />}
    >
      <div className="space-y-6 p-6 md:p-8">
        <PageHeader
          title="Business Analytics"
          description="Key metrics and insights to grow your gym"
        >
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/settings/subscription'}>
              <Download className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          </div>
        </PageHeader>

        {/* Chart Categories */}
        <Tabs defaultValue="operational" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="operational" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Operational
            </TabsTrigger>
            <TabsTrigger value="growth" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Growth
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Advanced
            </TabsTrigger>
          </TabsList>

          <TabsContent value="operational">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Operational Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Daily operational metrics and gym utilization data
              </p>
              <OperationalCharts 
                gymId={gymId} 
                onUpgrade={handleUpgrade}
              />
            </div>
          </TabsContent>

          <TabsContent value="growth">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Growth Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Member acquisition, retention, and engagement insights
              </p>
              <GrowthCharts 
                gymId={gymId} 
                onUpgrade={handleUpgrade}
              />
            </div>
          </TabsContent>

          <TabsContent value="revenue">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Revenue Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Financial performance and revenue tracking
              </p>
              <RevenueCharts 
                gymId={gymId} 
                onUpgrade={handleUpgrade}
              />
            </div>
          </TabsContent>

          <TabsContent value="advanced">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Advanced Analytics</h3>
              <p className="text-sm text-muted-foreground">
                AI-powered insights and custom reporting (Enterprise only)
              </p>
              <AdvancedCharts 
                gymId={gymId} 
                onUpgrade={handleUpgrade}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>Analytics update every 5 minutes • Last updated: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </AnalyticsGuard>
  )
}
                
                
