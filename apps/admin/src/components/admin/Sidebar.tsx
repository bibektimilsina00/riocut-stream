'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    BarChart3,
    Settings,
    Tv,
    MessageSquare,
    Users2,
    Bell,
    LogOut,
    BookOpen,
    Radio,
    Eye,
    Film,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

/**
 * Grouped by product/vertical, not one flat list — Sports has its own
 * section (Live Now / Providers / Analytics); Movies gets the same shape
 * (currently just Content Sources) so new movies-admin pages have a home
 * without another nav redesign.
 */
const adminGroups: { label: string; links: { href: string; icon: typeof LayoutDashboard; label: string; exact?: boolean }[] }[] = [
    {
        label: 'Overview',
        links: [{ href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true }],
    },
    {
        label: 'Sports',
        links: [
            { href: '/admin/sports/live', icon: Eye, label: 'Live Now' },
            { href: '/admin/sports/providers', icon: Radio, label: 'Providers' },
            { href: '/admin/sports/analytics', icon: BarChart3, label: 'Analytics' },
        ],
    },
    {
        label: 'Movies',
        links: [{ href: '/admin/content', icon: Film, label: 'Content Sources' }],
    },
    {
        label: 'Blog & Community',
        links: [
            { href: '/admin/blog', icon: BookOpen, label: 'Blog' },
            { href: '/admin/comments', icon: MessageSquare, label: 'Comments' },
            { href: '/admin/rooms', icon: Users2, label: 'Watch Rooms' },
        ],
    },
    {
        label: 'System',
        links: [
            { href: '/admin/users', icon: Users, label: 'Users' },
            { href: '/admin/analytics', icon: Tv, label: 'Site Analytics' },
            { href: '/admin/notifications', icon: Bell, label: 'Notifications' },
            { href: '/admin/settings', icon: Settings, label: 'Settings' },
        ],
    },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-gray-800">
                <Link href="/admin/dashboard" className="flex items-center gap-3 group">
                    <Image
                        src="/logo.svg"
                        alt="Riocut Admin"
                        width={566}
                                height={118}
                        className="h-8 w-auto group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="text-lg font-bold text-white pt-3">
                        Admin
                    </span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-5 overflow-y-auto">
                {adminGroups.map((group) => (
                    <div key={group.label} className="space-y-1">
                        <p className="px-4 text-xs font-semibold uppercase tracking-wider text-gray-600">{group.label}</p>
                        {group.links.map((link) => {
                            const isActive = link.exact ? pathname === link.href : pathname?.startsWith(link.href);
                            const Icon = link.icon;

                            return (
                                <Link key={link.href} href={link.href}>
                                    <div
                                        className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors ${isActive
                                            ? 'bg-teal-600 text-white'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                            }`}
                                    >
                                        <Icon size={18} />
                                        <span className="font-medium text-sm">{link.label}</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-gray-800">
                <button
                    onClick={() => signOut({ redirect: true, callbackUrl: '/blog' })}
                    className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
}
