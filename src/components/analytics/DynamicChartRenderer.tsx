'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { LucideIcon } from 'lucide-react'
import { useChartsByCategory } from '@/hooks/use-chart-access'
import LockedChart from './LockedChart'
import ChartPlaceholder from './ChartPlaceholder'
import { cn } from '@/lib/utils'

// Import chart components
const ChartComponents: Record<string, React.ComponentType<any>> = {
  DailyCheckinsChart: React.lazy(() => import('./charts/DailyCheckinsChart')),
  GymCapacityChart: React.lazy(() => import('./charts/GymCapacityChart')),
  ClassAttendanceChart: React.lazy(() => import('./charts/ClassAttendanceChart')),
  MemberGrowthChart: React.lazy(() => import('./charts/MemberGrowthChart')),
  RetentionRateChart: React.lazy(() => import('./charts/RetentionRateChart')),
  EngagementHeatmapChart: React.lazy(() => import('./charts/EngagementHeatmapChart')),
  RevenueTrendsChart: React.lazy(() => import('./charts/RevenueTrendsChart')),
  RevenuePerMemberChart: React.lazy(() => import('./charts/RevenuePerMemberChart')),
  PaymentAnalyticsChart: React.lazy(() => import('./charts/PaymentAnalyticsChart')),
  AdvancedRetentionChart: React.lazy(() => import('./charts/AdvancedRetentionChart')),
  PredictiveAnalyticsChart: React.lazy(() => import('./charts/PredictiveAnalyticsChart')),
  CustomReportsChart: React.lazy(() => import('./charts/CustomReportsChart')),
  ApiAnalyticsChart: React.lazy(() => import('./charts/ApiAnalyticsChart')),
}

interface DynamicChartRendererProps {
  gymId: string | null
  category?: 'operational' | 'growth' | 'revenue' | 'advanced'
  className?: string
  onUpgrade?: (requiredPlan: 'starter' | 'professional' | 'enterprise') => void
}

function ChartIcon({ iconName }: { iconName: string | null }) {
  if (!iconName) return null

  // Dynamically import the icon
  const IconComponent = React.lazy(() =>
    import('lucide-react').then((module) => ({
      default: module[iconName as keyof typeof module] as LucideIcon
    }))
  )

  return (
    <React.Suspense fallback={<div className="w-5 h-5" />}>
      <IconComponent />
    </React.Suspense>
  )
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  )
}

function ChartCard({
  chart,
  gymId,
  onUpgrade
}: {
  chart: any,
  gymId: string | null,
  onUpgrade?: (requiredPlan: 'starter' | 'professional' | 'enterprise') => void
}) {
  const ChartComponent = ChartComponents[chart.component_name]

  if (!ChartComponent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartIcon iconName={chart.icon_name} />
            {chart.title}
          </CardTitle>
          {chart.description && (
            <CardDescription>{chart.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Chart component not found: {chart.component_name}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render locked chart if access is not allowed
  // 🔒 SECURITY: Use placeholder instead of real chart to prevent data fetching
  if (chart.access_level === 'locked') {
    const requiredPlan = chart.category === 'growth' ? 'professional' :
      chart.category === 'revenue' ? 'professional' : 'enterprise'

    return (
      <LockedChart
        title={chart.title}
        description={chart.description}
        requiredPlan={requiredPlan}
        onUpgrade={() => onUpgrade?.(requiredPlan)}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartIcon iconName={chart.icon_name} />
              {chart.title}
            </CardTitle>
            {chart.description && (
              <CardDescription>{chart.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {/* Placeholder instead of real chart - no data fetch */}
            <ChartPlaceholder height={200} />
          </CardContent>
        </Card>
      </LockedChart>
    )
  }

  // Don't render if access is not available
  if (chart.access_level === 'not_available') {
    return null
  }

  // Render accessible chart
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChartIcon iconName={chart.icon_name} />
          {chart.title}
        </CardTitle>
        {chart.description && (
          <CardDescription>{chart.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <React.Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <ChartComponent gymId={gymId} />
        </React.Suspense>
      </CardContent>
    </Card>
  )
}

export function DynamicChartRenderer({
  gymId,
  category,
  className,
  onUpgrade
}: DynamicChartRendererProps) {
  const {
    chartsByCategory,
    isLoading,
    error
  } = useChartsByCategory(gymId)

  if (error) {
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-red-600">Error loading charts: {error}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={cn('grid gap-6', className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <ChartSkeleton key={i} />
        ))}
      </div>
    )
  }

  const chartsToRender = category ? chartsByCategory[category] :
    Object.values(chartsByCategory).flat()

  if (chartsToRender.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-gray-500">No charts available for this category.</p>
      </div>
    )
  }

  return (
    <div className={cn('grid gap-6', className)}>
      {chartsToRender.map((chart) => (
        <ChartCard
          key={chart.chart_key}
          chart={chart}
          gymId={gymId}
          onUpgrade={onUpgrade}
        />
      ))}
    </div>
  )
}

export function OperationalCharts({
  gymId,
  className,
  onUpgrade
}: {
  gymId: string | null
  className?: string
  onUpgrade?: (requiredPlan: 'starter' | 'professional' | 'enterprise') => void
}) {
  return (
    <DynamicChartRenderer
      gymId={gymId}
      category="operational"
      className={className}
      onUpgrade={onUpgrade}
    />
  )
}

export function GrowthCharts({
  gymId,
  className,
  onUpgrade
}: {
  gymId: string | null
  className?: string
  onUpgrade?: (requiredPlan: 'starter' | 'professional' | 'enterprise') => void
}) {
  return (
    <DynamicChartRenderer
      gymId={gymId}
      category="growth"
      className={className}
      onUpgrade={onUpgrade}
    />
  )
}

export function RevenueCharts({
  gymId,
  className,
  onUpgrade
}: {
  gymId: string | null
  className?: string
  onUpgrade?: (requiredPlan: 'starter' | 'professional' | 'enterprise') => void
}) {
  return (
    <DynamicChartRenderer
      gymId={gymId}
      category="revenue"
      className={className}
      onUpgrade={onUpgrade}
    />
  )
}

export function AdvancedCharts({
  gymId,
  className,
  onUpgrade
}: {
  gymId: string | null
  className?: string
  onUpgrade?: (requiredPlan: 'starter' | 'professional' | 'enterprise') => void
}) {
  return (
    <DynamicChartRenderer
      gymId={gymId}
      category="advanced"
      className={className}
      onUpgrade={onUpgrade}
    />
  )
}

export default DynamicChartRenderer
