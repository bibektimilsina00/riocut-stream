'use client';

import { track } from '@riocut/analytics/client';

/**
 * Google Analytics Hook for React
 * 
 * Easy-to-use React hook for tracking events with Google Analytics
 */

declare global {
    interface Window {
        gtag: (command: string, action?: string, parameters?: Record<string, unknown>) => void;
        dataLayer: Record<string, unknown>[];
    }
}

interface EventProperties {
    [key: string]: string | number | boolean;
}

export function useAnalytics() {
    // Ensure Google Analytics is available
    const getGtag = () => {
        if (typeof window !== 'undefined' && window.gtag) {
            return window.gtag;
        }
        return null;
    };

    /**
     * Track custom events
     * @param eventName - The name of the event
     * @param properties - Event data
     */
    const trackEvent = (eventName: string, properties?: EventProperties) => {
        track(eventName, properties);
        const gtag = getGtag();
        if (!gtag) {
            return;
        }

        try {
            gtag('event', eventName, properties);
            console.log(`Tracked event: ${eventName}`, properties);
        } catch (error) {
            console.error('Error tracking event:', error);
        }
    };

    /**
     * Track page views
     * @param pageName - Name of the page being viewed
     * @param properties - Additional page data
     */
    const trackPageView = (pageName: string, properties?: EventProperties) => {
        trackEvent('page_view', {
            page_title: pageName,
            ...properties
        });
    };

    /**
     * Track errors for debugging
     * @param error - The error object
     * @param context - Additional context about where the error occurred
     */
    const trackError = (error: Error, context?: EventProperties) => {
        trackEvent('exception', {
            description: error.message,
            fatal: false,
            ...context
        });
    };

    /**
     * Track watch together events
     * @param eventName - The specific watch together event
     * @param properties - Event-specific data
     */
    const trackWatchTogetherEvent = (eventName: string, properties?: EventProperties) => {
        trackEvent(`watch_together_${eventName}`, properties);
    };    /**
     * Track video quality and performance metrics
     * @param quality - Video quality level (high, medium, low)
     * @param duration - Video stream duration in seconds
     * @param resolution - Video resolution (1280x720, 640x480, etc)
     */
    const trackVideoQuality = (quality: string, duration: number, resolution: string) => {
        trackEvent('video_quality', {
            quality,
            duration_seconds: String(duration),
            resolution,
            timestamp: new Date().toISOString(),
        });
    };

    // Predefined tracking functions with proper typing and validation

    /**
     * Track connection events (WebSocket, network status)
     */
    const trackConnectionEvent = (status: string, details?: EventProperties) => {
        trackEvent('connection', {
            status: status,
            ...details
        });
    };    /**
     * Track media device permissions
     * @param deviceType - camera, microphone, screen
     * @param granted - true if permission granted
     */
    const trackPermission = (deviceType: string, granted: boolean) => {
        trackEvent('permission_granted', {
            device_type: deviceType,
            granted: granted ? 'yes' : 'no',
        });
    };

    /**
     * Track message sent in chat
     * @param messageLength - Length of message
     * @param participantCount - Number of participants in room
     */
    const trackMessage = (messageLength: number, participantCount?: number) => {
        const properties: EventProperties = {
            message_length: String(messageLength),
        };
        if (participantCount !== undefined) {
            properties.participant_count = String(participantCount);
        }
        trackEvent('message_sent', properties);
    };

    /**
     * Track video/audio toggle state changes
     * @param deviceType - camera or microphone
     * @param enabled - true if enabled, false if disabled
     */
    const trackDeviceToggle = (deviceType: string, enabled: boolean) => {
        trackEvent('device_toggled', {
            device_type: deviceType,
            enabled: enabled ? 'yes' : 'no',
        });
    };

    /**
     * Track user session events
     * @param eventName - login, logout, register, session_start
     * @param properties - Session properties
     */
    const trackSession = (eventName: string, properties?: EventProperties) => {
        trackEvent(`session_${eventName}`, properties);
    };

    /**
     * Track search and content discovery
     * @param searchQuery - What user searched for
     * @param results - Number of results found
     */
    const trackSearch = (searchQuery: string, results?: number) => {
        const properties: EventProperties = {
            query: searchQuery.substring(0, 100),
        };
        if (results !== undefined) {
            properties.results = String(results);
        }
        trackEvent('search_performed', properties);
    };

    /**
     * Track content interactions
     * @param contentType - movie, tv, watchlist, etc
     * @param action - viewed, added, removed, shared
     * @param contentId - ID of the content
     */
    const trackContent = (contentType: string, action: string, contentId?: string) => {
        const properties: EventProperties = {
            content_type: contentType,
            action,
        };
        if (contentId !== undefined) {
            properties.content_id = contentId;
        }
        trackEvent('content_interaction', properties);
    };

    /**
     * Track video player events
     * @param action - play, pause, seek, source_change, fullscreen
     * @param properties - Additional player properties
     */
    const trackPlayerEvent = (action: string, properties?: EventProperties) => {
        trackEvent('player_event', {
            action,
            ...properties,
        });
    };

    /**
     * Track performance metrics
     * @param metricName - metric identifier
     * @param duration - duration in milliseconds
     */
    const trackPerformance = (metricName: string, duration: number) => {
        trackEvent('performance_metric', {
            metric: metricName,
            duration_ms: String(duration),
        });
    };

    return {
        trackEvent,
        trackPageView,
        trackError,
        trackWatchTogetherEvent,
        trackVideoQuality,
        trackConnectionEvent,
        trackPermission,
        trackMessage,
        trackDeviceToggle,
        trackSession,
        trackSearch,
        trackContent,
        trackPlayerEvent,
        trackPerformance,
    };
}
