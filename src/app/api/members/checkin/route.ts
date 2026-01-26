import { NextRequest, NextResponse } from 'next/server'
/**
 * @swagger
 * /api/members/checkin:
 *   post:
 *     summary: Check in member for attendance
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: gym_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Gym ID where member is checking in
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               method:
 *                 type: string
 *                 default: portal
 *                 description: Check-in method
 *               notes:
 *                 type: string
 *                 description: Optional notes for check-in
 *     responses:
 *       200:
 *         description: Member checked in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 session:
 *                   type: object
 *                 message:
 *                   type: string
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: No member record found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// Request validation schema
const checkinSchema = z.object({
  method: z.string().default('portal'),
  notes: z.string().optional()
})

// POST /api/members/checkin - Start attendance session for member
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get gym_id from query parameters
    const { searchParams } = new URL(request.url)
    const gymId = searchParams.get('gym_id')
    
    if (!gymId) {
      return NextResponse.json({ error: 'Gym ID is required' }, { status: 400 })
    }

    // Parse request body
    const body = await request.json()
    const validatedData = checkinSchema.parse(body)

    logger.info('Member check-in request', { 
      userId: user.id, 
      gymId: gymId,
      method: validatedData.method 
    })

    // Call the member_check_in RPC function with gym_id
    const { data: session, error: checkinError } = await supabase
      .rpc('member_check_in', {
        p_gym_id: gymId,
        p_method: validatedData.method,
        p_notes: validatedData.notes
      })

    if (checkinError) {
      logger.error('Member check-in error:', { checkinError })
      
      if (checkinError.message?.includes('No member record found')) {
        return NextResponse.json({ 
          error: 'No member record found for authenticated user' 
        }, { status: 404 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to check in' 
      }, { status: 500 })
    }

    // Return session data
    return NextResponse.json({
      success: true,
      session: session,
      message: 'Successfully checked in'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: error.errors 
      }, { status: 400 })
    }

    logger.error('Error in /api/members/checkin:', { error })
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
