// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { RazorpayProvider } from "@/components/providers/razorpay-provider";
import { PWAWrapper } from "@/components/pwa/PWAWrapper";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";
import { SupabaseErrorHandler } from "@/components/providers/supabase-error-handler";
import { HelloWidgetWrapper } from "@/components/support/HelloWidgetWrapper";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL('https://centric.fit'),
  title: {
    default: "Centric Fit - Modern Fitness Management Software",
    template: "%s | Centric Fit",
  },
  description: "A comprehensive fitness management system for modern fitness businesses. Member tracking, analytics, subscriptions, check-ins, and more. Built for gyms, studios & fitness centers in India.",
  keywords: [
    "gym management software",
    "fitness management system",
    "gym software India",
    "member management",
    "gym check-in system",
    "fitness business software",
    "gym analytics",
    "gym subscription management",
    "fitness center software",
    "gym CRM",
    "Centric Fit",
  ],
  alternates: {
    canonical: 'https://centric.fit',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Centric Fit - Fitness Management System",
  },
  openGraph: {
    title: "Centric Fit - Modern Fitness Management Software",
    description: "Complete fitness business management with member tracking, analytics, subscription management, and mobile app access. Try free for 14 days.",
    url: 'https://centric.fit',
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Centric Fit - Modern Fitness Management Software",
      },
    ],
    type: "website",
    siteName: "Centric Fit",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Centric Fit - Modern Fitness Management Software",
    description: "Complete fitness business management with member tracking, analytics, and subscription management. Try free for 14 days.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                window.deferredPrompt = e;
              });
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <Script src="https://checkout.razorpay.com/v1/checkout.js"></Script>
        <ThemeProvider
          attribute="class"
          defaultTheme="rose"
          enableSystem={false}
          disableTransitionOnChange={false}
          themes={['light', 'blue', 'green', 'purple', 'rose']}
        >
          <RazorpayProvider>
            <QueryProvider>
              <SessionProvider>
                <SupabaseErrorHandler />
                {children}
                <HelloWidgetWrapper />
                <PWAWrapper />
                <ServiceWorkerRegister />
              </SessionProvider>
              <Toaster />
            </QueryProvider>
          </RazorpayProvider>
        </ThemeProvider>
        <Analytics />
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('consent', 'default', {
                  'analytics_storage': 'granted'
                });
                gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}