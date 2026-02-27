import React, { useState, useEffect, useMemo } from 'react';
import { Leaf, Ban, MapPin, Loader2, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchTodaysMeals } from '../api/mealApi';
import { fetchNutritionGoals } from '../api/summaryApi';

// Recommendation engine — picks foods based on what nutrients are lacking
const FOOD_DATABASE = {
    highProtein: [
        { name: 'Grilled Chicken Breast', desc: 'Lean protein powerhouse — 31g protein per 100g', tags: ['High Protein', 'Low Fat'], calories: 165, protein: 31, carbs: 0, fat: 3.6 },
        { name: 'Greek Yogurt + Nuts', desc: 'Probiotics + protein + healthy fats for gut health', tags: ['High Protein', 'Quick Prep'], calories: 180, protein: 15, carbs: 8, fat: 9 },
        { name: 'Eggs (3) + Spinach', desc: 'Complete amino acids with iron and B12', tags: ['High Protein', 'Budget Pick'], calories: 240, protein: 21, carbs: 3, fat: 15 },
        { name: 'Paneer Tikka', desc: 'Vegetarian protein bomb — 18g protein per 100g', tags: ['High Protein', 'Vegetarian'], calories: 260, protein: 18, carbs: 5, fat: 20 },
        { name: 'Tuna Salad Bowl', desc: 'Omega-3 rich with lean protein and fresh veggies', tags: ['High Protein', 'Omega-3'], calories: 200, protein: 26, carbs: 5, fat: 8 },
    ],
    lowCalorie: [
        { name: 'Mixed Green Salad + Vinaigrette', desc: 'Fiber-rich, low-calorie with essential vitamins', tags: ['Low Calorie', 'Fiber Rich'], calories: 120, protein: 4, carbs: 12, fat: 6 },
        { name: 'Grilled Fish + Steamed Veggies', desc: 'Lean and clean — packed with omega-3 and minerals', tags: ['Low Calorie', 'Omega-3'], calories: 220, protein: 28, carbs: 8, fat: 8 },
        { name: 'Cucumber & Hummus', desc: 'Light snack with healthy fats and plant protein', tags: ['Low Calorie', 'Quick Prep'], calories: 100, protein: 4, carbs: 8, fat: 6 },
    ],
    ironRich: [
        { name: 'Spinach & Lentil Soup', desc: 'Iron-rich, fiber-packed, and budget-friendly', tags: ['Iron Rich', 'Budget Pick'], calories: 180, protein: 12, carbs: 28, fat: 2 },
        { name: 'Chickpea & Beetroot Bowl', desc: 'Plant-based iron with vitamin C for better absorption', tags: ['Iron Rich', 'Vegetarian'], calories: 220, protein: 10, carbs: 35, fat: 5 },
        { name: 'Liver & Onions', desc: 'Highest bioavailable iron source — 6mg per 100g', tags: ['Iron Rich', 'High Protein'], calories: 175, protein: 26, carbs: 4, fat: 5 },
    ],
    highFiber: [
        { name: 'Oatmeal + Berries + Seeds', desc: 'Soluble fiber for heart health and energy', tags: ['High Fiber', 'Quick Prep'], calories: 280, protein: 10, carbs: 45, fat: 8 },
        { name: 'Brown Rice + Rajma', desc: 'Complete protein with fiber for sustained energy', tags: ['High Fiber', 'Budget Pick'], calories: 320, protein: 14, carbs: 55, fat: 3 },
        { name: 'Mixed Fruit Bowl + Flaxseed', desc: 'Antioxidants, vitamins, and digestive fiber', tags: ['High Fiber', 'Quick Prep'], calories: 180, protein: 4, carbs: 38, fat: 5 },
    ],
    balanced: [
        { name: 'Grilled Salmon Bowl', desc: 'High in Omega-3, Vitamin D, and lean protein', tags: ['Balanced', 'Omega-3'], calories: 350, protein: 30, carbs: 25, fat: 14 },
        { name: 'Avocado Toast + Egg', desc: 'Balanced macros with healthy fats for sustained energy', tags: ['Balanced', 'Quick Prep'], calories: 310, protein: 14, carbs: 28, fat: 18 },
        { name: 'Chicken Stir-Fry + Brown Rice', desc: 'Balanced protein, carbs, and veggies in one meal', tags: ['Balanced', 'High Protein'], calories: 420, protein: 28, carbs: 45, fat: 12 },
    ],
};

const AVOID_DATABASE = {
    highCalorie: [
        { name: 'Fried Fast Food', reason: 'Extremely calorie-dense — a single meal can exceed your daily fat target' },
        { name: 'Sugary Drinks & Sodas', reason: 'Empty calories and high fructose lead to energy crashes and fat storage' },
        { name: 'Creamy Pasta Dishes', reason: 'High in saturated fat and refined carbs — switch to whole wheat with olive oil' },
    ],
    highFat: [
        { name: 'Deep Fried Snacks', reason: 'Trans fats from frying damage cardiovascular health over time' },
        { name: 'Heavy Cream Sauces', reason: 'Saturated fat overload — substitute with yogurt-based sauces' },
    ],
    highCarb: [
        { name: 'White Bread & Refined Flour', reason: 'Spikes blood sugar rapidly — switch to whole grain or multigrain' },
        { name: 'Sugary Cereals', reason: 'Added sugars cause energy crashes — switch to oats or muesli' },
        { name: 'Candy & Desserts', reason: 'Simple sugars provide zero nutrition — opt for dark chocolate or fruit' },
    ],
    lowProtein: [
        { name: 'Plain Rice Meals', reason: 'Almost no protein — always pair rice with dal, chicken, or eggs' },
        { name: 'Bread-Heavy Sandwiches', reason: 'More bread than filling — increase protein fillings like turkey or tofu' },
    ],
};

function generateRecommendations(consumed, goals) {
    const recs = [];
    const avoids = [];

    const calPct = goals.calories ? consumed.calories / goals.calories : 0.5;
    const proPct = goals.protein ? consumed.protein / goals.protein : 0.5;
    const carbPct = goals.carbs ? consumed.carbs / goals.carbs : 0.5;
    const fatPct = goals.fat ? consumed.fat / goals.fat : 0.5;

    // Need more protein
    if (proPct < 0.7) {
        recs.push(...FOOD_DATABASE.highProtein.slice(0, 3));
        avoids.push(...AVOID_DATABASE.lowProtein);
    }

    // Over on calories
    if (calPct > 0.85) {
        recs.push(...FOOD_DATABASE.lowCalorie.slice(0, 2));
        avoids.push(...AVOID_DATABASE.highCalorie.slice(0, 2));
    }

    // Over on fat
    if (fatPct > 0.8) {
        avoids.push(...AVOID_DATABASE.highFat);
    }

    // Over on carbs
    if (carbPct > 0.8) {
        avoids.push(...AVOID_DATABASE.highCarb.slice(0, 2));
    }

    // Under on everything (haven't eaten much yet)
    if (calPct < 0.4) {
        recs.push(...FOOD_DATABASE.balanced.slice(0, 2));
        recs.push(...FOOD_DATABASE.highFiber.slice(0, 1));
    }

    // Iron rich if low on protein and carbs
    if (proPct < 0.5 && carbPct < 0.5) {
        recs.push(...FOOD_DATABASE.ironRich.slice(0, 2));
    }

    // Always add at least some balanced options
    if (recs.length < 3) {
        recs.push(...FOOD_DATABASE.balanced);
    }
    if (avoids.length === 0) {
        avoids.push({ name: 'Processed Snacks', reason: 'Generally low in nutrients — opt for whole foods instead' });
    }

    // Deduplicate by name
    const uniqueRecs = [...new Map(recs.map(r => [r.name, r])).values()].slice(0, 5);
    const uniqueAvoids = [...new Map(avoids.map(a => [a.name, a])).values()].slice(0, 4);

    return { recommended: uniqueRecs, avoid: uniqueAvoids };
}

function getSummaryMessage(consumed, goals) {
    const calPct = goals.calories ? consumed.calories / goals.calories : 0;
    const proPct = goals.protein ? consumed.protein / goals.protein : 0;

    const gaps = [];
    if (proPct < 0.6) gaps.push(`protein (${consumed.protein}g / ${goals.protein}g)`);
    if (calPct < 0.4) gaps.push(`calories (${consumed.calories} / ${goals.calories} kcal)`);

    if (gaps.length > 0) return `You're low on ${gaps.join(' and ')}. The meals below are specifically chosen to fill these gaps.`;
    if (calPct > 1) return `You've exceeded your calorie target. Focus on light, protein-rich foods for the rest of the day.`;
    return `You're on track! The recommendations below will help you finish strong today.`;
}

const Recommendations = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [todaysMeals, setTodaysMeals] = useState([]);
    const [goals, setGoals] = useState({ calories: 2200, protein: 90, carbs: 275, fat: 65, fiber: 25 });

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        if (!user?.id) { setLoading(false); return; }
        try {
            const [meals, savedGoals] = await Promise.all([
                fetchTodaysMeals(user.id),
                fetchNutritionGoals(user.id)
            ]);
            setTodaysMeals(meals || []);
            if (savedGoals) setGoals({
                calories: savedGoals.calories || 2200,
                protein: savedGoals.protein || 90,
                carbs: savedGoals.carbs || 275,
                fat: savedGoals.fat || 65,
                fiber: savedGoals.fiber || 25,
            });
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    };

    const consumed = useMemo(() => todaysMeals.reduce((acc, m) => ({
        calories: acc.calories + (Number(m.calories) || 0),
        protein: acc.protein + (Number(m.protein) || 0),
        carbs: acc.carbs + (Number(m.carbs) || 0),
        fat: acc.fat + (Number(m.fats) || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 }), [todaysMeals]);

    const { recommended, avoid } = useMemo(() => generateRecommendations(consumed, goals), [consumed, goals]);
    const summaryMsg = useMemo(() => getSummaryMessage(consumed, goals), [consumed, goals]);

    // Past meal recommendations from logged data
    const pastRecs = useMemo(() => {
        return todaysMeals
            .filter(m => m.recommendation)
            .map(m => ({ food: m.detected_food_name, rec: m.recommendation }))
            .slice(0, 3);
    }, [todaysMeals]);

    if (loading) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <Loader2 className="text-primary-500 animate-spin" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Recommendations</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Personalized meal suggestions based on your nutrition gaps today.</p>

            {/* Summary Banner */}
            <div className="bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 rounded-2xl p-4 mb-8 flex items-start gap-3">
                <TrendingUp className="text-primary-500 shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-primary-800 dark:text-primary-300 font-medium">{summaryMsg}</p>
            </div>

            {/* AI Recommendations from Past Meals */}
            {pastRecs.length > 0 && (
                <div className="mb-10">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">AI Insights from Your Meals</h2>
                    <div className="space-y-3">
                        {pastRecs.map((r, i) => (
                            <div key={i} className="bg-gradient-to-br from-dark-800 to-primary-900/30 rounded-2xl p-5 text-white">
                                <p className="text-xs font-bold text-primary-400 uppercase tracking-wider mb-1">After eating {r.food}</p>
                                <p className="text-sm text-gray-300 leading-relaxed">{r.rec}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recommended Meals */}
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Eat This Next</h2>
            <div className="space-y-4 mb-10">
                {recommended.map(meal => (
                    <div key={meal.name} className="bg-white dark:bg-dark-800 p-5 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm flex items-start gap-4">
                        <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-2xl flex-shrink-0">
                            <Leaf className="text-primary-500" size={22} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-start justify-between">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-1">{meal.name}</h3>
                                <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{meal.calories} kcal</span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{meal.desc}</p>
                            <div className="flex gap-2 flex-wrap">
                                {meal.tags.map(tag => (
                                    <span key={tag} className="text-xs font-semibold px-2.5 py-1 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 rounded-full">{tag}</span>
                                ))}
                                <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 dark:bg-dark-700 dark:text-gray-400 rounded-full">P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Avoid Foods */}
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Avoid Today</h2>
            <div className="space-y-4 mb-10">
                {avoid.map(food => (
                    <div key={food.name} className="bg-white dark:bg-dark-800 p-5 rounded-3xl border border-red-100 dark:border-red-900/30 shadow-sm flex items-start gap-4">
                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-2xl flex-shrink-0">
                            <Ban className="text-red-500" size={22} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">{food.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{food.reason}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Budget-Friendly Suggestions */}
            <div className="bg-white dark:bg-dark-800 p-6 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-xl">
                        <MapPin className="text-blue-500" size={20} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Budget-Friendly Options</h2>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Affordable meals that match your nutritional needs:</p>
                <div className="grid sm:grid-cols-2 gap-4">
                    {['Chana Dal (Chickpea Curry)', 'Mixed Veg Omelette', 'Brown Rice + Rajma', 'Banana + Peanut Butter'].map(name => (
                        <div key={name} className="bg-gray-50 dark:bg-dark-700 px-4 py-3 rounded-2xl flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{name}</span>
                            <span className="text-xs text-primary-600 dark:text-primary-400 font-bold">Budget Pick</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Recommendations;
