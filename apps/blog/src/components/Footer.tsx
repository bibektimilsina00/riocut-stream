import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Twitter, Mail, Home, Film, Tv, Users, Settings, BookOpen, Play, Grid } from 'lucide-react';

const MAIN_SITE_URL = process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'https://riocut.com';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 border-t border-gray-800 mt-20">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center group">
                            <Image
                                src="/logo.svg"
                                alt="Riocut Blog"
                                width={566}
                                height={118}
                                className="h-8 w-auto group-hover:scale-105 transition-transform duration-300"
                            />
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Stories, insights, and updates from the world of streaming and entertainment.
                        </p>
                        <div className="flex gap-3">
                            <SocialLink href="https://instagram.com/riocut" icon={Instagram} label="Instagram" />
                            <SocialLink href="https://twitter.com/riocut" icon={Twitter} label="Twitter" />
                            <SocialLink href="mailto:contact@riocut.com" icon={Mail} label="Email" />
                        </div>
                    </div>

                    {/* Browse */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 text-lg">Browse</h3>
                        <ul className="space-y-3">
                            <FooterLink href="/" icon={Home} text="Home" />
                            <FooterLink href="/posts" icon={BookOpen} text="All Posts" />
                            <FooterLink href="/categories" icon={Grid} text="Categories" />
                            <FooterLink href={MAIN_SITE_URL} icon={Play} text="Watch Movies" external />
                        </ul>
                    </div>

                    {/* Content */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 text-lg">Content</h3>
                        <ul className="space-y-3">
                            <FooterLink href="/latest" text="Latest Posts" />
                            <FooterLink href="/featured" text="Featured" />
                            <FooterLink href="/reviews" text="Reviews" />
                            <FooterLink href="/news" text="News" />
                        </ul>
                    </div>

                    {/* Admin & Support */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 text-lg">Support</h3>
                        <ul className="space-y-3">
                            <FooterLink href="/help" text="Help Center" />
                            <FooterLink href="/contact" text="Contact Us" />
                            <FooterLink href="/terms" text="Terms of Service" />
                            <FooterLink href="/privacy" text="Privacy Policy" />
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-gray-800">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-gray-500 text-sm">
                            © {currentYear} Riocut. All rights reserved.
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span>Powered by AI & Creativity</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

// Helper Components
function SocialLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 bg-gray-800 hover:bg-teal-500 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            aria-label={label}
        >
            <Icon className="w-4 h-4 text-white" />
        </a>
    );
}

function FooterLink({
    href,
    text,
    icon: Icon,
    external = false
}: {
    href: string;
    text: string;
    icon?: any;
    external?: boolean;
}) {
    const className = "text-gray-400 hover:text-teal-400 transition-colors text-sm flex items-center gap-2 group";

    const content = (
        <>
            {Icon && <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />}
            <span>{text}</span>
        </>
    );

    if (external) {
        return (
            <li>
                <a href={href} className={className} target="_blank" rel="noopener noreferrer">
                    {content}
                </a>
            </li>
        );
    }

    return (
        <li>
            <Link href={href} className={className}>
                {content}
            </Link>
        </li>
    );
}