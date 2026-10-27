'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from '@/components/admin/Sidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Only apply auth checks to /admin routes, not the public blog homepage
        if (!pathname.startsWith('/admin')) {
            return;
        }

        // Check if user is authenticated
        if (status === 'unauthenticated') {
            console.log('[Admin Layout] Unauthenticated - redirecting to /login');
            router.push('/login');
            return;
        }

        // Check if user has admin role from database
        const userRole = (session?.user as any)?.role;
        const isAdmin = userRole === 'admin';

        console.log('[Admin Layout] Status:', status);
        console.log('[Admin Layout] User Role:', userRole);
        console.log('[Admin Layout] Is Admin:', isAdmin);
        console.log('[Admin Layout] Full session:', session);

        if (status === 'authenticated' && !isAdmin) {
            console.log('[Admin Layout] Not admin - redirecting to /');
            router.push('/');
            return;
        }
    }, [status, session, router, pathname]);

    // For public routes (like blog homepage), render directly
    if (!pathname.startsWith('/admin')) {
        return <>{children}</>;
    }

    // For admin routes, apply authentication checks
    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
            </div>
        );
    }

    const userRole = (session?.user as any)?.role;
    const isAdmin = userRole === 'admin';

    console.log('[Admin Layout Render] Status:', status);
    console.log('[Admin Layout Render] User Role:', userRole);
    console.log('[Admin Layout Render] Is Admin:', isAdmin);

    if (status === 'unauthenticated') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-950">
                <p className="text-white">Redirecting to login...</p>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-950">
                <p className="text-white">Redirecting to home... Not admin!</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 flex">
            {/* Admin Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
