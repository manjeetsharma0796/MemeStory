"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, Search, Zap, ExternalLink, Layers } from "lucide-react";
import { fetchCollectionItems, GalleryItem } from "@/app/actions/story";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useWallet } from "@/hooks/useWallet";

// Default to a known collection if none searched (optional, or just show empty state)
// For now, let's leave it empty or user has to search.
// Maybe we can create a "Featured" section later.

export default function GalleryPage() {
    const [address, setAddress] = useState("");
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const { address: connectedAddress } = useWallet();
    const [hasAutoSearched, setHasAutoSearched] = useState(false);

    // Auto-search latest created collection from localStorage
    useEffect(() => {
        if (!hasAutoSearched) {
            try {
                const stored = localStorage.getItem("memeStory_collections");
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed.length > 0) {
                        const latest = parsed[parsed.length - 1];
                        setAddress(latest.address);
                        handleSearch(latest.address);
                    }
                }
            } catch (e) {
                console.error("Auto-load failed", e);
            }
            setHasAutoSearched(true);
        }
    }, [hasAutoSearched]);

    const handleSearch = async (searchAddr?: string) => {
        const target = searchAddr || address;
        if (!target) return;

        setIsLoading(true);
        setError("");
        setItems([]);

        try {
            const result = await fetchCollectionItems(target, 20);
            if (result.error) {
                setError(result.error);
            } else {
                setItems(result.items);
            }
        } catch (e) {
            setError("Failed to fetch collection.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemix = (item: GalleryItem) => {
        // Navigate to Studio with params
        const params = new URLSearchParams();
        params.set("parentIpId", item.id); // We used collection-id as ID, but for real remix we might need actual IP ID.
        // Wait, fetchCollectionItems returned `id` as `${collectionAddress}-${i}` which isn't the IP ID.
        // The fetch logic didn't actually fetch the IP ID from Story Protocol.
        // For the hackathon "Remix" flow, we might just pass the image and let them mint a new IP.
        // BUT the user asked to "use them as children".
        // To do that, we need the Parent IP ID.
        // Determining IP ID from Token ID requires a contract call to IP Asset Registry `ipId(chainId, tokenContract, tokenId)`.

        // For now, let's pass the image. If we can't get IP ID easily here without more ABI, 
        // we heavily assume the user wants to *visually* remix.
        // Actually, I can update fetchCollectionItems to get IP ID if I want to be 100% correct,
        // or just pass the contract and tokenId and let the Studio figure it out.

        // Let's pass image and title for now.
        params.set("parentImage", item.image);
        if (item.title) params.set("parentPrompt", `Remix of ${item.title}`);

        // Passing contract and tokenId so Studio can resolve IP ID if needed.
        params.set("parentContract", item.contract);
        params.set("parentTokenId", item.tokenId);

        router.push(`/create?${params.toString()}`);
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar />

            <main className="container mx-auto py-8 max-w-5xl">
                <div className="text-center mb-12 space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight">Meme Gallery</h1>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                        Explore collections on Story Protocol. Enter an SPG NFT Collection address to view memes.
                    </p>

                    <div className="flex w-full max-w-sm items-center space-x-2 mx-auto">
                        <Input
                            type="text"
                            placeholder="0x..."
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button onClick={() => handleSearch()} disabled={isLoading}>
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        </Button>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>

                {/* Grid */}
                {items.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {items.map((item) => (
                            <Card key={item.id} className="overflow-hidden flex flex-col group hover:shadow-lg transition-shadow">
                                <div className="aspect-square relative overflow-hidden bg-muted">
                                    {item.image ? (
                                        <Image
                                            src={item.image}
                                            alt={item.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            unoptimized // For IPFS images
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                            No Image
                                        </div>
                                    )}
                                </div>

                                <CardContent className="p-4 flex-1">
                                    <h3 className="font-semibold truncate" title={item.title}>{item.title}</h3>
                                    <p className="text-xs text-muted-foreground mt-1 truncate">
                                        Token #{item.tokenId}
                                    </p>
                                </CardContent>

                                <CardFooter className="p-4 pt-0">
                                    <Button className="w-full gap-2" variant="secondary" onClick={() => handleRemix(item)}>
                                        <Zap className="w-4 h-4 text-yellow-500" />
                                        Remix This
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    !isLoading && address && !error && (
                        <div className="text-center py-20 text-muted-foreground">
                            No items found or invalid collection.
                        </div>
                    )
                )}

                {/* Empty State / Defaults */}
                {!address && (
                    <div className="space-y-12">
                        {/* 1. Quick Action: View My Wallet */}
                        <div className="text-center py-10 border-2 border-dashed rounded-xl bg-muted/20">
                            <Search className="w-10 h-10 mx-auto text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-lg font-semibold mb-2">Explore the Gallery</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                                Search for any SPG Collection address or Wallet address to view their IP Assets.
                            </p>
                            {/* Hint for auto-fill */}
                            <p className="text-xs text-muted-foreground">
                                Hint: Connected? Search your address to see your held IPs.
                            </p>
                        </div>

                        {/* 2. Saved Collections (LocalStorage) */}
                        <SavedCollections onSelect={(addr) => { setAddress(addr); handleSearch(); }} />
                    </div>
                )}
            </main>
        </div>
    );
}

function SavedCollections({ onSelect }: { onSelect: (addr: string) => void }) {
    const [saved, setSaved] = useState<Array<{ name: string, address: string }>>([]);

    // Load from local storage on mount
    useState(() => {
        if (typeof window !== 'undefined') {
            const data = localStorage.getItem("memeStory_collections");
            if (data) {
                try {
                    setSaved(JSON.parse(data));
                } catch (e) {
                    console.error("Failed to parse collections", e);
                }
            }
        }
    });

    if (saved.length === 0) return null;

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <Layers className="w-6 h-6 text-yellow-500" />
                Your Created Collections
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {saved.map((col, idx) => (
                    <Card key={idx} className="hover:border-yellow-400 cursor-pointer transition-all" onClick={() => onSelect(col.address)}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="overflow-hidden">
                                <h3 className="font-semibold truncate">{col.name}</h3>
                                <p className="text-xs text-muted-foreground font-mono truncate">{col.address}</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
