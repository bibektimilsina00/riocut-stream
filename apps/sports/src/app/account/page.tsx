'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { User, Mail, Lock, Eye, EyeOff, Check, Loader2, Calendar, ShieldCheck, LogOut } from 'lucide-react';

interface Account {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
    updatedAt: string;
}

export default function AccountPage() {
    const [account, setAccount] = useState<Account | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadErr, setLoadErr] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('/api/account', { cache: 'no-store' });
                if (res.status === 401) {
                    window.location.href = '/login?callbackUrl=/account';
                    return;
                }
                const data = await res.json();
                if (cancelled) return;
                if (!res.ok) setLoadErr(data.error ?? 'Failed to load');
                else setAccount(data.account);
            } catch {
                if (!cancelled) setLoadErr('Network error');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <main className="container mx-auto px-4 py-10 max-w-3xl">
            {loading ? (
                <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading account…
                </div>
            ) : loadErr ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 p-4 text-sm">{loadErr}</div>
            ) : account ? (
                <div className="space-y-8">
                    <ProfileHeader account={account} />
                    <ProfileForm account={account} onUpdated={setAccount} />
                    <PasswordForm />
                    <DangerZone />
                </div>
            ) : null}
        </main>
    );
}

function ProfileHeader({ account }: { account: Account }) {
    const initial = (account.name || account.email || 'U').trim().charAt(0).toUpperCase();
    const memberSince = new Date(account.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    return (
        <header className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg ring-4 ring-teal-500/20">
                <span className="text-3xl font-bold text-white select-none">{initial}</span>
            </div>
            <div className="min-w-0">
                <h1 className="text-2xl font-bold text-white truncate">{account.name}</h1>
                <p className="text-sm text-gray-400 truncate">{account.email}</p>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    Member since {memberSince}
                </p>
            </div>
        </header>
    );
}

function ProfileForm({ account, onUpdated }: { account: Account; onUpdated: (a: Account) => void }) {
    const [name, setName] = useState(account.name);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    const dirty = name.trim() !== account.name;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!dirty) return;
        setSaving(true);
        setError(null);
        setSaved(false);
        try {
            const res = await fetch('/api/account', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? 'Update failed');
            } else {
                onUpdated({ ...account, ...data.account });
                setSaved(true);
                window.setTimeout(() => setSaved(false), 2500);
            }
        } catch {
            setError('Network error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Section title="Profile" description="Update how your name appears across RioSports.">
            <form onSubmit={submit} className="space-y-3">
                <Field icon={User} label="Display name">
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={60}
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 outline-none"
                    />
                </Field>
                <Field icon={Mail} label="Email" hint="Email is locked and used for sign-in.">
                    <input
                        type="email"
                        value={account.email}
                        readOnly
                        disabled
                        className="w-full bg-gray-900/60 border border-gray-800 rounded-lg pl-10 pr-3 py-2.5 text-sm text-gray-400 outline-none cursor-not-allowed"
                    />
                </Field>
                {error ? <ErrorBox>{error}</ErrorBox> : null}
                <div className="flex items-center justify-end gap-3 pt-1">
                    {saved ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                            <Check className="w-3.5 h-3.5" /> Saved
                        </span>
                    ) : null}
                    <button
                        type="submit"
                        disabled={!dirty || saving}
                        className="inline-flex items-center gap-2 rounded-lg bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm font-semibold text-white transition-colors"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Save changes
                    </button>
                </div>
            </form>
        </Section>
    );
}

function PasswordForm() {
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaved(false);
        if (next.length < 6) {
            setError('New password must be at least 6 characters.');
            return;
        }
        if (next !== confirm) {
            setError('Passwords do not match.');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('/api/account/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword: current, newPassword: next }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? 'Password change failed');
            } else {
                setSaved(true);
                setCurrent('');
                setNext('');
                setConfirm('');
                window.setTimeout(() => setSaved(false), 3000);
            }
        } catch {
            setError('Network error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Section title="Password" description="Use 6+ characters. Hashed with bcrypt before storing.">
            <form onSubmit={submit} className="space-y-3">
                <Field icon={Lock} label="Current password">
                    <input
                        type={showCurrent ? 'text' : 'password'}
                        value={current}
                        onChange={(e) => setCurrent(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 outline-none"
                    />
                    <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowCurrent((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                        aria-label={showCurrent ? 'Hide password' : 'Show password'}
                    >
                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </Field>
                <Field icon={Lock} label="New password">
                    <input
                        type={showNew ? 'text' : 'password'}
                        value={next}
                        onChange={(e) => setNext(e.target.value)}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 outline-none"
                    />
                    <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowNew((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                        aria-label={showNew ? 'Hide password' : 'Show password'}
                    >
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </Field>
                <Field icon={Lock} label="Confirm new password">
                    <input
                        type={showNew ? 'text' : 'password'}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 outline-none"
                    />
                </Field>
                {error ? <ErrorBox>{error}</ErrorBox> : null}
                <div className="flex items-center justify-end gap-3 pt-1">
                    {saved ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                            <ShieldCheck className="w-3.5 h-3.5" /> Password updated
                        </span>
                    ) : null}
                    <button
                        type="submit"
                        disabled={saving || !current || !next || !confirm}
                        className="inline-flex items-center gap-2 rounded-lg bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm font-semibold text-white transition-colors"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Update password
                    </button>
                </div>
            </form>
        </Section>
    );
}

function DangerZone() {
    const [signingOut, setSigningOut] = useState(false);
    return (
        <Section title="Session">
            <p className="text-sm text-gray-400">Sign out of this device. You can sign back in at any time.</p>
            <div className="pt-3">
                <button
                    onClick={async () => {
                        setSigningOut(true);
                        await signOut({ callbackUrl: '/' });
                    }}
                    disabled={signingOut}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                    {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                    Sign out
                </button>
            </div>
        </Section>
    );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
    return (
        <section className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
            <div className="mb-4">
                <h2 className="text-lg font-semibold text-white">{title}</h2>
                {description ? <p className="text-sm text-gray-400 mt-1">{description}</p> : null}
            </div>
            {children}
        </section>
    );
}

function Field({
    icon: Icon,
    label,
    hint,
    children,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="text-xs text-gray-400 mb-1.5 inline-block">{label}</span>
            <div className="relative">
                <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                {children}
            </div>
            {hint ? <span className="text-[11px] text-gray-500 mt-1 inline-block">{hint}</span> : null}
        </label>
    );
}

function ErrorBox({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {children}
        </div>
    );
}
