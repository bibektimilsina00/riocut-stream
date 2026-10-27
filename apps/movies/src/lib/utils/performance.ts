/**
 * Performance optimization utilities
 * Collection of helper functions to improve app performance
 */

/**
 * Debounce function to limit execution rate
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null;

    return function debounced(...args: Parameters<T>) {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            func(...args);
        }, delay);
    };
}

/**
 * Throttle function to limit execution frequency
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return function throttled(...args: Parameters<T>) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

/**
 * Intersection Observer for lazy loading
 */
export function createIntersectionObserver(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
): IntersectionObserver | null {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
        return null;
    }

    return new IntersectionObserver(callback, {
        rootMargin: '50px',
        threshold: 0.01,
        ...options,
    });
}

/**
 * Prefetch links for faster navigation
 */
export function prefetchLinks(urls: string[]): void {
    if (typeof window === 'undefined') return;

    urls.forEach((url) => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
    });
}

/**
 * Batch DOM operations for better performance
 */
export function batchDOMOperations(operations: Array<() => void>): void {
    requestAnimationFrame(() => {
        operations.forEach((op) => op());
    });
}

/**
 * Check if device prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get connection speed information
 */
export function getConnectionSpeed(): 'slow' | 'fast' | 'unknown' {
    if (typeof navigator === 'undefined' || !('connection' in navigator)) {
        return 'unknown';
    }

    const connection = (navigator as { connection?: { effectiveType?: string } }).connection;
    const effectiveType = connection?.effectiveType;

    if (effectiveType === '4g') return 'fast';
    if (effectiveType === '3g' || effectiveType === '2g') return 'slow';

    return 'unknown';
}

/**
 * Check if user has data saver enabled
 */
export function hasDataSaver(): boolean {
    if (typeof navigator === 'undefined' || !('connection' in navigator)) {
        return false;
    }

    const navConnection = (navigator as { connection?: { saveData?: boolean } }).connection;
    return navConnection?.saveData === true;
}
