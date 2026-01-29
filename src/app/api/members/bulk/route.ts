import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'
import { checkUserPermission } from '@/actions/rbac.actions'
import { logger } from '@/lib/logger'
import { getMemberErrorMessage } from '@/lib/member-error-messages'

// Validation schema for bulk member creation
const bulkCreateMemberSchema = z.object({
  gym_id: z.string().uuid(),
  members: z.array(z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().email().nullable().optional(),
    phone_number: z.string().nullable().optional(),
    status: z.enum(['active', 'inactive', 'pending']).default('active'),
    join_date: z.string().optional()
  })).min(1, 'At least one member is required')
})

// POST /api/members/bulk - Bulk create members
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = bulkCreateMemberSchema.parse(body)

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const canCreate = await checkUserPermission(user.id, validatedData.gym_id, 'members.create')
    if (!canCreate) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Use create_member_with_profile RPC for each member to ensure profiles are created
    // This creates both member and profile records atomically
    const success: Array<{ id: string; email: string | null; first_name: string; last_name: string; profile_id: string }> = []
    const failed: Array<{ data: { first_name: string; last_name: string; email?: string | null }; error: string }> = []

    for (const memberData of validatedData.members) {
      try {
        const { data: result, error: createError } = await supabase
          .rpc('create_member_with_profile', {
            p_gym_id: validatedData.gym_id,
            p_first_name: memberData.first_name,
            p_last_name: memberData.last_name,
            p_email: memberData.email || undefined,
            p_phone_number: memberData.phone_number || undefined,
            p_status: memberData.status || 'active',
            p_join_date: memberData.join_date || new Date().toISOString().split('T')[0]
          })
          .single()

        if (createError) {
          failed.push({ 
            data: { 
              first_name: memberData.first_name, 
              last_name: memberData.last_name, 
              email: memberData.email 
            }, 
            error: getMemberErrorMessage(createError) 
          })
        } else if (result && typeof result === 'object' && 'member_id' in result) {
          success.push({
            id: result.member_id as string,
            email: memberData.email || null,
            first_name: memberData.first_name,
            last_name: memberData.last_name,
            profile_id: result.profile_id as string
          })
        }
      } catch (err) {
        failed.push({ 
          data: { 
            first_name: memberData.first_name, 
            last_name: memberData.last_name, 
            email: memberData.email 
          }, 
          error: getMemberErrorMessage(err) 
        })
      }
    }

    logger.info('Bulk create with profiles completed:', { 
      successCount: success.length, 
      failedCount: failed.length 
    })

    return NextResponse.json({
      success: success,
      failed: failed,
      summary: {
        total_requested: validatedData.members.length,
        success_count: success.length,
        failed_count: failed.length
      }
    }, { status: failed.length > 0 ? 207 : 201 }) // 207 Multi-Status if some failed

  } catch (error) {
    logger.error('Bulk members POST error:', { error })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
