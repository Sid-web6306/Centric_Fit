'use client';

import { useEffect } from "react";
import Link from "next/link";
import { Home, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
            </div>

            <div className="relative z-10 text-center max-w-lg">
                {/* Error Icon */}
                <div className="mb-6 flex justify-center">
                    <div className="p-4 bg-red-500/20 rounded-full">
                        <AlertTriangle className="h-16 w-16 text-red-400" />
                    </div>
                </div>

                {/* Message */}
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                    Something Went Wrong
                </h1>
                <p className="text-slate-300 mb-4 text-base sm:text-lg leading-relaxed">
                    We apologize for the inconvenience. An unexpected error has occurred.
                </p>

                {error.digest && (
                    <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <p className="text-xs text-slate-500">
                            Error ID: {error.digest}
                        </p>
                    </div>
                )}

                <p className="text-slate-400 mb-8 text-sm">
                    Our team has been notified. Please try again or return to the homepage.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        onClick={reset}
                        size="lg"
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    >
                        <RefreshCw className="mr-2 h-5 w-5" />
                        Try Again
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                        <Link href="/">
                            <Home className="mr-2 h-5 w-5" />
                            Go to Homepage
                        </Link>
                    </Button>
                </div>

                {/* Help Text */}
                <p className="mt-8 text-sm text-slate-400">
                    Persistent issues?{" "}
                    <Link href="/contact" className="text-purple-400 hover:text-purple-300 underline">
                        Contact Support
                    </Link>
                </p>
            </div>
        </div>
    );
}
