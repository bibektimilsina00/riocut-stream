'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { User, Video, Users, LogOut } from 'lucide-react';

interface Activity {
    id: string;
    type: 'user_signup' | 'watch_started' | 'room_created' | 'user_logout';
    user: string;
    description: string;
    timestamp: string;
}

const activityIcons = {
    user_signup: <User size={18} className="text-teal-400" />,
    watch_started: <Video size={18} className="text-purple-400" />,
    room_created: <Users size={18} className="text-green-400" />,
    user_logout: <LogOut size={18} className="text-gray-400" />,
};

function formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function RecentActivity() {
    const { data: activities = [], isLoading } = useQuery({
        queryKey: ['admin', 'activity', 'recent'],
        queryFn: async () => {
            const res = await axios.get('/api/admin/activity/recent');
            return res.data.activities || [];
        },
        staleTime: 1000 * 30, // 30 seconds
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-400">No recent activity</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {activities.map((activity: Activity) => (
                <div
                    key={activity.id}
                    className="flex items-start space-x-4 p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
                >
                    <div className="mt-1">
                        {activityIcons[activity.type] || <User size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm">{activity.description}</p>
                        <p className="text-gray-400 text-xs mt-1">{activity.user}</p>
                    </div>
                    <div className="text-gray-400 text-xs whitespace-nowrap">
                        {formatTime(activity.timestamp)}
                    </div>
                </div>
            ))}
        </div>
    );
}
