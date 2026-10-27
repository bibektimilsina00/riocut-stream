'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    text?: string;
}

const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
};

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-3">
            <Loader2
                className={cn(
                    'animate-spin text-teal-500',
                    sizeClasses[size],
                    className
                )}
            />
            {text && (
                <p className="text-gray-400 text-sm animate-pulse">{text}</p>
            )}
        </div>
    );
}

export function PageLoader({ text = 'Loading...' }: { text?: string }) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
            <LoadingSpinner size="lg" text={text} />
        </div>
    );
}

export function FullScreenLoader({ text = 'Loading...' }: { text?: string }) {
    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
            <LoadingSpinner size="xl" text={text} />
        </div>
    );
}

export function InlineLoader({ size = 'sm', text }: LoadingSpinnerProps) {
    return (
        <div className="flex items-center gap-2 py-4">
            <Loader2 className={cn('animate-spin text-teal-500', sizeClasses[size])} />
            {text && <span className="text-gray-400 text-sm">{text}</span>}
        </div>
    );
}
