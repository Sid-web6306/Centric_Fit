'use client';

import { DemoCarousel, type DemoSlide } from './DemoCarousel';
import { ProductScreenshot } from './ProductScreenshot';
import { MobilePortalSection } from './MobilePortalSection';

// Demo slides for the carousel - auto-playing product demos
const demoSlides: DemoSlide[] = [
    {
        src: '/demos/dashboard-overview.webp',
        title: 'Insights at a Glance',
        description: 'Monitor performance, revenue, and member activity in real time.'
    },
    {
        src: '/demos/attendance-tracking.webp',
        title: 'Attendance, Automated',
        description: 'Track presence, absences, and trends effortlessly.'
    },
    {
        src: '/demos/analytics-charts.webp',
        title: 'Advanced Analytics',
        description: 'Visualize growth trends, revenue patterns, and member engagement.'
    },
    {
        src: '/demos/checkin-flow.webp',
        title: 'One-Tap Check-ins',
        description: 'Members check in instantly with real-time status updates.'
    }
];

// Static screenshots for the grid
const screenshots = [
    {
        src: '/screenshots/dashboard-overview.png',
        alt: 'Dashboard showing real-time gym metrics and insights',
        title: 'Smart Dashboard',
        description: 'Real-time metrics, insights, and quick actions'
    },
    {
        src: '/screenshots/analytics-page.png',
        alt: 'Analytics dashboard with revenue and growth charts',
        title: 'Advanced Analytics',
        description: 'Track growth, revenue, and member engagement'
    },
    {
        src: '/screenshots/attendance-page.png',
        alt: 'Attendance tracking interface with check-in history',
        title: 'Attendance Tracking',
        description: 'Digital check-ins with full history'
    }
];

export function ProductShowcase() {
    return (
        <div className="relative z-10 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/20">
            <div className="max-w-7xl mx-auto">
                {/* Section header */}
                <div className="text-center mb-10 sm:mb-12 lg:mb-16">
                    <span className="inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 mb-4">
                        See It In Action
                    </span>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
                        Experience the Platform
                    </h2>
                    <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
                        Powerful, intuitive, and built specifically for fitness businesses
                    </p>
                </div>

                {/* Auto-playing demo carousel */}
                <div className="mb-12 sm:mb-16">
                    <DemoCarousel
                        slides={demoSlides}
                        autoPlayInterval={6000}
                    />
                </div>

                {/* Screenshots grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {screenshots.map((screenshot, index) => (
                        <ProductScreenshot
                            key={index}
                            {...screenshot}
                        />
                    ))}
                </div>

                {/* Mobile portal highlight */}
                <MobilePortalSection className="mt-12 sm:mt-16" />
            </div>
        </div>
    );
}

// Re-export components for external use
export { DemoCarousel, ProductScreenshot, MobilePortalSection };
export type { DemoSlide };
