import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SessionProvider from "@riocut/auth/components/SessionProvider";
import { QueryProvider } from "@riocut/realtime/client/QueryProvider";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
    title: {
        default: "Riocut TV — Live TV",
        template: "%s | Riocut TV",
    },
    description:
        "Watch free live TV channels from around the world. Search and filter by country, category and language.",
    icons: {
        icon: "/favicon.svg",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
                <SessionProvider>
                    <QueryProvider>
                        <div className="flex min-h-screen flex-col">
                            <Navigation />
                            <main className="flex-1">{children}</main>
                            <Footer />
                        </div>
                        <ToastContainer
                            position="bottom-right"
                            autoClose={3500}
                            theme="dark"
                            newestOnTop
                            limit={5}
                        />
                    </QueryProvider>
                </SessionProvider>
            </body>
        </html>
    );
}
