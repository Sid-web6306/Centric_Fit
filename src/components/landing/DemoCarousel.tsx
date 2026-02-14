'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface DemoSlide {
    src: string;
    title: string;
    description: string;
}

interface DemoCarouselProps {
    slides: DemoSlide[];
    autoPlayInterval?: number;
    className?: string;
}

export function DemoCarousel({
    slides,
    autoPlayInterval = 6000,
    className = ''
}: DemoCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const goToSlide = useCallback((index: number) => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex(index);
        setTimeout(() => setIsTransitioning(false), 500);
    }, [isTransitioning]);

    const goToNext = useCallback(() => {
        goToSlide((currentIndex + 1) % slides.length);
    }, [currentIndex, slides.length, goToSlide]);

    const goToPrev = useCallback(() => {
        goToSlide((currentIndex - 1 + slides.length) % slides.length);
    }, [currentIndex, slides.length, goToSlide]);

    // Auto-advance carousel
    useEffect(() => {
        if (isPaused || slides.length <= 1) return;

        const timer = setInterval(goToNext, autoPlayInterval);
        return () => clearInterval(timer);
    }, [isPaused, autoPlayInterval, goToNext, slides.length]);

    if (slides.length === 0) return null;

    return (
        <div
            className={`relative group ${className}`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Main carousel container */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm shadow-2xl">
                {/* Slides container */}
                <div className="relative aspect-video w-full overflow-hidden">
                    {slides.map((slide, index) => (
                        <div
                            key={index}
                            className={`absolute inset-0 transition-all duration-500 ease-in-out ${index === currentIndex
                                ? 'opacity-100 translate-x-0 z-10'
                                : index < currentIndex
                                    ? 'opacity-0 -translate-x-full z-0'
                                    : 'opacity-0 translate-x-full z-0'
                                }`}
                        >
                            {/* Demo GIF */}
                            <img
                                src={slide.src}
                                alt={slide.title}
                                className="w-full h-full object-contain bg-slate-900"
                                loading={index === 0 ? 'eager' : 'lazy'}
                                decoding={index === 0 ? 'sync' : 'async'}
                                fetchPriority={index === 0 ? 'high' : 'low'}
                                width={1280}
                                height={720}
                            />

                            {/* Gradient overlay for text readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
                        </div>
                    ))}

                    {/* Caption overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                        <div className="transition-all duration-300">
                            <h3 className="text-white font-bold text-xl sm:text-2xl mb-2">
                                {slides[currentIndex]?.title}
                            </h3>
                            <p className="text-slate-300 text-sm sm:text-base max-w-xl">
                                {slides[currentIndex]?.description}
                            </p>
                        </div>
                    </div>

                    {/* Live Demo badge */}
                    <div className="absolute top-4 left-4 z-20">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 backdrop-blur-sm">
                            <span className="w-2 h-2 rounded-full bg-purple-400 mr-2 animate-pulse" />
                            Live Demo
                        </span>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800 z-30">
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Navigation arrows - visible on hover */}
            {slides.length > 1 && (
                <>
                    <button
                        onClick={goToPrev}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/80 text-white border border-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-800 z-30"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/80 text-white border border-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-800 z-30"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </>
            )}

            {/* Dot indicators */}
            {slides.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex
                                ? 'w-6 bg-purple-500'
                                : 'bg-slate-600 hover:bg-slate-500'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
