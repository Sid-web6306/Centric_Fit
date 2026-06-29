'use client';

import { ReactNode, useEffect } from 'react';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';

interface PostHogProviderProps {
  children: ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
        capture_pageview: false, // We'll handle pageviews manually
        capture_pageleave: true,
        persistence: 'localStorage',
        autocapture: {
          dom_event_allowlist: ['click', 'submit', 'change'],
          element_allowlist: ['a', 'button', 'form', 'input', 'select', 'textarea', 'label'],
        },
        // PII masking for session recording
        session_recording: {
          maskTextSelector: '[data-ph-capture-attribute=false], .member-name, .member-email, .member-phone',
        },
      });
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
