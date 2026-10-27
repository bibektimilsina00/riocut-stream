'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (searchParams?.get('registered') === 'true') {
            setShowSuccess(true);
            const t = setTimeout(() => setShowSuccess(false), 5000);
            return () => clearTimeout(t);
        }
    }, [searchParams]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPending(true);
        setError(null);
        try {
            const result = await signIn('credentials', { email, password, redirect: false });
            if (result?.error) {
                setError('Invalid email or password.');
            } else {
                router.push('/');
                router.refresh();
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setPending(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950">
            <Navigation />

            <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden flex items-center justify-center px-4 py-12">
                {/* Decorative background */}
                <div className="pointer-events-none absolute inset-0" aria-hidden>
                    <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl" />
                    <div className="absolute -bottom-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-cyan-600/15 blur-3xl" />
                    <div className="absolute top-1/3 right-1/4 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

                    {/* Cinema projector beams — two diagonal light cones */}
                    <div className="absolute -top-10 left-[12%] h-[120%] w-[42%] origin-top -rotate-12 bg-gradient-to-b from-teal-300/[0.07] via-teal-400/[0.03] to-transparent blur-2xl" />
                    <div className="absolute -top-10 right-[12%] h-[120%] w-[42%] origin-top rotate-12 bg-gradient-to-b from-cyan-300/[0.07] via-cyan-400/[0.03] to-transparent blur-2xl" />

                    {/* Twinkling star dots */}
                    <svg
                        className="absolute inset-0 h-full w-full opacity-50"
                        viewBox="0 0 1200 800"
                        preserveAspectRatio="xMidYMid slice"
                        aria-hidden
                    >
                        <g fill="currentColor" className="text-white">
                            {[
                                [120, 90, 1.5], [240, 180, 1], [360, 60, 2], [480, 220, 1],
                                [600, 110, 1.2], [720, 200, 1.6], [840, 80, 1], [960, 180, 1.8],
                                [1080, 130, 1.2], [80, 300, 1], [180, 420, 1.5], [120, 600, 1.2],
                                [240, 720, 1], [1140, 320, 1.4], [1060, 460, 1], [1120, 620, 1.6],
                                [980, 720, 1.2], [560, 680, 1], [700, 740, 1.3], [400, 750, 1],
                            ].map(([x, y, r], i) => (
                                <circle key={i} cx={x} cy={y} r={r} opacity={0.35 + (i % 3) * 0.15} />
                            ))}
                        </g>
                    </svg>

                    {/* drifting movie emojis */}
                    <FloatingEmoji emoji="🎬" className="left-[8%] top-[15%] text-5xl" delay="0s" />
                    <FloatingEmoji emoji="🍿" className="right-[10%] top-[20%] text-4xl" delay="1.4s" />
                    <FloatingEmoji emoji="🎞️" className="left-[12%] bottom-[18%] text-4xl" delay="2.6s" />
                    <FloatingEmoji emoji="📽️" className="right-[14%] bottom-[14%] text-5xl" delay="0.8s" />
                    <FloatingEmoji emoji="⭐" className="left-[44%] top-[8%] text-3xl" delay="2s" />
                    <FloatingEmoji emoji="🎭" className="right-[42%] bottom-[8%] text-3xl" delay="3.2s" />
                </div>

                <div className="relative w-full max-w-md">
                    {/* Top edge highlight */}
                    <div className="absolute inset-x-6 -top-px h-px bg-gradient-to-r from-transparent via-teal-400/60 to-transparent" aria-hidden />

                    <div className="relative rounded-2xl border border-gray-800/80 bg-gray-900/85 backdrop-blur-sm shadow-xl shadow-black/40 p-7 space-y-6">
                        {/* Logo + heading */}
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="flex items-center gap-2">
                                <Image src="/logo.svg" alt="Riocut" width={566}
                                height={118} className="h-9 w-auto" priority />
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back</h1>
                                <p className="text-sm text-gray-400">
                                    Continue your streaming journey.
                                </p>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={onSubmit} className="relative space-y-3">
                            {showSuccess ? (
                                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300 flex items-start gap-2">
                                    <CheckCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                    <span>Account created. Sign in to continue.</span>
                                </div>
                            ) : null}

                            <Field
                                icon={Mail}
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(v) => setEmail(v)}
                                autoComplete="email"
                                disabled={pending}
                            />
                            <Field
                                icon={Lock}
                                type={showPw ? 'text' : 'password'}
                                placeholder="Password"
                                value={password}
                                onChange={(v) => setPassword(v)}
                                autoComplete="current-password"
                                disabled={pending}
                                trailing={
                                    <button
                                        type="button"
                                        onClick={() => setShowPw((v) => !v)}
                                        className="text-gray-500 hover:text-gray-300 transition-colors"
                                        aria-label={showPw ? 'Hide password' : 'Show password'}
                                        tabIndex={-1}
                                    >
                                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                }
                            />

                            {error ? (
                                <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                                    {error}
                                </div>
                            ) : null}

                            <button
                                type="submit"
                                disabled={pending}
                                className="auth-cta group relative w-full inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-teal-500 via-teal-500 to-cyan-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:-translate-y-0.5 hover:shadow-teal-500/40 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            >
                                <span className="cta-shine pointer-events-none absolute inset-0" aria-hidden />
                                <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/40" aria-hidden />

                                {pending ? (
                                    <Loader2 className="relative h-4 w-4 animate-spin" />
                                ) : (
                                    <span
                                        className="relative text-[15px] leading-none transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110"
                                        aria-hidden
                                    >
                                        🍿
                                    </span>
                                )}
                                <span className="relative tracking-wide">{pending ? 'Signing in…' : 'Grab the popcorn'}</span>
                                {!pending ? (
                                    <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                ) : null}
                            </button>
                        </form>

                        {/* Footer */}
                        <div className="relative">
                            <p className="text-xs text-gray-400 text-center">
                                No account yet?{' '}
                                <Link href="/register" className="font-semibold text-teal-400 hover:text-teal-300 transition-colors">
                                    Create one
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    @keyframes float-emoji {
                        0% { transform: translateY(0px) rotate(-4deg); opacity: 0.45; }
                        50% { transform: translateY(-14px) rotate(4deg); opacity: 0.7; }
                        100% { transform: translateY(0px) rotate(-4deg); opacity: 0.45; }
                    }
                    .auth-cta :global(.cta-shine) {
                        background: linear-gradient(
                            110deg,
                            transparent 35%,
                            rgba(255, 255, 255, 0.28) 50%,
                            transparent 65%
                        );
                        background-size: 220% 100%;
                        background-position: 200% 0;
                        transition: background-position 700ms ease;
                    }
                    .auth-cta:not(:disabled):hover :global(.cta-shine) {
                        background-position: -50% 0;
                    }
                `}</style>
            </div>
        </div>
    );
}

function Field({
    icon: Icon,
    type,
    placeholder,
    value,
    onChange,
    autoComplete,
    disabled,
    trailing,
}: {
    icon: React.ComponentType<{ className?: string }>;
    type: string;
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
    autoComplete?: string;
    disabled?: boolean;
    trailing?: React.ReactNode;
}) {
    return (
        <label className="group relative block">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-teal-400">
                <Icon className="h-4 w-4" />
            </span>
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                autoComplete={autoComplete}
                required
                disabled={disabled}
                className="block w-full rounded-xl border border-gray-800 bg-gray-900/60 pl-9 pr-10 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition-all focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 disabled:opacity-60"
            />
            {trailing ? (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">{trailing}</span>
            ) : null}
        </label>
    );
}

function FloatingEmoji({
    emoji,
    className,
    delay,
}: {
    emoji: string;
    className: string;
    delay: string;
}) {
    return (
        <span
            className={`absolute select-none ${className}`}
            style={{
                animation: 'float-emoji 6s ease-in-out infinite',
                animationDelay: delay,
                filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.55))',
            }}
            aria-hidden
        >
            {emoji}
        </span>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
            <LoginForm />
        </Suspense>
    );
}
