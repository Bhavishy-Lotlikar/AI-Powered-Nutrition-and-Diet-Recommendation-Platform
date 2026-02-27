const { generateFromImage } = require('./geminiService');

/**
 * Analyze a food image using Gemini Vision.
 * Returns detected food name and estimated portion size.
 *
 * @param {string} base64Image - Base64-encoded image data
 * @param {string} mimeType - Image MIME type (image/jpeg, image/png, etc.)
 * @returns {Promise<{foodName: string, portionSize: string}>}
 */
async function analyzeImage(base64Image, mimeType) {
    const prompt = `You are a food recognition expert. Analyze this food image and respond ONLY with a valid JSON object (no markdown, no code fences, no extra text).

JSON format:
{
  "foodName": "name of the food item(s) detected",
  "portionSize": "estimated portion size (e.g., '1 medium bowl', '2 slices', '250g')"
}

If the image does not contain recognizable food, respond with:
{
  "foodName": "unknown",
  "portionSize": "unknown"
}`;

    const rawResponse = await generateFromImage(base64Image, mimeType, prompt);

    try {
        // Clean potential markdown code fences from response
        const cleaned = rawResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return {
            foodName: parsed.foodName || 'Unknown Food',
            portionSize: parsed.portionSize || 'Unknown portion',
        };
    } catch (err) {
        console.error('Vision parse error:', err.message, 'Raw:', rawResponse);
        throw new Error('Could not recognize food in the image. Please try a clearer photo.');
    }
}

module.exports = { analyzeImage };
