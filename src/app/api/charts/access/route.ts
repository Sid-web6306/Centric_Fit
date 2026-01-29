import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/logger'

// GET /api/charts/access - Get user's chart access permissions
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const gymId = searchParams.get('gym_id')

    if (!gymId) {
      return NextResponse.json({ error: 'Gym ID is required' }, { status: 400 })
    }

    // Get user's chart access permissions using the security definer function
    const { data: chartPermissions, error: accessError } = await supabase
      .rpc('get_user_chart_access', { 
        p_user_id: user.id, 
        p_gym_id: gymId 
      })

    if (accessError) {
      logger.error('Failed to get chart access permissions:', { 
        userId: user.id, 
        gymId, 
        error: accessError 
      })
      return NextResponse.json({ error: 'Failed to get chart access permissions' }, { status: 500 })
    }

    // Get all available charts with user's access level
    const { data: chartsWithAccess, error: chartsError } = await supabase
      .rpc('get_charts_with_access', { 
        p_user_id: user.id, 
        p_gym_id: gymId 
      })

    if (chartsError) {
      logger.error('Failed to get charts with access:', { 
        userId: user.id, 
        gymId, 
        error: chartsError 
      })
      return NextResponse.json({ error: 'Failed to get charts with access' }, { status: 500 })
    }

    return NextResponse.json({
      chartPermissions,
      charts: chartsWithAccess || []
    })

  } catch (error) {
    logger.error('Unexpected error in chart access API:', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/charts/access/invalidate - Invalidate chart access cache
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { gymId } = await request.json()

    if (!gymId) {
      return NextResponse.json({ error: 'Gym ID is required' }, { status: 400 })
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
      return NextResponse.json({ error: 'Failed to invalidate cache' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    logger.error('Unexpected error in chart access invalidate API:', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
