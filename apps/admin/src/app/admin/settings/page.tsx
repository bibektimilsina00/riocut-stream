'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';

interface Settings {
    maintenanceMode: boolean;
    maxConcurrentRooms: number;
    maxRoomSize: number;
    sessionTimeout: number;
    enableAnalytics: boolean;
    enableNotifications: boolean;
    apiRateLimit: number;
    defaultLanguage: string;
}

interface SystemInfo {
    version: string;
    environment: string;
    nodeVersion: string;
    databaseStatus: string;
    cacheStatus: string;
    socketIOStatus: string;
}

export default function SettingsPage() {
    const queryClient = useQueryClient();
    const [settings, setSettings] = useState<Partial<Settings>>({});
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Fetch settings
    const { data: currentSettings, isLoading } = useQuery({
        queryKey: ['admin', 'settings'],
        queryFn: async () => {
            const res = await axios.get('/api/admin/settings');
            setSettings(res.data);
            return res.data;
        },
        staleTime: 1000 * 60,
    });

    // Fetch system info
    const { data: systemInfo = {} as SystemInfo } = useQuery({
        queryKey: ['admin', 'settings', 'system'],
        queryFn: async () => {
            const res = await axios.get('/api/admin/settings/system');
            return res.data;
        },
        staleTime: 1000 * 30,
    });

    // Save settings mutation
    const saveSettingsMutation = useMutation({
        mutationFn: async () => {
            await axios.post('/api/admin/settings', settings);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
            setMessage({ type: 'success', text: 'Settings saved successfully!' });
            setTimeout(() => setMessage(null), 3000);
        },
        onError: () => {
            setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
            setTimeout(() => setMessage(null), 3000);
        },
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
                <h1 className="text-3xl font-bold text-white">Settings</h1>
                <p className="text-gray-400 mt-2">Manage platform configuration and system settings</p>
            </div>

            {/* Success/Error Message */}
            {message && (
                <div
                    className={`p-4 rounded-lg flex items-center space-x-3 ${message.type === 'success'
                        ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                        : 'bg-red-500/20 border border-red-500/30 text-red-300'
                        }`}
                >
                    {message.type === 'success' ? (
                        <CheckCircle size={20} />
                    ) : (
                        <AlertCircle size={20} />
                    )}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Quick Settings Navigation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a
                    href="/admin/settings/ai"
                    className="p-6 bg-gradient-to-br from-teal-600/20 to-purple-600/20 border-2 border-teal-500/30 rounded-lg hover:border-teal-500 transition-all group"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                🤖 AI Configuration
                            </h3>
                            <p className="text-gray-300 text-sm">
                                Configure AI models and API keys for blog generation
                            </p>
                            <ul className="mt-3 space-y-1 text-xs text-gray-400">
                                <li>• TMDb API Key (Required)</li>
                                <li>• Gemini, OpenAI, Claude API Keys</li>
                                <li>• Preferred AI Model Selection</li>
                            </ul>
                        </div>
                        <div className="text-4xl opacity-50 group-hover:opacity-100 transition-opacity">
                            ⚙️
                        </div>
                    </div>
                </a>

                <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg opacity-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-gray-500 mb-2">
                                More Settings Coming Soon
                            </h3>
                            <p className="text-gray-500 text-sm">
                                Additional configuration options will be available here
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Platform Settings */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h2 className="text-xl font-bold text-white mb-6">Platform Configuration</h2>
                <div className="space-y-6">
                    {/* Maintenance Mode */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50">
                        <div>
                            <h3 className="text-white font-medium">Maintenance Mode</h3>
                            <p className="text-sm text-gray-400 mt-1">Prevent users from accessing the platform</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.maintenanceMode || false}
                                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600" />
                        </label>
                    </div>

                    {/* Analytics Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50">
                        <div>
                            <h3 className="text-white font-medium">Analytics Tracking</h3>
                            <p className="text-sm text-gray-400 mt-1">Enable user analytics collection</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.enableAnalytics !== false}
                                onChange={(e) => setSettings({ ...settings, enableAnalytics: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600" />
                        </label>
                    </div>

                    {/* Notifications Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50">
                        <div>
                            <h3 className="text-white font-medium">System Notifications</h3>
                            <p className="text-sm text-gray-400 mt-1">Enable push notifications to users</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.enableNotifications !== false}
                                onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600" />
                        </label>
                    </div>
                </div>
            </div>

            {/* Limits Configuration */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h2 className="text-xl font-bold text-white mb-6">System Limits</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Max Concurrent Watch Rooms</label>
                        <input
                            type="number"
                            min="1"
                            value={settings.maxConcurrentRooms || 0}
                            onChange={(e) => setSettings({ ...settings, maxConcurrentRooms: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Max Room Size (participants)</label>
                        <input
                            type="number"
                            min="2"
                            value={settings.maxRoomSize || 0}
                            onChange={(e) => setSettings({ ...settings, maxRoomSize: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Session Timeout (minutes)</label>
                        <input
                            type="number"
                            min="5"
                            value={settings.sessionTimeout || 0}
                            onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">API Rate Limit (requests/min)</label>
                        <input
                            type="number"
                            min="10"
                            value={settings.apiRateLimit || 0}
                            onChange={(e) => setSettings({ ...settings, apiRateLimit: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>
                </div>
            </div>

            {/* System Information */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h2 className="text-xl font-bold text-white mb-6">System Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-gray-800/50">
                        <p className="text-sm text-gray-400">Version</p>
                        <p className="text-white font-medium mt-1">{systemInfo.version}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-800/50">
                        <p className="text-sm text-gray-400">Environment</p>
                        <p className="text-white font-medium mt-1">{systemInfo.environment}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-800/50">
                        <p className="text-sm text-gray-400">Node Version</p>
                        <p className="text-white font-medium mt-1">{systemInfo.nodeVersion}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-800/50">
                        <p className="text-sm text-gray-400">Database Status</p>
                        <p className={`font-medium mt-1 ${systemInfo.databaseStatus === 'Connected' ? 'text-green-400' : 'text-red-400'}`}>
                            {systemInfo.databaseStatus}
                        </p>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <button
                onClick={() => saveSettingsMutation.mutate()}
                disabled={saveSettingsMutation.isPending}
                className="w-full px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
                <Save size={20} />
                <span>{saveSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}</span>
            </button>
        </div>
    );
}
