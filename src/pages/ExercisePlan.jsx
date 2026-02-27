import React, { useState, useEffect } from 'react';
import {
    Dumbbell, Clock, Flame, Target, Loader2, CheckCircle2,
    Timer, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { generateExercisePlan, saveExercisePlan, fetchTodaysPlan, fetchRecentPlans } from '../api/exerciseApi';
import { fetchTodaysMeals } from '../api/mealApi';
import { fetchProfile } from '../api/profileApi';

const ExerciseCard = ({ exercise, index }) => (
    <div className="bg-white dark:bg-dark-800 p-5 rounded-2xl border border-gray-100 dark:border-dark-700 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 text-primary-600 font-bold text-sm">
            {index + 1}
        </div>
        <div className="flex-1">
            <h4 className="font-bold text-gray-900 dark:text-white mb-1">{exercise.name}</h4>
            <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span className="flex items-center gap-1"><Dumbbell size={12} /> {exercise.sets} sets × {exercise.reps}</span>
                <span className="flex items-center gap-1"><Timer size={12} /> Rest: {exercise.rest}</span>
            </div>
            {exercise.notes && <p className="text-xs text-gray-400 dark:text-gray-500 italic">{exercise.notes}</p>}
        </div>
    </div>
);

const ExercisePlan = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [plan, setPlan] = useState(null);
    const [error, setError] = useState(null);
    const [recentPlans, setRecentPlans] = useState([]);
    const [expandedPast, setExpandedPast] = useState(null);

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        if (!user?.id) { setLoading(false); return; }
        try {
            const [todayPlan, recent] = await Promise.all([
                fetchTodaysPlan(user.id),
                fetchRecentPlans(user.id, 7)
            ]);
            if (todayPlan) { setPlan(todayPlan.full_response); setSaved(true); }
            setRecentPlans(recent);
        } catch (err) {
            console.error('Load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        setError(null);
        setSaved(false);

        try {
            const [meals, profile] = await Promise.all([
                fetchTodaysMeals(user.id),
                fetchProfile(user.id)
            ]);

            const totals = (meals || []).reduce((acc, m) => ({
                calories: acc.calories + (Number(m.calories) || 0),
                protein: acc.protein + (Number(m.protein) || 0),
                carbs: acc.carbs + (Number(m.carbs) || 0),
                fats: acc.fats + (Number(m.fats) || 0),
            }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

            const data = {
                calories: totals.calories || 2000,
                protein: totals.protein || 60,
                carbs: totals.carbs || 200,
                fats: totals.fats || 50,
                goal: profile?.fitness_goal || 'maintenance',
                activityLevel: profile?.activity_level || 'moderate',
                height: profile?.height_cm || 170,
                weight: profile?.weight_kg || 70,
            };

            const result = await generateExercisePlan(data);
            setPlan(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!user?.id || !plan) return;
        setSaving(true);
        try {
            await saveExercisePlan(user.id, plan);
            setSaved(true);
            await loadData();
        } catch (err) {
            setError('Failed to save plan. Check Supabase configuration.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="text-primary-500 animate-spin" size={32} /></div>;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Exercise Plan</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">AI-generated daily workout based on your nutrition intake and fitness goals.</p>

            {error && (
                <div className="mb-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <Flame className="text-red-500 shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
                </div>
            )}

            {/* Generate Button */}
            {!plan && !generating && (
                <button
                    onClick={handleGenerate}
                    className="w-full py-6 bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold rounded-3xl transition-all shadow-lg shadow-primary-500/25 flex items-center justify-center gap-3 text-lg mb-8"
                >
                    <Dumbbell size={24} /> Generate Today's Workout Plan
                </button>
            )}

            {/* Generating State */}
            {generating && (
                <div className="bg-primary-50/50 dark:bg-primary-900/10 rounded-3xl p-12 text-center border border-primary-100 dark:border-primary-900/30 mb-8">
                    <Loader2 className="text-primary-500 animate-spin mx-auto mb-4" size={40} />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Generating Your Workout...</h3>
                    <p className="text-gray-500 dark:text-gray-400">NutriMind AI is building a personalized plan based on your nutrition and goals.</p>
                </div>
            )}

            {/* Plan Display */}
            {plan && (
                <div className="space-y-6">
                    {/* Summary Card */}
                    <div className="bg-gradient-to-br from-dark-800 to-primary-900/40 rounded-3xl p-6 text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-primary-500/20 p-3 rounded-2xl"><Target className="text-primary-400" size={24} /></div>
                            <div>
                                <h3 className="text-lg font-bold">{plan.focus || 'Full Body'}</h3>
                                <div className="flex gap-4 text-sm text-gray-400">
                                    <span className="flex items-center gap-1"><Clock size={14} /> {plan.duration || '45 min'}</span>
                                    <span className="flex items-center gap-1"><Flame size={14} /> ~{plan.caloriesBurned || 300} kcal</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-gray-300 leading-relaxed">{plan.summary}</p>
                    </div>

                    {/* Warmup */}
                    {plan.warmup && (
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4">
                            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Warmup</p>
                            <p className="text-sm text-amber-800 dark:text-amber-300">{plan.warmup}</p>
                        </div>
                    )}

                    {/* Exercises */}
                    {plan.exercises?.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold tracking-widest text-gray-400 uppercase mb-4">Exercises</h3>
                            <div className="space-y-3">
                                {plan.exercises.map((ex, i) => <ExerciseCard key={i} exercise={ex} index={i} />)}
                            </div>
                        </div>
                    )}

                    {/* Cardio */}
                    {plan.cardio && (
                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-5">
                            <h3 className="text-sm font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-2">Cardio</h3>
                            <p className="font-bold text-gray-900 dark:text-white">{plan.cardio.type} — {plan.cardio.duration}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Intensity: {plan.cardio.intensity}</p>
                            {plan.cardio.notes && <p className="text-sm text-gray-400 italic mt-1">{plan.cardio.notes}</p>}
                        </div>
                    )}

                    {/* Cooldown */}
                    {plan.cooldown && (
                        <div className="bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 rounded-2xl p-4">
                            <p className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-1">Cooldown</p>
                            <p className="text-sm text-primary-800 dark:text-primary-300">{plan.cooldown}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button onClick={() => { setPlan(null); setSaved(false); setError(null); }} className="flex-1 py-4 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2">
                            <RefreshCw size={18} /> Regenerate
                        </button>
                        {!saved ? (
                            <button onClick={handleSave} disabled={saving} className="flex-1 py-4 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2">
                                {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : 'Save Plan'}
                            </button>
                        ) : (
                            <div className="flex-1 py-4 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 font-bold rounded-2xl flex items-center justify-center gap-2">
                                <CheckCircle2 size={18} /> Plan Saved
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Recent Plans */}
            {recentPlans.length > 0 && (
                <div className="mt-12">
                    <h3 className="text-sm font-bold tracking-widest text-gray-400 uppercase mb-4">Saved Workout Logs</h3>
                    <div className="space-y-3">
                        {recentPlans.map((rp) => (
                            <div key={rp.id} className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 overflow-hidden">
                                <button
                                    onClick={() => setExpandedPast(expandedPast === rp.id ? null : rp.id)}
                                    className="w-full p-4 flex items-center justify-between text-left"
                                >
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">{rp.focus || 'Workout'}</p>
                                        <p className="text-xs text-gray-500">{new Date(rp.date).toLocaleDateString()} — {rp.duration}</p>
                                    </div>
                                    {expandedPast === rp.id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                                </button>
                                {expandedPast === rp.id && rp.full_response && (
                                    <div className="px-4 pb-4 border-t border-gray-100 dark:border-dark-700 pt-3">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{rp.summary}</p>
                                        {rp.exercises?.map((ex, i) => (
                                            <p key={i} className="text-xs text-gray-500 mb-1">{i + 1}. {ex.name} — {ex.sets}×{ex.reps}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExercisePlan;
