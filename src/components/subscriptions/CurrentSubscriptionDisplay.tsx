'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { 
  DynamicCard,
  DynamicCardContent,
  DynamicCardDescription,
  DynamicCardHeader,
  DynamicCardTitle,
  DynamicButton,
  DynamicBadge,
  DynamicUsers,
  DynamicStar,
  DynamicZap,
  DynamicCheck,
  DynamicArrowUpRight,
  DynamicCreditCard,
  DynamicCalendar,
  DynamicTimer,
  DynamicCheckCircle,
  DynamicAlertTriangle,
  DynamicX
} from '@/lib/dynamic-imports'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useSimplifiedPaymentSystem, useTrialStatus, isTrialActive, hasActiveSubscription } from '@/hooks/use-simplified-payments'
import { SubscriptionPlan } from '@/hooks/use-trial'

export function CurrentSubscriptionDisplay({ className = "" }) {
  const router = useRouter()
  const { currentSubscription, plans, isLoading, error, subscriptionAction } = useSimplifiedPaymentSystem()
  const { trial: trialInfo, isLoading: trialLoading } = useTrialStatus()
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [rating, setRating] = useState<number | undefined>(undefined)
  const [wouldRecommend, setWouldRecommend] = useState<boolean | undefined>(undefined)
  const [isCancelling, setIsCancelling] = useState(false)

  // Priority logic: Trial first, then subscription
  const isOnTrial = trialInfo && isTrialActive(trialInfo)
  const hasSubscription = hasActiveSubscription(currentSubscription || null)
  const showTrialStatus = isOnTrial && !hasSubscription

  // Get plan icon based on tier
  const getPlanIcon = (tierLevel: number) => {
    switch (tierLevel) {
      case 1: return DynamicUsers
      case 2: return DynamicStar  
      case 3: return DynamicZap
      default: return DynamicUsers
    }
  }

  // Get plan color based on tier
  const getPlanColor = (tierLevel: number) => {
    switch (tierLevel) {
      case 1: return 'blue'
      case 2: return 'yellow'
      case 3: return 'purple'
      default: return 'blue'
    }
  }

  // Format price from paise to rupees
  const formatPrice = (priceInPaise: number) => {
    return Math.round(priceInPaise / 100)
  }
  const handleUpgradeClick = () => {
    router.push('/upgrade')
  }

  const handleCancelSubscription = async () => {
    if (!currentSubscription?.id) return
    
    setIsCancelling(true)
    try {
      await subscriptionAction.mutateAsync({
        action: 'cancel',
        subscriptionId: currentSubscription.id,
        feedback: cancelReason || rating !== undefined || wouldRecommend !== undefined ? {
          reason: cancelReason,
          feedbackText: '',
          rating,
          wouldRecommend
        } : undefined
      })
      setShowCancelModal(false)
      setCancelReason('')
      setRating(undefined)
      setWouldRecommend(undefined)
    } catch (error) {
      console.error('Failed to cancel subscription:', error)
    } finally {
      setIsCancelling(false)
    }
  }

  if (isLoading || trialLoading) {
    return (
      <div className={`flex items-center justify-center min-h-[300px] ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading subscription...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-red-500 mb-2">Failed to load subscription details</p>
        <p className="text-muted-foreground text-sm">Please try refreshing the page</p>
      </div>
    )
  }

  // Show trial status first (if user is on trial)
  if (showTrialStatus) {
    return (
      <div className={`space-y-6 pt-6 ${className}`}>
        <DynamicCard className="border-2 border-primary/50 shadow-lg bg-gradient-to-b from-card to-primary/5">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-50">
            <DynamicBadge className="bg-gradient-to-r from-primary/90 to-primary/70 text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold shadow-lg border-0">
              Free Trial
            </DynamicBadge>
          </div>
          
          <DynamicCardHeader className="text-center pb-4 pt-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-primary/15">
                <DynamicTimer className="h-5 w-5 text-primary" />
              </div>
              <DynamicCardTitle className="text-xl">
                Trial Period Active
              </DynamicCardTitle>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-primary">
                  {trialInfo?.days_remaining || 0}
                </span>
                <span className="text-muted-foreground">
                  days remaining
                </span>
              </div>
            </div>
            
            <DynamicCardDescription className="text-base mt-2">
              Choose a plan to continue after your trial ends
            </DynamicCardDescription>
          </DynamicCardHeader>
          
          <DynamicCardContent className="space-y-6 pt-0">
            {/* Trial Benefits */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Trial Includes
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <DynamicCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Full access to all features</span>
                </div>
                <div className="flex items-center gap-3">
                  <DynamicCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Up to 50 members</span>
                </div>
                <div className="flex items-center gap-3">
                  <DynamicCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Basic analytics and reporting</span>
                </div>
                <div className="flex items-center gap-3">
                  <DynamicCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Email support</span>
                </div>
              </div>
            </div>
            
            {/* Action Button */}
            <div className="flex justify-center pt-4">
              <DynamicButton 
                onClick={handleUpgradeClick}
                className="cursor-pointer bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 border-0"
                size="lg"
              >
                <DynamicArrowUpRight className="h-4 w-4 mr-2" />
                Choose Your Plan
              </DynamicButton>
            </div>
          </DynamicCardContent>
        </DynamicCard>
      </div>
    )
  }

  // Show subscription details if user has active subscription
  if (hasSubscription && currentSubscription) {
    // Find the current plan details from plans data
    const currentPlan = plans?.plans?.find((plan: SubscriptionPlan) => 
      plan.id === currentSubscription.subscription_plan_id
    ) || plans?.groupedPlans?.[`${currentSubscription.plan_type}_${currentSubscription.billing_cycle}`]

    if (!currentPlan) {
      return (
        <div className={`${className}`}>
          <DynamicCard>
            <DynamicCardContent className="py-8 text-center">
              <p className="text-muted-foreground">Unable to load plan details</p>
              <DynamicButton 
                onClick={handleUpgradeClick}
                variant="outline"
                className="mt-4 cursor-pointer"
              >
                <DynamicArrowUpRight className="h-4 w-4 mr-2" />
                View Plans
              </DynamicButton>
            </DynamicCardContent>
          </DynamicCard>
        </div>
      )
    }

    const PlanIcon = getPlanIcon(currentPlan.tier_level || 1)
    const planColor = getPlanColor(currentPlan.tier_level || 1)
    const isActive = currentSubscription.status === 'active'
    const nextBillingDate = new Date(currentSubscription.current_period_end)

    return (
      <div className={`space-y-6 pt-6 ${className}`}>
        {/* Current Plan Card */}
        <DynamicCard className="border-2 border-primary shadow-xl shadow-primary/20 bg-gradient-to-b from-card to-primary/5">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-50">
            <DynamicBadge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold shadow-lg border-0">
              Current Plan
            </DynamicBadge>
          </div>
          
          <DynamicCardHeader className="text-center pb-4 pt-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className={`p-2 rounded-full ${
                planColor === 'blue' ? 'bg-primary/10' : 
                planColor === 'yellow' ? 'bg-primary/15' : 
                'bg-primary/20'
              }`}>
                <PlanIcon className="h-5 w-5 text-primary" />
              </div>
              <DynamicCardTitle className="text-xl">
                {currentPlan.plan_type.charAt(0).toUpperCase() + currentPlan.plan_type.slice(1)} Plan
              </DynamicCardTitle>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold">
                  ₹{formatPrice(currentPlan.price_inr)}
                </span>
                <span className="text-muted-foreground">
                  /{currentSubscription.billing_cycle === 'monthly' ? 'month' : 'year'}
                </span>
              </div>
            </div>
            
            <DynamicCardDescription className="text-base mt-2">
              {currentPlan.member_limit 
                ? `Up to ${currentPlan.member_limit} members` 
                : 'Unlimited members'
              }
            </DynamicCardDescription>
          </DynamicCardHeader>
          
          <DynamicCardContent className="space-y-6 pt-0">
            {/* Subscription Status */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-card/80 rounded-lg border border-border/50">
                <div className="flex items-center gap-2">
                  <DynamicCheckCircle className={`h-4 w-4 ${isActive ? 'text-green-500' : 'text-yellow-500'}`} />
                  <span className="text-sm font-medium">Status</span>
                </div>
                <DynamicBadge variant={isActive ? 'default' : 'secondary'}>
                  {currentSubscription.status}
                </DynamicBadge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-card/80 rounded-lg border border-border/50">
                <div className="flex items-center gap-2">
                  <DynamicCalendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Next billing</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {nextBillingDate.toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Included Features
              </h4>
              <div className="space-y-2">
                {currentPlan.features.map((feature: string) => (
                  <div key={feature} className="flex items-center gap-3">
                    <DynamicCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scheduled Change Section */}
            {currentSubscription?.scheduled_change_type === 'plan_change' && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-800">
                      Scheduled Downgrade
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      Changes to {currentSubscription.scheduled_change_data?.newPlanName} on {new Date(currentSubscription.scheduled_change_effective_date).toLocaleDateString('en-IN')}
                    </p>
                    <p className="text-xs text-orange-500 mt-1">
                      Plan changes are locked until this takes effect
                    </p>
                  </div>
                  <div className="ml-3">
                    <DynamicTimer className="h-4 w-4 text-orange-600" />
                  </div>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <DynamicButton 
                onClick={handleUpgradeClick}
                variant="outline"
                className="flex-1 cursor-pointer hover:bg-primary/5 hover:border-primary/50"
              >
                <DynamicArrowUpRight className="h-4 w-4 mr-2" />
                Upgrade Plan
              </DynamicButton>
              
              <DynamicButton 
                onClick={() => setShowCancelModal(true)}
                variant="outline"
                className="flex-1 cursor-pointer hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors duration-200"
              >
                <DynamicX className="h-4 w-4 mr-2" />
                Cancel Subscription
              </DynamicButton>
            </div>

            {/* Cancellation Confirmation Modal */}
            <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <DynamicAlertTriangle className="h-5 w-5 text-orange-600" />
                    Cancel Subscription
                  </DialogTitle>
                  <DialogDescription>
                    You&apos;ll continue to have access until {nextBillingDate.toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <section>
                    <label htmlFor="cancel-reason" className="block text-sm font-medium mb-2">
                      Reason for cancellation (optional)
                    </label>
                    <textarea
                      id="cancel-reason"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      rows={3}
                      placeholder="Help us improve by sharing your reason..."
                    />
                  </section>

                  <section>
                    <label className="block text-sm font-medium mb-2">
                      How would you rate your experience? (optional)
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`p-1 rounded transition-colors ${
                            star <= (rating || 0)
                              ? 'text-yellow-500 hover:text-yellow-600'
                              : 'text-gray-300 hover:text-yellow-400'
                          }`}
                        >
                          <svg className="w-6 h-6 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <label className="block text-sm font-medium mb-2">
                      Would you recommend us to others? (optional)
                    </label>
                    <div className="flex gap-3">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="recommend"
                          value="yes"
                          checked={wouldRecommend === true}
                          onChange={() => setWouldRecommend(true)}
                          className="mr-2 text-red-500 focus:ring-red-500"
                        />
                        <span className="text-sm">Yes</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="recommend"
                          value="no"
                          checked={wouldRecommend === false}
                          onChange={() => setWouldRecommend(false)}
                          className="mr-2 text-red-500 focus:ring-red-500"
                        />
                        <span className="text-sm">No</span>
                      </label>
                    </div>
                  </section>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-3 pt-4">
                  <DynamicButton
                    onClick={() => setShowCancelModal(false)}
                    variant="outline"
                    className="flex-1"
                    disabled={isCancelling}
                  >
                    Keep Subscription
                  </DynamicButton>
                  <DynamicButton
                    onClick={handleCancelSubscription}
                    variant="destructive"
                    className="flex-1"
                    disabled={isCancelling}
                  >
                    {isCancelling ? 'Cancelling...' : 'Cancel Subscription'}
                  </DynamicButton>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </DynamicCardContent>
        </DynamicCard>
      </div>
    )
  }

  // No subscription or trial - show call to action
  return (
    <div className={`${className}`}>
      <DynamicCard className="border-dashed border-2 border-muted-foreground/25">
        <DynamicCardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 bg-muted/50 rounded-full mb-4">
            <DynamicCreditCard className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            You don&apos;t have an active subscription. Choose a plan to get started with all the features.
          </p>
          <DynamicButton 
            onClick={handleUpgradeClick}
            className="cursor-pointer bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 border-0"
          >
            <DynamicArrowUpRight className="h-4 w-4 mr-2" />
            Choose a Plan
          </DynamicButton>
        </DynamicCardContent>
      </DynamicCard>
    </div>
  )
}