import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Leaf, Ban, Loader2, TrendingUp, AlertTriangle, RefreshCw, Lightbulb, Sparkles, Wallet } from 'lucide-react';
import { motion, useScroll, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { fetchTodaysMeals } from '../api/mealApi';
import { fetchNutritionGoals } from '../api/summaryApi';

const AI_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Tracking Circle Component for the left sidebar
function TrackingCircle() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["end end", "start start"],
    });

    return (
        <div ref={ref} className="hidden md:flex flex-col items-center absolute left-0 top-0 bottom-0 w-24 pointer-events-none">
            <div className="sticky top-1/2 -translate-y-1/2 w-20 h-20 flex justify-center items-center">
                <svg width="75" height="75" viewBox="0 0 100 100" className="-rotate-90">
                    <circle
                        cx="50" cy="50" r="30"
                        className="fill-none stroke-primary-500/20 stroke-[5px]"
                    />
                    <motion.circle
                        cx="50" cy="50" r="30"
                        className="fill-none stroke-primary-500 stroke-[5px]"
                        style={{ pathLength: scrollYProgress }}
                    />
                </svg>
            </div>
        </div>
    );
}

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

            // Utility to strip emojis from all response text
            const stripEmojis = (obj) => {
                if (typeof obj === 'string') {
                    // Regex covering most emoji ranges
                    return obj.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
                }
                if (Array.isArray(obj)) return obj.map(stripEmojis);
                if (typeof obj === 'object' && obj !== null) {
                    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, stripEmojis(v)]));
                }
                return obj;
            };

            setAiResult(stripEmojis(data));
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

            {/* AI Results Layout Native to Viewport Tracking */}
            {aiResult && (
                <div className="relative mt-12 pt-8">
                    {/* The drawing circle that tracks vertical scroll */}
                    <TrackingCircle />

                    <div className="space-y-24 md:pl-28 max-w-3xl">


                        {/* Section 2: Eat Next */}
                        {aiResult.recommended?.length > 0 && (
                            <section className="min-h-[50vh] flex flex-col justify-center">
                                <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }}>
                                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 tracking-tight">Optimal Meals <span className="text-primary-500">To Eat Next</span></h2>
                                    <div className="space-y-5">
                                        {aiResult.recommended.map((meal, i) => (
                                            <div key={i} className="bg-white dark:bg-dark-800 p-6 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-lg hover:shadow-xl transition-shadow flex flex-col sm:flex-row items-start sm:items-center gap-6 group">
                                                <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                                                    <Leaf className="text-primary-500" size={28} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{meal.name}</h3>
                                                        <span className="text-sm font-black text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-full mt-2 sm:mt-0 w-fit">{meal.calories} kcal</span>
                                                    </div>
                                                    <p className="text-gray-500 dark:text-gray-400 mb-4">{meal.desc}</p>
                                                    <div className="flex gap-2 flex-wrap">
                                                        {meal.tags?.map(tag => (
                                                            <span key={tag} className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 bg-gray-100 text-gray-600 dark:bg-dark-700 dark:text-gray-300 rounded-lg">{tag}</span>
                                                        ))}
                                                        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-lg">P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </section>
                        )}

                        {/* Section 3: Budget Friendly */}
                        {aiResult.budget_friendly?.length > 0 && (
                            <section className="min-h-[50vh] flex flex-col justify-center">
                                <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }}>
                                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 tracking-tight flex items-center gap-3">
                                        <Wallet className="text-emerald-500" size={32} />
                                        Budget Friendly <span className="text-emerald-500">Options</span>
                                    </h2>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {aiResult.budget_friendly.map((meal, i) => (
                                            <div key={i} className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-6 rounded-3xl flex flex-col h-full hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20 transition-colors">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{meal.name}</h3>
                                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-3">{meal.calories} kcal • P:{meal.protein}g</span>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">{meal.desc}</p>
                                                {meal.tags && meal.tags.length > 0 && (
                                                    <div className="mt-4 flex flex-wrap gap-2">
                                                        {meal.tags.map(t => <span key={t} className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-1 rounded-md">{t}</span>)}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </section>
                        )}

                        {/* Section 4: Avoid Today */}
                        {aiResult.avoid?.length > 0 && (
                            <section className="min-h-[30vh] flex flex-col justify-center">
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-100px" }}>
                                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 tracking-tight flex items-center gap-3">
                                        <Ban className="text-red-500" size={32} />
                                        Foods to <span className="text-red-500">Avoid</span>
                                    </h2>
                                    <div className="space-y-4">
                                        {aiResult.avoid.map((food, i) => (
                                            <div key={i} className="bg-red-50/50 dark:bg-red-900/10 p-5 rounded-3xl border border-red-100 dark:border-red-900/20 flex flex-col sm:flex-row sm:items-center gap-4">
                                                <h3 className="font-bold text-lg text-red-900 dark:text-red-400 min-w-[200px]">{food.name}</h3>
                                                <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">{food.reason}</p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </section>
                        )}

                        {/* Section 5: Regenerate */}
                        <section className="min-h-[40vh] flex flex-col justify-center items-center text-center">
                            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                                <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Need different options?</h2>
                                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">We can recalculate the optimal macros and find entirely new recipes that fit your exact dietary needs right now.</p>
                                <button
                                    onClick={() => { setAiResult(null); handleGenerate(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    className="px-8 py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-2xl transition-transform hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto shadow-xl"
                                >
                                    <RefreshCw size={20} /> Recalculate Protocol
                                </button>
                            </motion.div>
                        </section>

                    </div>
                </div>
            )}
        </div>
    );
};

export default Recommendations;
