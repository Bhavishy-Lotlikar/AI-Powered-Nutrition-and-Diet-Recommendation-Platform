import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { AlertTriangle, Target, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchTodaysMeals } from '../api/mealApi';
import { fetchNutritionGoals, saveNutritionGoals } from '../api/summaryApi';

const DEFAULT_GOALS = { calories: 2200, protein: 90, carbs: 275, fat: 65, fiber: 25 };
const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const NutritionAnalysis = () => {
    const { user } = useAuth();
    const [goals, setGoals] = useState(DEFAULT_GOALS);
    const [tempGoals, setTempGoals] = useState(DEFAULT_GOALS);
    const [editingGoals, setEditingGoals] = useState(false);
    const [savingGoals, setSavingGoals] = useState(false);
    const [goalsSaved, setGoalsSaved] = useState(false);
    const [todaysMeals, setTodaysMeals] = useState([]);
    const [loading, setLoading] = useState(true);

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
            if (savedGoals) {
                const g = {
                    calories: savedGoals.calories || DEFAULT_GOALS.calories,
                    protein: savedGoals.protein || DEFAULT_GOALS.protein,
                    carbs: savedGoals.carbs || DEFAULT_GOALS.carbs,
                    fat: savedGoals.fat || DEFAULT_GOALS.fat,
                    fiber: savedGoals.fiber || DEFAULT_GOALS.fiber,
                };
                setGoals(g);
                setTempGoals(g);
            }
        } catch (err) {
            console.error('Failed to load nutrition data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveGoals = async () => {
        if (!user?.id) return;
        setSavingGoals(true);
        try {
            await saveNutritionGoals(user.id, tempGoals);
            setGoals(tempGoals);
            setEditingGoals(false);
            setGoalsSaved(true);
            setTimeout(() => setGoalsSaved(false), 3000);
        } catch (err) {
            console.error('Failed to save goals:', err);
        } finally {
            setSavingGoals(false);
        }
    };

    // Calculate consumed totals
    const consumed = todaysMeals.reduce((acc, meal) => {
        const raw = meal.full_raw_response || {};
        return {
            calories: acc.calories + (Number(meal.calories) || 0),
            protein: acc.protein + (Number(meal.protein) || 0),
            carbs: acc.carbs + (Number(meal.carbs) || 0),
            fat: acc.fat + (Number(meal.fats) || 0),
            fiber: acc.fiber + (Number(raw.nutritionFacts?.dietaryFiber) || 0),
        };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

    // Bar chart data
    const comparisonData = [
        { name: 'Calories', consumed: consumed.calories, goal: goals.calories },
        { name: 'Protein', consumed: consumed.protein, goal: goals.protein },
        { name: 'Carbs', consumed: consumed.carbs, goal: goals.carbs },
        { name: 'Fat', consumed: consumed.fat, goal: goals.fat },
        { name: 'Fiber', consumed: consumed.fiber, goal: goals.fiber },
    ];

    // Pie chart data (macros only if we have data)
    const totalMacros = consumed.protein + consumed.carbs + consumed.fat;
    const macroData = totalMacros > 0 ? [
        { name: 'Protein', value: Math.round((consumed.protein / totalMacros) * 100) },
        { name: 'Carbs', value: Math.round((consumed.carbs / totalMacros) * 100) },
        { name: 'Fat', value: Math.round((consumed.fat / totalMacros) * 100) },
    ] : [
        { name: 'Protein', value: 33 },
        { name: 'Carbs', value: 34 },
        { name: 'Fat', value: 33 },
    ];

    // Deficiency warnings
    const deficiencies = comparisonData
        .map(item => ({
            name: item.name,
            pct: item.goal > 0 ? Math.round((item.consumed / item.goal) * 100) : 100,
        }))
        .filter(item => item.pct < 80)
        .sort((a, b) => a.pct - b.pct);

    if (loading) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <Loader2 className="text-primary-500 animate-spin" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Nutrition Analysis</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Track your daily nutrition intake against your personal goals.</p>

            {/* Goal Setting Panel */}
            <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 border border-gray-100 dark:border-dark-700 shadow-sm mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Target className="text-primary-500" size={20} />
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Daily Goals</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {goalsSaved && (
                            <span className="text-xs text-green-500 flex items-center gap-1"><CheckCircle2 size={14} /> Saved</span>
                        )}
                        {!editingGoals ? (
                            <button
                                onClick={() => setEditingGoals(true)}
                                className="text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors"
                            >
                                Edit Goals
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button onClick={() => { setEditingGoals(false); setTempGoals(goals); }} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                                <button
                                    onClick={handleSaveGoals}
                                    disabled={savingGoals}
                                    className="text-sm font-medium bg-primary-500 text-white px-3 py-1 rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center gap-1"
                                >
                                    {savingGoals ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-5 gap-3">
                    {['calories', 'protein', 'carbs', 'fat', 'fiber'].map((key) => (
                        <div key={key} className="text-center">
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{key}</p>
                            {editingGoals ? (
                                <input
                                    type="number"
                                    value={tempGoals[key]}
                                    onChange={(e) => setTempGoals({ ...tempGoals, [key]: Number(e.target.value) })}
                                    className="w-full text-center text-lg font-bold bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-600 rounded-xl py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            ) : (
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                    {goals[key]}<span className="text-xs font-normal text-gray-400">{key === 'calories' ? '' : 'g'}</span>
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Comparison Chart */}
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 bg-white dark:bg-dark-800 p-6 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Consumed vs Goal</h2>
                    <div className="flex gap-6 mb-4">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary-500"></div><span className="text-sm text-gray-500">Consumed</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-dark-600"></div><span className="text-sm text-gray-500">Goal</span></div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={comparisonData} barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="consumed" radius={[4, 4, 0, 0]} fill="#22c55e" />
                                <Bar dataKey="goal" radius={[4, 4, 0, 0]} fill="#E5E7EB" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Macro Pie Chart */}
                <div className="bg-white dark:bg-dark-800 p-6 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Macro Split</h2>
                    <div className="h-44 mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={macroData} cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={3} dataKey="value">
                                    {macroData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                        {macroData.map((item, i) => (
                            <div key={item.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                                </div>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">{item.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Deficiency Warnings */}
            {deficiencies.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Deficiency Warnings</h2>
                    <div className="space-y-3">
                        {deficiencies.map(item => (
                            <div key={item.name} className="bg-white dark:bg-dark-800 p-5 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle size={18} className={item.pct < 50 ? 'text-red-500' : 'text-amber-500'} />
                                        <span className="font-bold text-gray-900 dark:text-white">{item.name}</span>
                                    </div>
                                    <span className={`text-sm font-bold ${item.pct < 50 ? 'text-red-500' : 'text-amber-500'}`}>{item.pct}% of goal</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${item.pct < 50 ? 'bg-red-400' : 'bg-amber-400'}`} style={{ width: `${Math.min(item.pct, 100)}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No meals notice */}
            {todaysMeals.length === 0 && (
                <div className="bg-white dark:bg-dark-800 rounded-3xl p-8 text-center border border-gray-100 dark:border-dark-700 mt-8">
                    <p className="text-gray-400 dark:text-gray-500">No meals logged yet today. Head to the Food Scanner to start tracking.</p>
                </div>
            )}
        </div>
    );
};

export default NutritionAnalysis;
