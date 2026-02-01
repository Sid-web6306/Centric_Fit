'use client'

import { useAuth } from '@/hooks/use-auth'
import { usePathname } from 'next/navigation'
import { MSG91HelloWidget } from './MSG91HelloWidget'

/**
 * Smart wrapper for MSG91 Hello Widget
 * 
 * - Shows on PUBLIC pages: /, /contact, /demo, /privacy-policy, /terms-of-service, /refund-policy
 * - NOT shown on: dashboard (/app), portal (/portal), auth pages (/login, /signup), onboarding
 * - For logged-in users: auto-fills name, email, phone
 */
export function HelloWidgetWrapper() {
    const pathname = usePathname()
    const { user, profile } = useAuth()

    // Define public page patterns where widget should appear
    const publicPagePatterns = [
        '/',                    // Home page
        '/contact',             // Contact page
        '/demo',                // Demo page
        '/privacy-policy',      // Privacy policy
        '/terms-of-service',    // Terms of service
        '/refund-policy',       // Refund policy
    ]

    // Check if current path is a public page
    const isPublicPage = publicPagePatterns.some(pattern => {
        if (pattern === '/') {
            return pathname === '/'
        }
        return pathname.startsWith(pattern)
    })

    // Don't render widget on non-public pages
    if (!isPublicPage) {
        return null
    }

    // Determine theme based on page (home page is dark themed)
    const theme = pathname === '/' ? 'dark' : 'system'

    // If user is logged in, pass their details
    if (user && profile) {
        return (
            <MSG91HelloWidget
                theme={theme}
                loadDelay={3000}
                name={profile.full_name || undefined}
                email={user.email || undefined}
                uniqueId={user.id}
            />
        )
    }

    // Anonymous user - show form to collect details
    return (
        <MSG91HelloWidget
            theme={theme}
            loadDelay={3000}
        />
    )
}

export default HelloWidgetWrapper
