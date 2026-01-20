'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { logger } from '@/lib/logger'

interface VersionCheckOptions {
  pollingInterval?: number // in milliseconds, default 60 seconds
  enabled?: boolean
}

interface VersionCheckResult {
  updateAvailable: boolean
  currentVersion: string | null
  latestVersion: string | null
  dismiss: () => void
  refresh: () => void
}

const DISMISSED_KEY = 'version-update-dismissed'
const DISMISS_DURATION = 5 * 60 * 1000 // 5 minutes before showing again

export function useVersionCheck(options: VersionCheckOptions = {}): VersionCheckResult {
  const { 
    pollingInterval = 60000, // Check every 60 seconds
    enabled = true 
  } = options

  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [latestVersion, setLatestVersion] = useState<string | null>(null)
  const initialVersionRef = useRef<string | null>(null)
  const dismissedUntilRef = useRef<number>(0)

  // Get the build ID that was present when the app loaded
  const currentVersion = typeof window !== 'undefined' 
    ? process.env.NEXT_PUBLIC_BUILD_ID || null 
    : null

  // Store the initial version on first render
  useEffect(() => {
    if (currentVersion && !initialVersionRef.current) {
      initialVersionRef.current = currentVersion
      logger.info('Version check initialized', { buildId: currentVersion })
    }
  }, [currentVersion])

  // Check if we should show the update notification
  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY)
    if (dismissed) {
      dismissedUntilRef.current = parseInt(dismissed, 10)
    }
  }, [])

  const checkVersion = useCallback(async () => {
    if (!enabled || typeof window === 'undefined') return

    // Don't check if dismissed recently
    if (Date.now() < dismissedUntilRef.current) return

    try {
      const response = await fetch('/api/version', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      })

      if (!response.ok) {
        throw new Error(`Version check failed: ${response.status}`)
      }

      const data = await response.json()
      const serverVersion = data.buildId

      setLatestVersion(serverVersion)

      // Compare with the version the app was initially loaded with
      if (initialVersionRef.current && serverVersion !== initialVersionRef.current) {
        logger.info('New version detected', { 
          current: initialVersionRef.current, 
          latest: serverVersion 
        })
        setUpdateAvailable(true)
      }
    } catch (error) {
      logger.warn('Version check failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  }, [enabled])

  // Poll for version changes
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    // Initial check after a short delay
    const initialTimeout = setTimeout(checkVersion, 5000)

    // Set up polling interval
    const interval = setInterval(checkVersion, pollingInterval)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [enabled, pollingInterval, checkVersion])

  // Also check when tab becomes visible
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [enabled, checkVersion])

  const dismiss = useCallback(() => {
    const dismissUntil = Date.now() + DISMISS_DURATION
    dismissedUntilRef.current = dismissUntil
    localStorage.setItem(DISMISSED_KEY, dismissUntil.toString())
    setUpdateAvailable(false)
  }, [])

  const refresh = useCallback(() => {
    // Clear any caches and do a hard refresh
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name)
        })
      })
    }
    window.location.reload()
  }, [])

  return {
    updateAvailable,
    currentVersion: initialVersionRef.current,
    latestVersion,
    dismiss,
    refresh,
  }
}
