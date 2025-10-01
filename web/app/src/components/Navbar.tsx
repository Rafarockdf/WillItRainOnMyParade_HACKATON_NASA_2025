"use client";
import { CloudRain, Home, Phone, Info } from "lucide-react";
import Link from "next/link";
import ThemeToggle from "../provider/ThemeToggle";

export default function Navbar() {

    return (
        <nav className="w-full flex items-center justify-between py-4 px-8 bg-[var(--background)] text-[var(--foreground)] border-b border-[color-mix(in_srgb,var(--foreground)_12%,transparent)]/50 backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--background)_85%,transparent)] transition-colors">
            <div className="flex items-center space-x-4">
                <CloudRain className="h-6 w-6" aria-hidden="true" />
                <span className="text-lg font-semibold">Previsão Certa</span>
            </div>
            <div className="flex space-x-4 items-center">
                        <Link href="/" aria-label="Início" className="hover:opacity-80 transition-colors">
                            <Home className="h-5 w-5" aria-hidden="true" />
                        </Link>
                        <Link href="/about" aria-label="Sobre" className="hover:opacity-80 transition-colors">
                            <Info className="h-5 w-5" aria-hidden="true" />
                        </Link>
                        <Link href="/about/contact" aria-label="Contato" className="hover:opacity-80 transition-colors">
                            <Phone className="h-5 w-5" aria-hidden="true" />
                        </Link>
                <ThemeToggle />
            </div>
        </nav>
    );
}