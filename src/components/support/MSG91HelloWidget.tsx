'use client'

import { useEffect, useCallback } from 'react'
import Script from 'next/script'

// Extend Window interface for MSG91 Hello widget
declare global {
    interface Window {
        initChatWidget: (config: HelloConfig, delay?: number) => void
    }
}

interface HelloConfig {
    widgetToken: string
    user_jwt_token?: string
    hide_launcher?: boolean
    show_widget_form?: boolean
    show_close_button?: boolean
    launch_widget?: boolean
    show_send_button?: boolean
    unique_id?: string
    name?: string
    number?: string
    mail?: string
    theme?: 'light' | 'dark' | 'system'
}

interface MSG91HelloWidgetProps {
    /** Optional: User's unique identifier (username, email, etc.) */
    uniqueId?: string
    /** Optional: User's name - if not provided, a form will be displayed */
    name?: string
    /** Optional: User's phone number - if not provided, a form will be displayed */
    phone?: string
    /** Optional: User's email - if not provided, a form will be displayed */
    email?: string
    /** Optional: JWT token for identity verification (if enabled in MSG91) */
    userJwtToken?: string
    /** Optional: Widget theme - defaults to 'system' */
    theme?: 'light' | 'dark' | 'system'
    /** Optional: Delay in milliseconds before loading the widget */
    loadDelay?: number
}

/**
 * MSG91 Hello Chat Widget Component
 * 
 * Embeds the MSG91 Hello customer support chat widget on the page.
 * The widget appears at the bottom-right corner in a fixed position.
 * 
 * @example
 * // Basic usage (shows form to collect user info)
 * <MSG91HelloWidget />
 * 
 * @example
 * // With user context (no form needed)
 * <MSG91HelloWidget
 *   name="John Doe"
 *   email="john@example.com"
 *   phone="+919876543210"
 *   uniqueId="user-123"
 * />
 */
export function MSG91HelloWidget({
    uniqueId,
    name,
    phone,
    email,
    userJwtToken,
    theme = 'system',
    loadDelay = 3000, // Load after 3 seconds by default for better page performance
}: MSG91HelloWidgetProps) {

    const initWidget = useCallback(() => {
        if (typeof window !== 'undefined' && window.initChatWidget) {
            const widgetToken = process.env.NEXT_PUBLIC_MSG91_HELLO_WIDGET_TOKEN
            if (!widgetToken) {
                console.warn('MSG91 Hello widget token not configured. Set NEXT_PUBLIC_MSG91_HELLO_WIDGET_TOKEN in .env.local')
                return
            }

            const config: HelloConfig = {
                widgetToken,
                hide_launcher: false,
                show_widget_form: true, // Show form if user details not provided
                show_close_button: true,
                launch_widget: false, // Don't auto-open
                show_send_button: true,
                theme: theme,
            }

            // Add user JWT token if identity verification is enabled
            if (userJwtToken) {
                config.user_jwt_token = userJwtToken
            }

            // Add user context if provided
            if (uniqueId) config.unique_id = uniqueId
            if (name) config.name = name
            if (phone) config.number = phone
            if (email) config.mail = email

            // If user details are provided, hide the form
            if (name && (phone || email)) {
                config.show_widget_form = false
            }

            window.initChatWidget(config, loadDelay)
        }
    }, [uniqueId, name, phone, email, userJwtToken, theme, loadDelay])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // Remove widget container if it exists
            const widgetContainer = document.getElementById('msg91-hello-widget')
            if (widgetContainer) {
                widgetContainer.remove()
            }
        }
    }, [])

    return (
        <Script
            id="msg91-hello-widget-script"
            src="https://blacksea.msg91.com/chat-widget.js"
            strategy="lazyOnload"
            onLoad={initWidget}
        />
    )
}

export default MSG91HelloWidget
