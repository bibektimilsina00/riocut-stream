'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@riocut/ui/components/ui/button';
import { Input } from '@riocut/ui/components/ui/input';

function LoginForm() {
    const params = useSearchParams();
    const router = useRouter();
    const callbackUrl = params.get('callbackUrl') ?? '/';
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPending(true);
        setError(null);
        const res = await signIn('credentials', { email, password, redirect: false, callbackUrl });
        setPending(false);
        if (res?.error) setError('Invalid credentials.');
        else router.push(callbackUrl);
    };

    return (
        <div className="container mx-auto max-w-md px-4 py-12">
            <div className="rounded-xl border border-border p-6 space-y-4">
                <div>
                    <h1 className="text-2xl font-bold">Sign in to EGLive</h1>
                    <p className="text-sm text-muted-foreground">Same account as Riocut.</p>
                </div>
                <form onSubmit={onSubmit} className="space-y-3">
                    <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    {error ? <p className="text-xs text-red-500">{error}</p> : null}
                    <Button type="submit" className="w-full" disabled={pending}>
                        {pending ? 'Signing in…' : 'Sign in'}
                    </Button>
                </form>
                <p className="text-xs text-muted-foreground">
                    No account? <Link href="/register" className="underline">Create one</Link>.
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading…</div>}>
            <LoginForm />
        </Suspense>
    );
}
