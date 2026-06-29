'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toastActions } from '@/stores/toast-store'
import { logger } from '@/lib/logger'

export interface MemberPayment {
  id: string
  gym_id: string
  member_id: string
  amount: number        // paise
  currency: string
  payment_method: string
  notes: string | null
  recorded_by: string | null
  payment_date: string
  created_at: string
}

export const memberPaymentKeys = {
  all: ['member-payments'] as const,
  byMember: (memberId: string) => ['member-payments', 'member', memberId] as const,
  byGym: (gymId: string) => ['member-payments', 'gym', gymId] as const,
}

export function useMemberPayments(memberId: string | null) {
  return useQuery({
    queryKey: memberPaymentKeys.byMember(memberId ?? ''),
    enabled: !!memberId,
    queryFn: async (): Promise<MemberPayment[]> => {
      const res = await fetch(`/api/members/payments?member_id=${memberId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch payments')
      return data.payments
    },
    staleTime: 5 * 60 * 1000,
  })
}

export interface RecordPaymentInput {
  member_id: string
  gym_id: string
  amount_rupees: number
  payment_method: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'other'
  notes?: string
  payment_date?: string
}

export function useRecordPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: RecordPaymentInput): Promise<MemberPayment> => {
      const res = await fetch('/api/members/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to record payment')
      return data.payment
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: memberPaymentKeys.byMember(variables.member_id) })
      queryClient.invalidateQueries({ queryKey: memberPaymentKeys.byGym(variables.gym_id) })
      toastActions.success('Payment Recorded', 'The payment has been saved successfully.')
    },
    onError: (error: Error) => {
      logger.error('Failed to record payment:', { error })
      toastActions.error('Failed to Record Payment', error.message)
    },
  })
}
