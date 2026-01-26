import { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { ApiResponseBuilder, ApiErrorCode } from './api-response'

export interface ApiContext {
  user: {
    id: string
    email: string
    gymId?: string
  } | null
  requestId: string
  timestamp: string
}

// Authentication Middleware
export async function authenticate(_request: NextRequest): Promise<ApiContext> {
  const requestId = crypto.randomUUID()
  const timestamp = new Date().toISOString()

  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return {
        user: null,
        requestId,
        timestamp
      }
    }

    // Get user's gym association
    const { data: profile } = await supabase
      .from('profiles')
      .select('gym_id')
      .eq('id', user.id)
      .single()

    return {
      user: {
        id: user.id,
        email: user.email!,
        gymId: profile?.gym_id || undefined
      },
      requestId,
      timestamp
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      user: null,
      requestId,
      timestamp
    }
  }
}

// Permission Check Middleware
export async function requirePermission(
  context: ApiContext,
  resource: string,
  action: string,
  resourceId?: string
): Promise<boolean> {
  if (!context.user) {
    return false
  }

  try {
    const { checkUserPermission } = await import('@/actions/rbac.actions')
    const gymId = resourceId || context.user.gymId

    if (!gymId) {
      return false
    }

    return await checkUserPermission(context.user.id, gymId, `${resource}.${action}` as any)
  } catch (error) {
    console.error('Permission check error:', error)
    return false
  }
}

// Request Validation Middleware
export function validateRequired(_context: ApiContext, _requiredFields: string[]): {
  isValid: boolean
  missingFields: string[]
} {
  // This would be used with request body validation
  // Implementation depends on the specific validation library used
  return {
    isValid: true,
    missingFields: []
  }
}

// Rate Limiting Middleware (basic implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  context: ApiContext,
  limit: number = 100,
  windowMs: number = 60000 // 1 minute
): boolean {
  const key = context.user?.id || context.requestId
  const now = Date.now()

  const current = rateLimitMap.get(key) || { count: 0, resetTime: now + windowMs }

  if (now > current.resetTime) {
    // Reset window
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (current.count >= limit) {
    return false
  }

  current.count++
  rateLimitMap.set(key, current)
  return true
}

// Error Handler Middleware
export function handleApiError(error: unknown): {
  response: Response
  logged: boolean
} {
  const requestId = crypto.randomUUID()
  
  // Log the error
  console.error(`API Error [${requestId}]:`, error)

  // Handle specific error types
  if (error instanceof Error) {
    if (error.message.includes('validation')) {
      return {
        response: Response.json(
          ApiResponseBuilder.error(ApiErrorCode.VALIDATION_ERROR, error.message),
          { status: 400 }
        ),
        logged: true
      }
    }

    if (error.message.includes('permission')) {
      return {
        response: Response.json(
          ApiResponseBuilder.error(ApiErrorCode.FORBIDDEN, 'Insufficient permissions'),
          { status: 403 }
        ),
        logged: true
      }
    }
  }

  // Default error response
  return {
    response: Response.json(
      ApiResponseBuilder.error(
        ApiErrorCode.INTERNAL_ERROR,
        'An unexpected error occurred'
      ),
      { status: 500 }
    ),
    logged: true
  }
}
