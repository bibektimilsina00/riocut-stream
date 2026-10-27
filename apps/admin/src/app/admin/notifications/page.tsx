'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';
import { Send, Trash2, AlertCircle, Info } from 'lucide-react';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'maintenance';
    isActive: boolean;
    createdAt: string;
    expiresAt?: string;
}

export default function NotificationsPage() {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'info' as const,
        expiresIn: '24', // hours
    });

    // Fetch notifications
    const { data: notificationsData = { notifications: [], total: 0 }, isLoading } = useQuery({
        queryKey: ['admin', 'notifications', 'all'],
        queryFn: async () => {
            const res = await axios.get('/api/admin/notifications');
            return res.data;
        },
        staleTime: 1000 * 30,
    });

    // Create notification mutation
    const createNotificationMutation = useMutation({
        mutationFn: async () => {
            await axios.post('/api/admin/notifications', {
                ...formData,
                expiresIn: parseInt(formData.expiresIn),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
            setFormData({ title: '', message: '', type: 'info', expiresIn: '24' });
        },
    });

    // Delete notification mutation
    const deleteNotificationMutation = useMutation({
        mutationFn: async (notificationId: string) => {
            await axios.delete(`/api/admin/notifications/${notificationId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
        },
    });

    const typeIcons = {
        info: <Info size={20} className="text-teal-400" />,
        warning: <AlertCircle size={20} className="text-yellow-400" />,
        error: <AlertCircle size={20} className="text-red-400" />,
        maintenance: <AlertCircle size={20} className="text-purple-400" />,
    };

    const typeColors = {
        info: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
        warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        error: 'bg-red-500/20 text-red-400 border-red-500/30',
        maintenance: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Notifications</h1>
                <p className="text-gray-400 mt-2">Create and manage system-wide notifications</p>
            </div>

            {/* Create Notification Form */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h2 className="text-xl font-bold text-white mb-6">Send System Notification</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                        <input
                            type="text"
                            placeholder="Notification title..."
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                        <textarea
                            placeholder="Notification message..."
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="info">Info</option>
                                <option value="warning">Warning</option>
                                <option value="error">Error</option>
                                <option value="maintenance">Maintenance</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Expires In (hours)</label>
                            <input
                                type="number"
                                min="1"
                                max="720"
                                value={formData.expiresIn}
                                onChange={(e) => setFormData({ ...formData, expiresIn: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                    </div>

                    <button
                        onClick={() => createNotificationMutation.mutate()}
                        disabled={!formData.title || !formData.message || createNotificationMutation.isPending}
                        className="w-full px-4 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                        <Send size={20} />
                        <span>Send Notification</span>
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800 bg-gray-800/50">
                    <h2 className="text-lg font-bold text-white">Active Notifications</h2>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                    </div>
                ) : notificationsData.notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 px-6">
                        <AlertCircle size={48} className="text-gray-600 mb-4" />
                        <p className="text-gray-400 text-lg">No active notifications</p>
                    </div>
                ) : (
                    <div className="space-y-4 p-6">
                        {notificationsData.notifications.map((notification: Notification) => (
                            <div
                                key={notification.id}
                                className={`p-4 rounded-lg border ${typeColors[notification.type]} hover:opacity-90 transition-opacity`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4 flex-1">
                                        <div className="mt-1">{typeIcons[notification.type]}</div>
                                        <div>
                                            <h4 className="font-bold text-sm">{notification.title}</h4>
                                            <p className="text-sm mt-1 opacity-90">{notification.message}</p>
                                            <p className="text-xs opacity-75 mt-2">
                                                Created: {new Date(notification.createdAt).toLocaleString()}
                                                {notification.expiresAt && (
                                                    <> • Expires: {new Date(notification.expiresAt).toLocaleString()}</>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteNotificationMutation.mutate(notification.id)}
                                        className="p-2 rounded-lg hover:bg-black/20 transition-colors ml-4"
                                        title="Delete notification"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
