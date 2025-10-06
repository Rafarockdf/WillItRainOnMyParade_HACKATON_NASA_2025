"use client";
import { CloudRain, Home,Cloud } from "lucide-react";
import Link from "next/link";
import ThemeToggle from "../provider/ThemeToggle";

export default function Navbar() {


    return (
        <nav className="w-full flex items-center justify-between py-4 px-8 bg-[var(--background-nav)] text-[var(--foreground)] border-b border-[color-mix(in_srgb,var(--foreground)_12%,transparent)]/50 backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--background-nav)_85%,transparent)] transition-colors fixed top-0 z-50">
            <div className="flex items-center space-x-4">
                <CloudRain className="h-6 w-6" aria-hidden="true" />
                <span className="text-lg font-semibold">The Chess Forecasters</span>
            </div>
            <div className="flex space-x-4 items-center">
                        <Link href="/" aria-label="Home" className="hover:opacity-80 transition-colors">
                            <Home className="h-5 w-5" aria-hidden="true" />
                        </Link>
                        <Link href="/forecast" aria-label="Forecast" className="hover:opacity-80 transition-colors">
                            <Cloud className="h-5 w-5" aria-hidden="true" />
                        </Link>
                <ThemeToggle />
            </div>
        </nav>
    );

}