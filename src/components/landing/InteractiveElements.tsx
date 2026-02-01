'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';

// Animated counter that counts up when visible
export function AnimatedCounter({
    end,
    duration = 2000,
    prefix = '',
    suffix = '',
    className = ''
}: {
    end: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
}) {
    const [count, setCount] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated) {
                    setHasAnimated(true);

                    const startTime = performance.now();
                    const animate = (currentTime: number) => {
                        const elapsed = currentTime - startTime;
                        const progress = Math.min(elapsed / duration, 1);

                        // Easing function for smooth animation
                        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                        setCount(Math.floor(easeOutQuart * end));

                        if (progress < 1) {
                            requestAnimationFrame(animate);
                        }
                    };

                    requestAnimationFrame(animate);
                }
            },
            { threshold: 0.5 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [end, duration, hasAnimated]);

    return (
        <span ref={ref} className={className}>
            {prefix}{count.toLocaleString()}{suffix}
        </span>
    );
}

// Scroll reveal animation wrapper
export function ScrollReveal({
    children,
    className = '',
    delay = 0,
    direction = 'up'
}: {
    children: ReactNode;
    className?: string;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right' | 'scale';
}) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setTimeout(() => setIsVisible(true), delay);
                }
            },
            { threshold: 0.1, rootMargin: '50px' }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [delay]);

    const getTransform = () => {
        if (isVisible) return 'translate3d(0, 0, 0) scale(1)';
        switch (direction) {
            case 'up': return 'translate3d(0, 40px, 0)';
            case 'down': return 'translate3d(0, -40px, 0)';
            case 'left': return 'translate3d(40px, 0, 0)';
            case 'right': return 'translate3d(-40px, 0, 0)';
            case 'scale': return 'scale(0.9)';
            default: return 'translate3d(0, 40px, 0)';
        }
    };

    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: getTransform(),
                transition: `opacity 0.6s ease-out, transform 0.6s ease-out`,
                transitionDelay: `${delay}ms`,
            }}
        >
            {children}
        </div>
    );
}

// Typewriter effect for hero text
export function Typewriter({
    words,
    className = '',
    typingSpeed = 100,
    deletingSpeed = 50,
    pauseDuration = 2000
}: {
    words: string[];
    className?: string;
    typingSpeed?: number;
    deletingSpeed?: number;
    pauseDuration?: number;
}) {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentText, setCurrentText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const word = words[currentWordIndex];

        const timeout = setTimeout(() => {
            if (!isDeleting) {
                // Typing
                if (currentText.length < word.length) {
                    setCurrentText(word.slice(0, currentText.length + 1));
                } else {
                    // Pause before deleting
                    setTimeout(() => setIsDeleting(true), pauseDuration);
                }
            } else {
                // Deleting
                if (currentText.length > 0) {
                    setCurrentText(word.slice(0, currentText.length - 1));
                } else {
                    setIsDeleting(false);
                    setCurrentWordIndex((prev) => (prev + 1) % words.length);
                }
            }
        }, isDeleting ? deletingSpeed : typingSpeed);

        return () => clearTimeout(timeout);
    }, [currentText, isDeleting, currentWordIndex, words, typingSpeed, deletingSpeed, pauseDuration]);

    return (
        <span className={className}>
            {currentText}
            <span className="animate-pulse">|</span>
        </span>
    );
}

// Mouse-following gradient spotlight
export function MouseGradient({ children }: { children: ReactNode }) {
    const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                setMousePosition({ x, y });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div ref={containerRef} className="relative">
            <div
                className="pointer-events-none absolute inset-0 opacity-30 transition-opacity duration-300"
                style={{
                    background: `radial-gradient(600px circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(147, 51, 234, 0.15), transparent 40%)`,
                }}
            />
            {children}
        </div>
    );
}

// Floating animation wrapper
export function FloatingElement({
    children,
    className = '',
    duration = 3,
    delay = 0,
    range = 10
}: {
    children: ReactNode;
    className?: string;
    duration?: number;
    delay?: number;
    range?: number;
}) {
    return (
        <div
            className={className}
            style={{
                animation: `float ${duration}s ease-in-out infinite`,
                animationDelay: `${delay}s`,
            }}
        >
            <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-${range}px); }
        }
      `}</style>
            {children}
        </div>
    );
}

// Interactive hover card with 3D tilt effect
export function TiltCard({
    children,
    className = ''
}: {
    children: ReactNode;
    className?: string;
}) {
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;

        setRotation({ x: rotateX, y: rotateY });
    };

    const handleMouseLeave = () => {
        setRotation({ x: 0, y: 0 });
        setIsHovering(false);
    };

    return (
        <div
            ref={cardRef}
            className={className}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={handleMouseLeave}
            style={{
                transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) ${isHovering ? 'scale(1.02)' : 'scale(1)'}`,
                transition: isHovering ? 'none' : 'transform 0.5s ease-out',
                transformStyle: 'preserve-3d',
            }}
        >
            {children}
        </div>
    );
}

// Staggered animation for lists
export function StaggeredList({
    children,
    className = '',
    staggerDelay = 100
}: {
    children: ReactNode[];
    className?: string;
    staggerDelay?: number;
}) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={ref} className={className}>
            {children.map((child, index) => (
                <div
                    key={index}
                    style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                        transition: `opacity 0.5s ease-out, transform 0.5s ease-out`,
                        transitionDelay: `${index * staggerDelay}ms`,
                    }}
                >
                    {child}
                </div>
            ))}
        </div>
    );
}

// Pulse ring animation for CTAs
export function PulseButton({
    children,
    className = '',
    pulseColor = 'rgba(147, 51, 234, 0.5)'
}: {
    children: ReactNode;
    className?: string;
    pulseColor?: string;
}) {
    return (
        <div className={`relative inline-block ${className}`}>
            <div
                className="absolute inset-0 rounded-lg animate-ping opacity-75"
                style={{ backgroundColor: pulseColor, animationDuration: '2s' }}
            />
            <div
                className="absolute inset-0 rounded-lg animate-pulse opacity-50"
                style={{ backgroundColor: pulseColor, animationDuration: '2s', animationDelay: '0.5s' }}
            />
            <div className="relative">{children}</div>
        </div>
    );
}
