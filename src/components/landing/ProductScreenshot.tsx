'use client';

import Image from 'next/image';
import { useState } from 'react';

interface ProductScreenshotProps {
    src: string;
    alt: string;
    title: string;
    description: string;
    className?: string;
}

export function ProductScreenshot({
    src,
    alt,
    title,
    description,
    className = ''
}: ProductScreenshotProps) {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div className={`group relative ${className}`}>
            <div className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur shadow-2xl transition-all duration-300 hover:border-purple-500/50 hover:shadow-purple-500/10">
                {/* Screenshot container with perspective */}
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        className={`object-cover object-top transition-all duration-500 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                            } group-hover:scale-[1.02]`}
                        loading="lazy"
                        onLoad={() => setIsLoaded(true)}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Caption overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900/90 to-transparent">
                    <h4 className="text-white font-semibold text-sm sm:text-base">{title}</h4>
                    <p className="text-slate-300 text-xs sm:text-sm mt-1">{description}</p>
                </div>

                {/* Live preview badge */}
                <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 animate-pulse" />
                        Live Preview
                    </span>
                </div>
            </div>
        </div>
    );
}
