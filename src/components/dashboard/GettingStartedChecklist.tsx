'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, ChevronDown, ChevronUp, UserPlus, Activity, Settings, Users, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface ChecklistItem {
  id: string
  label: string
  description: string
  href: string
  icon: React.ElementType
  cta: string
}

const ITEMS: ChecklistItem[] = [
  {
    id: 'add_member',
    label: 'Add your first member',
    description: 'Start building your membership roster',
    href: '/members',
    icon: UserPlus,
    cta: 'Add Member',
  },
  {
    id: 'record_checkin',
    label: 'Record a check-in',
    description: 'Track who is using your gym today',
    href: '/attendance',
    icon: Activity,
    cta: 'Go to Attendance',
  },
  {
    id: 'invite_staff',
    label: 'Invite a staff member',
    description: 'Add trainers and front-desk staff',
    href: '/team',
    icon: Users,
    cta: 'Invite Staff',
  },
  {
    id: 'configure_gym',
    label: 'Complete your gym profile',
    description: 'Add your gym name, logo, and contact info',
    href: '/settings',
    icon: Settings,
    cta: 'Go to Settings',
  },
  {
    id: 'upgrade',
    label: 'Choose a plan',
    description: 'Unlock full access before your trial ends',
    href: '/upgrade',
    icon: Zap,
    cta: 'View Plans',
  },
]

const STORAGE_KEY = 'getting-started-completed'
const DISMISS_KEY = 'getting-started-dismissed'

interface GettingStartedChecklistProps {
  totalMembers: number
  todayCheckins: number
  hasStaff?: boolean
}

export function GettingStartedChecklist({
  totalMembers,
  todayCheckins,
  hasStaff = false,
}: GettingStartedChecklistProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [dismissed, setDismissed] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // Derive completion from props
  useEffect(() => {
    const derived = new Set<string>()
    if (totalMembers > 0) derived.add('add_member')
    if (todayCheckins > 0) derived.add('record_checkin')
    if (hasStaff) derived.add('invite_staff')

    // Merge with manually-stored completions
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as string[]
      stored.forEach(id => derived.add(id))
    } catch { /* ignore */ }

    setCompletedIds(derived)
  }, [totalMembers, todayCheckins, hasStaff])

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY)) setDismissed(true)
    } catch { /* ignore */ }
  }, [])

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* ignore */ }
    setDismissed(true)
  }

  const markDone = (id: string) => {
    setCompletedIds(prev => {
      const next = new Set(prev)
      next.add(id)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
      } catch { /* ignore */ }
      return next
    })
  }

  const completedCount = ITEMS.filter(i => completedIds.has(i.id)).length
  const allDone = completedCount === ITEMS.length

  // Hide when all done or user dismissed
  if (dismissed || allDone) return null

  const pct = Math.round((completedCount / ITEMS.length) * 100)

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">Getting Started</CardTitle>
            <span className="text-sm text-muted-foreground">
              {completedCount}/{ITEMS.length} complete
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCollapsed(v => !v)}
              className="rounded p-1 hover:bg-muted transition-colors text-muted-foreground"
              aria-label={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
            <button
              onClick={handleDismiss}
              className="rounded p-1 hover:bg-muted transition-colors text-muted-foreground text-xs"
              aria-label="Dismiss checklist"
            >
              ✕
            </button>
          </div>
        </div>
        <Progress value={pct} className="h-1.5 mt-2" />
      </CardHeader>

      {!collapsed && (
        <CardContent className="pt-2 space-y-2">
          {ITEMS.map(item => {
            const done = completedIds.has(item.id)
            const Icon = item.icon
            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg p-3 transition-colors',
                  done ? 'opacity-50' : 'hover:bg-muted/50'
                )}
              >
                <div
                  className={cn(
                    'shrink-0 h-6 w-6 rounded-full flex items-center justify-center',
                    done
                      ? 'bg-green-500 text-white'
                      : 'border-2 border-muted-foreground/30'
                  )}
                >
                  {done ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium', done && 'line-through text-muted-foreground')}>
                    {item.label}
                  </p>
                  {!done && (
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  )}
                </div>
                {!done && (
                  <Link href={item.href}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs shrink-0"
                      onClick={() => markDone(item.id)}
                    >
                      {item.cta}
                    </Button>
                  </Link>
                )}
              </div>
            )
          })}
        </CardContent>
      )}
    </Card>
  )
}
