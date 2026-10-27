'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Mail, Lock, Shield, Sparkles, CheckCircle, Users, BarChart3, Settings } from 'lucide-react';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Invalid email or password');
            } else {
                router.push('/admin');
                router.refresh();
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950">
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-teal-950/20 to-gray-950 flex items-center justify-center px-4 py-12 relative overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal-600/5 rounded-full blur-3xl"></div>
                </div>

                <div className="max-w-md w-full relative z-10">
                    {/* Logo Section */}
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center gap-2 text-gray-300 mb-6">
                            <Sparkles className="w-5 h-5 text-teal-400" />
                            <span className="text-lg">Riocut Admin Portal</span>
                            <Sparkles className="w-5 h-5 text-teal-400" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Admin Sign In</h1>
                        <p className="text-gray-400">Access your admin dashboard</p>
                    </div>

                    {/* Login Card */}
                    <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-800/50 hover:border-gray-700/50 transition-all duration-300">

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl p-4 text-sm flex items-start gap-2 backdrop-blur-sm animate-in fade-in slide-in-from-top">
                                    <span className="text-lg">⚠️</span>
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-teal-400" />
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all hover:bg-gray-800/70"
                                    placeholder="admin@riocut.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-teal-400" />
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all hover:bg-gray-800/70"
                                    placeholder="••••••••"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 px-4 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-teal-500/50 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        <Shield size={18} />
                                        Sign In to Admin
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Admin Features */}
                        <div className="mt-6 p-5 bg-gradient-to-r from-teal-900/20 to-teal-900/20 rounded-xl border border-teal-800/30 backdrop-blur-sm space-y-2">
                            <p className="text-sm text-teal-300 font-semibold mb-3">Admin Dashboard Features</p>
                            <div className="space-y-2 text-xs text-gray-400">
                                <p className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-teal-400" />
                                    User management & analytics
                                </p>
                                <p className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-teal-400" />
                                    Content moderation tools
                                </p>
                                <p className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-teal-400" />
                                    System monitoring & logs
                                </p>
                            </div>
                        </div>

                        {/* Features Grid */}
                        <div className="mt-8 flex justify-around gap-3">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                                    <Users className="w-6 h-6 text-teal-400" />
                                </div>
                                <p className="text-xs text-gray-400 font-medium">Users</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                                    <BarChart3 className="w-6 h-6 text-teal-400" />
                                </div>
                                <p className="text-xs text-gray-400 font-medium">Analytics</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                                    <Settings className="w-6 h-6 text-teal-400" />
                                </div>
                                <p className="text-xs text-gray-400 font-medium">Settings</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-8 pt-6 border-t border-gray-800/50">
                            <p className="text-center text-gray-400 text-sm">
                                Admin access only. Contact system administrator for credentials.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}