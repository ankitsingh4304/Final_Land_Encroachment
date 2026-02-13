import type { Metadata } from "next";
import Image from "next/image";
import "./globals.css";
import { HamburgerMenu } from "@/components/HamburgerMenu";

export const metadata: Metadata = {
  title: "Government Land Analyzer",
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
      <body className="antialiased bg-gray-50 text-gray-900" style={{ fontFamily: 'Arial, sans-serif' }}>
        <div className="min-h-screen bg-white">
          <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-4 sm:px-6 lg:px-8">
            <header className="mb-6 flex items-center justify-between border-b-2 border-blue-600 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded bg-blue-600">
                  <Image
                    src="/logo.png"
                    alt="Government Land Analyzer"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900">
                    Government Land Analyzer
                  </p>
                  <p className="text-xs text-gray-600">
                    Secure, transparent land allocation for citizens & government
                  </p>
                </div>
              </div>
              <HamburgerMenu />
            </header>
            <main className="flex-1">{children}</main>
            <footer className="mt-8 border-t border-gray-300 bg-white pt-4 text-center text-xs text-gray-600">
              © Government Land Analyzer. All rights reserved.
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
