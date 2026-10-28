'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Film, Search, Menu, X, Home, Tv, Heart, LogIn, LogOut, BookOpen, Loader2, Activity, Users, LifeBuoy, PlayCircle, Settings, History } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { searchMulti } from '@/lib/tmdb';


interface SearchSuggestion {
    id: number;
    media_type: 'movie' | 'tv';
    title: string;
    poster_path: string | null;
}

export default function Navigation() {
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [highlighted, setHighlighted] = useState<number>(-1);
    const [mounted, setMounted] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();
    const userMenuRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const suggestDebounceRef = useRef<number | undefined>(undefined);

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

    // Autosuggest: debounced as user types
    useEffect(() => {
        // Clear previous debounce
        if (suggestDebounceRef.current) {
            window.clearTimeout(suggestDebounceRef.current);
        }

        if (!searchQuery || searchQuery.trim().length < 2) {
            setSuggestions([]);
            return;
        }

        // Skip suggestions on /search — the results grid already filters live.
        if (pathname === '/search') {
            setSuggestions([]);
            return;
        }

        // debounce 300ms
        suggestDebounceRef.current = window.setTimeout(async () => {
            try {
                const res = await searchMulti(searchQuery.trim(), 1);
                const items = (res.results || []).filter((it: { media_type: string }) => it.media_type === 'movie' || it.media_type === 'tv');
                // Map to simplified suggestion items and dedupe by id
                const uniques: SearchSuggestion[] = [];
                const seen = new Set();
                for (const it of items) {
                    const title = it.media_type === 'movie' ? (it as { title: string }).title : (it as { name: string }).name;
                    const key = `${it.media_type}-${it.id}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        uniques.push({
                            id: it.id,
                            media_type: it.media_type as 'movie' | 'tv',
                            title,
                            poster_path: it.poster_path
                        });
                    }
                    if (uniques.length >= 6) break; // limit suggestions to 6 for navbar
                }
                setSuggestions(uniques);
            } catch (err) {
                console.error('Autosuggest error:', err);
                setSuggestions([]);
            }
        }, 300);

        return () => {
            if (suggestDebounceRef.current) window.clearTimeout(suggestDebounceRef.current);
        };
    }, [searchQuery, pathname]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
            setSuggestions([]);
            setMobileMenuOpen(false);
        }
    };

    // Memoize navLinks to prevent recreation
    const navLinks = useMemo(() => [
        { href: '/', label: 'Home', icon: Home },
        { href: '/movies', label: 'Movies', icon: Film },
        { href: '/tv', label: 'TV Shows', icon: Tv },
        { href: process.env.NEXT_PUBLIC_RIOCUT_SPORTS_URL || 'https://sports.riocut.com', label: 'Live Sports', icon: Activity, external: true },
        { href: process.env.NEXT_PUBLIC_BLOG_URL || process.env.NEXT_PUBLIC_BLOG_SITE_URL || 'https://blog.riocut.com', label: 'Blog', icon: BookOpen, external: true },
        { href: '/watchlist', label: 'Watchlist', icon: Heart },
    ], []);

    // Memoize handlers to prevent recreation
    const toggleMobileMenu = useCallback(() => {
        setMobileMenuOpen(prev => !prev);
    }, []);

    const toggleUserMenu = useCallback(() => {
        setUserMenuOpen(prev => !prev);
    }, []);

    const handleSignOut = useCallback(async () => {
        setIsSigningOut(true);
        try {
            await signOut();
            setUserMenuOpen(false);
            setMobileMenuOpen(false);
        } finally {
            setIsSigningOut(false);
        }
    }, []);

    const closeMobileMenu = useCallback(() => {
        setMobileMenuOpen(false);
    }, []);

    return (
        <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-md border-b border-gray-800 shadow-lg">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group shrink-0">
                        <div className="relative">
                            <Image
                                src="/logo.svg"
                                alt="Riocut"
                                width={566}
                                height={118}
                                className="h-8 w-auto group-hover:scale-105 transition-transform duration-300"
                                priority
                            />
                        </div>
                    </Link>

                    {/* Desktop Navigation - Compact */}
                    <nav className="hidden lg:flex items-center gap-4">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            const isActive = mounted && pathname === link.href && !link.external;

                            if (link.external) {
                                return (
                                    <a
                                        key={link.href}
                                        href={link.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
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
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setHighlighted(-1);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'ArrowDown') {
                                        e.preventDefault();
                                        setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
                                    } else if (e.key === 'ArrowUp') {
                                        e.preventDefault();
                                        setHighlighted((h) => Math.max(h - 1, 0));
                                    } else if (e.key === 'Enter') {
                                        if (highlighted >= 0 && suggestions[highlighted]) {
                                            e.preventDefault();
                                            const sel = suggestions[highlighted];
                                            router.push(`/${sel.media_type}/${sel.id}`);
                                            setSuggestions([]);
                                            setSearchQuery('');
                                        }
                                    } else if (e.key === 'Escape') {
                                        setSuggestions([]);
                                    }
                                }}
                                onBlur={() => {
                                    // Delay to allow click on suggestion
                                    setTimeout(() => setSuggestions([]), 200);
                                }}
                                placeholder="Search movies, TV shows..."
                                className="bg-gray-800/50 text-white px-4 py-2 pr-10 rounded-full outline-none focus:ring-2 focus:ring-teal-500 focus:bg-gray-800 transition-all w-48 lg:w-64 xl:w-72 text-sm placeholder:text-gray-500"
                            />
                            <button
                                type="submit"
                                className="absolute right-3 top-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
                            >
                                <Search className="w-4 h-4 text-gray-400 hover:text-teal-400" />
                            </button>

                            {/* Suggestions dropdown */}
                            {suggestions.length > 0 && (
                                <ul
                                    role="listbox"
                                    className="absolute left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-sm border border-gray-800 rounded-xl shadow-2xl z-50 max-h-80 overflow-auto"
                                >
                                    {suggestions.map((sugg, idx) => (
                                        <li
                                            key={`${sugg.media_type}-${sugg.id}`}
                                            role="option"
                                            aria-selected={highlighted === idx}
                                            onMouseDown={(e) => {
                                                // onMouseDown to prevent blur before click
                                                e.preventDefault();
                                                router.push(`/${sugg.media_type}/${sugg.id}`);
                                                setSuggestions([]);
                                                setSearchQuery('');
                                            }}
                                            onMouseEnter={() => setHighlighted(idx)}
                                            className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-800 transition-colors ${highlighted === idx ? 'bg-gray-800' : ''}`}
                                        >

                                            <Image
                                                src={sugg.poster_path ? `https://image.tmdb.org/t/p/w92${sugg.poster_path}` : '/placeholder-movie.jpg'}
                                                alt={sugg.title}
                                                width={32}
                                                height={48}
                                                className="w-8 h-12 object-cover rounded-md shrink-0"
                                            />
                                            <div className="flex-1 text-left min-w-0">
                                                <div className="text-white text-sm font-medium truncate">{sugg.title}</div>
                                                <div className="text-gray-400 text-xs">{sugg.media_type === 'movie' ? 'Movie' : 'TV Show'}</div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </form>

                        {/* Auth Section - Compact with Dropdown */}
                        <div className="hidden md:flex items-center gap-2">
                            {/* Notification Bell */}
                            <NotificationBell />

                            <div className="relative" ref={userMenuRef}>
                                {session ? (
                                    <>
                                        <button
                                            onClick={toggleUserMenu}
                                            aria-label="Open user menu"
                                            aria-haspopup="menu"
                                            aria-expanded={userMenuOpen}
                                            className="relative h-9 w-9 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 ring-2 ring-gray-800 hover:ring-teal-500/40 transition-all flex items-center justify-center shadow-md focus:outline-none focus-visible:ring-teal-500/60"
                                        >
                                            <span className="text-sm font-semibold text-white select-none">
                                                {((session.user?.name || session.user?.email || 'U').trim().charAt(0) || 'U').toUpperCase()}
                                            </span>
                                        </button>

                                        {userMenuOpen && (
                                            <div
                                                role="menu"
                                                className="absolute right-0 mt-3 w-72 bg-gray-900/95 backdrop-blur-md border border-gray-800 rounded-2xl shadow-2xl shadow-black/40 py-2 z-50 animate-in fade-in slide-in-from-top-2 max-h-[80vh] overflow-y-auto"
                                            >
                                                {/* Header card */}
                                                <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-800/60">
                                                    <div className="h-11 w-11 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-md flex-shrink-0 ring-2 ring-teal-500/20">
                                                        <span className="text-base font-bold text-white select-none">
                                                            {((session.user?.name || session.user?.email || 'U').trim().charAt(0) || 'U').toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm text-white font-semibold truncate">{session.user?.name ?? 'Account'}</p>
                                                        <p className="text-xs text-gray-400 truncate">{session.user?.email}</p>
                                                    </div>
                                                </div>

                                                {/* My Library */}
                                                <MenuSection label="My Library">
                                                    <MenuLink href="/watchlist" icon={Heart} label="Watchlist" onSelect={() => setUserMenuOpen(false)} />
                                                    <MenuLink href="/continue-watching" icon={History} label="Continue Watching" onSelect={() => setUserMenuOpen(false)} />
                                                    <MenuLink href="/watch-party" icon={Users} label="Watch Party" onSelect={() => setUserMenuOpen(false)} />
                                                    <MenuLink href="/movies" icon={PlayCircle} label="Browse Movies" onSelect={() => setUserMenuOpen(false)} />
                                                </MenuSection>

                                                {/* Account */}
                                                <MenuSection label="Account">
                                                    <MenuLink href="/account" icon={Settings} label="Profile & Password" onSelect={() => setUserMenuOpen(false)} />
                                                </MenuSection>

                                                {/* Apps */}
                                                <MenuSection label="More from Riocut">
                                                    <MenuExternal href={process.env.NEXT_PUBLIC_RIOCUT_SPORTS_URL || 'https://sports.riocut.com'} icon={Activity} label="Live Sports" sub="RioSports" />
                                                    <MenuExternal href={process.env.NEXT_PUBLIC_RIOCUT_TV_URL || 'https://tv.riocut.com'} icon={Tv} label="Live TV" sub="Riocut TV" />
                                                    <MenuExternal href={process.env.NEXT_PUBLIC_BLOG_URL || process.env.NEXT_PUBLIC_BLOG_SITE_URL || 'https://blog.riocut.com'} icon={BookOpen} label="Blog" />
                                                </MenuSection>

                                                {/* Support */}
                                                <MenuSection label="Support">
                                                    <MenuExternal href="mailto:support@khareedlow.com" icon={LifeBuoy} label="Help & Feedback" />
                                                </MenuSection>

                                                {/* Sign out */}
                                                <div className="border-t border-gray-800/60 mt-1 pt-1">
                                                    <button
                                                        onClick={handleSignOut}
                                                        disabled={isSigningOut}
                                                        role="menuitem"
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {isSigningOut ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <LogOut className="w-4 h-4" />
                                                        )}
                                                        <span>{isSigningOut ? 'Signing out…' : 'Sign out'}</span>
                                                    </button>
                                                </div>

                                                <p className="px-4 pt-2 pb-1 text-[10px] text-gray-600 text-center">
                                                    Riocut · v{process.env.NEXT_PUBLIC_BUILD_VERSION?.slice(0, 12) || 'dev'}
                                                </p>
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
                            onClick={toggleMobileMenu}
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
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={closeMobileMenu}
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
                                        onClick={closeMobileMenu}
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
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-md flex-shrink-0">
                                                <span className="text-sm font-bold text-white select-none">
                                                    {((session.user?.name || session.user?.email || 'U').trim().charAt(0) || 'U').toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{session.user?.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-gray-800/50 transition-all"
                                        >
                                            <LogOut className="w-5 h-5" />
                                            Sign Out
                                        </button>
                                    </>
                                ) : (
                                    <Link
                                        href="/login"
                                        onClick={closeMobileMenu}
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

function MenuSection({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="py-1">
            <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">{label}</p>
            <div className="mt-0.5">{children}</div>
        </div>
    );
}

function MenuLink({
    href,
    icon: Icon,
    label,
    sub,
    onSelect,
}: {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    sub?: string;
    onSelect?: () => void;
}) {
    return (
        <Link
            href={href}
            onClick={onSelect}
            role="menuitem"
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800/60 transition-colors"
        >
            <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="flex-1 truncate">{label}</span>
            {sub ? <span className="text-[10px] text-gray-500 uppercase tracking-wider">{sub}</span> : null}
        </Link>
    );
}

function MenuExternal({
    href,
    icon: Icon,
    label,
    sub,
}: {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    sub?: string;
}) {
    return (
        <a
            href={href}
            target={href.startsWith('mailto:') ? undefined : '_blank'}
            rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
            role="menuitem"
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800/60 transition-colors"
        >
            <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="flex-1 truncate">{label}</span>
            {sub ? <span className="text-[10px] text-gray-500 uppercase tracking-wider">{sub}</span> : null}
        </a>
    );
}
