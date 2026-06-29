'use client'

import { useDeferredValue } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { Dumbbell, type LucideIcon } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useSidebarState } from '@/stores/ui-store'
import { CollapsibleNavItem } from '@/components/layout/CollapsibleNavItem'
import { SidebarToggle } from '@/components/layout/SidebarToggle'
import { CollapsibleUserSection } from '@/components/layout/CollapsibleUserSection'
import { useSidebarShortcuts } from '@/hooks/use-sidebar-shortcuts'
import { useGymData, useGymRealtime } from '@/hooks/use-gym-data'
import { cn } from '@/lib/utils'

export interface SidebarNavItem {
  name: string
  href: string
  icon: LucideIcon
}

interface AppSidebarProps {
  navigation: SidebarNavItem[]
  /**
   * Text shown in the header when no gym data is loaded and the user has no
   * gym_id association (e.g. "Setup Required" for admins, "Member Portal" for
   * portal users). "Loading..." is shown automatically when gym_id exists but
   * gymData hasn't resolved yet.
   */
  gymNameFallback?: string
}

export function AppSidebar({
  navigation,
  gymNameFallback = 'Setup Required',
}: AppSidebarProps) {
  const pathname = usePathname()
  const deferredPathname = useDeferredValue(pathname)
  const { profile } = useAuth()
  const { sidebarCollapsed, sidebarCollapsedMobile, toggleMobileSidebar } =
    useSidebarState()
  const { data: gymData } = useGymData(profile?.gym_id || null)

  useSidebarShortcuts()
  useGymRealtime(profile?.gym_id || null)

  const displayName =
    gymData?.name || (profile?.gym_id ? 'Loading...' : gymNameFallback)

  const logoSection = (
    <div className="flex items-center gap-3 min-w-0 flex-1">
      {gymData?.logo_url ? (
        <Image
          src={gymData.logo_url}
          alt={gymData.name || 'Logo'}
          width={40}
          height={40}
          className="h-10 w-10 rounded-md object-contain flex-shrink-0"
        />
      ) : (
        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Dumbbell className="h-6 w-6 text-primary" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-card-foreground truncate">
          {displayName}
        </p>
        <p className="text-[10px] text-muted-foreground/70">
          Powered by Centric Fit
        </p>
      </div>
    </div>
  )

  return (
    <>
      {/* ── Desktop Sidebar ────────────────────────────────────── */}
      <div
        className={cn(
          'hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-50',
          'bg-card shadow-lg border-r border-border',
          'transition-[width] duration-300 ease-out',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center h-16 border-b border-border transition-all duration-300',
            sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'
          )}
        >
          {sidebarCollapsed ? (
            <SidebarToggle />
          ) : (
            <>
              {logoSection}
              <SidebarToggle />
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="mt-5 flex-1 px-2">
          <div className="space-y-1">
            {navigation.map((item) => (
              <CollapsibleNavItem
                key={item.name}
                name={item.name}
                href={item.href}
                icon={item.icon}
                isActive={deferredPathname === item.href}
                prefetch={true}
              />
            ))}
          </div>
        </nav>

        {/* User Section */}
        <CollapsibleUserSection className="mt-auto" />
      </div>

      {/* ── Mobile Sidebar ─────────────────────────────────────── */}
      <div
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-lg border-r border-border',
          'transition-transform duration-300 ease-out',
          sidebarCollapsedMobile ? '-translate-x-full' : 'translate-x-0'
        )}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          {logoSection}
          <SidebarToggle isMobile />
        </div>

        {/* Mobile Navigation */}
        <nav className="mt-5 px-2 flex-1">
          <div className="space-y-1">
            {navigation.map((item) => (
              <CollapsibleNavItem
                key={item.name}
                name={item.name}
                href={item.href}
                icon={item.icon}
                isActive={deferredPathname === item.href}
                onClick={toggleMobileSidebar}
                forceExpanded={true}
                prefetch={true}
              />
            ))}
          </div>
        </nav>

        {/* Mobile User Section */}
        <CollapsibleUserSection forceExpanded />
      </div>

      {/* ── Mobile Overlay ─────────────────────────────────────── */}
      {!sidebarCollapsedMobile && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={toggleMobileSidebar}
        />
      )}
    </>
  )
}
