'use client'

import { CreditCard, CalendarCheck, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { format, differenceInDays, parseISO } from 'date-fns'
import { MemberProfile } from '@/hooks/use-member-portal'

interface MembershipStatusCardProps {
  profile: MemberProfile | null | undefined
  isLoading: boolean
}

function getDaysRemaining(expiryDateStr: string | null | undefined): number | null {
  if (!expiryDateStr) return null
  try {
    return differenceInDays(parseISO(expiryDateStr), new Date())
  } catch {
    return null
  }
}

export function MembershipStatusCard({ profile, isLoading }: MembershipStatusCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-48" />
        </CardContent>
      </Card>
    )
  }

  if (!profile) return null

  const status = profile.status || 'unknown'
  const joinDate = profile.join_date
  // Expiry may be stored in metadata by the gym owner
  const expiryDate = (profile as unknown as { expires_at?: string }).expires_at ?? null
  const daysRemaining = getDaysRemaining(expiryDate)

  const statusConfig = {
    active: {
      label: 'Active',
      icon: CheckCircle2,
      badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      iconClass: 'text-green-600',
    },
    inactive: {
      label: 'Inactive',
      icon: AlertTriangle,
      badgeClass: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      iconClass: 'text-gray-500',
    },
    expired: {
      label: 'Expired',
      icon: AlertTriangle,
      badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      iconClass: 'text-red-500',
    },
    pending: {
      label: 'Pending',
      icon: Clock,
      badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
      iconClass: 'text-amber-500',
    },
    unknown: {
      label: 'Unknown',
      icon: CreditCard,
      badgeClass: 'bg-muted text-muted-foreground',
      iconClass: 'text-muted-foreground',
    },
  }

  const cfg = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.unknown
  const Icon = cfg.icon

  const urgentExpiry = daysRemaining !== null && daysRemaining <= 7 && daysRemaining >= 0
  const expired = daysRemaining !== null && daysRemaining < 0

  return (
    <Card className={urgentExpiry || expired || status === 'expired' ? 'border-amber-300 dark:border-amber-700' : ''}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-4 w-4" />
          Membership
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Icon className={`h-6 w-6 shrink-0 ${cfg.iconClass}`} />
          <div className="flex-1">
            <Badge className={cfg.badgeClass}>{cfg.label}</Badge>
          </div>
        </div>

        <div className="divide-y divide-border">
          {joinDate && (
            <div className="flex justify-between py-2 text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <CalendarCheck className="h-3.5 w-3.5" /> Member since
              </span>
              <span className="font-medium">{format(parseISO(joinDate), 'MMM d, yyyy')}</span>
            </div>
          )}

          {expiryDate && (
            <div className="flex justify-between py-2 text-sm">
              <span className="text-muted-foreground">Expires</span>
              <span className={`font-medium ${urgentExpiry || expired ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                {format(parseISO(expiryDate), 'MMM d, yyyy')}
                {daysRemaining !== null && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    {expired
                      ? '(expired)'
                      : daysRemaining === 0
                      ? '(today)'
                      : `(${daysRemaining}d left)`}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {(urgentExpiry || expired || status === 'expired') && (
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded-md px-3 py-2">
            {expired || status === 'expired'
              ? 'Your membership has expired. Please contact the gym to renew.'
              : `Your membership expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. Contact the gym to renew.`}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
