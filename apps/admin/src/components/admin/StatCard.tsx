'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    trend?: string;
    color: 'blue' | 'green' | 'purple' | 'emerald' | 'red';
}

const colorClasses = {
    blue: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function StatCard({ title, value, icon, trend, color }: StatCardProps) {
    const isPositive = trend && !trend.includes('-');

    return (
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 hover:border-gray-700 transition-colors">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
                <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
                    {icon}
                </div>
            </div>

            {/* Value */}
            <div className="mb-3">
                <p className="text-3xl font-bold text-white">{value}</p>
            </div>

            {/* Trend */}
            {trend && (
                <div className="flex items-center space-x-1">
                    {isPositive ? (
                        <TrendingUp size={16} className="text-green-400" />
                    ) : (
                        <TrendingDown size={16} className="text-red-400" />
                    )}
                    <span className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {trend}
                    </span>
                </div>
            )}
        </div>
    );
}
