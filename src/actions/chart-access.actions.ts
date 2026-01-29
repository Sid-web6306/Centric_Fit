'use server'

import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/logger'

export interface ChartAccessLevel {
  [chartKey: string]: 'allowed' | 'locked' | 'not_available'
}

export interface ChartWithAccess {
  chart_key: string
  title: string
  description: string | null
  category: 'operational' | 'growth' | 'revenue' | 'advanced'
  component_name: string
  icon_name: string | null
  sort_order: number
  access_level: 'allowed' | 'locked' | 'not_available'
  is_accessible: boolean
}

export interface ChartAccessResponse {
  chartPermissions: ChartAccessLevel
  charts: ChartWithAccess[]
}

/**
 * Get user's chart access permissions for a specific gym
 */
export async function getChartAccess(gymId: string): Promise<ChartAccessResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Get user's chart access permissions using the security definer function
    const { data: chartPermissions, error: accessError } = await supabase
      .rpc('get_user_chart_access', { 
        p_user_id: user.id, 
        p_gym_id: gymId 
      }) as { data: ChartAccessLevel | null; error: unknown }

    if (accessError) {
      logger.error('Failed to get chart access permissions:', { 
        userId: user.id, 
        gymId, 
        error: accessError 
      })
      throw new Error('Failed to get chart access permissions')
    }

    // Get all available charts with user's access level
    const { data: chartsWithAccess, error: chartsError } = await supabase
      .rpc('get_charts_with_access', { 
        p_user_id: user.id, 
        p_gym_id: gymId 
      }) as { data: ChartWithAccess[] | null; error: unknown }

    if (chartsError) {
      logger.error('Failed to get charts with access:', { 
        userId: user.id, 
        gymId, 
        error: chartsError 
      })
      throw new Error('Failed to get charts with access')
    }

    return {
      chartPermissions: chartPermissions || {},
      charts: chartsWithAccess || []
    }

  } catch (error) {
    logger.error('Unexpected error in getChartAccess:', { error })
    throw error
  }
}

/**
 * Invalidate user's chart access cache (call after subscription changes)
 */
export async function invalidateChartAccessCache(gymId: string): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Invalidate the user's chart access cache
    const { error: invalidateError } = await supabase
      .rpc('invalidate_chart_access_cache', { 
        p_user_id: user.id, 
        p_gym_id: gymId 
      })

    if (invalidateError) {
      logger.error('Failed to invalidate chart access cache:', { 
        userId: user.id, 
        gymId, 
        error: invalidateError 
      })
      throw new Error('Failed to invalidate cache')
    }

  } catch (error) {
    logger.error('Unexpected error in invalidateChartAccessCache:', { error })
    throw error
  }
}

/**
 * Check if user has access to a specific chart
 */
export async function hasChartAccess(
  gymId: string, 
  chartKey: string
): Promise<'allowed' | 'locked' | 'not_available'> {
  try {
    const { chartPermissions } = await getChartAccess(gymId)
    return chartPermissions[chartKey] || 'not_available'
  } catch (error) {
    logger.error('Failed to check chart access:', { gymId, chartKey, error })
    return 'not_available'
  }
}

/**
 * Get charts filtered by access level
 */
export async function getChartsByAccessLevel(
  gymId: string,
  accessLevel: 'allowed' | 'locked' | 'not_available'
): Promise<ChartWithAccess[]> {
  try {
    const { charts } = await getChartAccess(gymId)
    return charts.filter(chart => chart.access_level === accessLevel)
  } catch (error) {
    logger.error('Failed to get charts by access level:', { gymId, accessLevel, error })
    return []
  }
}
