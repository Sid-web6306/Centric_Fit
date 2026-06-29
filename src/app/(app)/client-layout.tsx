'use client'

import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import {
  Users,
  LayoutDashboard,
  Settings,
  UserCog,
  BookUser,
  CalendarDays,
  BarChart3,
} from 'lucide-react'
import { useSidebarState } from '@/stores/ui-store'
import { RequireAuth } from '@/components/auth/AuthGuard'
import { RealtimeProvider } from '@/components/providers/realtime-provider-simple'
import { AppSidebar, type SidebarNavItem } from '@/components/layout/AppSidebar'
import { SidebarToggle } from '@/components/layout/SidebarToggle'
import { cn } from '@/lib/utils'
import { TrialCountdownBanner } from '@/components/trial/TrialCountdownBanner'

interface ClientLayoutProps {
  children: React.ReactNode
}

const navigation: SidebarNavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Attendance', href: '/attendance', icon: CalendarDays },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Roles & Invitations', href: '/team', icon: UserCog },
  { name: 'Staff Directory', href: '/staff', icon: BookUser },
  { name: 'Settings', href: '/settings', icon: Settings },
]

function ClientLayoutContent({ children }: ClientLayoutProps) {
  const pathname = usePathname()
  const { sidebarCollapsed } = useSidebarState()

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar navigation={navigation} gymNameFallback="Setup Required" />

      {/* Main content */}
      <div
        className={cn(
          'flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-out',
          // Mobile: no margin
          'ml-0',
          // Desktop: margin based on sidebar state
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        <TrialCountdownBanner />

        {/* Mobile Top bar */}
        <div className="bg-card shadow-sm border-b border-border lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <SidebarToggle isMobile />
            <h1 className="text-lg font-semibold text-card-foreground">
              {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
            </h1>
            <div className="w-8"></div> {/* Spacer for balance */}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <Suspense fallback={<div className="p-6 text-muted-foreground">Loading...</div>}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  )
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <RequireAuth>
      <RealtimeProvider>
        <ClientLayoutContent>
          {children}
        </ClientLayoutContent>
      </RealtimeProvider>
    </RequireAuth>
  )
} 