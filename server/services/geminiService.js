const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 5000;

/**
 * Get the Gemini generative model instance.
 * @param {string} modelName - e.g. 'gemini-2.0-flash'
 * @returns {import('@google/generative-ai').GenerativeModel}
 */
function getModel(modelName = 'gemini-2.5-flash') {
    return genAI.getGenerativeModel({ model: modelName });
}

/**
 * Sleep helper for retry delays.
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wrap a Gemini API call with retry logic for 429 rate limits.
 */
async function withRetry(fn) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            return await fn();
        } catch (err) {
            const is429 = err.message && (err.message.includes('429') || err.message.includes('Too Many Requests') || err.message.includes('quota'));
            if (is429 && attempt < MAX_RETRIES) {
                const delay = BASE_DELAY_MS * Math.pow(2, attempt);
                console.log(`⏳ Rate limited. Retrying in ${delay / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})...`);
                await sleep(delay);
                continue;
            }
            // Re-throw with user-friendly message
            if (is429) {
                throw new Error('AI service is temporarily busy due to rate limits. Please wait 30 seconds and try again.');
            }
            throw err;
        }
    }
}

/**
 * Generate text content from a prompt.
 */
async function generateText(prompt) {
    return withRetry(async () => {
        const model = getModel();
        const result = await model.generateContent(prompt);
        return result.response.text();
    });
}

/**
 * Generate content from multimodal input (image + text).
 */
async function generateFromImage(base64Image, mimeType, prompt) {
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

module.exports = { getModel, generateText, generateFromImage };
