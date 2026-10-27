'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function WatchPartyPage() {
    const router = useRouter();

    // Redirect after 5 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            router.push('/');
        }, 5000);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="min-h-screen bg-gray-950">
            <Navigation />

            <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4">
                <div className="max-w-2xl w-full text-center space-y-8">
                    <div className="space-y-4">
                        <Users size={80} className="mx-auto text-teal-500" />
                        <h1 className="text-4xl md:text-5xl font-bold text-white">Watch Together</h1>
                        <p className="text-xl text-gray-400">
                            Experience movies and TV shows with friends in real-time!
                        </p>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 space-y-6">
                        <div className="space-y-4 text-left">
                            <h2 className="text-2xl font-bold text-white">How to use Watch Together:</h2>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                                        1
                                    </div>
                                    <div>
                                        <p className="text-gray-300">
                                            <span className="font-semibold text-white">Find a movie or TV show</span> you want to watch
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                                        2
                                    </div>
                                    <div>
                                        <p className="text-gray-300">
                                            <span className="font-semibold text-white">Click the &ldquo;Watch Together&rdquo; button</span> on the movie/TV page
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                                        3
                                    </div>
                                    <div>
                                        <p className="text-gray-300">
                                            <span className="font-semibold text-white">Create a room or join with a code</span> to watch with friends
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                                        4
                                    </div>
                                    <div>
                                        <p className="text-gray-300">
                                            <span className="font-semibold text-white">Enjoy video calling, voice chat, and real-time messaging</span> while watching together!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-800">
                            <Link href="/">
                                <button className="w-full py-4 px-6 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2">
                                    Browse Movies & TV Shows
                                    <ArrowRight size={20} />
                                </button>
                            </Link>
                        </div>

                        <p className="text-sm text-gray-500">
                            Redirecting to homepage in 5 seconds...
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-white mb-2">🎥 Video Calling</h3>
                            <p className="text-sm text-gray-400">
                                See your friends while watching together with built-in video calling
                            </p>
                        </div>

                        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-white mb-2">💬 Real-time Chat</h3>
                            <p className="text-sm text-gray-400">
                                React and discuss the movie in real-time with instant messaging
                            </p>
                        </div>

                        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-white mb-2">🔒 Secure Rooms</h3>
                            <p className="text-sm text-gray-400">
                                Login required for safety. Share 6-digit codes with friends only
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}