import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { logger } from '@/lib/logger'
import { toastActions } from '@/stores/toast-store'

// Type definitions (keeping the useful ones)
export interface SubscriptionPlan {
  id: string
  name: string
  price_monthly_inr: number
  price_annual_inr: number
  member_limit: number | null
  features: string[]
  is_active: boolean
  razorpay_plan_id: string | null
}

export interface TrialInfo {
  trial_start_date: string | null
  trial_end_date: string | null
  trial_status: 'active' | 'expired' | 'converted'
  days_remaining: number
}

export interface SubscriptionInfo {
  id: string
  user_id: string
  subscription_plan_id: string
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'scheduled' | 'paused' | 'pending' | 'completed'
  billing_cycle: 'monthly' | 'annual'
  starts_at: string
  current_period_start: string
  current_period_end: string
  ends_at: string | null
  canceled_at: string | null
  paused_at: string | null
  scheduled_change_type: string | null
  scheduled_change_effective_date: string | null
  scheduled_change_data: Record<string, unknown> | null
  razorpay_customer_id: string | null
  razorpay_subscription_id: string | null
  razorpay_subscription_item_id: string | null
  razorpay_price_id: string | null
  amount: number
  currency: string
  created_at: string
  updated_at: string
  // Trial fields (now in subscriptions table)
  trial_start_date: string | null
  trial_end_date: string | null
  trial_status: string | null
  // Related data
  plan?: SubscriptionPlan
}

// UTILITY FUNCTIONS

// Helper function to format currency amount
export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount / 100) // Convert from paise to rupees
}

// Helper function to format subscription period remaining
export function formatTimeRemaining(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffInDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''}`
  }
  
  if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30)
    return `${months} month${months > 1 ? 's' : ''}`
  }
  
  const years = Math.floor(diffInDays / 365)
  const remainingMonths = Math.floor((diffInDays % 365) / 30)
  
  if (remainingMonths === 0) {
    return `${years} year${years > 1 ? 's' : ''}`
  }
  
  return `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`
}

// Helper function to calculate annual savings percentage
export const getAnnualSavings = (monthlyPrice: number, annualPrice: number): number => {
  const monthlyCost = monthlyPrice * 12
  const savings = ((monthlyCost - annualPrice) / monthlyCost) * 100
  return Math.round(savings)
}

// Helper function to calculate annual savings amount
export const getAnnualSavingsAmount = (monthlyPrice: number, annualPrice: number): number => {
  const monthlyCost = monthlyPrice * 12
  return monthlyCost - annualPrice
}

// Trial status helper functions
export const isTrialExpiringSoon = (trialInfo: TrialInfo | null | undefined): boolean => {
  if (!trialInfo) return false
  return trialInfo.trial_status === 'active' && trialInfo.days_remaining <= 3
}

export const isTrialActive = (trialInfo: TrialInfo | null | undefined): boolean => {
  if (!trialInfo) return false
  return trialInfo.trial_status === 'active' && trialInfo.days_remaining > 0
}

export const hasActiveSubscription = (subscriptionInfo: SubscriptionInfo | null | undefined): boolean => {
  if (!subscriptionInfo) return false
  return subscriptionInfo.status === 'active' && (subscriptionInfo.trial_status === 'converted' || subscriptionInfo.trial_status === null)
}

export const isSubscriptionCanceled = (subscriptionInfo: SubscriptionInfo | null): boolean => {
  return subscriptionInfo?.status === 'canceled'
}

// Helper function to get subscription status color for UI
export const getSubscriptionStatusColor = (status: string): string => {
  switch (status) {
    case 'active': return 'green'
    case 'canceled': return 'red'
    case 'past_due': return 'orange'
    case 'incomplete': return 'gray'
    case 'paused': return 'yellow'
    case 'scheduled': return 'blue'
    default: return 'gray'
  }
}

// Helper function to get human-readable subscription status
export const getSubscriptionStatusText = (status: string): string => {
  switch (status) {
    case 'active': return 'Active'
    case 'canceled': return 'Canceled'
    case 'past_due': return 'Past Due'
    case 'incomplete': return 'Incomplete'
    case 'scheduled': return 'Scheduled'
    case 'paused': return 'Paused'
    default: return 'Unknown'
  }
}

// Helper function to get trial status color for UI
export const getTrialStatusColor = (status: string): string => {
  switch (status) {
    case 'active': return 'green'
    case 'expired': return 'red'
    case 'converted': return 'blue'
    default: return 'gray'
  }
}

// Helper function to get human-readable trial status
export const getTrialStatusText = (status: string): string => {
  switch (status) {
    case 'active': return 'Active Trial'
    case 'expired': return 'Trial Expired'
    case 'converted': return 'Subscribed'
    default: return 'Unknown'
  }
}

// Helper function to determine if user needs to upgrade
export const shouldShowUpgradePrompt = (trialInfo: TrialInfo | null | undefined, subscriptionInfo: SubscriptionInfo | null | undefined): boolean => {
  if (!trialInfo) return false
  return (trialInfo.trial_status === 'expired' || isTrialExpiringSoon(trialInfo)) && !hasActiveSubscription(subscriptionInfo)
}

// Helper function to get plan by ID
export const findPlanById = (plans: SubscriptionPlan[], id: string): SubscriptionPlan | undefined => {
  return plans.find(plan => plan.id === id)
}

// Helper function to get available billing cycles for a plan
export const getAvailableBillingCycles = (plan: SubscriptionPlan): ('monthly' | 'annual')[] => {
  const cycles: ('monthly' | 'annual')[] = []
  if (plan.price_monthly_inr > 0) cycles.push('monthly')
  if (plan.price_annual_inr > 0) cycles.push('annual')
  return cycles
}

// Helper function to get plan price by billing cycle
export const getPlanPrice = (plan: SubscriptionPlan, billingCycle: 'monthly' | 'annual'): number => {
  return billingCycle === 'monthly' ? plan.price_monthly_inr : plan.price_annual_inr
}

// Trial initialization mutation - still needed for new user trials
interface TrialInitializationResponse {
  subscriptionId: string
  success: boolean
  message?: string
}

interface TrialInitializationError {
  message: string
  code?: string
}

export function useTrialInitialization() {
  const queryClient = useQueryClient()

  return useMutation<TrialInitializationResponse, TrialInitializationError, void>({
    mutationFn: async (): Promise<TrialInitializationResponse> => {
      const supabase = createClient()
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        throw { message: 'Authentication required' }
      }

      logger.info('Checking for existing trial subscription', { userId: user.id })

      // First, check if user already has a trial subscription
      const { data: existingSubscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('id, trial_start_date, trial_end_date, trial_status')
        .eq('user_id', user.id)
        .not('trial_start_date', 'is', null)
        .single()

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        logger.error('Error checking existing trial', { error: subscriptionError.message })
        // Continue with initialization if it's not a "no rows" error
      }

      if (existingSubscription) {
        logger.info('Trial subscription already exists', { 
          userId: user.id, 
          subscriptionId: existingSubscription.id,
          trialStatus: existingSubscription.trial_status
        })
        
        return {
          subscriptionId: existingSubscription.id,
          success: true,
          message: 'Trial subscription already active!'
        }
      }

      logger.info('No existing trial found, initializing new trial subscription', { userId: user.id })

      // Call the RPC function to initialize trial subscription
      const { data: subscriptionId, error } = await supabase.rpc('initialize_trial_subscription', {
        p_user_id: user.id
      })

      if (error) {
        const errorMessage = error.message || 'Unknown error'
        logger.error('Trial initialization failed', { 
          error: errorMessage, 
          userId: user.id 
        })
        
        // Handle specific error cases
        if (errorMessage.includes('already has a trial subscription')) {
          // This shouldn't happen now since we check first, but handle gracefully
          logger.warn('Trial exists error caught after check - returning success')
          return {
            subscriptionId: 'existing',
            success: true,
            message: 'Trial subscription already active!'
          }
        }
        
        if (errorMessage.includes('No active subscription plan found')) {
          throw { message: 'No subscription plans available at the moment', code: 'NO_PLANS' }
        }
        
        throw { message: errorMessage || 'Failed to initialize trial subscription' }
      }

      if (!subscriptionId) {
        throw { message: 'Failed to create trial subscription' }
      }

      logger.info('Trial subscription initialized successfully', { 
        userId: user.id, 
        subscriptionId 
      })

      return {
        subscriptionId: subscriptionId as string,
        success: true,
        message: 'Trial subscription started successfully!'
      }
    },
    onSuccess: (data) => {
      // Invalidate the consolidated subscription query to refresh UI
      queryClient.invalidateQueries({ queryKey: ['subscription-data'] })
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      
      // Show appropriate success message
      if (data.message?.includes('already active')) {
        toastActions.info('Trial Active', 'Your trial subscription is already active.')
      } else {
        toastActions.success('Trial Started!', data.message || 'Your 14-day free trial has begun.')
      }
      
      logger.info('Trial initialization successful - queries invalidated')
    },
    onError: (error) => {
      logger.error('Trial initialization failed', { error: error.message })
    },
    // Prevent multiple simultaneous trial initialization attempts
    networkMode: 'offlineFirst',
    retry: (failureCount, error) => {
      // Don't retry if no plans available (TRIAL_EXISTS is now handled gracefully)
      if (error.code === 'NO_PLANS') {
        return false
      }
      // Retry up to 2 times for other errors
      return failureCount < 2
    },
    retryDelay: 1000, // 1 second delay between retries
  })
} 