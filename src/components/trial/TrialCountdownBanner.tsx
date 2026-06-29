'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Clock, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTrialStatus, isTrialActive } from '@/hooks/use-simplified-payments'

const DISMISS_KEY = 'trial-banner-dismissed-at'
const DISMISS_HOURS = 24

export function TrialCountdownBanner() {
  const { trial, isLoading } = useTrialStatus()
  const [dismissed, setDismissed] = useState(true) // default hidden; set after mount

  useEffect(() => {
    try {
      const storedAt = localStorage.getItem(DISMISS_KEY)
      if (!storedAt) {
        setDismissed(false)
        return
      }
      const dismissedMs = Date.now() - Number(storedAt)
      if (dismissedMs > DISMISS_HOURS * 60 * 60 * 1000) {
        setDismissed(false)
      }
    } catch {
      setDismissed(false)
    }
  }, [])

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      // storage unavailable — dismiss in-memory only
    }
    setDismissed(true)
  }

  if (isLoading || dismissed || !trial || !isTrialActive(trial)) return null

  const { days_remaining } = trial
  const urgent = days_remaining <= 3
  const critical = days_remaining <= 1

  const bgClass = critical
    ? 'bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800'
    : urgent
    ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800'
    : 'bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800'

  const textClass = critical
    ? 'text-red-800 dark:text-red-200'
    : urgent
    ? 'text-amber-800 dark:text-amber-200'
    : 'text-blue-800 dark:text-blue-200'

  const label =
    days_remaining === 0
      ? 'Your free trial expires today!'
      : days_remaining === 1
      ? '1 day left on your free trial'
      : `${days_remaining} days left on your free trial`

  return (
    <div className={`border-b px-4 py-2.5 ${bgClass}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className={`flex items-center gap-2 text-sm font-medium ${textClass}`}>
          <Clock className="h-4 w-4 shrink-0" />
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/upgrade">
            <Button size="sm" className="h-7 gap-1 text-xs">
              <Zap className="h-3 w-3" />
              Upgrade Now
            </Button>
          </Link>
          <button
            onClick={handleDismiss}
            className={`rounded p-1 hover:bg-black/10 transition-colors ${textClass}`}
            aria-label="Dismiss trial banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
