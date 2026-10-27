'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
    LayoutGrid,
    Heart,
    Activity,
    BookOpen,
    Film,
    Search,
    Menu,
    X,
    User,
    ChevronDown,
    LogIn,
    LogOut,
    Loader2,
} from 'lucide-react';

const BLOG_URL = process.env.NEXT_PUBLIC_BLOG_SITE_URL || 'https://blog.riocut.com';
const RIOCUT_URL = process.env.NEXT_PUBLIC_RIOCUT_URL || 'https://riocut.com';
const RIOCUT_SPORTS_URL = process.env.NEXT_PUBLIC_RIOCUT_SPORTS_URL || 'https://sports.riocut.com';

interface NavLink {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    external?: boolean;
}

export default function Navigation() {
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        if (userMenuOpen) document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [userMenuOpen]);

    const navLinks = useMemo<NavLink[]>(() => [
        { href: '/browse', label: 'Browse', icon: LayoutGrid },
        { href: '/favorites', label: 'Favorites', icon: Heart },
        { href: RIOCUT_URL, label: 'Movies & TV', icon: Film, external: true },
        { href: RIOCUT_SPORTS_URL, label: 'Sport', icon: Activity, external: true },
        { href: BLOG_URL, label: 'Blog', icon: BookOpen, external: true },
    ], []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
        }
    };

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

    return (
        <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-md border-b border-gray-800 shadow-lg">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                    <Link href="/" className="flex items-center gap-2 group shrink-0">
                        <Image
                            src="/logo.svg"
                            alt="Riocut TV"
                            width={566}
                                height={118}
                            className="h-7 w-auto block group-hover:scale-105 transition-transform duration-300"
                            priority
                        />
                        <span className="text-teal-400 font-semibold text-lg leading-none">TV</span>
                    </Link>

                    <nav className="hidden lg:flex items-center gap-4">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            const isActive = mounted && !link.external && pathname === link.href;
                            const baseClass = 'flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 text-sm whitespace-nowrap';
                            if (link.external) {
                                return (
                                    <a
                                        key={link.href}
                                        href={link.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={baseClass + ' text-gray-300 hover:text-teal-400 hover:bg-gray-800/50'}
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
                                    className={`${baseClass} ${isActive ? 'text-teal-400 bg-teal-500/10' : 'text-gray-300 hover:text-teal-400 hover:bg-gray-800/50'}`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="hidden xl:inline">{link.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-2">
                        <form onSubmit={handleSearch} className="relative hidden md:block">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search channels..."
                                className="bg-gray-800/50 text-white px-4 py-2 pr-10 rounded-full outline-none focus:ring-2 focus:ring-teal-500 focus:bg-gray-800 transition-all w-48 lg:w-64 xl:w-72 text-sm placeholder:text-gray-500"
                            />
                            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 hover:scale-110 transition-transform" aria-label="Search">
                                <Search className="w-4 h-4 text-gray-400 hover:text-teal-400" />
                            </button>
                        </form>

                        <div className="hidden md:flex items-center gap-2">
                            <div className="relative" ref={userMenuRef}>
                                {session ? (
                                    <>
                                        <button
                                            onClick={() => setUserMenuOpen((v) => !v)}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 hover:bg-gray-800 rounded-full transition-all"
                                        >
                                            <User className="w-4 h-4 text-gray-300" />
                                            <span className="text-sm text-gray-300 max-w-[100px] truncate">{session.user?.name}</span>
                                            <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        {userMenuOpen && (
                                            <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl py-2 z-50">
                                                <div className="px-4 py-2 border-b border-gray-800">
                                                    <p className="text-sm text-gray-400">Signed in as</p>
                                                    <p className="text-sm text-white font-medium truncate">{session.user?.email}</p>
                                                </div>
                                                <button
                                                    onClick={handleSignOut}
                                                    disabled={isSigningOut}
                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-800/50 transition-all disabled:opacity-50"
                                                >
                                                    {isSigningOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                                                    {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="flex items-center gap-1.5 px-4 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-full transition-all text-sm whitespace-nowrap"
                                    >
                                        <LogIn className="w-4 h-4" />
                                        <span>Sign In</span>
                                    </Link>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => setMobileMenuOpen((v) => !v)}
                            className="lg:hidden text-white hover:text-teal-400 transition-colors p-2"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {mobileMenuOpen && (
                    <div className="lg:hidden mt-3 pb-3 border-t border-gray-800 pt-3 space-y-1">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            const isActive = mounted && !link.external && pathname === link.href;
                            const linkClass = `flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isActive ? 'text-teal-400 bg-teal-500/10' : 'text-gray-300 hover:text-teal-400 hover:bg-gray-800/50'}`;
                            if (link.external) {
                                return (
                                    <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass} onClick={() => setMobileMenuOpen(false)}>
                                        <Icon className="w-4 h-4" /> {link.label}
                                    </a>
                                );
                            }
                            return (
                                <Link key={link.href} href={link.href} className={linkClass} onClick={() => setMobileMenuOpen(false)}>
                                    <Icon className="w-4 h-4" /> {link.label}
                                </Link>
                            );
                        })}
                        <form onSubmit={handleSearch} className="pt-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search channels..."
                                className="bg-gray-800/50 text-white px-4 py-2 rounded-full outline-none focus:ring-2 focus:ring-teal-500 w-full text-sm placeholder:text-gray-500"
                            />
                        </form>
                        <div className="pt-2">
                            {session ? (
                                <button
                                    onClick={handleSignOut}
                                    disabled={isSigningOut}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-400 bg-gray-800/50 hover:bg-gray-800 rounded-full transition-all disabled:opacity-50"
                                >
                                    {isSigningOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                                    Sign Out
                                </button>
                            ) : (
                                <Link href="/login" className="flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-full text-sm" onClick={() => setMobileMenuOpen(false)}>
                                    <LogIn className="w-4 h-4" /> Sign In
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
