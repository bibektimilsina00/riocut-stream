'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@riocut/ui/components/ui/button';
import { Input } from '@riocut/ui/components/ui/input';

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPending(true);
        setError(null);
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name }),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setError(data.error ?? 'Registration failed.');
            setPending(false);
            return;
        }
        await signIn('credentials', { email, password, redirect: false });
        setPending(false);
        router.push('/');
    };

    return (
        <div className="container mx-auto max-w-md px-4 py-12">
            <div className="rounded-xl border border-border p-6 space-y-4">
                <div>
                    <h1 className="text-2xl font-bold">Create your EGLive account</h1>
                    <p className="text-sm text-muted-foreground">Single account works on Riocut too.</p>
                </div>
                <form onSubmit={onSubmit} className="space-y-3">
                    <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
                    <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <Input type="password" placeholder="Password (min 8)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
                    {error ? <p className="text-xs text-red-500">{error}</p> : null}
                    <Button type="submit" className="w-full" disabled={pending}>{pending ? 'Creating…' : 'Create account'}</Button>
                </form>
                <p className="text-xs text-muted-foreground">
                    Already have an account? <Link href="/login" className="underline">Sign in</Link>.
                </p>
            </div>
        </div>
    );
}
