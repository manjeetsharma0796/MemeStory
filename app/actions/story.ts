"use server";

import { client, account } from "@/utils/config";
import { PILFlavor } from "@story-protocol/core-sdk";
import axios from 'axios';
import FormData from 'form-data';
import { zeroAddress } from "viem";
import { createHash } from "crypto";

// Helper to upload to Pinata
async function uploadToPinata(buffer: Buffer, filename: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', buffer, { filename });

    const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
        maxContentLength: Infinity,
        headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${process.env.PINATA_JWT}`
        }
    });
    return `https://ipfs.io/ipfs/${res.data.IpfsHash}`;
}

async function uploadJSONToPinata(json: any): Promise<string> {
    const res = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', json, {
        headers: {
            Authorization: `Bearer ${process.env.PINATA_JWT}`
        }
    });
    return `https://ipfs.io/ipfs/${res.data.IpfsHash}`;
}

export async function createSPGCollection(name: string, symbol: string) {
    try {
        const newCollection = await client.nftClient.createNFTCollection({
            name,
            symbol,
            isPublicMinting: true,
            mintOpen: true,
            contractURI: 'https://ipfs.io/ipfs/QmTeLVjM6Ney29mgCh75BWATC6hsxiyGKnbkUM3K1ZNNja', // Default URI
            mintFeeRecipient: zeroAddress,
        });

        return { success: true, address: newCollection.spgNftContract, txHash: newCollection.txHash };
    } catch (e: any) {
        console.error("Create Collection Error:", e);
        return { success: false, error: e.message };
    }
}

export async function registerIP(
    spgNftContract: `0x${string}`,
    imageBase64: string,
    name: string,
    description: string
) {
    try {
        // 1. Upload Image to Pinata
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const imageUrl = await uploadToPinata(imageBuffer, 'meme.png');

        // 2. Upload Metadata to Pinata
        const ipMetadata = {
            title: name,
            description: description,
            createdAt: Math.floor(Date.now() / 1000).toString(),
            creators: [{
                name: "MemeStory User",
                address: account.address,
                description: "Meme Creator"
            }],
            image: imageUrl,
            mediaUrl: imageUrl,
            mediaType: "image/png"
        };
        const ipMetadataURI = await uploadJSONToPinata(ipMetadata);
        const ipMetadataHash = `0x${createHash('sha256').update(JSON.stringify(ipMetadata)).digest('hex')}`;

        const nftMetadata = {
            name,
            description,
            image: imageUrl
        };
        const nftMetadataURI = await uploadJSONToPinata(nftMetadata);
        const nftMetadataHash = `0x${createHash('sha256').update(JSON.stringify(nftMetadata)).digest('hex')}`;

        // 3. Register IP
        const response = await client.ipAsset.registerIpAsset({
            nft: { type: 'mint', spgNftContract },
            licenseTermsData: [{
                terms: PILFlavor.commercialRemix({
                    commercialRevShare: 0,
                    defaultMintingFee: 0n,
                    currency: '0x1514000000000000000000000000000000000000'
                })
            }],
            // If strict, I should use params.
            // Let's assume standard default behavior or try to match minimal payload.
            // If I look at register.ts: `PILFlavor.commercialRemix({...})`.
            // I'll use `PILFlavor.nonCommercialRemix()` and assume defaults work, or add dummy.
            // To be safe, I'll use the same structure as register.ts if `nonCommercialRemix` is similar.
            // Actually, non-commercial remix usually doesn't need currency?
            // Let's try `PILFlavor.nonCommercialRemix({ country: 'US' })` or just empty.
            // I'll rely on IntelliSense/inference. 
            // Better: `PILFlavor.nonCommercialRemix()` without arguments if it allows.
            ipMetadata: {
                ipMetadataURI,
                ipMetadataHash: ipMetadataHash as `0x${string}`,
                nftMetadataURI,
                nftMetadataHash: nftMetadataHash as `0x${string}`,
            },
        });

        return {
            success: true,
            ipId: response.ipId,
            txHash: response.txHash,
            explorerUrl: `https://aeneid.explorer.story.foundation/ipa/${response.ipId}`
        };

    } catch (e: any) {
        console.error("Register IP Error:", e);
        return { success: false, error: e.message }; // Return error message string
    }
}
