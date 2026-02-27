const { GoogleGenerativeAI } = require('@google/generative-ai');

// dotenv is already loaded in server.js BEFORE this file is required
// So process.env.GEMINI_API_KEY will be available

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 5000;

function getModel(modelName = 'gemini-2.5-flash') {
    return genAI.getGenerativeModel({ model: modelName });
}

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
            if (is429) {
                throw new Error('AI service is temporarily busy due to rate limits. Please wait 30 seconds and try again.');
            }
            if (isNetwork) {
                throw new Error('Cannot reach Google AI API. Please check your internet connection and try again.');
            }
            throw err;
        }
    }
}

async function generateFromImage(base64Image, mimeType, prompt) {
    console.log('Using API Key:', process.env.GEMINI_API_KEY ? '***' + process.env.GEMINI_API_KEY.slice(-4) : 'NOT SET');
    console.log('Using model: gemini-2.5-flash');
    return withRetry(async () => {
        const model = getModel();
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: mimeType || 'image/jpeg',
            },
        };
        const result = await model.generateContent([prompt, imagePart]);
        return result.response.text();
    });
}

module.exports = { generateFromImage };
