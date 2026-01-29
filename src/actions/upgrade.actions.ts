'use server'

import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/logger'

/**
 * Handle chart upgrade request - redirect to subscription page with plan selection
 */
export async function handleChartUpgrade(requiredPlan: 'starter' | 'professional' | 'enterprise') {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Log the upgrade request for analytics tracking
    logger.info('Chart upgrade request:', { 
      userId: user.id, 
      requiredPlan,
      source: 'analytics_upgrade'
    })

    // In a real implementation, you would:
    // 1. Get the current subscription
    // 2. Calculate upgrade pricing
    // 3. Create Razorpay order
    // 4. Return payment URL
    
    // For now, we'll redirect to the dedicated upgrade page
    // This page shows all subscription plans with upgrade options
    const upgradeUrl = `/upgrade`
    
    return {
      success: true,
      redirectUrl: upgradeUrl
    }

  } catch (error) {
    logger.error('Failed to handle chart upgrade:', { error })
    throw error
  }
}

/**
 * Invalidate chart access cache after successful upgrade
 */
export async function handleUpgradeSuccess(gymId: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Invalidate the chart access cache
    const { error: invalidateError } = await supabase
      .rpc('invalidate_chart_access_cache', { 
        p_user_id: user.id, 
        p_gym_id: gymId 
      })

    if (invalidateError) {
      logger.error('Failed to invalidate chart access cache after upgrade:', { 
        userId: user.id, 
        gymId, 
        error: invalidateError 
      })
      throw new Error('Failed to refresh chart access')
    }

    return {
      success: true,
      message: 'Chart access updated successfully'
    }

  } catch (error) {
    logger.error('Failed to handle upgrade success:', { error })
    throw error
  }
}
