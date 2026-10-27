'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { TrendingUp, Eye, Clock, Search } from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';

export default function AnalyticsPage() {
    // Fetch analytics data
    const { data: analytics = {}, isLoading } = useQuery({
        queryKey: ['admin', 'analytics', 'detailed'],
        queryFn: async () => {
            const res = await axios.get('/api/admin/analytics');
            return res.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Analytics</h1>
                <p className="text-gray-400 mt-2">Detailed platform performance metrics</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Page Views"
                    value={analytics.pageViews || 0}
                    icon={<Eye size={24} />}
                    trend={analytics.pageViewsTrend || '+0%'}
                    color="blue"
                />
                <StatCard
                    title="Avg Session Duration"
                    value={`${analytics.avgSessionDuration || 0}m`}
                    icon={<Clock size={24} />}
                    trend={analytics.sessionTrend || '+0%'}
                    color="green"
                />
                <StatCard
                    title="Search Queries"
                    value={analytics.searchQueries || 0}
                    icon={<Search size={24} />}
                    trend={analytics.searchTrend || '+0%'}
                    color="purple"
                />
                <StatCard
                    title="Bounce Rate"
                    value={`${analytics.bounceRate || 0}%`}
                    icon={<TrendingUp size={24} />}
                    trend={analytics.bounceRateTrend || '+0%'}
                    color="emerald"
                />
            </div>

            {/* Popular Content */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h2 className="text-xl font-bold text-white mb-6">Most Watched Content</h2>
                <div className="space-y-4">
                    {(analytics.topContent || []).map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors">
                            <div className="flex items-center space-x-4 flex-1">
                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-teal-600 text-white font-bold text-sm">
                                    #{index + 1}
                                </div>
                                <div>
                                    <p className="text-white font-medium">{item.title}</p>
                                    <p className="text-sm text-gray-400 mt-1">{item.type}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-white font-bold">{item.views}</p>
                                <p className="text-xs text-gray-400 mt-1">views</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Search Trends */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h2 className="text-xl font-bold text-white mb-6">Top Search Queries</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {(analytics.topSearches || []).map((query: any, index: number) => (
                        <div key={index} className="p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors">
                            <p className="text-gray-400 text-xs mb-2 truncate">{query.query}</p>
                            <p className="text-white font-bold">{query.count}</p>
                            <p className="text-xs text-gray-500">searches</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* User Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Active Users */}
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                    <h2 className="text-xl font-bold text-white mb-6">Daily Active Users</h2>
                    <div className="h-48 flex items-end justify-between space-x-2">
                        {(analytics.dailyActiveUsers || []).map((day: any, index: number) => (
                            <div key={index} className="flex-1 flex flex-col items-center">
                                <div
                                    className="w-full bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-lg transition-all hover:from-teal-500 hover:to-teal-300"
                                    style={{
                                        height: `${(day.count / Math.max(...(analytics.dailyActiveUsers || []).map((d: any) => d.count), 1)) * 100}%`,
                                        minHeight: '4px',
                                    }}
                                />
                                <p className="text-xs text-gray-400 mt-2">{day.day}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Device Stats */}
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                    <h2 className="text-xl font-bold text-white mb-6">Platform Distribution</h2>
                    <div className="space-y-4">
                        {(analytics.platformStats || []).map((stat: any, index: number) => (
                            <div key={index}>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm text-gray-300">{stat.platform}</p>
                                    <p className="text-sm font-bold text-white">{stat.percentage}%</p>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-2">
                                    <div
                                        className="bg-teal-600 h-2 rounded-full transition-all"
                                        style={{ width: `${stat.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
