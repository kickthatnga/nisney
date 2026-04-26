const https = require('https');

// ====================== CONFIG ======================
const URL = 'https://api.aryankaushik.space/api/auth/signup';
const ATTEMPTS = 100;      // ← Change this number
const DELAY_MS = 400;      // ← Delay between requests (lower = more aggressive)

// Random string generator
function randomString(length = 10) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ====================== MAIN ======================
async function sendSignup(i) {
    const rand = randomString(8);
    const username = `stress_${rand}`;
    const email = `${username}@duck.com`;
    const password = `Pass${rand}123!`;

    const payload = JSON.stringify({
        username: username,
        email: email,
        password: password
    });

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Origin': 'https://aeroweb.aryankaushik.space',
            'Referer': 'https://aeroweb.aryankaushik.space/'
        }
    };

    const req = https.request(URL, options, (res) => {
        console.log(`[${i}/${ATTEMPTS}] ${email} → HTTP ${res.statusCode}`);
        
        if (res.statusCode === 429) {
            console.log("⚠️  RATE LIMIT HIT (429) !");
        }
    });

    req.on('error', (err) => {
        console.log(`[${i}/${ATTEMPTS}] ${email} → ERROR: ${err.message}`);
    });

    req.write(payload);
    req.end();
}

// ====================== RUN ======================
console.log(`=== Signup Rate Limit Test Started ===`);
console.log(`Target: ${URL}`);
console.log(`Attempts: ${ATTEMPTS} | Delay: ${DELAY_MS}ms`);
console.log(`=====================================\n`);

let count = 0;

const interval = setInterval(() => {
    if (count >= ATTEMPTS) {
        clearInterval(interval);
        console.log("\n=== Test Finished ===");
        return;
    }
    count++;
    sendSignup(count);
}, DELAY_MS);
