const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { analyzeImage } = require('./services/visionService');
const { estimateNutrition } = require('./services/nutritionService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..')));

/**
 * POST /analyze-image
 * Accepts: { image: base64string, goal: string, age: number }
 * Returns: { foodName, estimatedCalories, protein, carbs, fat, healthScore, warnings, recommendation }
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

        // Step 1: Analyze image with Vision
        console.log('🔍 Analyzing food image...');
        const visionResult = await analyzeImage(base64Data, mimeType);

        if (visionResult.foodName === 'unknown') {
            return res.status(422).json({
                error: 'Could not recognize food in this image. Please try a clearer photo of food.',
            });
        }

        // Step 2: Estimate nutrition + generate recommendation
        console.log(`🥗 Estimating nutrition for: ${visionResult.foodName} (${visionResult.portionSize})`);
        const nutritionResult = await estimateNutrition(
            visionResult.foodName,
            visionResult.portionSize,
            goal,
            age
        );

        // Step 3: Return combined result
        const response = {
            foodName: visionResult.foodName,
            portionSize: visionResult.portionSize,
            estimatedCalories: nutritionResult.estimatedCalories,
            protein: nutritionResult.protein,
            carbs: nutritionResult.carbs,
            fat: nutritionResult.fat,
            healthScore: nutritionResult.healthScore,
            warnings: nutritionResult.warnings,
            recommendation: nutritionResult.recommendation,
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

app.listen(PORT, () => {
    console.log(`\n🧠 NurtiMind server running at http://localhost:${PORT}\n`);
});
