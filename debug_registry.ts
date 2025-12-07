
import { createPublicClient, http, parseAbi } from 'viem';
import { aeneid, StoryClient, StoryConfig } from '@story-protocol/core-sdk';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

async function test() {
    try {
        const dummyAccount = privateKeyToAccount(generatePrivateKey());
        const config: StoryConfig = {
            account: dummyAccount,
            transport: http(aeneid.rpcUrls.default.http[0]),
            chainId: 'aeneid',
        };
        const client = StoryClient.newClient(config);

        // @ts-ignore
        const registryClient = client.ipAsset.ipAssetRegistryClient;
        console.log("Registry Address:", registryClient?.address);

        if (!registryClient?.address) return;

        const publicClient = createPublicClient({
            chain: aeneid,
            transport: http()
        });

        const ABI = parseAbi([
            'function balanceOf(address owner) view returns (uint256)'
        ]);

        const bal = await publicClient.readContract({
            address: registryClient.address,
            abi: ABI,
            functionName: 'balanceOf',
            args: ['0x0000000000000000000000000000000000000000']
        });
        console.log("Balance:", bal);

    } catch (e) {
        console.error("Test Failed:", e);
    }
}

test();
