// OpenRouter API — using google/gemini-2.5-flash via OpenRouter
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 5000;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.5-flash';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRetry(fn) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            return await fn();
        } catch (err) {
            console.error(`Attempt ${attempt + 1} failed:`, err.message);
            const is429 = err.message && (err.message.includes('429') || err.message.includes('Too Many Requests') || err.message.includes('quota'));
            const isNetwork = err.message && (err.message.includes('fetch failed') || err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED'));
            if ((is429 || isNetwork) && attempt < MAX_RETRIES) {
                const delay = BASE_DELAY_MS * Math.pow(2, attempt);
                console.log(`Retrying in ${delay / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})...`);
                await sleep(delay);
                continue;
            }
            if (is429) throw new Error('AI service is temporarily busy due to rate limits. Please wait 30 seconds and try again.');
            if (isNetwork) throw new Error('Cannot reach OpenRouter API. Please check your internet connection and try again.');
            throw err;
        }
    }
}

async function generateFromImage(base64Image, mimeType, prompt) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    console.log('Using OpenRouter API Key:', apiKey ? '***' + apiKey.slice(-4) : 'NOT SET');
    console.log('Using model:', MODEL);

    return withRetry(async () => {
        const imageUrl = `data:${mimeType || 'image/jpeg'};base64,${base64Image}`;

        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:5173',
                'X-Title': 'NutriMind',
            },
            body: JSON.stringify({
                model: MODEL,
                max_tokens: 1000,
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            { type: 'image_url', image_url: { url: imageUrl } }
                        ]
                    }
                ]
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`OpenRouter API error ${response.status}: ${errBody}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    });
}

module.exports = { generateFromImage };
