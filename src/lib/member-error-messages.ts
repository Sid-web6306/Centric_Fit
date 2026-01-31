/**
 * Member Error Messages
 * 
 * Centralized error handling for all member-related API operations.
 * Maps Postgres error codes and patterns to user-friendly messages.
 * 
 * Usage:
 *   import { getMemberErrorResponse, MEMBER_ERRORS } from '@/lib/member-error-messages'
 *   
 *   // In API route:
 *   if (error) {
 *     return getMemberErrorResponse(error)
 *   }
 */

import { NextResponse } from 'next/server'

// ========== ERROR CODES ==========
// Postgres error codes we handle
export const PG_ERROR_CODES = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  CHECK_VIOLATION: '23514',
} as const

// ========== MEMBER ERROR DEFINITIONS ==========
export const MEMBER_ERRORS = {
  // Duplicate/Unique constraint errors
  DUPLICATE_EMAIL: {
    code: 'DUPLICATE_EMAIL',
    message: 'A member with this email already exists in your fitness center',
    httpStatus: 409,
  },
  DUPLICATE_PHONE: {
    code: 'DUPLICATE_PHONE',
    message: 'A member with this phone number already exists',
    httpStatus: 409,
  },
  
  // Validation errors
  INVALID_EMAIL: {
    code: 'INVALID_EMAIL',
    message: 'Please provide a valid email address',
    httpStatus: 400,
  },
  INVALID_PHONE: {
    code: 'INVALID_PHONE',
    message: 'Please provide a valid phone number',
    httpStatus: 400,
  },
  INVALID_STATUS: {
    code: 'INVALID_STATUS',
    message: 'Invalid member status. Must be: active, inactive, or pending',
    httpStatus: 400,
  },
  MISSING_REQUIRED_FIELD: {
    code: 'MISSING_REQUIRED_FIELD',
    message: 'Required field is missing',
    httpStatus: 400,
  },
  FIRST_NAME_REQUIRED: {
    code: 'FIRST_NAME_REQUIRED',
    message: 'First name is required',
    httpStatus: 400,
  },
  LAST_NAME_REQUIRED: {
    code: 'LAST_NAME_REQUIRED',
    message: 'Last name is required',
    httpStatus: 400,
  },
  
  // Permission errors
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'You must be logged in to perform this action',
    httpStatus: 401,
  },
  INSUFFICIENT_PERMISSIONS: {
    code: 'INSUFFICIENT_PERMISSIONS',
    message: 'You do not have permission to perform this action',
    httpStatus: 403,
  },
  
  // Not found errors
  MEMBER_NOT_FOUND: {
    code: 'MEMBER_NOT_FOUND',
    message: 'Member not found',
    httpStatus: 404,
  },
  FITNESS_CENTER_NOT_FOUND: {
    code: 'FITNESS_CENTER_NOT_FOUND',
    message: 'No fitness center association found for your account',
    httpStatus: 400,
  },
  
  // Portal errors
  EMAIL_REQUIRED_FOR_PORTAL: {
    code: 'EMAIL_REQUIRED_FOR_PORTAL',
    message: 'Member must have an email address for portal access',
    httpStatus: 400,
  },
  PORTAL_ACCESS_EXISTS: {
    code: 'PORTAL_ACCESS_EXISTS',
    message: 'Member already has portal access',
    httpStatus: 400,
  },
  
  // Rate limiting
  RATE_LIMITED: {
    code: 'RATE_LIMITED',
    message: 'Too many requests. Please wait a moment before trying again',
    httpStatus: 429,
  },
  
  // Server errors
  SERVER_ERROR: {
    code: 'SERVER_ERROR',
    message: 'An unexpected error occurred. Please try again',
    httpStatus: 500,
  },
  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    message: 'Database operation failed. Please try again',
    httpStatus: 500,
  },
} as const

export type MemberErrorCode = keyof typeof MEMBER_ERRORS

// ========== ERROR PATTERN MATCHING ==========

interface ErrorPatternMapping {
  patterns: RegExp[]
  error: typeof MEMBER_ERRORS[MemberErrorCode]
}

/**
 * Pattern mappings for Postgres and application errors
 * Order matters - more specific patterns should come first
 */
const ERROR_PATTERN_MAPPINGS: ErrorPatternMapping[] = [
  // Duplicate email (unique constraint on email per gym)
  {
    patterns: [
      /idx_members_unique_email_per_gym/i,
      /members_email_gym_id/i,
      /duplicate.*email/i,
      /email.*already.*exists/i,
      /email.*unique/i,
    ],
    error: MEMBER_ERRORS.DUPLICATE_EMAIL,
  },
  
  // Duplicate phone
  {
    patterns: [
      /phone.*unique/i,
      /duplicate.*phone/i,
      /phone.*already.*exists/i,
    ],
    error: MEMBER_ERRORS.DUPLICATE_PHONE,
  },
  
  // Invalid email format
  {
    patterns: [
      /invalid.*email/i,
      /email.*invalid/i,
      /email.*format/i,
    ],
    error: MEMBER_ERRORS.INVALID_EMAIL,
  },
  
  // Invalid phone format
  {
    patterns: [
      /invalid.*phone/i,
      /phone.*invalid/i,
      /phone.*format/i,
    ],
    error: MEMBER_ERRORS.INVALID_PHONE,
  },
  
  // Missing required fields
  {
    patterns: [
      /first.*name.*required/i,
      /first_name.*required/i,
    ],
    error: MEMBER_ERRORS.FIRST_NAME_REQUIRED,
  },
  {
    patterns: [
      /last.*name.*required/i,
      /last_name.*required/i,
    ],
    error: MEMBER_ERRORS.LAST_NAME_REQUIRED,
  },
  {
    patterns: [
      /not-null.*violation/i,
      /null.*value/i,
      /required/i,
    ],
    error: MEMBER_ERRORS.MISSING_REQUIRED_FIELD,
  },
  
  // Permission errors
  {
    patterns: [
      /unauthorized/i,
      /not.*authenticated/i,
    ],
    error: MEMBER_ERRORS.UNAUTHORIZED,
  },
  {
    patterns: [
      /permission/i,
      /forbidden/i,
      /access.*denied/i,
      /rls.*policy/i,
    ],
    error: MEMBER_ERRORS.INSUFFICIENT_PERMISSIONS,
  },
  
  // Not found
  {
    patterns: [
      /member.*not.*found/i,
      /PGRST116/i,  // Supabase "no rows returned" code
    ],
    error: MEMBER_ERRORS.MEMBER_NOT_FOUND,
  },
  
  // Rate limiting
  {
    patterns: [
      /rate.*limit/i,
      /too.*many.*requests/i,
      /429/i,
    ],
    error: MEMBER_ERRORS.RATE_LIMITED,
  },
]

// ========== HELPER FUNCTIONS ==========

interface PostgresError {
  code?: string
  message?: string
  detail?: string
  constraint?: string
}

/**
 * Extract error message from various error types
 */
function getErrorString(error: unknown): string {
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null) {
    const pgError = error as PostgresError
    // Combine all available info for better pattern matching
    return [
      pgError.message,
      pgError.detail,
      pgError.constraint,
      pgError.code,
    ].filter(Boolean).join(' ')
  }
  return String(error)
}

/**
 * Check if error is a Postgres unique violation
 */
function isUniqueViolation(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const pgError = error as PostgresError
    return pgError.code === PG_ERROR_CODES.UNIQUE_VIOLATION
  }
  return false
}

/**
 * Get the appropriate member error for a given error
 */
export function getMemberError(error: unknown): typeof MEMBER_ERRORS[MemberErrorCode] {
  const errorStr = getErrorString(error)
  
  // Check for unique violation first (most common for duplicates)
  if (isUniqueViolation(error)) {
    // Check constraint name to determine which field
    const pgError = error as PostgresError
    if (pgError.constraint?.includes('email')) {
      return MEMBER_ERRORS.DUPLICATE_EMAIL
    }
    if (pgError.constraint?.includes('phone')) {
      return MEMBER_ERRORS.DUPLICATE_PHONE
    }
    // Default to email for the common case
    return MEMBER_ERRORS.DUPLICATE_EMAIL
  }
  
  // Pattern matching for other errors
  for (const mapping of ERROR_PATTERN_MAPPINGS) {
    if (mapping.patterns.some(pattern => pattern.test(errorStr))) {
      return mapping.error
    }
  }
  
  // Default to server error
  return MEMBER_ERRORS.SERVER_ERROR
}

/**
 * Get a NextResponse for a member error
 * Use this directly in API routes
 */
export function getMemberErrorResponse(
  error: unknown,
  additionalData?: Record<string, unknown>
): NextResponse {
  const memberError = getMemberError(error)
  
  return NextResponse.json(
    {
      error: memberError.message,
      code: memberError.code,
      ...additionalData,
    },
    { status: memberError.httpStatus }
  )
}

/**
 * Create a response for a specific known error
 * Use when you know exactly which error occurred
 */
export function createMemberErrorResponse(
  errorCode: MemberErrorCode,
  customMessage?: string
): NextResponse {
  const memberError = MEMBER_ERRORS[errorCode]
  
  return NextResponse.json(
    {
      error: customMessage || memberError.message,
      code: memberError.code,
    },
    { status: memberError.httpStatus }
  )
}

/**
 * Check if an error is a duplicate email error
 */
export function isDuplicateEmailError(error: unknown): boolean {
  const memberError = getMemberError(error)
  return memberError.code === 'DUPLICATE_EMAIL'
}

/**
 * Get user-friendly message for any member error
 * Useful for client-side error display
 */
export function getMemberErrorMessage(error: unknown): string {
  return getMemberError(error).message
}
