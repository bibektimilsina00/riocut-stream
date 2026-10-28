import { ShieldCheck, Sparkles, ArrowUpRight } from 'lucide-react';

const UBLOCK_URL = 'https://chromewebstore.google.com/detail/ublock-origin-lite/ddkjiahejlhfcafbddmgiahcphecmpfh';
const BRAVE_URL = 'https://brave.com/';

export default function PlayerNotice() {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-teal-500/20 bg-gray-900/80 backdrop-blur-sm">
            {/* Decorative gradient glows */}
            <div className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-teal-500/20 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-16 -right-12 h-44 w-44 rounded-full bg-cyan-500/15 blur-3xl" aria-hidden />

            <div className="relative p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                        <span className="absolute inset-0 rounded-xl bg-teal-500/30 blur-md" aria-hidden />
                        <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 text-white shadow-lg shadow-teal-500/30 ring-1 ring-white/20">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-white tracking-tight">
                                Get the cleanest stream experience
                            </h3>
                            <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/15 px-2 py-0.5 text-[10px] font-medium text-teal-300 ring-1 ring-teal-500/30">
                                <Sparkles className="h-2.5 w-2.5" /> Recommended
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            Third-party streams can include popups and overlay ads. Pair the player with an ad blocker or a
                            privacy-first browser — takes 10 seconds, lasts forever.
                        </p>
                    </div>
                </div>

                {/* CTA grid */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {/* uBlock card */}
                    <a
                        href={UBLOCK_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/60 p-3 transition-all hover:-translate-y-0.5 hover:border-teal-500/50 hover:bg-gray-900 hover:shadow-lg hover:shadow-teal-500/10"
                    >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-400 ring-1 ring-red-500/30 transition-colors group-hover:bg-red-500/25">
                            <UBlockMark className="h-5 w-5" />
                        </span>
                        <span className="flex-1 min-w-0">
                            <span className="block text-sm font-semibold text-white">uBlock Origin Lite</span>
                            <span className="block text-[11px] text-gray-500">Chrome Web Store · Free</span>
                        </span>
                        <ArrowUpRight className="h-4 w-4 text-gray-500 transition-all group-hover:text-teal-300 group-hover:rotate-12" />
                    </a>

                    {/* Brave card */}
                    <a
                        href={BRAVE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/60 p-3 transition-all hover:-translate-y-0.5 hover:border-orange-500/50 hover:bg-gray-900 hover:shadow-lg hover:shadow-orange-500/10"
                    >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30 transition-colors group-hover:bg-orange-500/25">
                            <BraveMark className="h-5 w-5" />
                        </span>
                        <span className="flex-1 min-w-0">
                            <span className="block text-sm font-semibold text-white">Brave Browser</span>
                            <span className="block text-[11px] text-gray-500">Ad blocker built-in · Free</span>
                        </span>
                        <ArrowUpRight className="h-4 w-4 text-gray-500 transition-all group-hover:text-orange-300 group-hover:rotate-12" />
                    </a>
                </div>

                {/* Footnote */}
                <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Already using one? You&apos;re all set — nothing else to do.
                </p>
            </div>
        </div>
    );
}

function UBlockMark({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
            <path d="M12 1.5 3.5 5v6.5c0 5.25 3.6 9.95 8.5 11 4.9-1.05 8.5-5.75 8.5-11V5L12 1.5Zm0 5.25 5 2.25v3.25c0 3.45-2.05 6.7-5 7.75-2.95-1.05-5-4.3-5-7.75V9l5-2.25Z" />
        </svg>
    );
}

function BraveMark({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
            <path d="m4 5.4 1.6-1.8c.4-.4 1-.4 1.4 0L9 5.6h6L16.9 3.7c.4-.4 1-.4 1.4 0L20 5.4l-1.2 1.2 1 2-.4 1.6-1.7 6.4c-.3 1-.9 1.8-1.8 2.4l-3.7 2.4c-.5.3-1.1.3-1.6 0l-3.7-2.4c-.9-.6-1.5-1.4-1.8-2.4L3.4 10.2 3 8.6l1-2L4 5.4Zm6.3 3.7c0 .3.1.7.3 1l1.4 1.7-2.2 1.3c-.4.2-.5.7-.3 1l1.2 1.6c.2.3.6.4 1 .3l1.6-.6 1.6.6c.3.1.7 0 1-.3l1.2-1.6c.2-.3.1-.8-.3-1L14.6 12l1.4-1.9c.2-.3.3-.6.3-1l-.2-1.3c0-.4-.4-.7-.8-.7h-4.5c-.4 0-.8.3-.8.7l-.2 1.3Z" />
        </svg>
    );
}
