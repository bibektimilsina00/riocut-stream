import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import { Instagram, Twitter, Mail, BookOpen, LayoutGrid, Heart, Film, Tv, Activity } from 'lucide-react';

const BLOG_URL = process.env.NEXT_PUBLIC_BLOG_SITE_URL || 'https://blog.riocut.com';
const RIOCUT_URL = process.env.NEXT_PUBLIC_RIOCUT_URL || 'https://riocut.com';
const RIOCUT_SPORTS_URL = process.env.NEXT_PUBLIC_RIOCUT_SPORTS_URL || 'https://sports.riocut.com';

export default function Footer() {
    const year = new Date().getFullYear();
    return (
        <footer className="bg-gray-900 border-t border-gray-800 mt-20">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2 group">
                            <Image
                                src="/logo.svg"
                                alt="Riocut TV"
                                width={566}
                                height={118}
                                className="h-8 w-auto block group-hover:scale-105 transition-transform duration-300"
                            />
                            <span className="text-teal-400 font-semibold text-lg leading-none">TV</span>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Free live TV channels from around the world — news, sports, movies, music and more.
                        </p>
                        <div className="flex gap-3">
                            <SocialLink href="https://instagram.com/riocut" icon={Instagram} label="Instagram" />
                            <SocialLink href="https://twitter.com/riocut" icon={Twitter} label="Twitter" />
                            <SocialLink href="mailto:contact@riocut.com" icon={Mail} label="Email" />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-4 text-lg">Browse</h3>
                        <ul className="space-y-3">
                            <FooterLink href="/browse" icon={LayoutGrid} text="All Channels" />
                            <FooterLink href="/favorites" icon={Heart} text="Favorites" />
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-4 text-lg">Riocut Network</h3>
                        <ul className="space-y-3">
                            <FooterLink href={`${RIOCUT_URL}/movies`} icon={Film} text="Movies" external />
                            <FooterLink href={`${RIOCUT_URL}/tv`} icon={Tv} text="TV Shows" external />
                            <FooterLink href={RIOCUT_SPORTS_URL} icon={Activity} text="Sport" external />
                            <FooterLink href={BLOG_URL} icon={BookOpen} text="Blog" external />
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-4 text-lg">About</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            One account across Riocut, RioSports and Riocut TV. Channel data via the iptv-org project.
                        </p>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-10 pt-6 text-center text-xs text-gray-500">
                    &copy; {year} Riocut Network. Riocut TV is part of the Riocut family.
                </div>
            </div>
        </footer>
    );
}

function SocialLink({ href, icon: Icon, label }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-800/50 hover:bg-gray-800 text-gray-300 hover:text-teal-400 transition-all"
        >
            <Icon className="w-4 h-4" />
        </a>
    );
}

function FooterLink({ href, icon: Icon, text, external }: { href: string; icon: React.ComponentType<{ className?: string }>; text: string; external?: boolean }) {
    const className = 'flex items-center gap-2 text-sm text-gray-400 hover:text-teal-400 transition-colors';
    if (external) {
        return (
            <li>
                <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
                    <Icon className="w-4 h-4" /> {text}
                </a>
            </li>
        );
    }
    return (
        <li>
            <Link href={href} className={className}>
                <Icon className="w-4 h-4" /> {text}
            </Link>
        </li>
    );
}
