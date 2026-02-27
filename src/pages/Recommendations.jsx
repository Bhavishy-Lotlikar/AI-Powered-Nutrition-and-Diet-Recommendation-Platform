import React, { useState, useEffect, useMemo } from 'react';
import { Leaf, Ban, Loader2, TrendingUp, AlertTriangle, RefreshCw, Lightbulb, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchTodaysMeals } from '../api/mealApi';
import { fetchNutritionGoals } from '../api/summaryApi';

const AI_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const Recommendations = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [todaysMeals, setTodaysMeals] = useState([]);
    const [goals, setGoals] = useState({ calories: 2200, protein: 90, carbs: 275, fat: 65 });
    const [aiResult, setAiResult] = useState(null);
    const [error, setError] = useState(null);

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

    // Past meal recommendations from logged data
    const pastRecs = useMemo(() => {
        return todaysMeals
            .filter(m => m.recommendation)
            .map(m => ({ food: m.detected_food_name, rec: m.recommendation }))
            .slice(0, 3);
    }, [todaysMeals]);

    const handleGenerate = async () => {
        setGenerating(true);
        setError(null);
        try {
            const response = await fetch(`${AI_BASE_URL}/generate-recommendations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ consumed, goals })
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to generate recommendations.');
            }
            const data = await response.json();
            setAiResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="text-primary-500 animate-spin" size={32} /></div>;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Recommendations</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">AI-powered meal suggestions based on your nutrition gaps today.</p>

            {error && (
                <div className="mb-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
                </div>
            )}

            {/* Today's Nutrition Status */}
            <div className="bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="text-primary-500" size={18} />
                    <span className="text-sm font-bold text-primary-800 dark:text-primary-300">Today's Intake</span>
                </div>
                <div className="grid grid-cols-4 gap-3 text-center">
                    <div><p className="text-lg font-bold text-gray-900 dark:text-white">{consumed.calories}</p><p className="text-xs text-gray-500">/ {goals.calories} kcal</p></div>
                    <div><p className="text-lg font-bold text-gray-900 dark:text-white">{consumed.protein}g</p><p className="text-xs text-gray-500">/ {goals.protein}g prot</p></div>
                    <div><p className="text-lg font-bold text-gray-900 dark:text-white">{consumed.carbs}g</p><p className="text-xs text-gray-500">/ {goals.carbs}g carbs</p></div>
                    <div><p className="text-lg font-bold text-gray-900 dark:text-white">{consumed.fat}g</p><p className="text-xs text-gray-500">/ {goals.fat}g fat</p></div>
                </div>
            </div>

            {/* AI Insights from Past Meals */}
            {pastRecs.length > 0 && (
                <div className="mb-8">
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

            {/* Generate Button */}
            {!aiResult && !generating && (
                <button
                    onClick={handleGenerate}
                    className="w-full py-5 bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold rounded-3xl transition-all shadow-lg shadow-primary-500/25 flex items-center justify-center gap-3 text-lg mb-8"
                >
                    <Sparkles size={22} /> Get AI Nutrition Recommendations
                </button>
            )}

            {/* Generating State */}
            {generating && (
                <div className="bg-primary-50/50 dark:bg-primary-900/10 rounded-3xl p-12 text-center border border-primary-100 dark:border-primary-900/30 mb-8">
                    <Loader2 className="text-primary-500 animate-spin mx-auto mb-4" size={40} />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Generating Recommendations...</h3>
                    <p className="text-gray-500 dark:text-gray-400">NutriMind AI is analyzing your nutrition gaps and finding the perfect meals.</p>
                </div>
            )}

            {/* AI Results */}
            {aiResult && (
                <div className="space-y-8">
                    {/* Summary */}
                    {aiResult.summary && (
                        <div className="bg-gradient-to-br from-dark-800 to-primary-900/40 rounded-3xl p-6 text-white">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="text-primary-400" size={18} />
                                <span className="text-sm font-bold text-primary-400 uppercase tracking-wider">AI Assessment</span>
                            </div>
                            <p className="text-gray-300 leading-relaxed">{aiResult.summary}</p>
                        </div>
                    )}

                    {/* Recommended Meals */}
                    {aiResult.recommended?.length > 0 && (
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Eat This Next</h2>
                            <div className="space-y-4">
                                {aiResult.recommended.map((meal, i) => (
                                    <div key={i} className="bg-white dark:bg-dark-800 p-5 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm flex items-start gap-4">
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
                                                {meal.tags?.map(tag => (
                                                    <span key={tag} className="text-xs font-semibold px-2.5 py-1 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 rounded-full">{tag}</span>
                                                ))}
                                                <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 dark:bg-dark-700 dark:text-gray-400 rounded-full">P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Avoid Foods */}
                    {aiResult.avoid?.length > 0 && (
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Avoid Today</h2>
                            <div className="space-y-4">
                                {aiResult.avoid.map((food, i) => (
                                    <div key={i} className="bg-white dark:bg-dark-800 p-5 rounded-3xl border border-red-100 dark:border-red-900/30 shadow-sm flex items-start gap-4">
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
                        </div>
                    )}

                    {/* Tips */}
                    {aiResult.tips?.length > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Lightbulb className="text-amber-500" size={18} />
                                <span className="text-sm font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Pro Tips</span>
                            </div>
                            <ul className="space-y-2">
                                {aiResult.tips.map((tip, i) => (
                                    <li key={i} className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
                                        <span className="text-amber-500 mt-0.5">•</span> {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Regenerate Button */}
                    <button
                        onClick={() => { setAiResult(null); handleGenerate(); }}
                        className="w-full py-4 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={18} /> Regenerate Recommendations
                    </button>
                </div>
            )}
        </div>
    );
};

export default Recommendations;
