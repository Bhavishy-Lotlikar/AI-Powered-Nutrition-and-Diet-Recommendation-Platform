import React, { useState, useEffect, useRef } from 'react';
import {
    Dumbbell, Clock, Flame, Target, Loader2, CheckCircle2,
    Timer, RefreshCw, ChevronDown, ChevronUp, Check
} from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { generateExercisePlan, saveExercisePlan, fetchTodaysPlan, fetchRecentPlans } from '../api/exerciseApi';
import { fetchTodaysMeals } from '../api/mealApi';
import { fetchProfile } from '../api/profileApi';

const ExerciseCardAnimated = ({ exercise, index }) => (
    <div className="w-[300px] sm:w-[350px] md:w-[400px] flex-shrink-0 h-[400px] sm:h-[450px] rounded-3xl relative overflow-hidden bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-700 shadow-2xl flex flex-col group">
        <div className="absolute inset-0 bg-primary-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="p-6 md:p-8 flex-1 flex flex-col relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-primary-500/20 flex items-center justify-center text-primary-400 font-black text-xl mb-6 shadow-inner ring-1 ring-primary-500/30">
                0{index + 1}
            </div>

            <h4 className="text-2xl sm:text-3xl font-black text-white mb-4 leading-tight">{exercise.name}</h4>

            <div className="space-y-3 mt-auto mb-6">
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                    <Dumbbell className="text-primary-400" size={18} />
                    <span className="text-gray-200 font-bold">{exercise.sets} sets × {exercise.reps}</span>
                </div>
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                    <Timer className="text-primary-400" size={18} />
                    <span className="text-gray-200 font-bold">Rest: {exercise.rest}</span>
                </div>
            </div>

            {exercise.notes && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm italic">
                    {exercise.notes}
                </div>
            )}
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

    // Horizontal Scroll Ref
    const scrollContainerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: scrollContainerRef,
        offset: ["start start", "end end"],
    });

    // We need viewport width to calculate horizontal distance
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1000);
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
            <AnimatePresence>
                {generating && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        className="bg-primary-50/50 dark:bg-primary-900/10 rounded-3xl p-12 text-center border border-primary-100 dark:border-primary-900/30 mb-8 max-w-lg mx-auto overflow-hidden relative"
                    >
                        <motion.div
                            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary-500/10 to-transparent z-0"
                            animate={{ translateX: ['-100%', '200%'] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        />
                        <Loader2 className="text-primary-500 animate-spin mx-auto mb-4 relative z-10" size={40} />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 relative z-10">Coding Your Regimen...</h3>
                        <p className="text-gray-500 dark:text-gray-400 relative z-10">A personalized split is being calculated for maximum hypertrophy based on today's macros.</p>
                    </motion.div>
                )}
            </AnimatePresence>

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

                    {/* Horizontal Scroll Gallery for Exercises */}
                    {plan.exercises?.length > 0 && (
                        <div className="py-12 -mx-4 sm:-mx-6 lg:-mx-8">
                            {/* We calculate scroll container height. ~100vh per card for nice scrolling */}
                            <div ref={scrollContainerRef} style={{ height: `${plan.exercises.length * 70}vh`, position: 'relative' }}>
                                {/* Sticky container locks to viewport */}
                                <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden">

                                    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                        <div className="mb-8 pl-2">
                                            <h3 className="text-3xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white uppercase">The Protocol</h3>
                                            <p className="text-gray-500 dark:text-gray-400 font-bold tracking-widest uppercase text-sm mt-2">Scroll to execute</p>
                                        </div>

                                        {/* Transform horizontal based on scrollYProgress. */}
                                        <ExerciseGallery scrollYProgress={scrollYProgress} exercises={plan.exercises} windowWidth={windowWidth} />
                                    </div>

                                </div>
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

                    {/* Action Buttons - Slide in from right */}
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "0px 0px -100px 0px" }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="flex flex-col sm:flex-row gap-4 mt-12 py-8 border-t border-gray-200 dark:border-dark-700 max-w-2xl mx-auto"
                    >
                        <button onClick={() => { setPlan(null); setSaved(false); setError(null); }} className="flex-1 py-5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2">
                            <RefreshCw size={20} /> Regenerate Protocol
                        </button>
                        {!saved ? (
                            <button onClick={handleSave} disabled={saving} className="flex-1 py-5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:opacity-50 text-white font-bold rounded-2xl transition-colors shadow-xl shadow-primary-500/25 flex items-center justify-center gap-2 text-lg">
                                {saving ? <><Loader2 size={20} className="animate-spin" /> Committing...</> : 'Save & Log Execution'}
                            </button>
                        ) : (
                            <div className="flex-1 py-5 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 font-bold rounded-2xl flex items-center justify-center gap-2 text-lg">
                                <Check size={24} strokeWidth={3} /> Protocol Saved
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            {/* Recent Plans - Slides in when saved */}
            <AnimatePresence>
                {recentPlans.length > 0 && (plan ? saved : true) && (
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
                        className="mt-12 max-w-2xl mx-auto"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-200 dark:to-dark-700"></div>
                            <h3 className="text-sm font-bold tracking-widest text-gray-400 uppercase">Workout Logs</h3>
                            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-200 dark:to-dark-700"></div>
                        </div>

                        <div className="space-y-4">
                            {recentPlans.map((rp, index) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    key={rp.id}
                                    className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 overflow-hidden shadow-sm"
                                >
                                    <button
                                        onClick={() => setExpandedPast(expandedPast === rp.id ? null : rp.id)}
                                        className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-xl text-primary-600 dark:text-primary-400">
                                                <Dumbbell size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white text-lg">{rp.focus || 'Full Body Protocol'}</p>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{new Date(rp.date).toLocaleDateString()} • {rp.duration}</p>
                                            </div>
                                        </div>
                                        <div className="bg-gray-100 dark:bg-dark-700 p-2 rounded-full">
                                            {expandedPast === rp.id ? <ChevronUp size={18} className="text-gray-900 dark:text-white" /> : <ChevronDown size={18} className="text-gray-900 dark:text-white" />}
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {expandedPast === rp.id && rp.full_response && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="px-5 pb-5 border-t border-gray-100 dark:border-dark-700 pt-4"
                                            >
                                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{rp.summary}</p>
                                                <div className="bg-gray-50 dark:bg-dark-900/50 rounded-2xl p-4 space-y-3">
                                                    {rp.exercises?.map((ex, i) => (
                                                        <div key={i} className="flex items-start gap-3 border-b border-gray-200 dark:border-dark-700 last:border-b-0 pb-3 last:pb-0">
                                                            <span className="text-xs font-bold text-primary-500 mt-1">0{i + 1}</span>
                                                            <div>
                                                                <p className="font-bold text-gray-900 dark:text-white text-sm">{ex.name}</p>
                                                                <p className="text-xs text-gray-500">{ex.sets} sets × {ex.reps}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Component helper for the horizontal transform
const ExerciseGallery = ({ scrollYProgress, exercises, windowWidth }) => {
    // Gap and card width assumptions
    // Card width depends on viewport but roughly 400px + 24px gap = 424px.
    const isMobile = windowWidth < 640;
    const cardWidth = isMobile ? 300 : windowWidth < 768 ? 350 : 400;
    const gap = 24;

    // Total scrollable width.
    const totalDistance = (exercises.length - 1) * (cardWidth + gap);

    // Map strictly 0 to 1 of scrollY to 0 to -totalDistance horizontally
    const x = useTransform(scrollYProgress, [0, 1], [0, -totalDistance]);

    return (
        <motion.div
            className="flex gap-6 pl-2 pr-[50vw]" // Extra padding on right so last card isn't edge-locked
            style={{ x }}
        >
            {exercises.map((ex, i) => (
                <ExerciseCardAnimated key={i} exercise={ex} index={i} />
            ))}
        </motion.div>
    );
};

export default ExercisePlan;
