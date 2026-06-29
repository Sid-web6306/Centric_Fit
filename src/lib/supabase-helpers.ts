import { createClient } from '@/utils/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

/**
 * Resolve a user's gym_id from their profile.
 * Supports both auth_user_id (new) and id (legacy) lookup patterns.
 */
export async function getUserGymId(
  supabase: SupabaseServerClient,
  userId: string
): Promise<string | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('gym_id')
    .or(`auth_user_id.eq.${userId},id.eq.${userId}`)
    .single()
  return profile?.gym_id ?? null
}

/**
 * Fetch a user's full profile row.
 * Supports both auth_user_id (new) and id (legacy) lookup patterns.
 */
export async function getUserProfile(
  supabase: SupabaseServerClient,
  userId: string
) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .or(`auth_user_id.eq.${userId},id.eq.${userId}`)
    .single()
  return profile ?? null
}
