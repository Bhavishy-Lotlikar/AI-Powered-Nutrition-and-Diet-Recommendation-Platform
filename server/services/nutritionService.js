const { generateText } = require('./geminiService');

/**
 * Estimate nutrition values and generate health score + recommendation.
 *
 * @param {string} foodName - Detected food name
 * @param {string} portionSize - Estimated portion size
 * @param {string} goal - User health goal (fat_loss, muscle_gain, maintenance)
 * @param {number} age - User age
 * @returns {Promise<object>} Full nutrition analysis result
 */
async function estimateNutrition(foodName, portionSize, goal, age) {
    const goalLabel = goal.replace('_', ' ');

    const prompt = `You are a certified nutritionist AI. Given the following food and user profile, provide a complete nutrition analysis.

Food: ${foodName}
Estimated Portion: ${portionSize}
User Goal: ${goalLabel}
User Age: ${age}

Respond ONLY with a valid JSON object (no markdown, no code fences, no extra text):
{
  "estimatedCalories": <number>,
  "protein": <number in grams>,
  "carbs": <number in grams>,
  "fat": <number in grams>,
  "healthScore": <number 0-100, where 100 = perfectly aligned with user goal>,
  "warnings": ["<warning string 1>", "<warning string 2>"],
  "recommendation": "<personalized 2-3 sentence recommendation based on the user's goal and age>"
}

Health score guidelines:
- For fat_loss: penalize high calories, high fat, high sugar foods
- For muscle_gain: reward high protein, penalize very low calorie foods
- For maintenance: reward balanced macros

Warnings should flag specific concerns (e.g., "High sugar content", "Low protein for muscle gain goal").
If there are no warnings, return an empty array.`;

    const rawResponse = await generateText(prompt);

    try {
        const cleaned = rawResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);

        return {
            estimatedCalories: parsed.estimatedCalories || 0,
            protein: parsed.protein || 0,
            carbs: parsed.carbs || 0,
            fat: parsed.fat || 0,
            healthScore: Math.min(100, Math.max(0, parsed.healthScore || 50)),
            warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
            recommendation: parsed.recommendation || 'No specific recommendation available.',
        };
    } catch (err) {
        console.error('Nutrition parse error:', err.message, 'Raw:', rawResponse);
        throw new Error('Failed to estimate nutrition. Please try again.');
    }
}

module.exports = { estimateNutrition };
