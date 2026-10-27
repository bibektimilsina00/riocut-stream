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
} from 'lucide-react';
import { signOut } from 'next-auth/react';

const adminLinks = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/content', icon: Tv, label: 'Content' },
    { href: '/admin/sports-providers', icon: Radio, label: 'Sports Providers' },
    { href: '/admin/sports-analytics', icon: BarChart3, label: 'Sports Analytics' },
    { href: '/admin/blog', icon: BookOpen, label: 'Blog' },
    { href: '/admin/comments', icon: MessageSquare, label: 'Comments' },
    { href: '/admin/rooms', icon: Users2, label: 'Watch Rooms' },
    { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/admin/notifications', icon: Bell, label: 'Notifications' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
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
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {adminLinks.map((link) => {
                    const isActive =
                        link.exact
                            ? pathname === link.href
                            : pathname?.startsWith(link.href);
                    const Icon = link.icon;

                    return (
                        <Link key={link.href} href={link.href}>
                            <div
                                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-teal-600 text-white'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                <Icon size={20} />
                                <span className="font-medium">{link.label}</span>
                            </div>
                        </Link>
                    );
                })}
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
