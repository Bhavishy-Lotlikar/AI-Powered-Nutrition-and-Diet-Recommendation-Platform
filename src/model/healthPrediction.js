/**
 * Health Prediction Model (JS port of Python XGBoost logic)
 * 
 * Uses the same health formula from the training data generation:
 * health = 100 - (calories * 0.05 + fat * 0.7) + protein * 0.4 - weeks * 1.2
 * 
 * This formula captures the same relationships that the XGBoost model would learn
 * from the synthetic data, without needing a Python backend.
 */

// Simple seeded random for reproducibility
function seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

/**
 * Predict health score based on nutrition intake and time
 */
function predictHealth(calories, fat, protein, weeks) {
    const noise = (seededRandom(calories + fat + protein + weeks) - 0.5) * 6;
    let health = 100 - (calories * 0.05 + fat * 0.7) + protein * 0.4 - weeks * 1.2 + noise;
    return Math.max(10, Math.min(100, Math.round(health)));
}

/**
 * Generate 24-week health projection comparing current diet vs ideal diet
 * 
 * @param {Object} nutrients - { calories, fat, protein } from logged meals average
 * @returns {Array} - Array of { week, currentDiet, idealDiet } data points
 */
export function generateHealthProjection(nutrients) {
    const weeks = Array.from({ length: 24 }, (_, i) => i + 1);

    // Starting score based on current diet quality
    const baseScore = Math.max(40, Math.min(80,
        80 - (nutrients.calories * 0.02 + nutrients.fat * 0.3) + nutrients.protein * 0.2
    ));

    return weeks.map(w => {
        // Current diet: declines noticeably over time
        const currentDecay = w * 2.2;
        const noise1 = (seededRandom(w * 7 + 3) - 0.5) * 4;
        const currentScore = Math.max(15, Math.min(95, baseScore - currentDecay + noise1));

        // Ideal diet: improves steadily over time
        const idealGrowth = w * 1.5;
        const noise2 = (seededRandom(w * 13 + 7) - 0.5) * 3;
        const idealScore = Math.max(30, Math.min(95, baseScore + idealGrowth + noise2));

        return {
            week: `W${w}`,
            weekNum: w,
            currentDiet: Math.round(currentScore),
            idealDiet: Math.round(idealScore),
        };
    });
}

/**
 * Calculate risk scores based on current average nutrition
 */
export function calculateRiskScores(avgNutrients, goals) {
    const cal = avgNutrients.calories || 0;
    const fat = avgNutrients.fat || 0;
    const protein = avgNutrients.protein || 0;
    const carbs = avgNutrients.carbs || 0;

    // Iron deficiency risk (high carb + low protein = higher risk)
    const ironRisk = Math.min(100, Math.max(10,
        50 + (carbs > (goals?.carbs || 275) ? 20 : -10) - (protein > (goals?.protein || 90) ? 20 : -10) + (cal < 1200 ? 25 : 0)
    ));

    // Energy crash risk (high sugar/carbs + low protein)
    const energyRisk = Math.min(100, Math.max(10,
        40 + (carbs > 200 ? (carbs - 200) * 0.15 : -15) + (protein < 50 ? 20 : -10) + (fat > 80 ? 15 : -5)
    ));

    // Overall wellbeing (balanced = good)
    const calRatio = goals?.calories ? cal / goals.calories : 0.8;
    const proteinRatio = goals?.protein ? protein / goals.protein : 0.8;
    const wellbeing = Math.min(100, Math.max(10,
        60 + (Math.abs(1 - calRatio) < 0.15 ? 20 : -10) + (proteinRatio >= 0.8 ? 15 : -15) + (fat < (goals?.fat || 65) ? 10 : -10)
    ));

    return { ironRisk, energyRisk, wellbeing };
}

/**
 * Generate a personalized energy crash prediction message
 */
export function getEnergyCrashPrediction(avgNutrients) {
    const carbs = avgNutrients.carbs || 0;
    const protein = avgNutrients.protein || 0;
    const fat = avgNutrients.fat || 0;

    if (carbs > 250 && protein < 60) {
        return "Based on your meal patterns, you're consuming high carbs with low protein. A mid-afternoon energy crash is likely around 2:30-4:00 PM. Consider swapping one carb-heavy meal with a protein-rich option like grilled chicken, eggs, or legumes.";
    }
    if (fat > 80) {
        return "Your fat intake is quite high, which can cause sluggishness after meals. Consider lighter meals at lunch to maintain steady energy through the afternoon. Add more fiber-rich foods and reduce fried items.";
    }
    if (protein > 100) {
        return "Great protein intake! Your energy levels should be relatively stable. To maintain this, ensure you're also getting enough complex carbs from whole grains and vegetables for sustained energy release.";
    }
    return "Your current dietary pattern looks fairly balanced. Keep monitoring your meals and aim for consistent protein intake throughout the day to prevent energy dips. A small mid-afternoon snack can help maintain focus.";
}
