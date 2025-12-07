
import axios from 'axios';

const HASH = "QmTeLVjM6Ney29mgCh75BWATC6hsxiyGKnbkUM3K1ZNNja"; // Sample Contract URI
const URL = `https://gateway.pinata.cloud/ipfs/${HASH}`;

async function test() {
    console.log("Testing:", URL);
    try {
        const res = await axios.get(URL, { timeout: 5000 });
        console.log("Status:", res.status);
        console.log("Data:", res.data);
    } catch (e) {
        console.error("Error:", e.message);
    }
}

test();
