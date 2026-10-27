'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Film, Search, Menu, X, Home, Tv, Play, Heart, LogIn, LogOut, User, ChevronDown, BookOpen, Settings } from 'lucide-react';

const MAIN_SITE_URL = process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'https://riocut.com';

export default function AdminNavigation() {
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };

        if (userMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [userMenuOpen]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Redirect to main site for search
            window.location.href = `${MAIN_SITE_URL}/search?q=${encodeURIComponent(searchQuery)}`;
        }
    };

    const isAdmin = (session?.user as any)?.role === 'admin';

    const navLinks = [
        { href: '/', label: 'Blog', icon: BookOpen },
        { href: `${MAIN_SITE_URL}`, label: 'Main Site', icon: Home, external: true },
        { href: `${MAIN_SITE_URL}/movies`, label: 'Movies', icon: Film, external: true },
        { href: `${MAIN_SITE_URL}/tv`, label: 'TV Shows', icon: Tv, external: true },
        ...(isAdmin ? [{ href: '/admin/dashboard', label: 'Admin', icon: Settings }] : []),
        { href: `${MAIN_SITE_URL}/watchlist`, label: 'Watchlist', icon: Heart, external: true },
    ];

    return (
        <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-md border-b border-gray-800 shadow-lg">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                    {/* Logo */}
                    <Link href="/blog" className="flex items-center gap-2 group shrink-0">
                        <Image
                            src="/logo.svg"
                            alt="Riocut"
                            width={566}
                                height={118}
                            className="h-8 w-auto group-hover:scale-105 transition-transform duration-300"
                        />
                    </Link>

                    {/* Desktop Navigation - Compact */}
                    <nav className="hidden lg:flex items-center gap-4 pt-2">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            const isActive = mounted && pathname === link.href && !link.external;

                            if (link.external) {
                                return (
                                    <a
                                        key={link.href}
                                        href={link.href}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 text-sm text-gray-300 hover:text-teal-400 hover:bg-gray-800/50"
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="hidden xl:inline">{link.label}</span>
                                    </a>
                                );
                            }

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${isActive
                                        ? 'text-teal-400 bg-teal-500/10'
                                        : 'text-gray-300 hover:text-teal-400 hover:bg-gray-800/50'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="hidden xl:inline">{link.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right Side - Search & Auth */}
                    <div className="flex items-center gap-2">
                        {/* Search Bar - Wider with Auto-suggestions */}
                        <form onSubmit={handleSearch} className="relative hidden md:block" autoComplete="off">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search movies, TV shows..."
                                className="bg-gray-800/50 text-white px-4 py-2 pr-10 rounded-full outline-none focus:ring-2 focus:ring-teal-500 focus:bg-gray-800 transition-all w-48 lg:w-64 xl:w-72 text-sm placeholder:text-gray-500"
                            />
                            <button
                                type="submit"
                                className="absolute right-3 top-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
                            >
                                <Search className="w-4 h-4 text-gray-400 hover:text-teal-400" />
                            </button>
                        </form>

                        {/* Auth Section - Compact with Dropdown */}
                        <div className="hidden md:flex items-center gap-2">
                            <div className="relative" ref={userMenuRef}>
                                {session ? (
                                    <>
                                        <button
                                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 hover:bg-gray-800 rounded-full transition-all"
                                        >
                                            <User className="w-4 h-4 text-gray-300" />
                                            <span className="text-sm text-gray-300 max-w-[100px] truncate">{session.user?.name}</span>
                                            <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {/* User Dropdown Menu */}
                                        {userMenuOpen && (
                                            <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl py-2 z-50">
                                                <div className="px-4 py-2 border-b border-gray-800">
                                                    <p className="text-sm text-gray-400">Signed in as</p>
                                                    <p className="text-sm text-white font-medium truncate">{session.user?.email}</p>
                                                    {(session.user as any)?.role === 'admin' && (
                                                        <span className="inline-block mt-1 px-2 py-0.5 bg-teal-500/20 text-teal-400 text-xs rounded-full">
                                                            Admin
                                                        </span>
                                                    )}
                                                </div>
                                                {(session.user as any)?.role === 'admin' && (
                                                    <Link
                                                        href="/admin/dashboard"
                                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all"
                                                        onClick={() => setUserMenuOpen(false)}
                                                    >
                                                        <Settings className="w-4 h-4" />
                                                        Admin Dashboard
                                                    </Link>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        signOut({ callbackUrl: '/blog' });
                                                        setUserMenuOpen(false);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-800/50 transition-all"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Sign Out
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="flex items-center gap-1.5 px-4 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-full transition-all text-sm"
                                    >
                                        <LogIn className="w-4 h-4" />
                                        <span>Sign In</span>
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden text-white hover:text-teal-400 transition-colors p-2"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="lg:hidden mt-4 pb-4 border-t border-gray-800 animate-in slide-in-from-top">
                        {/* Mobile Search */}
                        <form onSubmit={handleSearch} className="relative my-4">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="w-full bg-gray-800/50 text-white px-4 py-2 pr-10 rounded-full outline-none focus:ring-2 focus:ring-teal-500 focus:bg-gray-800 transition-all"
                            />
                            <button
                                type="submit"
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                                <Search className="w-5 h-5 text-gray-400" />
                            </button>
                        </form>

                        {/* Mobile Nav Links */}
                        <nav className="flex flex-col gap-2">
                            {navLinks.map((link) => {
                                const Icon = link.icon;
                                const isActive = mounted && pathname === link.href && !link.external;

                                if (link.external) {
                                    return (
                                        <a
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-300 hover:text-teal-400 hover:bg-gray-800/50"
                                        >
                                            <Icon className="w-5 h-5" />
                                            {link.label}
                                        </a>
                                    );
                                }

                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                            ? 'text-teal-400 bg-teal-500/10'
                                            : 'text-gray-300 hover:text-teal-400 hover:bg-gray-800/50'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {link.label}
                                    </Link>
                                );
                            })}

                            {/* Mobile Auth Links */}
                            <div className="mt-2 pt-2 border-t border-gray-800">
                                {session ? (
                                    <>
                                        <div className="flex items-center gap-3 px-4 py-3 text-gray-300 bg-gray-800/30 rounded-lg mb-2">
                                            <User className="w-5 h-5" />
                                            <div>
                                                <p className="text-sm font-medium">{session.user?.name}</p>
                                                <p className="text-xs text-gray-500">{session.user?.email}</p>
                                                {(session.user as any)?.role === 'admin' && (
                                                    <span className="inline-block mt-1 px-2 py-0.5 bg-teal-500/20 text-teal-400 text-xs rounded-full">
                                                        Admin
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {(session.user as any)?.role === 'admin' && (
                                            <Link
                                                href="/admin/dashboard"
                                                onClick={() => setMobileMenuOpen(false)}
                                                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:text-teal-400 hover:bg-gray-800/50 transition-all mb-2"
                                            >
                                                <Settings className="w-5 h-5" />
                                                Admin Dashboard
                                            </Link>
                                        )}
                                        <button
                                            onClick={() => {
                                                signOut({ callbackUrl: '/blog' });
                                                setMobileMenuOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-gray-800/50 transition-all"
                                        >
                                            <LogOut className="w-5 h-5" />
                                            Sign Out
                                        </button>
                                    </>
                                ) : (
                                    <Link
                                        href="/login"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-all"
                                    >
                                        <LogIn className="w-5 h-5" />
                                        Sign In
                                    </Link>
                                )}
                            </div>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}