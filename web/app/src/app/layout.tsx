import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Previsão Certa",
  description: "Site para previsão do tempo em determinado evento",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen transition-colors bg-[var(--background)] text-[var(--foreground)] pt-20`}
        >
        <div className="fixed top-0 left-0 w-full z-50">
          <Navbar />
        </div>
        {children}
      </body>
    </html>
  );
}