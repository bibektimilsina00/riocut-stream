'use client';

import { Bell, Search, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface AdminUser {
    name?: string | null;
    email?: string | null;
    image?: string | null;
}

interface AdminHeaderProps {
    user?: AdminUser;
}

export function AdminHeader({ user }: AdminHeaderProps) {
    // Fetch unread notifications
    const { data: notificationsCount = 0 } = useQuery({
        queryKey: ['admin', 'notifications', 'unread'],
        queryFn: async () => {
            const res = await axios.get('/api/admin/notifications/unread');
            return res.data.count || 0;
        },
        staleTime: 1000 * 30, // 30 seconds
    });

    return (
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
            <div className="flex items-center justify-between">
                {/* Left Section - Search */}
                <div className="flex-1 max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>
                </div>

                {/* Right Section - Notifications and User */}
                <div className="flex items-center space-x-6 ml-6">
                    {/* Notifications Bell */}
                    <button className="relative text-gray-400 hover:text-white transition-colors">
                        <Bell size={24} />
                        {notificationsCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {notificationsCount}
                            </span>
                        )}
                    </button>

                    {/* User Profile */}
                    <div className="flex items-center space-x-3 pl-6 border-l border-gray-700">
                        <div className="text-right">
                            <p className="text-white font-medium text-sm">{user?.name || 'Admin'}</p>
                            <p className="text-gray-400 text-xs">{user?.email}</p>
                        </div>
                        <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center">
                            {user?.image ? (
                                <img
                                    src={user.image}
                                    alt={user.name || 'User'}
                                    className="w-10 h-10 rounded-full"
                                />
                            ) : (
                                <User size={20} className="text-white" />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
