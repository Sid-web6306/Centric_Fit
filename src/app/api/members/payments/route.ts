import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET /api/members/payments?member_id=xxx  — list payments for a member
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const memberId = searchParams.get('member_id')
  const gymId    = searchParams.get('gym_id')

  if (!memberId && !gymId) {
    return NextResponse.json({ error: 'member_id or gym_id required' }, { status: 400 })
  }

  let query = supabase
    .from('member_payments')
    .select('*, members(id, profile_id, profiles:profile_id(first_name, last_name))')
    .order('payment_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (memberId) query = query.eq('member_id', memberId)
  if (gymId)    query = query.eq('gym_id', gymId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ payments: data })
}

// POST /api/members/payments  — record a new payment
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { member_id, gym_id, amount_rupees, payment_method, notes, payment_date } = body

  if (!member_id || !gym_id || !amount_rupees) {
    return NextResponse.json({ error: 'member_id, gym_id and amount_rupees are required' }, { status: 400 })
  }

  const amountPaise = Math.round(Number(amount_rupees) * 100)
  if (isNaN(amountPaise) || amountPaise <= 0) {
    return NextResponse.json({ error: 'amount_rupees must be a positive number' }, { status: 400 })
  }

  // Verify recorder is a member of this gym
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  const { data: payment, error } = await supabase
    .from('member_payments')
    .insert({
      gym_id,
      member_id,
      amount: amountPaise,
      currency: 'INR',
      payment_method: payment_method || 'cash',
      notes: notes || null,
      recorded_by: profile?.id ?? null,
      payment_date: payment_date || new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ payment }, { status: 201 })
}
