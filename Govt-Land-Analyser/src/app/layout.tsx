import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Govt Land Analyzer",
  description:
    "Transparent government land allocation platform for citizens and administrators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-50`}
      >
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900/40">
          <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
            <header className="mb-8 flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3 shadow-lg shadow-emerald-500/10 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 ring-1 ring-emerald-400/60">
                  <span className="text-lg font-semibold text-emerald-300">
                    GL
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-tight text-white">
                    Govt Land Analyzer
                  </p>
                  <p className="text-[11px] text-slate-300/70">
                    Secure, transparent land allocation for citizens & govt
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-200/80">
                <span className="hidden rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 font-medium tracking-tight sm:inline">
                  IIIT Hackathon Ready
                </span>
              </div>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="mt-6 border-t border-white/10 pt-4 text-center text-[11px] text-slate-400/80">
              Built with Next.js, MongoDB & thoughtful civic UX.
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
