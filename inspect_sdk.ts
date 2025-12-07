
import { StoryClient, StoryConfig, aeneid } from '@story-protocol/core-sdk';
import { http, createPublicClient, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

async function main() {
    // 1. Inspect Client
    try {
        const account = privateKeyToAccount('0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e');
        const config: StoryConfig = {
            account: account,
            transport: http(aeneid.rpcUrls.default.http[0]),
            chainId: 'aeneid',
        };
        const client = StoryClient.newClient(config);

        // Use console.log with detailed access
        const ipClient = client.ipAsset as any;
        console.log("IPAssetClient Keys:", Object.keys(ipClient));
        if (ipClient.ipAssetRegistryClient) {
            console.log("Registry Client:", ipClient.ipAssetRegistryClient);
            console.log("Registry Address:", ipClient.ipAssetRegistryClient.address);
        }
    } catch (e) {
        console.error("SDK Inspect Error:", e);
    }

    // 2. Test candidate address for balanceOf
    try {
        const publicClient = createPublicClient({
            chain: aeneid,
            transport: http()
        });
        const ADDRESS = "0x77319B4031e6eF1250907aa00018B8B1c67a244b";
        const bal = await publicClient.readContract({
            address: ADDRESS,
            abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
            functionName: 'balanceOf',
            args: ['0x0000000000000000000000000000000000000000']
        });
        console.log("BalanceOf Call Success. Result:", bal.toString());
    } catch (e) {
        console.log("BalanceOf failed:", e.message);
    }
}

main();
