import Link from "next/link";
import { Home, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
            </div>

            <div className="relative z-10 text-center max-w-lg">
                {/* 404 Number */}
                <div className="mb-8">
                    <h1 className="text-8xl sm:text-9xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        404
                    </h1>
                </div>

                {/* Search Icon */}
                <div className="mb-6 flex justify-center">
                    <div className="p-4 bg-purple-500/20 rounded-full">
                        <Search className="h-12 w-12 text-purple-400" />
                    </div>
                </div>

                {/* Message */}
                <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-4">
                    Page Not Found
                </h2>
                <p className="text-slate-300 mb-8 text-base sm:text-lg leading-relaxed">
                    Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    Let&apos;s get you back on track.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        asChild
                        size="lg"
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    >
                        <Link href="/">
                            <Home className="mr-2 h-5 w-5" />
                            Go to Homepage
                        </Link>
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                        <Link href="javascript:history.back()">
                            <ArrowLeft className="mr-2 h-5 w-5" />
                            Go Back
                        </Link>
                    </Button>
                </div>

                {/* Help Text */}
                <p className="mt-8 text-sm text-slate-400">
                    Need help?{" "}
                    <Link href="/contact" className="text-purple-400 hover:text-purple-300 underline">
                        Contact Support
                    </Link>
                </p>
            </div>
        </div>
    );
}
