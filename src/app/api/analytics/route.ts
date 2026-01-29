import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { checkUserPermission } from '@/actions/rbac.actions'
import { logger } from '@/lib/logger'

// Plan tier type for analytics access control
type PlanTier = 'trial' | 'starter' | 'professional' | 'enterprise'
type AnalyticsCategory = 'operational' | 'growth' | 'revenue' | 'advanced'

// Analytics data categories by plan tier
const ANALYTICS_ACCESS: Record<PlanTier, AnalyticsCategory[]> = {
  trial: ['operational'],
  starter: ['operational'],
  professional: ['operational', 'growth', 'revenue'],
  enterprise: ['operational', 'growth', 'revenue', 'advanced']
}

// Helper function to get user's plan tier
async function getUserPlanTier(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  gymId: string
): Promise<PlanTier> {
  try {
    // Get user's active subscription with plan details
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select(`
        status,
        trial_status,
        subscription_plan_id,
        subscription_plans:subscription_plan_id (
          plan_type,
          tier_level
        )
      `)
      .eq('user_id', userId)
      .in('status', ['active', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !subscription) {
      // Check if user has active trial
      const { data: trialSub } = await supabase
        .from('subscriptions')
        .select('trial_status, trial_end_date')
        .eq('user_id', userId)
        .eq('trial_status', 'active')
        .single()

      if (trialSub && trialSub.trial_status === 'active' && trialSub.trial_end_date) {
        const trialEnd = new Date(trialSub.trial_end_date)
        if (trialEnd > new Date()) {
          return 'trial'
        }
      }
      return 'trial' // Default to trial (most restrictive)
    }

    // Check if still in trial
    if (subscription.trial_status === 'active') {
      return 'trial'
    }

    // Get plan type from joined data
    const planData = subscription.subscription_plans as { plan_type?: string; tier_level?: number } | null
    const planType = planData?.plan_type

    if (planType === 'enterprise') return 'enterprise'
    if (planType === 'professional') return 'professional'
    if (planType === 'starter') return 'starter'

    return 'trial'
  } catch (error) {
    logger.error('Error getting user plan tier:', { userId, gymId, error })
    return 'trial' // Default to most restrictive on error
  }
}

// GET /api/analytics - Get comprehensive gym analytics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const gymId = searchParams.get('gym_id')
    const periodDays = parseInt(searchParams.get('period_days') || '30')

    if (!gymId) {
      return NextResponse.json({ error: 'Gym ID is required' }, { status: 400 })
    }

    // Check permissions
    const canView = await checkUserPermission(user.id, gymId, 'analytics.read')
    if (!canView) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // 🔒 Get user's plan tier for data filtering
    const planTier = await getUserPlanTier(supabase, user.id, gymId)
    const accessibleCategories = ANALYTICS_ACCESS[planTier]
    
    logger.info('Analytics access check:', { 
      userId: user.id, 
      gymId, 
      planTier, 
      accessibleCategories 
    })

    const now = new Date()
    const startOfPeriod = new Date(now)
    startOfPeriod.setDate(now.getDate() - periodDays)
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    
    // Fetch Members Data
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, created_at, status, join_date')
      .eq('gym_id', gymId)
    
    if (membersError) {
      logger.error('Failed to fetch members for analytics:', { membersError })
      return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 })
    }
    
    // Fetch Attendance Data (last 30 days)
    const { data: attendanceSessions, error: attendanceError } = await supabase
      .from('attendance_sessions')
      .select('id, check_in_at, check_out_at, member_id, subject_type')
      .eq('gym_id', gymId)
      .gte('check_in_at', startOfPeriod.toISOString())
      .order('check_in_at', { ascending: false })
    
    if (attendanceError) {
      logger.error('Failed to fetch attendance for analytics:', { attendanceError })
      // Don't throw - analytics can work with partial data
    }
    
    // Fetch Subscription Data for Revenue (if available) - Only for professional+
    let subscriptions = null
    if (accessibleCategories.includes('revenue')) {
      const { data } = await supabase
        .from('subscriptions')
        .select('amount, status, created_at')
        .eq('gym_id', gymId)
        .eq('status', 'active')
      subscriptions = data
    }
    
    // === OPERATIONAL METRICS (All plans) ===
    const totalMembers = members?.length || 0
    const activeMembers = members?.filter(m => m.status === 'active').length || 0
    
    // Attendance Metrics
    const memberAttendance = attendanceSessions?.filter(s => s.subject_type === 'member') || []
    const uniqueAttendees = new Set(memberAttendance.map(s => s.member_id)).size
    const attendanceRate = activeMembers > 0 ? (uniqueAttendees / activeMembers) * 100 : 0
    const averageVisitsPerMember = activeMembers > 0 ? memberAttendance.length / activeMembers : 0
    
    // Today's Checkins
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayCheckins = memberAttendance.filter(s => 
      new Date(s.check_in_at) >= todayStart
    ).length
    
    // Peak Hours Analysis (6 AM to 11 PM)
    const peakHours: { hour: number; count: number }[] = []
    for (let hour = 6; hour <= 23; hour++) {
      const count = memberAttendance.filter(s => {
        const checkInHour = new Date(s.check_in_at).getHours()
        return checkInHour === hour
      }).length
      peakHours.push({ hour, count })
    }
    
    // Average Daily Capacity
    const averageDailyCapacity = (todayCheckins / 100) * 100
    
    // Attendance Trend (last 7 days)
    const attendanceTrend: { date: string; checkins: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(now.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const checkins = memberAttendance.filter(s => {
        const checkInDate = new Date(s.check_in_at).toISOString().split('T')[0]
        return checkInDate === dateStr
      }).length
      
      attendanceTrend.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        checkins
      })
    }

    // === GROWTH METRICS (Professional+ only) ===
    let newMembersThisMonth = null
    let memberGrowthRate = null
    let atRiskMembers = null
    let retentionRate = null
    let memberTrend = null
    
    if (accessibleCategories.includes('growth')) {
      newMembersThisMonth = members?.filter(m => 
        new Date(m.created_at) >= startOfMonth
      ).length || 0
      
      const newMembersLastMonth = members?.filter(m => {
        const createdDate = new Date(m.created_at)
        return createdDate >= startOfLastMonth && createdDate <= endOfLastMonth
      }).length || 0
      
      memberGrowthRate = newMembersLastMonth > 0 
        ? ((newMembersThisMonth - newMembersLastMonth) / newMembersLastMonth) * 100
        : newMembersThisMonth > 0 ? 100 : 0
      
      // At-Risk Members: Active members with < 2 visits in last 30 days
      const memberVisitCounts = new Map<string, number>()
      memberAttendance.forEach(session => {
        if (session.member_id) {
          memberVisitCounts.set(
            session.member_id, 
            (memberVisitCounts.get(session.member_id) || 0) + 1
          )
        }
      })
      
      atRiskMembers = members?.filter(m => {
        if (m.status !== 'active') return false
        const visits = memberVisitCounts.get(m.id) || 0
        return visits < 2
      }).length || 0
      
      // Retention Rate
      retentionRate = totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0
      
      // Member Trend (last 30 days)
      memberTrend = []
      for (let i = periodDays - 1; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(now.getDate() - i)
        date.setHours(0, 0, 0, 0)
        
        const dateStr = date.toISOString().split('T')[0]
        const membersUntilDate = members?.filter(m => 
          new Date(m.created_at) <= date
        ).length || 0
        
        const newOnDate = members?.filter(m => {
          const createdDate = new Date(m.created_at)
          return createdDate.toISOString().split('T')[0] === dateStr
        }).length || 0
        
        memberTrend.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count: membersUntilDate,
          new: newOnDate
        })
      }
    }
    
    // === REVENUE METRICS (Professional+ only) ===
    let monthlyRecurringRevenue = null
    let revenueTrend = null
    
    if (accessibleCategories.includes('revenue')) {
      monthlyRecurringRevenue = subscriptions?.reduce((sum, sub) => sum + (sub.amount || 0), 0) || 0
      
      // Revenue Trend (last 6 months)
      revenueTrend = []
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' })
        
        const monthMembers = members?.filter(m => {
          const joinDate = new Date(m.join_date || m.created_at)
          return joinDate <= monthDate && m.status === 'active'
        }).length || 0
        
        revenueTrend.push({
          month: monthName,
          amount: monthMembers * 50
        })
      }
    }
    
    // === INSIGHTS (Filtered by plan) ===
    const insights: {
      type: 'success' | 'warning' | 'danger' | 'info'
      title: string
      description: string
      action?: string
    }[] = []
    
    // Operational Insights (all plans)
    if (attendanceRate < 50) {
      insights.push({
        type: 'warning',
        title: 'Low Attendance Rate',
        description: `Only ${attendanceRate.toFixed(0)}% of active members visited this month.`,
        action: 'Send engagement emails or run a challenge'
      })
    }
    
    // Peak Hours Insights (all plans)
    const topPeakHour = peakHours.reduce((max, h) => h.count > max.count ? h : max, peakHours[0])
    if (topPeakHour && topPeakHour.count > averageVisitsPerMember * 0.5) {
      const hourLabel = topPeakHour.hour === 12 ? '12 PM' : 
                       topPeakHour.hour > 12 ? `${topPeakHour.hour - 12} PM` : `${topPeakHour.hour} AM`
      insights.push({
        type: 'info',
        title: `Peak Hour: ${hourLabel}`,
        description: `Most members check in around ${hourLabel}.`,
        action: 'Ensure adequate staffing during this time'
      })
    }
    
    // Growth Insights (Professional+ only)
    if (accessibleCategories.includes('growth') && memberGrowthRate !== null && newMembersThisMonth !== null) {
      if (memberGrowthRate > 20) {
        insights.push({
          type: 'success',
          title: 'Strong Growth! 🚀',
          description: `You've added ${newMembersThisMonth} new members this month (${memberGrowthRate.toFixed(0)}% growth).`,
          action: 'Keep up your marketing efforts!'
        })
      } else if (memberGrowthRate < -10) {
        insights.push({
          type: 'danger',
          title: 'Membership Declining',
          description: `Member count is down ${Math.abs(memberGrowthRate).toFixed(0)}% from last month.`,
          action: 'Consider running a promotion or outreach campaign'
        })
      } else if (newMembersThisMonth < 5 && totalMembers < 100) {
        insights.push({
          type: 'warning',
          title: 'Slow Growth',
          description: `Only ${newMembersThisMonth} new members this month.`,
          action: 'Boost your marketing or referral programs'
        })
      }
      
      // At-Risk Members
      if (atRiskMembers !== null && atRiskMembers > 0) {
        const riskPercentage = (atRiskMembers / activeMembers) * 100
        if (riskPercentage > 30) {
          insights.push({
            type: 'danger',
            title: `${atRiskMembers} Members at Risk of Churning`,
            description: `${riskPercentage.toFixed(0)}% of active members have visited less than 2 times this month.`,
            action: 'Reach out personally to re-engage them'
          })
        } else if (atRiskMembers > 5) {
          insights.push({
            type: 'warning',
            title: `${atRiskMembers} Members Need Attention`,
            description: 'These members have low attendance and may be at risk.',
            action: 'Send a check-in message or offer personal training'
          })
        }
      }

      // Positive Reinforcement
      if (retentionRate !== null && retentionRate > 80 && insights.length < 2) {
        insights.push({
          type: 'success',
          title: 'Excellent Retention! 🎯',
          description: `${retentionRate.toFixed(0)}% of your members are active.`,
          action: 'Keep providing great service!'
        })
      }
    }
    
    // Revenue Insights (Professional+ only)
    if (accessibleCategories.includes('revenue') && monthlyRecurringRevenue !== null && monthlyRecurringRevenue > 0) {
      const revenuePerMember = monthlyRecurringRevenue / activeMembers
      if (revenuePerMember < 40) {
        insights.push({
          type: 'info',
          title: 'Revenue Optimization Opportunity',
          description: `Average revenue per member is $${revenuePerMember.toFixed(0)}.`,
          action: 'Consider premium plans or add-on services'
        })
      }
    }
    
    // Build filtered analytics response
    const analytics = {
      // Operational (all plans)
      totalMembers,
      activeMembers,
      attendanceRate,
      averageVisitsPerMember,
      todayCheckins,
      peakHours,
      averageDailyCapacity,
      attendanceTrend,
      
      // Growth (Professional+ only) - null for lower tiers
      newMembersThisMonth,
      memberGrowthRate,
      atRiskMembers,
      retentionRate,
      memberTrend,
      
      // Revenue (Professional+ only) - null for lower tiers
      monthlyRecurringRevenue,
      revenueTrend,
      
      // Insights (filtered by what user can see)
      insights,
      
      // Metadata for client
      _planTier: planTier,
      _accessibleCategories: accessibleCategories
    }

    return NextResponse.json({ analytics })

  } catch (error) {
    logger.error('Analytics GET error:', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

