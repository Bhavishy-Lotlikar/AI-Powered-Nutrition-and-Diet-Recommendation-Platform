const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 5000;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateExercisePlan({ calories, protein, carbs, fats, goal, activityLevel, height, weight }) {
    const goalLabel = (goal || 'maintenance').replace('_', ' ');
    const activity = (activityLevel || 'moderate').replace('_', ' ');

    const prompt = `You are a certified fitness and nutrition coach.
Based on this user's daily nutrition intake and profile, generate a safe, realistic daily exercise plan.

User Profile:
- Daily Calories: ${calories || 2000} kcal
- Protein: ${protein || 60}g
- Carbs: ${carbs || 200}g
- Fats: ${fats || 50}g
- Fitness Goal: ${goalLabel}
- Activity Level: ${activity}
- Height: ${height || 170} cm
- Weight: ${weight || 70} kg

Return ONLY a valid JSON object (no markdown, no code fences):
{
  "summary": "Brief 1-2 sentence overview of today's plan",
  "focus": "Primary focus area (e.g. Upper Body, Core, Legs, Full Body, Cardio)",
  "duration": "Estimated total time (e.g. 45 minutes)",
  "warmup": "Brief warmup description (2-3 sentences)",
  "exercises": [
    {
      "name": "Exercise name",
      "sets": 3,
      "reps": "12",
      "rest": "60s",
      "notes": "Brief form tip or alternative"
    }
  ],
  "cardio": {
    "type": "e.g. Brisk walking, HIIT, Cycling",
    "duration": "e.g. 20 minutes",
    "intensity": "e.g. Moderate, High",
    "notes": "Brief description"
  },
  "cooldown": "Brief cooldown/stretch description",
  "caloriesBurned": 300
}

Generate 5-7 exercises appropriate for the user's goal and activity level. Ensure exercises are safe for beginners if activity is sedentary or light.`;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const result = await model.generateContent(prompt);
            const raw = result.response.text();
            const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(cleaned);
            return parsed;
        } catch (err) {
            console.error(`Exercise gen attempt ${attempt + 1} failed:`, err.message);
            const is429 = err.message?.includes('429') || err.message?.includes('quota');
            const isNetwork = err.message?.includes('fetch failed') || err.message?.includes('ENOTFOUND');
            if ((is429 || isNetwork) && attempt < MAX_RETRIES) {
                await sleep(BASE_DELAY_MS * Math.pow(2, attempt));
                continue;
            }
            if (is429) throw new Error('AI service is busy. Please wait 30 seconds and try again.');
            throw err;
        }
    }
}

module.exports = { generateExercisePlan };
