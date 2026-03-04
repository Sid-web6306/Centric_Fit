
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { PaymentService } from '@/services/payment.service'
import { logger } from '@/lib/logger'
import { serverConfig } from '@/lib/config'

// POST /api/payments - Create or update Razorpay subscription
export async function POST(request: NextRequest) {
  try {
    if (!PaymentService.isConfigured()) {
      return NextResponse.json({ error: 'Razorpay not configured' }, { status: 500 })
    }

    const { 
      planId, 
      billingCycle,
      metadata = {}
    } = await request.json()

    if (!planId || !billingCycle) {
      return NextResponse.json({ error: 'Plan ID and billing cycle are required' }, { status: 400 })
    }

    if (!['monthly', 'annual'].includes(billingCycle)) {
      return NextResponse.json({ error: 'Invalid billing cycle' }, { status: 400 })
    }

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile for metadata
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, gym_id, is_gym_owner')
      .eq('id', user.id)
      .single()

    // C3: Verify user has permission to manage subscriptions (gym owner only)
    if (!profile?.is_gym_owner) {
      logger.warn('Unauthorized subscription management attempt', {
        userId: user.id,
        isGymOwner: profile?.is_gym_owner
      })
      return NextResponse.json(
        { error: 'Only gym owners can manage subscriptions' },
        { status: 403 }
      )
    }

    // Get subscription plan details
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('billing_cycle', billingCycle)
      .single()

    if (!plan) {
      return NextResponse.json({ 
        error: 'Plan not found or not properly configured' 
      }, { status: 404 })
    }

    // Check for existing active subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id, status, subscription_plan_id, razorpay_subscription_id, current_period_start, current_period_end')
      .eq('user_id', user.id)
      .eq('gym_id', profile?.gym_id || '')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // If user has an active subscription, handle upgrade/downgrade with payment
    if (existingSubscription) {
      logger.info('Existing active subscription found, handling upgrade/downgrade', {
        userId: user.id,
        gymId: profile?.gym_id,
        existingSubscriptionId: existingSubscription.id,
        currentPlanId: existingSubscription.subscription_plan_id,
        newPlanId: planId,
        billingCycle
      })

      // Check if it's the same plan and billing cycle
      if (existingSubscription.subscription_plan_id === planId) {
        return NextResponse.json({
          error: 'You already have an active subscription for this plan',
          existingSubscription: {
            id: existingSubscription.id,
            status: existingSubscription.status,
            current_period_end: existingSubscription.current_period_end
          }
        }, { status: 400 })
      }

      // Get current plan details for comparison
      const { data: currentPlan } = await supabase
        .from('subscription_plans')
        .select('price_inr, currency, billing_cycle, plan_type, name')
        .eq('id', existingSubscription.subscription_plan_id)
        .single()

      if (!currentPlan) {
        return NextResponse.json({ error: 'Current plan not found' }, { status: 404 })
      }

      // Check if this is a billing cycle change (same plan type, different cycle)
      const isBillingCycleChange = currentPlan.plan_type === plan.plan_type && 
                                   currentPlan.billing_cycle !== billingCycle

      logger.info('Plan change analysis', {
        currentPlan: {
          id: existingSubscription.subscription_plan_id,
          type: currentPlan.plan_type,
          cycle: currentPlan.billing_cycle,
          amount: currentPlan.price_inr
        },
        newPlan: {
          id: planId,
          type: plan.plan_type,
          cycle: billingCycle,
          amount: plan.price_inr
        },
        isBillingCycleChange,
        isTierChange: currentPlan.plan_type !== plan.plan_type
      })

      // M4: Check for scheduled changes on Razorpay subscription before computing proration
      if (existingSubscription.razorpay_subscription_id) {
        try {
          const razorpaySub = await PaymentService.fetchSubscription(existingSubscription.razorpay_subscription_id)
          if (razorpaySub?.has_scheduled_changes) {
            return NextResponse.json({
              error: 'You have a pending plan change scheduled. Please wait for it to take effect or cancel it before making another change.',
              hasScheduledChanges: true,
              effectiveDate: existingSubscription.current_period_end
            }, { status: 409 })
          }
        } catch (rzpError) {
          logger.warn('Could not check Razorpay subscription for scheduled changes:', {
            error: rzpError instanceof Error ? rzpError.message : String(rzpError)
          })
          // Continue with proration — non-blocking check
        }
      }

      // Calculate day-based proration amount
      const currentAmount = currentPlan.price_inr
      const newAmount = plan.price_inr

      // Time-based proration: charge only for the remaining days in the cycle
      const now = new Date()
      const periodStart = new Date(existingSubscription.current_period_start)
      const periodEnd = new Date(existingSubscription.current_period_end)
      const totalDaysInCycle = Math.max(1, Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)))
      const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

      // Daily rate difference × days remaining
      const dailyRateDiff = (newAmount - currentAmount) / totalDaysInCycle
      const prorationAmount = Math.round(dailyRateDiff * daysRemaining)

      logger.info('Day-based proration calculation', {
        currentAmount,
        newAmount,
        totalDaysInCycle,
        daysRemaining,
        dailyRateDiff: Math.round(dailyRateDiff),
        prorationAmount,
        isUpgrade: prorationAmount > 0,
        isDowngrade: prorationAmount < 0,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        currentPlanId: existingSubscription.subscription_plan_id,
        newPlanId: planId,
        billingCycle
      })

      // If it's an upgrade (higher price), create a payment order
      if (prorationAmount > 0) {
        try {
          // Validate proration amount
          if (prorationAmount < 100) { // Minimum 1 rupee in paise
            logger.warn('Proration amount too small, treating as free upgrade', {
              prorationAmount,
              currentAmount,
              newAmount
            })
            
            // Update subscription directly for very small amounts
            const { error: updateError } = await supabase
              .from('subscriptions')
              .update({
                subscription_plan_id: planId,
                amount: plan.price_inr,
                currency: plan.currency || 'INR',
                billing_cycle: billingCycle,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingSubscription.id)

            if (updateError) {
              logger.error('Error updating subscription for small proration:', { error: updateError.message })
              return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
            }

            return NextResponse.json({
              success: true,
              message: 'Subscription upgraded successfully (no payment required)',
              subscription: {
                id: existingSubscription.id,
                status: 'active',
                plan_id: planId,
                billing_cycle: billingCycle,
                amount: plan.price_inr
              }
            })
          }

        // Create Razorpay order for the proration amount
        const orderData = {
          amount: Math.round(prorationAmount), // Amount is already in paise
          currency: plan.currency || 'INR',
          receipt: `upg_${Date.now()}`, // Shortened receipt (max 40 chars)
          notes: {
            type: 'subscription_upgrade',
            subscriptionId: existingSubscription.id,
            oldPlanId: existingSubscription.subscription_plan_id,
            newPlanId: planId,
            billingCycle,
            userId: user.id,
            gymId: profile?.gym_id || ''
          }
        }

          logger.info('Creating Razorpay order with data:', orderData)
          
          const order = await PaymentService.createOrder(orderData)

          logger.info('Razorpay order created for subscription upgrade', {
            orderId: order.id,
            amount: prorationAmount,
            subscriptionId: existingSubscription.id
          })
          
          // Return checkout data for payment
          return NextResponse.json({
            requiresPayment: true,
            orderId: order.id,
            amount: prorationAmount,
            currency: plan.currency || 'INR',
            upgradeType: isBillingCycleChange ? 'billing_cycle_change' : 
                        currentPlan.plan_type !== plan.plan_type ? 'tier_change' : 'plan_change',
            checkout: {
              key: serverConfig.razorpayKeyId,
              order_id: order.id,
              name: 'Centric Fit Pro',
              description: `Subscription upgrade - ${plan.name} (${billingCycle})`,
              image: `${request.headers.get('origin')}/icon.svg`,
              prefill: {
                name: profile?.full_name || user.email?.split('@')[0] || 'Customer',
                email: user.email || '',
              },
              theme: {
                color: '#3B82F6',
              },
            },
            subscriptionData: {
              subscriptionId: existingSubscription.id,
              newPlanId: planId,
              billingCycle,
              newAmount: plan.price_inr,
              currentPlan: {
                id: existingSubscription.subscription_plan_id,
                type: currentPlan.plan_type,
                cycle: currentPlan.billing_cycle,
                amount: currentPlan.price_inr
              },
              newPlan: {
                id: planId,
                type: plan.plan_type,
                cycle: billingCycle,
                amount: plan.price_inr
              }
            }
          })
        } catch (orderError) {
          logger.error('Error creating Razorpay order for upgrade:', { 
            error: orderError instanceof Error ? orderError.message : String(orderError),
            errorDetails: orderError,
            prorationAmount,
            currency: plan.currency || 'INR'
          })
          return NextResponse.json({ 
            error: 'Failed to create payment order',
            details: orderError instanceof Error ? orderError.message : 'Unknown error'
          }, { status: 500 })
        }
      } else {
        // Downgrade - Schedule change at cycle end
        try {
          if (!existingSubscription.razorpay_subscription_id) {
            return NextResponse.json({ error: 'No Razorpay subscription found' }, { status: 400 })
          }

          // Validate plan ID — fail explicitly if not configured (never construct fallback IDs)
          if (!plan.razorpay_plan_id) {
            logger.error('Razorpay plan ID missing for downgrade plan', {
              planId,
              billingCycle
            })
            return NextResponse.json(
              { error: 'Plan not properly configured with payment provider. Please contact support.' },
              { status: 500 }
            )
          }
          const razorpayPlanId = plan.razorpay_plan_id

          logger.info('Attempting to schedule downgrade in Razorpay', {
            subscriptionId: existingSubscription.id,
            razorpaySubscriptionId: existingSubscription.razorpay_subscription_id,
            planId,
            razorpayPlanId,
            billingCycle
          })

          // Update Razorpay subscription to change at cycle end
          await PaymentService.updateSubscription(existingSubscription.razorpay_subscription_id, {
            plan_id: razorpayPlanId,
            schedule_change_at: 'cycle_end',
            customer_notify: true
          })
          
          logger.info('✅ Downgrade scheduled in Razorpay', {
            subscriptionId: existingSubscription.id,
            oldPlanId: existingSubscription.subscription_plan_id,
            newPlanId: planId,
            razorpayPlanId: plan.razorpay_plan_id,
            effectiveDate: existingSubscription.current_period_end
          })

          // Note: DB will be updated via subscription.updated webhook at cycle end
          return NextResponse.json({
            success: true,
            message: 'Downgrade scheduled for end of billing cycle',
            effectiveDate: existingSubscription.current_period_end,
            subscription: {
              id: existingSubscription.id,
              scheduled_change: {
                type: 'downgrade',
                effective_date: existingSubscription.current_period_end,
                new_plan_id: planId,
                new_plan_name: plan.name
              }
            }
          })
        } catch (razorpayError) {
          logger.error('Failed to schedule Razorpay subscription downgrade:', {
            error: razorpayError instanceof Error ? razorpayError.message : String(razorpayError),
            errorDetails: razorpayError,
            subscriptionId: existingSubscription.id,
            razorpaySubscriptionId: existingSubscription.razorpay_subscription_id,
            planId: planId,
            razorpayPlanId: plan.razorpay_plan_id
          })
          
          // Check for UPI restriction
          const errorMessage = razorpayError instanceof Error ? razorpayError.message : String(razorpayError)
          const isUPIRestriction = errorMessage.includes('subscriptions cannot be updated when payment mode is upi')
          
          return NextResponse.json({ 
            error: isUPIRestriction 
              ? 'UPI_SUBSCRIPTION_RESTRICTION' 
              : 'Failed to schedule downgrade with payment provider',
            details: errorMessage,
            isUPIRestriction
          }, { status: 500 })
        }
      }
    }

    // Create or get Razorpay customer
    const customerData = {
      name: profile?.full_name || user.email?.split('@')[0] || 'Customer',
      email: user.email || '',
      notes: {
        userId: user.id,
        gymId: profile?.gym_id || '',
      }
    }

    let customer
    try {
      // B6: First check for stored razorpay_customer_id from previous subscriptions
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('razorpay_customer_id')
        .eq('user_id', user.id)
        .not('razorpay_customer_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existingSub?.razorpay_customer_id) {
        // Use stored customer ID — skip Razorpay API search
        logger.info('Using stored Razorpay customer ID', {
          customerId: existingSub.razorpay_customer_id
        })
        customer = { id: existingSub.razorpay_customer_id }
      } else {
        // Fallback: search Razorpay for existing customer by email
        let existingCustomer = null
        if (user.email) {
          const customers = await PaymentService.fetchAllCustomers({
            count: 100
          })
          logger.info('Razorpay customers:', { customers: customers.items.length })
          existingCustomer = customers.items.find((c: { email?: string }) => c.email === user.email)
        }

        if (existingCustomer) {
          logger.info('Razorpay customer found via search:', { customer: existingCustomer })
          customer = existingCustomer
        } else {
          customer = await PaymentService.createCustomer(customerData)
        }
      }
    } catch (error) {
      logger.error('Error creating/finding Razorpay customer:', { error: error instanceof Error ? error.message : JSON.stringify(error) })
      return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
    }

    // Validate Razorpay plan ID before creating subscription
    if (!plan.razorpay_plan_id) {
      logger.error('Razorpay plan ID missing for new subscription', { planId, billingCycle })
      return NextResponse.json(
        { error: 'Plan not properly configured with payment provider. Please contact support.' },
        { status: 500 }
      )
    }

    // Create subscription
    const subscriptionData = {
      plan_id: plan.razorpay_plan_id,
      customer_id: customer.id,
      quantity: 1,
      total_count: billingCycle === 'annual' ? 12 : 60, // 5 years max
      notes: {
        userId: user.id,
        gymId: profile?.gym_id || '',
        planId,
        billingCycle,
        ...metadata,
      }
    }

    try {
      const subscription = await PaymentService.createSubscription(subscriptionData)

      logger.info('Razorpay subscription created:', {
        subscriptionId: subscription.id,
        customerId: customer.id,
        planId,
        billingCycle,
        userId: user.id,
        amount: plan.price_inr,
      })

      // Return data required to open Razorpay Checkout on frontend
      return NextResponse.json({
        subscriptionId: subscription.id,
        customerId: customer.id,
        checkout: {
          ...(process.env.RAZORPAY_OFFER_ID ? { offer_id: process.env.RAZORPAY_OFFER_ID } : {}),
          key: serverConfig.razorpayKeyId,
          subscription_id: subscription.id,
          name: 'Centric Fit Pro',
          description: `${plan.name} - ${billingCycle} Subscription`,
          image: `${request.headers.get('origin')}/icon.svg`,
          webview_intent: true,
          prefill: {
            name: customerData.name,
            email: customerData.email,
          },
          theme: {
            color: '#3B82F6',
          },
        }
      })
    } catch (error) {
      logger.error('Error creating Razorpay subscription:', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
    }

  } catch (error) {
    logger.error('Payments API error:', { error: error instanceof Error ? error.message : String(error) })
    
    return NextResponse.json({ 
      error: 'Failed to create payment' 
    }, { status: 500 })
  }
}

// Note: Payment verification is now handled entirely by Razorpay and webhooks
// The hosted checkout flow doesn't require custom verification endpoints 