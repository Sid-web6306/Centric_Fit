'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import { Home, History, User } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useSidebarState } from '@/stores/ui-store'
import { LoadingSpinner } from '@/components/layout/LoadingSpinner'
import { SidebarToggle } from '@/components/layout/SidebarToggle'
import { cn } from '@/lib/utils'
import { RealtimeProvider } from '@/components/providers/realtime-provider-simple'
import { PortalDataProvider } from '@/components/providers/portal-data-provider'
import { AppSidebar, type SidebarNavItem } from '@/components/layout/AppSidebar'
import { PortalBottomNav } from '@/components/portal/PortalBottomNav'

interface PortalLayoutProps {
  children: React.ReactNode
}

const navigation: SidebarNavItem[] = [
  { name: 'Dashboard', href: '/portal', icon: Home },
  { name: 'History', href: '/portal/history', icon: History },
  { name: 'Profile', href: '/portal/profile', icon: User },
]

function PortalLayoutContent({ children }: PortalLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { sidebarCollapsed } = useSidebarState()

  // Handle redirect for unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Don't render anything if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar navigation={navigation} gymNameFallback="Member Portal" />

      {/* Main content */}
      <div
        className={cn(
          'flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-out',
          'ml-0',
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        {/* Mobile Top bar */}
        <div className="bg-card shadow-sm border-b border-border lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <SidebarToggle isMobile />
            <h1 className="text-lg font-semibold text-card-foreground">
              {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
            </h1>
            <div className="w-8"></div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto pb-20 lg:pb-0">
          <Suspense fallback={<div className="p-6 text-muted-foreground">Loading...</div>}>
            {children}
          </Suspense>
        </main>
      </div>

      <PortalBottomNav />
    </div>
  )
}

export default function PortalLayout({ children }: PortalLayoutProps) {
  return (
    <RealtimeProvider>
      <PortalDataProvider key="portal-data-provider">
        <PortalLayoutContent>
          {children}
        </PortalLayoutContent>
      </PortalDataProvider>
    </RealtimeProvider>
  )
}
