'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { ChartAccessResponse } from '@/actions/chart-access.actions'

export function useChartAccess(gymId: string | null) {
  const { user } = useAuth()
  const [data, setData] = useState<ChartAccessResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !gymId) {
      setData(null)
      setError(null)
      return
    }

    const fetchChartAccess = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/charts/access?gym_id=${gymId}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to load chart access')
        }
        
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chart access')
        setData(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchChartAccess()
  }, [user, gymId])

  const refetch = () => {
    if (user && gymId) {
      fetch(`/api/charts/access?gym_id=${gymId}`)
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to load chart access')
          }
          return response.json()
        })
        .then(setData)
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load chart access'))
    }
  }

  return {
    data,
    isLoading,
    error,
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
