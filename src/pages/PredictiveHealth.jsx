import React, { useState, useEffect, useMemo } from 'react';
import { TrendingDown, Zap, ShieldAlert, Loader2, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { fetchTodaysMeals } from '../api/mealApi';
import { fetchNutritionGoals } from '../api/summaryApi';
import { generateHealthProjection, calculateRiskScores, getEnergyCrashPrediction } from '../model/healthPrediction';

const PredictiveHealth = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [todaysMeals, setTodaysMeals] = useState([]);
    const [goals, setGoals] = useState(null);

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
            setGoals(savedGoals);
        } catch (err) {
            console.error('Failed to load health data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Calculate average nutrients from today's meals (or use defaults)
    const avgNutrients = useMemo(() => {
        if (todaysMeals.length === 0) {
            return { calories: 500, fat: 25, protein: 20, carbs: 220 };
        }
        const totals = todaysMeals.reduce((acc, meal) => ({
            calories: acc.calories + (Number(meal.calories) || 0),
            fat: acc.fat + (Number(meal.fats) || 0),
            protein: acc.protein + (Number(meal.protein) || 0),
            carbs: acc.carbs + (Number(meal.carbs) || 0),
        }), { calories: 0, fat: 0, protein: 0, carbs: 0 });

        return {
            calories: Math.round(totals.calories / todaysMeals.length),
            fat: Math.round(totals.fat / todaysMeals.length),
            protein: Math.round(totals.protein / todaysMeals.length),
            carbs: Math.round(totals.carbs / todaysMeals.length),
        };
    }, [todaysMeals]);

    const projectionData = useMemo(() => generateHealthProjection(avgNutrients), [avgNutrients]);
    const risks = useMemo(() => calculateRiskScores(avgNutrients, goals), [avgNutrients, goals]);
    const energyMsg = useMemo(() => getEnergyCrashPrediction(avgNutrients), [avgNutrients]);

    // Build risk cards from computed scores
    const riskCards = [
        {
            icon: ShieldAlert,
            title: 'Iron Deficiency Risk',
            score: risks.ironRisk > 65 ? 'High' : risks.ironRisk > 40 ? 'Medium' : 'Low',
            color: risks.ironRisk > 65 ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : risks.ironRisk > 40 ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-primary-600 bg-primary-50 dark:bg-primary-900/20',
            bar: risks.ironRisk > 65 ? 'bg-red-400' : risks.ironRisk > 40 ? 'bg-amber-400' : 'bg-primary-500',
            pct: risks.ironRisk,
        },
        {
            icon: Zap,
            title: 'Energy Crash Risk',
            score: risks.energyRisk > 65 ? 'High' : risks.energyRisk > 40 ? 'Medium' : 'Low',
            color: risks.energyRisk > 65 ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : risks.energyRisk > 40 ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-primary-600 bg-primary-50 dark:bg-primary-900/20',
            bar: risks.energyRisk > 65 ? 'bg-red-400' : risks.energyRisk > 40 ? 'bg-amber-400' : 'bg-primary-500',
            pct: risks.energyRisk,
        },
        {
            icon: TrendingDown,
            title: 'Overall Wellbeing',
            score: risks.wellbeing > 65 ? 'Good' : risks.wellbeing > 40 ? 'Fair' : 'Poor',
            color: risks.wellbeing > 65 ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' : risks.wellbeing > 40 ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-red-500 bg-red-50 dark:bg-red-900/20',
            bar: risks.wellbeing > 65 ? 'bg-primary-500' : risks.wellbeing > 40 ? 'bg-amber-400' : 'bg-red-400',
            pct: risks.wellbeing,
        },
    ];

    if (loading) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <Loader2 className="text-primary-500 animate-spin" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Predictive Health Engine</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
                AI-powered 24-week health forecast based on {todaysMeals.length > 0 ? 'your logged meals' : 'sample nutrition data'}.
            </p>

            {/* Current Diet Summary */}
            <div className="bg-white dark:bg-dark-800 rounded-3xl p-5 border border-gray-100 dark:border-dark-700 shadow-sm mb-8">
                <div className="flex items-center gap-2 mb-3">
                    <Activity size={18} className="text-primary-500" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Prediction Based On</h3>
                    {todaysMeals.length === 0 && (
                        <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">Using sample data — log meals for real predictions</span>
                    )}
                </div>
                <div className="grid grid-cols-4 gap-3">
                    <div className="text-center"><p className="text-xs text-gray-400 font-bold">Avg Calories</p><p className="text-lg font-bold text-gray-900 dark:text-white">{avgNutrients.calories}</p></div>
                    <div className="text-center"><p className="text-xs text-gray-400 font-bold">Avg Protein</p><p className="text-lg font-bold text-gray-900 dark:text-white">{avgNutrients.protein}g</p></div>
                    <div className="text-center"><p className="text-xs text-gray-400 font-bold">Avg Carbs</p><p className="text-lg font-bold text-gray-900 dark:text-white">{avgNutrients.carbs}g</p></div>
                    <div className="text-center"><p className="text-xs text-gray-400 font-bold">Avg Fat</p><p className="text-lg font-bold text-gray-900 dark:text-white">{avgNutrients.fat}g</p></div>
                </div>
            </div>

            {/* Risk Score Cards */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
                {riskCards.map(item => {
                    const Icon = item.icon;
                    return (
                        <div key={item.title} className="bg-white dark:bg-dark-800 p-6 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${item.color}`}>
                                <Icon size={22} />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{item.title}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white mb-4">{item.score}</p>
                            <div className="w-full h-2 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${item.bar}`} style={{ width: `${item.pct}%` }}></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 24-Week Projection Graph */}
            <div className="bg-white dark:bg-dark-800 p-6 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm mb-8">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">24-Week Health Projection</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Comparing your current diet trajectory vs an ideal balanced diet.</p>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={projectionData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} interval={3} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} domain={[0, 100]} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                formatter={(value, name) => [
                                    `${value}/100`,
                                    name === 'currentDiet' ? 'Your Current Diet' : 'Ideal Healthy Diet'
                                ]}
                            />
                            <Legend
                                formatter={(value) => value === 'currentDiet' ? 'Your Current Diet' : 'Ideal Healthy Diet'}
                            />
                            <Line
                                type="monotone"
                                dataKey="currentDiet"
                                stroke="#ef4444"
                                strokeWidth={2.5}
                                dot={{ fill: '#ef4444', r: 3 }}
                                activeDot={{ r: 6 }}
                                name="currentDiet"
                            />
                            <Line
                                type="monotone"
                                dataKey="idealDiet"
                                stroke="#22c55e"
                                strokeWidth={2.5}
                                strokeDasharray="6 3"
                                dot={{ fill: '#22c55e', r: 3 }}
                                activeDot={{ r: 6 }}
                                name="idealDiet"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Energy Crash Section */}
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-6 rounded-3xl">
                <h2 className="text-lg font-bold text-amber-800 dark:text-amber-400 mb-2">Energy Crash Prediction</h2>
                <p className="text-amber-700 dark:text-amber-300 text-sm leading-relaxed">
                    {energyMsg}
                </p>
            </div>
        </div>
    );
};

export default PredictiveHealth;
