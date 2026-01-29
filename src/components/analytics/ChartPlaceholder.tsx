'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ChartPlaceholderProps {
    className?: string
    height?: number
}

/**
 * A visually appealing placeholder for locked charts.
 * Does NOT fetch any data - purely decorative skeleton.
 */
export function ChartPlaceholder({
    className,
    height = 200
}: ChartPlaceholderProps) {
    return (
        <div className={cn('relative', className)}>
            {/* Mock chart skeleton with animated gradient */}
            <div
                className="w-full bg-gradient-to-br from-muted/50 to-muted overflow-hidden rounded-lg"
                style={{ height }}
            >
                {/* Horizontal grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between py-4 px-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-px bg-gray-200/50 w-full"
                        />
                    ))}
                </div>

                {/* Mock bar chart elements */}
                <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around px-4 pb-2 h-3/4">
                    {[40, 65, 55, 80, 70, 90, 60, 75].map((h, i) => (
                        <div
                            key={i}
                            className="w-6 bg-gradient-to-t from-gray-300/60 to-gray-200/40 rounded-t animate-pulse"
                            style={{
                                height: `${h}%`,
                                animationDelay: `${i * 0.1}s`
                            }}
                        />
                    ))}
                </div>

                {/* Subtle shimmer overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
            </div>

            {/* Bottom axis labels skeleton */}
            <div className="flex justify-around mt-2">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-2 w-8 bg-gray-200/50 rounded"
                    />
                ))}
            </div>
        </div>
    )
}

export default ChartPlaceholder
