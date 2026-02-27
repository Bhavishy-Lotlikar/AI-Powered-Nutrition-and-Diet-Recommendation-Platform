// OpenRouter API — Exercise plan generation via google/gemini-2.5-flash
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.5-flash';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 5000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateExercisePlan({ calories, protein, carbs, fats, goal, activityLevel, height, weight }) {
  const goalLabel = (goal || 'maintenance').replace('_', ' ');
  const activity = (activityLevel || 'moderate').replace('_', ' ');

  const prompt = `You are an elite personal fitness trainer with 15 years of experience training clients from beginners to athletes. Your name is Coach NutriMind. You design safe, effective, and motivating workout plans tailored to each client's nutrition and body composition.

Your client's profile for today:
- Today's Calorie Intake: ${calories || 2000} kcal
- Protein: ${protein || 60}g | Carbs: ${carbs || 200}g | Fats: ${fats || 50}g
- Fitness Goal: ${goalLabel}
- Activity Level: ${activity}
- Height: ${height || 170} cm | Weight: ${weight || 70} kg

Design a complete daily workout plan that matches their energy intake and fitness goal. If they ate less, suggest lighter exercises. If they have high protein, focus on strength training. Be motivational in your summary.

Return ONLY a valid JSON object (no markdown, no code fences):
{
  "summary": "Motivational 2-3 sentence overview addressing the client directly, e.g. 'Great protein intake today! Let's capitalize on that with a strength-focused session...'",
  "focus": "Primary muscle group or workout type",
  "duration": "Estimated total time e.g. '45 minutes'",
  "warmup": "Specific warmup routine with duration",
  "exercises": [
    { "name": "Exercise name", "sets": 3, "reps": "12", "rest": "60s", "notes": "Form tip or modification for beginners" }
  ],
  "cardio": { "type": "Specific cardio activity", "duration": "20 minutes", "intensity": "Low/Moderate/High", "notes": "Heart rate zone or technique tip" },
  "cooldown": "Specific stretching routine with duration",
  "caloriesBurned": 300
}

Generate 5-7 exercises. Include bodyweight alternatives for gym exercises. Match intensity to their activity level. Be specific with rep ranges and rest periods.`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) throw new Error('OPENROUTER_API_KEY not set in .env');

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
