'use client';

import Image from 'next/image';

interface MobilePortalSectionProps {
    className?: string;
}

export function MobilePortalSection({ className = '' }: MobilePortalSectionProps) {
    return (
        <div className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-12 ${className}`}>
            {/* Phone mockup */}
            <div className="lg:w-1/3 order-2 lg:order-1">
                <div className="relative mx-auto w-[200px] sm:w-[240px]">
                    {/* Phone frame mockup */}
                    <div className="relative rounded-[2rem] border-4 border-slate-700 bg-slate-800 p-2 shadow-2xl">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-800 rounded-b-xl z-10" />
                        <div className="relative rounded-[1.5rem] overflow-hidden aspect-[9/16]">
                            <Image
                                src="/screenshots/portal-mobile.png"
                                alt="Member portal on mobile showing check-in interface"
                                fill
                                className="object-cover object-top"
                                loading="lazy"
                                sizes="240px"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="lg:w-2/3 order-1 lg:order-2 text-center lg:text-left">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">
                    Mobile-First Member Experience
                </h3>
                <p className="text-slate-300 text-base sm:text-lg mb-6 max-w-xl">
                    Your members get a beautiful, native-like app experience. One-tap check-ins,
                    workout tracking, and real-time session updates—all from their phone.
                </p>
                <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                    <span className="px-3 py-1.5 rounded-full text-sm bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        ✓ Install as App (PWA)
                    </span>
                    <span className="px-3 py-1.5 rounded-full text-sm bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        ✓ Works Offline
                    </span>
                    <span className="px-3 py-1.5 rounded-full text-sm bg-green-500/20 text-green-300 border border-green-500/30">
                        ✓ Push Notifications
                    </span>
                </div>
            </div>
        </div>
    );
}
