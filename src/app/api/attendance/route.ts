import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { checkUserPermission } from '@/actions/rbac.actions'
import { logger } from '@/lib/logger'

/**
 * @swagger
 * /api/attendance:
 *   get:
 *     summary: Get attendance data
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: gym_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Gym ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [members, staff]
 *           default: members
 *         description: Attendance type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by member/staff name
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of results
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Results offset
 *       - in: query
 *         name: summary
 *         schema:
 *           type: boolean
 *         description: Return summary statistics only
 *     responses:
 *       200:
 *         description: Attendance data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     attendance:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Attendance'
 *                     total:
 *                       type: integer
 *                 - type: object
 *                   properties:
 *                     active_members:
 *                       type: integer
 *                     active_staff:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Bad request (missing gym_id)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// GET /api/attendance - Get attendance data
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const gymId = searchParams.get('gym_id')
    const type = searchParams.get('type') || 'members' // 'members' or 'staff'
    const search = searchParams.get('search')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const summary = searchParams.get('summary') === 'true'

    if (!gymId) {
      return NextResponse.json({ error: 'Gym ID is required' }, { status: 400 })
    }

    // Check permissions
    const permission = type === 'staff' ? 'staff.read' : 'members.read'
    const canView = await checkUserPermission(user.id, gymId, permission)
    if (!canView) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    if (summary) {
      // Efficiently fetch counts of active sessions
      const [membersResult, staffResult] = await Promise.all([
        supabase
          .from('attendance_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('gym_id', gymId)
          .eq('subject_type', 'member')
          .is('check_out_at', null),
        supabase
          .from('attendance_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('gym_id', gymId)
          .eq('subject_type', 'staff')
          .is('check_out_at', null)
      ])

      if (membersResult.error) logger.error('Error counting member attendance:', { error: membersResult.error.message })
      if (staffResult.error) logger.error('Error counting staff attendance:', { error: staffResult.error.message })

      return NextResponse.json({
        stats: {
          membersPresent: membersResult.count || 0,
          staffPresent: staffResult.count || 0,
          totalPresent: (membersResult.count || 0) + (staffResult.count || 0)
        }
      })
    }

    // Call the appropriate RPC function
    const rpcFunction = type === 'staff' ? 'get_staff_attendance' : 'get_member_attendance'
    
    const { data, error } = await supabase.rpc(rpcFunction, {
      p_gym_id: gymId,
      p_search: search ?? undefined,
      p_from: from ?? undefined,
      p_to: to ?? undefined,
      p_limit: limit,
      p_offset: offset,
    })

    if (error) {
      logger.error('Attendance query failed:', { error, type })
      return NextResponse.json({ error: 'Failed to fetch attendance data' }, { status: 500 })
    }

    return NextResponse.json({ 
      attendance: data || [],
      pagination: {
        limit,
        offset,
        hasMore: (data?.length || 0) === limit
      }
    })

  } catch (error) {
    logger.error('Attendance GET error:', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
