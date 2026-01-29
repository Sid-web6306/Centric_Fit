'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { ChartAccessResponse } from '@/actions/chart-access.actions'

export function useChartAccess(gymId: string | null) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['chart-access', gymId],
    queryFn: async (): Promise<ChartAccessResponse> => {
      if (!gymId) throw new Error('Gym ID is required')
      
      const response = await fetch(`/api/charts/access?gym_id=${gymId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load chart access')
      }
      
      return response.json()
    },
    enabled: !!user && !!gymId,
    staleTime: 5 * 60 * 1000, // 5 minutes - matches analytics cache
    refetchOnWindowFocus: false,
  })

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['chart-access', gymId] })
  }

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch
  }
}


export function useChartsByCategory(gymId: string | null) {
  const { data, isLoading, error, refetch } = useChartAccess(gymId)

  const chartsByCategory = {
    operational: data?.charts.filter(chart => chart.category === 'operational') || [],
    growth: data?.charts.filter(chart => chart.category === 'growth') || [],
    revenue: data?.charts.filter(chart => chart.category === 'revenue') || [],
    advanced: data?.charts.filter(chart => chart.category === 'advanced') || []
  }

  const accessibleCharts = data?.charts.filter(chart => chart.is_accessible) || []
  const lockedCharts = data?.charts.filter(chart => chart.access_level === 'locked') || []
  const unavailableCharts = data?.charts.filter(chart => chart.access_level === 'not_available') || []

  return {
    chartsByCategory,
    accessibleCharts,
    lockedCharts,
    unavailableCharts,
    allCharts: data?.charts || [],
    chartPermissions: data?.chartPermissions || {},
    isLoading,
    error,
    refetch
  }
}

export function useChartAccessLevel(gymId: string | null, chartKey: string) {
  const { data, isLoading, error } = useChartAccess(gymId)

  const accessLevel = data?.chartPermissions[chartKey] || 'not_available'
  const isAccessible = accessLevel === 'allowed'
  const isLocked = accessLevel === 'locked'
  const isNotAvailable = accessLevel === 'not_available'

  return {
    accessLevel,
    isAccessible,
    isLocked,
    isNotAvailable,
    isLoading,
    error
  }
}
