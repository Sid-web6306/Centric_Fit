import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'
// import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, phone, userId } = body

    if (!action || !phone) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Rate limit by phone number (primary) + IP fallback to prevent SMS cost abuse
    const rateLimitId = phone ? `phone:${phone}` : getClientIP(request)
    const rateLimitResponse = await checkRateLimit(request, 'communications', rateLimitId)
    if (rateLimitResponse) return rateLimitResponse

    // Placeholder implementation. Integrate MSG91 or chosen OTP provider server-side.
    // For now, just return success for send action and validate for verify action in future.
    if (action === 'send') {
      // TODO: send OTP via server provider
      return NextResponse.json({ success: true })
    }

    if (action === 'verify') {
      // TODO: verify OTP and update profile.phone_verified
      if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    //   const supabase = await createClient()
    //   await supabase.from('profiles').update({ phone_verified: true, phone_verified_at: new Date().toISOString() }).eq('id', userId)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


