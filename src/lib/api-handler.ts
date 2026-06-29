import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import type { User } from '@supabase/supabase-js'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

interface AuthContext {
  user: User
  supabase: SupabaseServerClient
}

/**
 * Authenticate the incoming request via Supabase session cookie.
 * Returns { user, supabase } on success, or null when unauthenticated.
 *
 * Usage:
 *   const auth = await withAuth()
 *   if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 *   const { user, supabase } = auth
 */
export async function withAuth(): Promise<AuthContext | null> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return null
  return { user, supabase }
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
