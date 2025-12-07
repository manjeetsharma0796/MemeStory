"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSPGCollection, registerIP } from "@/app/actions/story";
import { Loader2, CheckCircle2 } from "lucide-react";
import { generateMemeImage } from "@/app/actions/gemini"; // Reuse gemini for metadata if needed or new action

interface RegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    prompt: string;
}

export function RegistrationModal({ isOpen, onClose, imageUrl, prompt }: RegistrationModalProps) {
    const [step, setStep] = useState<"collection" | "details" | "registering" | "success">("collection");
    const [spgAddress, setSpgAddress] = useState<string>("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isCreatingCollection, setIsCreatingCollection] = useState(false);
    const [txHash, setTxHash] = useState("");
    const [explorerUrl, setExplorerUrl] = useState("");
    const [collectionName, setCollectionName] = useState("MemeStory Collection");

    useEffect(() => {
        const stored = localStorage.getItem("memeStory_spgAddress");
        if (stored) {
            setSpgAddress(stored);
            setStep("details");
        }

        // Auto-fill metadata using prompt
        if (prompt) {
            setTitle(prompt.slice(0, 50));
            setDescription(`Meme generated from prompt: ${prompt}`);
        }
    }, [isOpen, prompt]);

    const handleCreateCollection = async () => {
        setIsCreatingCollection(true);
        const res = await createSPGCollection(collectionName, "MEME");
        if (res.success && res.address) {
            setSpgAddress(res.address);
            localStorage.setItem("memeStory_spgAddress", res.address as string);
            setStep("details");
        } else {
            alert("Failed to create collection: " + res.error);
        }
        setIsCreatingCollection(false);
    };

    const handleRegister = async () => {
        setStep("registering");
        const res = await registerIP(spgAddress as `0x${string}`, imageUrl, title, description);
        if (res.success) {
            setTxHash(res.txHash || "");
            setExplorerUrl(res.explorerUrl || "");
            setStep("success");
            // Save to gallery (localStorage for now or just append?)
            const existingGallery = JSON.parse(localStorage.getItem("memeStory_gallery") || "[]");
            existingGallery.push({ id: res.ipId, title, imageUrl, explorerUrl: res.explorerUrl });
            localStorage.setItem("memeStory_gallery", JSON.stringify(existingGallery));
        } else {
            alert("Registration failed: " + res.error);
            setStep("details");
        }
    };

    const handleReset = () => {
        setStep(spgAddress ? "details" : "collection");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Register IP Asset</DialogTitle>
                </DialogHeader>

                {step === "collection" && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            First, you need an SPG NFT Collection to mint your IP into.
                        </p>
                        <div className="grid gap-2">
                            <Label>Collection Name</Label>
                            <Input value={collectionName} onChange={(e) => setCollectionName(e.target.value)} />
                        </div>
                        <Button onClick={handleCreateCollection} disabled={isCreatingCollection} className="w-full">
                            {isCreatingCollection ? <Loader2 className="animate-spin mr-2" /> : "Create New Collection"}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">- OR -</p>
                        <Input
                            placeholder="Paste existing SPG Address"
                            value={spgAddress}
                            onChange={(e) => setSpgAddress(e.target.value)}
                        />
                        <Button variant="outline" onClick={() => spgAddress && setStep("details")} disabled={!spgAddress} className="w-full">
                            Use Existing
                        </Button>
                    </div>
                )}

                {step === "details" && (
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Title</Label>
                            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>
                        <Button onClick={handleRegister} className="w-full bg-green-600 hover:bg-green-700">
                            Mint & Register
                        </Button>
                        <Button variant="ghost" onClick={() => setStep("collection")} className="w-full text-xs">
                            Change Collection
                        </Button>
                    </div>
                )}

                {step === "registering" && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
                        <p>Uploading to IPFS and Registering on Story Protocol...</p>
                    </div>
                )}

                {step === "success" && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                        <h3 className="font-bold text-lg">Success!</h3>
                        <p className="text-sm text-muted-foreground">Your meme is now a registered IP Asset.</p>
                        {explorerUrl && (
                            <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">
                                View on Story Explorer
                            </a>
                        )}
                        <Button onClick={handleReset} className="w-full mt-4">Close</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
