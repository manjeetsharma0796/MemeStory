"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // I might need to add badge if I missed it, or use custom
import { Wallet } from "lucide-react";

export function Navbar() {
    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                    🍌 <span>MemeStory</span>
                </Link>

                {/* Navigation Links */}
                <div className="hidden md:flex gap-6 text-sm font-medium">
                    <Link href="/" className="hover:text-primary transition-colors">Studio</Link>
                    <Link href="/gallery" className="text-muted-foreground hover:text-primary transition-colors">Gallery</Link>
                    <Link href="/profile" className="text-muted-foreground hover:text-primary transition-colors">Profile</Link>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Story Odyssey
                    </div>

                    <Button variant="outline" className="gap-2">
                        <Wallet className="w-4 h-4" />
                        Connect Wallet
                    </Button>
                </div>
            </div>
        </nav>
    );
}
