import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { PaymentService } from '@/services/payment.service';
import { logger, performanceTracker } from '@/lib/logger';
import { serverConfig } from '@/lib/config';
// Import Razorpay's official webhook validation utility
import { validateWebhookSignature } from 'razorpay/dist/utils/razorpay-utils';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

// Helper function to invalidate chart access cache after subscription changes
async function invalidateChartAccessCache(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  try {
    // Get user's gym ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('gym_id')
      .eq('id', userId)
      .single()

    if (profile?.gym_id) {
      const { error } = await supabase
        .rpc('invalidate_chart_access_cache', {
          p_user_id: userId,
          p_gym_id: profile.gym_id
        })

      if (error) {
        logger.warn('⚠️ Failed to invalidate chart access cache', {
          userId,
          gymId: profile.gym_id,
          error: error.message
        })
      } else {
        logger.info('✅ Chart access cache invalidated', {
          userId,
          gymId: profile.gym_id
        })
      }
    }
  } catch (error) {
    logger.warn('⚠️ Error invalidating chart access cache', {
      userId,
      error: error instanceof Error ? error.message : String(error)
    })
    // Don't throw - cache invalidation is not critical
  }
}

// Razorpay webhook event types
interface RazorpayPaymentEntity {
  id: string
  amount: number
  currency: string
  status: string
  method: string
  captured: boolean
  created_at: number
  email?: string
  contact?: string
  error_code?: string
  error_description?: string
  notes?: Record<string, string>
}

interface RazorpaySubscriptionEntity {
  id: string
  plan_id: string
  customer_id: string
  status: string
  current_start: number
  current_end: number
  ended_at?: number
  charge_at: number
  total_count: number
  paid_count: number
  remaining_count: number
  plan?: {
    item?: {
      amount: number
    }
  }
  notes?: Record<string, string>
  has_scheduled_changes?: boolean
  change_scheduled_at?: number
}

interface RazorpayWebhookEvent {
  event: string
  created_at: number
  payload: {
    payment?: {
      entity: RazorpayPaymentEntity
    }
    subscription?: {
      entity: RazorpaySubscriptionEntity
    }
  }
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const razorpaySignature = headersList.get('x-razorpay-signature');
  const webhookId = headersList.get('x-razorpay-webhook-id') || 
                    `webhook_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  const processingStart = Date.now();
  performanceTracker.start('razorpay-webhook');

  const supabase = await createClient();

  // ✅ Check for duplicate webhook processing (IDEMPOTENCY)
  const { data: existingWebhook } = await supabase
    .from('webhook_events')
    .select('id, status')
    .eq('webhook_id', webhookId)
    .single();

  if (existingWebhook) {
    logger.info('Webhook already processed, skipping', { 
      webhookId,
      status: existingWebhook.status
    });
    return NextResponse.json({ 
      received: true, 
      status: 'already_processed',
      webhook_id: webhookId 
    });
  }

  // Verify webhook signature using Razorpay SDK
  if (!serverConfig.razorpayWebhookSecret) {
    logger.error('Razorpay webhook secret not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  try {
    // ✅ Use Razorpay's official validation utility
    const isValid = validateWebhookSignature(
      body,
      razorpaySignature || '',
      serverConfig.razorpayWebhookSecret
    );

    if (!isValid) {
      logger.error('Webhook signature verification failed', { 
        webhookId,
        signatureProvided: razorpaySignature?.substring(0, 10) + '...'
      });
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }
  } catch (err) {
    logger.error('Webhook signature verification error', { 
      webhookId,
      error: err instanceof Error ? err.message : String(err) 
    });
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  let event: RazorpayWebhookEvent | null = null;

  try {
    event = JSON.parse(body) as RazorpayWebhookEvent;
    
    const eventId = event.payload?.payment?.entity?.id || event.payload?.subscription?.entity?.id || 'unknown';
    
    logger.info('Processing Razorpay webhook', { 
      eventType: event.event,
      eventId,
      webhookId
    });

    // ✅ Create webhook event record immediately for idempotency
    await supabase
      .from('webhook_events')
      .insert({
        webhook_id: webhookId,
        event_type: event.event,
        status: 'processing',
        raw_event: JSON.parse(body),
        razorpay_event_id: eventId,
        created_at: new Date().toISOString()
      });

    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event, supabase, processingStart);
        break;
        
      case 'payment.failed':
        await handlePaymentFailed(event, supabase, processingStart);
        break;
        
      case 'subscription.activated':
        await handleSubscriptionActivated(event, supabase, processingStart);
        break;
        
      case 'subscription.charged':
        await handleSubscriptionCharged(event, supabase, processingStart);
        break;
        
      case 'subscription.updated':
        await handleSubscriptionUpdated(event, supabase, processingStart);
        break;
        
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event, supabase, processingStart);
        break;
      default:
        logger.warn('Unhandled webhook event type', { eventType: event.event, eventId: event.payload?.payment?.entity?.id || event.payload?.subscription?.entity?.id });
    }

    const processingDuration = Date.now() - processingStart;
    logger.info(`✅ Webhook processed successfully in ${processingDuration}ms`);
    
    // ✅ Mark webhook as completed
    await supabase
      .from('webhook_events')
      .update({ 
        status: 'completed',
        processed_at: new Date().toISOString(),
        processing_duration_ms: processingDuration
      })
      .eq('webhook_id', webhookId);
    
    return NextResponse.json({ 
      received: true, 
      event_type: event.event,
      processing_time_ms: processingDuration,
      webhook_id: webhookId
    });

  } catch (error) {
    const processingDuration = Date.now() - processingStart;
    const errorInstance = error instanceof Error ? error : new Error(String(error));
    
    // Enhanced error logging
    await logWebhookError(event, errorInstance, supabase, processingDuration);
    
    // ✅ Mark webhook as failed
    await supabase
      .from('webhook_events')
      .update({ 
        status: 'failed',
        error_message: errorInstance.message,
        processed_at: new Date().toISOString(),
        processing_duration_ms: processingDuration
      })
      .eq('webhook_id', webhookId);
    
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      event_type: event?.event || 'unknown',
      processing_time_ms: processingDuration,
      webhook_id: webhookId
    }, { status: 500 });
  }
}

async function handlePaymentCaptured(
  event: RazorpayWebhookEvent, 
  supabase: SupabaseClient, 
  processingStart: number
): Promise<void> {
  const payment = event.payload.payment!.entity;
  
  logger.info('🎯 Payment captured', { 
    paymentId: payment.id,
    amount: payment.amount,
    currency: payment.currency,
    method: payment.method
  });

  // If this payment is related to a subscription, update the subscription status
  if (payment.notes?.subscriptionId) {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('razorpay_subscription_id', payment.notes.subscriptionId);

    if (error) {
      logger.error('❌ Error updating subscription after payment capture', { 
        error: error.message,
        paymentId: payment.id,
        subscriptionId: payment.notes.subscriptionId
      });
    }
  }

  await logWebhookEvent(event, supabase, Date.now() - processingStart);
}

async function handlePaymentFailed(
  event: RazorpayWebhookEvent, 
  supabase: SupabaseClient, 
  processingStart: number
): Promise<void> {
  const payment = event.payload.payment!.entity;
  logger.info('Payment failed', { payment });
  logger.warn('⚠️ Payment failed', { 
    paymentId: payment.id,
    amount: payment.amount,
    currency: payment.currency,
    errorCode: payment.error_code,
    errorDescription: payment.error_description,
    notes: payment.notes
  });

  // If this payment is related to a subscription, update the subscription status
  if (payment.notes?.subscriptionId) {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('razorpay_subscription_id', payment.notes.subscriptionId);

    if (error) {
      logger.error('❌ Error updating subscription after payment failure', { 
        error: error.message,
        paymentId: payment.id,
        subscriptionId: payment.notes.subscriptionId
      });
    }
  }

  await logWebhookEvent(event, supabase, Date.now() - processingStart);
}

async function handleSubscriptionActivated(
  event: RazorpayWebhookEvent, 
  supabase: SupabaseClient, 
  processingStart: number
): Promise<void> {
  const subscription = event.payload.subscription!.entity;
  
  logger.info('✅ Subscription activated', { 
    subscriptionId: subscription.id,
    planId: subscription.plan_id,
    customerId: subscription.customer_id,
    status: subscription.status
  });

  // Find user from subscription notes or customer
  let userId: string | null = subscription.notes?.userId || null;

  if (!userId) {
    // Try to find user by customer ID
    if (PaymentService.isConfigured()) {
      try {
        const razorpay = PaymentService.getRazorpayInstance();
        if (razorpay) {
          const customer = await razorpay.customers.fetch(subscription.customer_id);
          if (customer.email) {
            const { data: profile } = await supabase.rpc('get_user_id_by_email', {
              p_email: customer.email
            });
            userId = profile;
          }
        }
      } catch (error) {
        logger.warn('⚠️ Could not fetch customer details', { 
          customerId: subscription.customer_id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  if (!userId) {
    logger.error('❌ Could not find user for subscription', { 
      subscriptionId: subscription.id,
      customerId: subscription.customer_id
    });
    return;
  }

  // Check if subscription already exists
  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('razorpay_subscription_id', subscription.id)
    .single();

  if (existingSubscription) {
    // Update existing subscription
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_start: new Date(subscription.current_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('razorpay_subscription_id', subscription.id);

    if (error) {
      const errorInstance = new Error(`Failed to update subscription: ${error.message}`);
      logger.error('❌ Error updating subscription', { 
        error: error.message,
        subscriptionId: subscription.id
      });
      await logWebhookError(event, errorInstance, supabase, Date.now() - processingStart);
    }
  } else {
    // Find plan by Razorpay plan ID
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('id, name, billing_cycle')
      .eq('razorpay_plan_id', subscription.plan_id)
      .single();

    if (!plan) {
      logger.error('❌ Plan not found for subscription', { 
        planId: subscription.plan_id,
        subscriptionId: subscription.id
      });
      return;
    }

    // Create new subscription
    const { error } = await supabase.rpc('create_subscription', {
      p_user_id: userId,
      p_plan_id: plan.id,
      p_billing_cycle: plan.billing_cycle,
      p_razorpay_customer_id: subscription.customer_id,
      p_razorpay_subscription_id: subscription.id,
      p_razorpay_price_id: subscription.plan_id,
      p_amount: subscription.plan?.item?.amount || 0,
      p_current_period_start: new Date(subscription.current_start * 1000).toISOString(),
      p_current_period_end: new Date(subscription.current_end * 1000).toISOString()
    });

    if (error) {
      const errorInstance = new Error(`Failed to create subscription: ${error.message}`);
      logger.error('❌ Error creating subscription', { 
        error: error.message,
        subscriptionId: subscription.id,
        userId,
        planId: plan.id
      });
      await logWebhookError(event, errorInstance, supabase, Date.now() - processingStart);
      return;
    }

    logger.info('✅ Subscription created successfully', { 
      subscriptionId: subscription.id,
      userId,
      planName: plan.name
    });

    // After successfully creating the new subscription in our DB, cancel any previous active subscriptions
    try {
      const { data: previousSubs } = await supabase
        .from('subscriptions')
        .select('id, razorpay_subscription_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .neq('razorpay_subscription_id', subscription.id)

      if (previousSubs && previousSubs.length > 0) {
        if (PaymentService.isConfigured()) {
          const razorpay = PaymentService.getRazorpayInstance()
          if (razorpay) {
            for (const prev of previousSubs) {
              if (prev.razorpay_subscription_id) {
                try {
                  await razorpay.subscriptions.cancel(prev.razorpay_subscription_id, 0)
                  await supabase
                    .from('subscriptions')
                    .update({ status: 'canceled', canceled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
                    .eq('id', prev.id)
                  logger.info('Canceled previous active subscription after new activation', {
                    userId,
                    oldRazorpaySubscriptionId: prev.razorpay_subscription_id,
                    newRazorpaySubscriptionId: subscription.id
                  })
                } catch (cancelErr) {
                  logger.error('Failed to cancel previous subscription after new activation', {
                    error: cancelErr instanceof Error ? cancelErr.message : String(cancelErr),
                    userId,
                    oldRazorpaySubscriptionId: prev.razorpay_subscription_id
                  })
                }
              }
            }
          }
        }
      }
    } catch (cleanupErr) {
      logger.error('Error while cleaning up previous subscriptions after activation', {
        error: cleanupErr instanceof Error ? cleanupErr.message : String(cleanupErr),
        userId
      })
    }
  }

  // 🔒 Invalidate chart access cache after subscription activated
  if (userId) {
    await invalidateChartAccessCache(supabase, userId)
  }

  await logWebhookEvent(event, supabase, Date.now() - processingStart);
}

async function handleSubscriptionCharged(
  event: RazorpayWebhookEvent, 
  supabase: SupabaseClient, 
  processingStart: number
): Promise<void> {
  const subscription = event.payload.subscription!.entity;
  const payment = event.payload.payment?.entity;
  
  logger.info('💳 Subscription charged', { 
    subscriptionId: subscription.id,
    paymentId: payment?.id,
    amount: payment?.amount,
    status: subscription.status
  });

  // Update subscription with new period dates
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_start: new Date(subscription.current_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('razorpay_subscription_id', subscription.id);

  if (error) {
    logger.error('❌ Error updating subscription after charge', { 
      error: error.message,
      subscriptionId: subscription.id
    });
  }

  await logWebhookEvent(event, supabase, Date.now() - processingStart);
}

async function handleSubscriptionCancelled(
  event: RazorpayWebhookEvent, 
  supabase: SupabaseClient, 
  processingStart: number
): Promise<void> {
  const subscription = event.payload.subscription!.entity;
  
  logger.info('🚫 Subscription cancelled', { 
    subscriptionId: subscription.id,
    status: subscription.status,
    endedAt: subscription.ended_at
  });

  // Update subscription status with enhanced tracking for end-of-cycle cancellation
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      ends_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : new Date().toISOString(),
      canceled_at: new Date().toISOString(),
      cancel_at_period_end: false, // Now actually cancelled (was scheduled before)
      updated_at: new Date().toISOString()
    })
    .eq('razorpay_subscription_id', subscription.id);

  if (error) {
    logger.error('❌ Error canceling subscription', { 
      error: error.message,
      subscriptionId: subscription.id
    });
  } else {
    logger.info('✅ Subscription successfully marked as canceled in database', {
      subscriptionId: subscription.id,
      canceledAt: new Date().toISOString(),
      endsAt: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : new Date().toISOString()
    });

    // 🔒 Invalidate chart access cache after subscription cancelled
    // Get user from subscription notes
    const userId = subscription.notes?.userId
    if (userId) {
      await invalidateChartAccessCache(supabase, userId)
    } else {
      // Try to get user from DB subscription
      const { data: dbSub } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('razorpay_subscription_id', subscription.id)
        .single()
      if (dbSub?.user_id) {
        await invalidateChartAccessCache(supabase, dbSub.user_id)
      }
    }
  }

  await logWebhookEvent(event, supabase, Date.now() - processingStart);
}

async function handleSubscriptionUpdated(
  event: RazorpayWebhookEvent, 
  supabase: SupabaseClient, 
  processingStart: number
): Promise<void> {
  const subscription = event.payload.subscription!.entity;
  
  logger.info('🔄 Subscription updated', { 
    subscriptionId: subscription.id,
    planId: subscription.plan_id,
    status: subscription.status,
    hasScheduledChanges: subscription.has_scheduled_changes,
    changeScheduledAt: subscription.change_scheduled_at
  });

  // Find the subscription in our database
  const { data: dbSubscription, error: fetchError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('razorpay_subscription_id', subscription.id)
    .single()

  if (fetchError || !dbSubscription) {
    logger.error('❌ Subscription not found in DB for webhook update', {
      razorpaySubscriptionId: subscription.id,
      error: fetchError?.message
    })
    await logWebhookEvent(event, supabase, Date.now() - processingStart);
    return
  }

  // Get new plan details from Razorpay plan_id
  const { data: newPlan, error: planError } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('razorpay_plan_id', subscription.plan_id)
    .single()

  if (planError || !newPlan) {
    logger.error('❌ New plan not found for webhook update', {
      razorpayPlanId: subscription.plan_id,
      error: planError?.message
    })
    await logWebhookEvent(event, supabase, Date.now() - processingStart);
    return
  }

  // Determine change type for logging
  const changeType = subscription.has_scheduled_changes ? 
    'scheduled_downgrade_applied' : 'immediate_upgrade_applied';

  logger.info('⚡ Applying subscription change', {
    subscriptionId: dbSubscription.id,
    newPlanId: newPlan.id,
    oldPlanId: dbSubscription.subscription_plan_id,
    changeType
  })

  // Update subscription in database - works for both upgrades and downgrades
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      subscription_plan_id: newPlan.id,
      amount: newPlan.price_inr,
      billing_cycle: newPlan.billing_cycle,
      current_period_start: new Date(subscription.current_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_end * 1000).toISOString(),
      scheduled_change_type: null,
      scheduled_change_effective_date: null,
      scheduled_change_data: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', dbSubscription.id)

  if (updateError) {
    logger.error('❌ Error applying subscription change in DB', {
      error: updateError.message,
      subscriptionId: dbSubscription.id
    })
  } else {
    logger.info('✅ Subscription change applied successfully', {
      subscriptionId: dbSubscription.id,
      oldPlanId: dbSubscription.subscription_plan_id,
      newPlanId: newPlan.id,
      changeType
    })

    // Log the change event
    await supabase
      .from('subscription_events')
      .insert({
        subscription_id: dbSubscription.id,
        event_type: 'plan_changed',
        event_data: {
          old_plan_id: dbSubscription.subscription_plan_id,
          new_plan_id: newPlan.id,
          change_type: changeType,
          razorpay_plan_id: subscription.plan_id
        },
        webhook_id: subscription.id,
        processing_duration_ms: 0
      })

    // 🔒 Invalidate chart access cache after subscription updated
    if (dbSubscription.user_id) {
      await invalidateChartAccessCache(supabase, dbSubscription.user_id)
    }
  }

  await logWebhookEvent(event, supabase, Date.now() - processingStart);
}


async function logWebhookEvent(
  event: RazorpayWebhookEvent,
  supabase: SupabaseClient,
  processingDuration: number
): Promise<void> {
  // Find subscription ID if event relates to a subscription
  let subscriptionId = null;
  
  const razorpaySubscriptionId = event.payload?.subscription?.entity?.id;
  
  if (razorpaySubscriptionId) {
    const { data } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('razorpay_subscription_id', razorpaySubscriptionId)
      .single();
    
    subscriptionId = data?.id;
  }

  if (subscriptionId) {
    await supabase
      .from('subscription_events')
      .insert({
        subscription_id: subscriptionId,
        event_type: event.event.includes('payment') ? 
          (event.event.includes('captured') ? 'payment_succeeded' : 'payment_failed') :
          event.event.replace('subscription.', ''),
        event_data: {
          razorpay_event_id: event.payload?.subscription?.entity?.id || event.payload?.payment?.entity?.id,
          razorpay_event_type: event.event,
          event_created: event.created_at || Math.floor(Date.now() / 1000)
        },
        webhook_id: event.payload?.subscription?.entity?.id || event.payload?.payment?.entity?.id || 'unknown',
        processing_duration_ms: processingDuration
      });
  }
}

async function logWebhookError(
  event: RazorpayWebhookEvent | null,
  error: Error,
  supabase: SupabaseClient,
  processingDuration: number
): Promise<void> {
  const eventId = event?.payload?.subscription?.entity?.id || event?.payload?.payment?.entity?.id || 'unknown';
  
  logger.error(`❌ Webhook error for ${event?.event || 'unknown'}`, {
    eventType: event?.event || 'unknown',
    eventId,
    error: error.message,
    stack: error.stack,
    processingDuration
  });

  // Also log detailed error to subscription_events table if it's subscription-related
  if (event?.event?.startsWith('subscription.')) {
    const razorpaySubscriptionId = event.payload?.subscription?.entity?.id;
    
    if (razorpaySubscriptionId) {
      const { data } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('razorpay_subscription_id', razorpaySubscriptionId)
        .single();
      
      if (data?.id) {
        await supabase
          .from('subscription_events')
          .insert({
            subscription_id: data.id,
            event_type: 'error',
            event_data: {
              razorpay_event_id: eventId,
              razorpay_event_type: event.event,
              error_message: error.message,
              error_stack: error.stack,
              event_created: event.created_at || Math.floor(Date.now() / 1000)
            },
            webhook_id: eventId,
            processing_duration_ms: processingDuration
          });
      }
    }
  }
}