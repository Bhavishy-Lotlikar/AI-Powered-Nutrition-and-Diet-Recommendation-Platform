const express = require('express');
const cors = require('cors');
const path = require('path');

// Load env from the SINGLE .env in the project root
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Verify key is loaded at startup
const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
    console.error('WARNING: OPENROUTER_API_KEY is not set in .env file!');
} else {
    console.log('OpenRouter API Key loaded: ***' + apiKey.slice(-4));
}

const { generateFromImage } = require('./services/geminiService');
const { generateExercisePlan } = require('./services/exerciseService');
const { startScheduler } = require('./services/schedulerService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

/**
 * POST /analyze-image
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
        if (!process.env.OPENROUTER_API_KEY) {
            return res.status(503).json({
                error: 'OpenRouter API key not configured. Please add your OPENROUTER_API_KEY to the .env file.',
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
        console.log('Analyzing food image...');

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

        console.log('Analysis complete:', response.foodName, '- Score:', response.healthScore);
        res.json(response);
    } catch (err) {
        console.error('Analysis error:', err.message);
        res.status(500).json({
            error: err.message || 'An unexpected error occurred. Please try again.',
        });
    }
});

/**
 * POST /generate-exercise
 */
app.post('/generate-exercise', async (req, res) => {
    try {
        const { calories, protein, carbs, fats, goal, activityLevel, height, weight } = req.body;

        if (!process.env.OPENROUTER_API_KEY) {
            return res.status(503).json({ error: 'OpenRouter API key not configured.' });
        }

        console.log('Generating exercise plan...');
        const plan = await generateExercisePlan({ calories, protein, carbs, fats, goal, activityLevel, height, weight });
        console.log('Exercise plan generated:', plan.focus);
        res.json(plan);
    } catch (err) {
        console.error('Exercise generation error:', err.message);
        res.status(500).json({ error: err.message || 'Failed to generate exercise plan.' });
    }
});

/**
 * POST /send-exercise-now
 * Generates a plan AND immediately sends it via WhatsApp/Email
 */
app.post('/send-exercise-now', async (req, res) => {
    try {
        const { calories, protein, carbs, fats, goal, activityLevel, height, weight, notificationMethod, whatsappNumber, email } = req.body;

        if (!process.env.OPENROUTER_API_KEY) {
            return res.status(503).json({ error: 'OpenRouter API key not configured.' });
        }

        console.log('Generating exercise plan for immediate delivery...');
        const plan = await generateExercisePlan({ calories, protein, carbs, fats, goal, activityLevel, height, weight });
        console.log('Plan generated:', plan.focus);

        const results = { plan, sent: false, method: notificationMethod };
        const { sendWhatsApp, sendEmail } = require('./services/notificationService');

        // Send via WhatsApp if number is provided
        if (whatsappNumber) {
            try {
                await sendWhatsApp(whatsappNumber, plan);
                results.sent = true;
                results.whatsappSent = true;
                console.log('WhatsApp sent to', whatsappNumber);
            } catch (waErr) {
                console.error('WhatsApp send failed:', waErr.message);
                results.whatsappError = waErr.message;
            }
        }

        // Also send via email if available
        if (email) {
            try {
                await sendEmail(email, plan);
                results.sent = true;
                results.emailSent = true;
                console.log('Email sent to', email);
            } catch (emErr) {
                console.error('Email send failed:', emErr.message);
                results.emailError = emErr.message;
            }
        }

        res.json(results);
    } catch (err) {
        console.error('Send exercise error:', err.message);
        res.status(500).json({ error: err.message || 'Failed to generate and send exercise plan.' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * POST /generate-recommendations
 * AI-powered nutrition recommendations based on consumed vs goals
 */
app.post('/generate-recommendations', async (req, res) => {
    try {
        const { consumed, goals } = req.body;

        if (!process.env.OPENROUTER_API_KEY) {
            return res.status(503).json({ error: 'OpenRouter API key not configured.' });
        }

        const prompt = `You are a world-class certified nutritionist and dietitian with 20 years of experience.

A user has logged their meals for today. Based on their consumed nutrients vs daily goals, suggest personalized meals and foods to avoid.

CONSUMED TODAY:
- Calories: ${consumed.calories || 0} kcal (Goal: ${goals.calories || 2200} kcal)
- Protein: ${consumed.protein || 0}g (Goal: ${goals.protein || 90}g)
- Carbs: ${consumed.carbs || 0}g (Goal: ${goals.carbs || 275}g)
- Fat: ${consumed.fat || 0}g (Goal: ${goals.fat || 65}g)

Return ONLY valid JSON (no markdown, no code fences):
{
  "summary": "1-2 sentence personalized assessment of their nutrition status today",
  "recommended": [
    { "name": "Meal name", "desc": "Why this meal helps fill their gaps (1 sentence)", "calories": 300, "protein": 25, "carbs": 30, "fat": 8, "tags": ["High Protein", "Quick Prep"] }
  ],
  "budget_friendly": [
    { "name": "Budget meal name", "desc": "Why this budget meal helps fill their gaps (1 sentence)", "calories": 300, "protein": 25, "carbs": 30, "fat": 8, "tags": ["Budget", "High Protein"] }
  ],
  "avoid": [
    { "name": "Food to avoid", "reason": "Why they should avoid this today (1 sentence)" }
  ],
  "tips": ["1 actionable nutrition tip for them"]
}

Give 3 recommended meals, 3 budget-friendly meals, and 3 foods to avoid. Be specific with Indian and international food options. Tailor recommendations to fill their nutritional gaps.`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:5173',
                'X-Title': 'NutriMind',
            },
            body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                max_tokens: 2500,
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`OpenRouter API error ${response.status}: ${errBody}`);
        }

        const data = await response.json();
        const raw = data.choices[0].message.content;
        const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);
        console.log('Recommendations generated');
        res.json(parsed);
    } catch (err) {
        console.error('Recommendations error:', err.message);
        res.status(500).json({ error: err.message || 'Failed to generate recommendations.' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\nNurtiMind API running at http://0.0.0.0:${PORT}\n`);
    startScheduler();
});
