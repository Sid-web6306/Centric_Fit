'use client'

import { InstallPrompt } from '@/components/pwa/InstallPrompt'
import { OfflineStatus } from '@/components/pwa/OfflineStatus'

export function PWAWrapper() {
  return (
    <>
      <OfflineStatus />
      <InstallPrompt />
      {/* <UpdatePrompt  intervalMs={1000}/> */}
    </>
  )
} 