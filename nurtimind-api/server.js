const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { generateFromImage } = require('./services/geminiService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

/**
 * POST /analyze-image
 * 
 * Request body:
 *   {
 *     "image": "base64 encoded image string (with or without data URI prefix)",
 *     "goal": "fat_loss" | "muscle_gain" | "maintenance",
 *     "age": 25
 *   }
 * 
 * Response:
 *   {
 *     "foodName": "Detected food name",
 *     "portionSize": "Estimated portion size",
 *     "estimatedCalories": 250,
 *     "protein": 10,
 *     "carbs": 30,
 *     "fat": 8,
 *     "nutritionFacts": { ... detailed breakdown ... },
 *     "healthScore": 72,
 *     "warnings": ["Warning 1"],
 *     "recommendation": "Personalized advice"
 *   }
 */
app.post('/analyze-image', async (req, res) => {
    try {
        const { image, goal, age } = req.body;

        // Validate request
        if (!image) {
            return res.status(400).json({ error: 'No image provided. Please capture or upload a food image.' });
        }
        if (!goal || !['fat_loss', 'muscle_gain', 'maintenance'].includes(goal)) {
            return res.status(400).json({ error: 'Invalid health goal. Choose fat_loss, muscle_gain, or maintenance.' });
        }
        if (!age || age < 1 || age > 120) {
            return res.status(400).json({ error: 'Please provide a valid age (1-120).' });
        }

        // Check for API key
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            return res.status(503).json({
                error: 'Gemini API key not configured. Please add your GEMINI_API_KEY to the .env file.',
            });
        }

        // Extract base64 data and mime type
        let base64Data = image;
        let mimeType = 'image/jpeg';

        if (image.startsWith('data:')) {
            const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
            if (match) {
                mimeType = match[1];
                base64Data = match[2];
            } else {
                return res.status(400).json({ error: 'Invalid image format.' });
            }
        }

        // Single combined AI call
        console.log('🔍 Analyzing food image...');

        const goalLabel = goal.replace('_', ' ');
        const prompt = `You are a certified nutritionist AI with food recognition abilities. Analyze this food image and provide a complete nutrition analysis.

User Goal: ${goalLabel}
User Age: ${age}

Respond ONLY with a valid JSON object (no markdown, no code fences, no extra text):
{
  "foodName": "detected food name",
  "portionSize": "estimated portion (e.g. '1 medium bowl', '2 slices', '250g')",
  "estimatedCalories": <number>,
  "protein": <number in grams>,
  "carbs": <number in grams>,
  "fat": <number in grams>,
  "nutritionFacts": {
    "servingSize": "<e.g. '1 bowl (250g)'>",
    "totalFat": <number in grams>,
    "saturatedFat": <number in grams>,
    "transFat": <number in grams>,
    "cholesterol": <number in mg>,
    "sodium": <number in mg>,
    "totalCarbs": <number in grams>,
    "dietaryFiber": <number in grams>,
    "totalSugars": <number in grams>,
    "addedSugars": <number in grams>,
    "protein": <number in grams>,
    "vitaminD": <number in mcg>,
    "calcium": <number in mg>,
    "iron": <number in mg>,
    "potassium": <number in mg>
  },
  "healthScore": <number 0-100, 100 = perfectly aligned with user goal>,
  "warnings": ["<warning 1>", "<warning 2>"],
  "recommendation": "<personalized 2-3 sentence recommendation>"
}

If the image does not contain recognizable food, respond with:
{"foodName": "unknown"}

Health score: fat_loss penalizes high cal/fat/sugar; muscle_gain rewards high protein; maintenance rewards balance.`;

        const rawResponse = await generateFromImage(base64Data, mimeType, prompt);

        let parsed;
        try {
            const cleaned = rawResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            parsed = JSON.parse(cleaned);
        } catch (parseErr) {
            console.error('Parse error:', parseErr.message, 'Raw:', rawResponse);
            throw new Error('Failed to analyze food image. Please try again.');
        }

        if (parsed.foodName === 'unknown') {
            return res.status(422).json({
                error: 'Could not recognize food in this image. Please try a clearer photo of food.',
            });
        }

        const nf = parsed.nutritionFacts || {};
        const response = {
            foodName: parsed.foodName || 'Unknown Food',
            portionSize: parsed.portionSize || 'Standard serving',
            estimatedCalories: parsed.estimatedCalories || 0,
            protein: parsed.protein || 0,
            carbs: parsed.carbs || 0,
            fat: parsed.fat || 0,
            nutritionFacts: {
                servingSize: nf.servingSize || parsed.portionSize || 'Standard serving',
                totalFat: nf.totalFat || parsed.fat || 0,
                saturatedFat: nf.saturatedFat || 0,
                transFat: nf.transFat || 0,
                cholesterol: nf.cholesterol || 0,
                sodium: nf.sodium || 0,
                totalCarbs: nf.totalCarbs || parsed.carbs || 0,
                dietaryFiber: nf.dietaryFiber || 0,
                totalSugars: nf.totalSugars || 0,
                addedSugars: nf.addedSugars || 0,
                protein: nf.protein || parsed.protein || 0,
                vitaminD: nf.vitaminD || 0,
                calcium: nf.calcium || 0,
                iron: nf.iron || 0,
                potassium: nf.potassium || 0,
            },
            healthScore: Math.min(100, Math.max(0, parsed.healthScore || 50)),
            warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
            recommendation: parsed.recommendation || 'No specific recommendation available.',
        };

        console.log('✅ Analysis complete:', response.foodName, '— Score:', response.healthScore);
        res.json(response);
    } catch (err) {
        console.error('❌ Analysis error:', err.message);
        res.status(500).json({
            error: err.message || 'An unexpected error occurred. Please try again.',
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🧠 NurtiMind API running at http://0.0.0.0:${PORT}\n`);
});
