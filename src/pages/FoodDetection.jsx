import React, { useState, useEffect } from 'react';
import {
    Upload, ScanSearch, CheckCircle2, AlertTriangle, Loader2,
    ShieldCheck, ShieldAlert, Flame, Beef, Wheat, Droplets, Clock, Trash2
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { analyzeFood, saveMeal, fetchTodaysMeals } from '../api/mealApi';
import { updateDailySummary } from '../api/summaryApi';

const NutritionFactRow = ({ label, value, unit, bold = false, indent = false }) => (
    <div className={clsx(
        "flex justify-between py-1.5 border-b border-gray-100 dark:border-dark-700 last:border-b-0",
        indent && "pl-4"
    )}>
        <span className={clsx("text-sm text-gray-600 dark:text-gray-400", bold && "font-bold text-gray-900 dark:text-white")}>{label}</span>
        <span className={clsx("text-sm", bold ? "font-bold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300")}>{value}{unit}</span>
    </div>
);

const HealthBadge = ({ score }) => {
    const isHealthy = score >= 60;
    return (
        <div className={clsx(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold",
            isHealthy
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        )}>
            {isHealthy ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
            {isHealthy ? 'Healthy Choice' : 'Caution'} - {score}/100
        </div>
    );
};

const MacroCard = ({ label, value, unit, icon: Icon, color, bgColor }) => (
    <div className="bg-white dark:bg-dark-800 p-4 rounded-2xl border border-gray-100 dark:border-dark-700 flex flex-col items-center gap-1">
        <div className={clsx("p-2 rounded-xl mb-1", bgColor)}>
            <Icon size={16} className={color} />
        </div>
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}<span className="text-sm font-normal text-gray-400">{unit}</span></span>
    </div>
);

const FoodDetection = () => {
    const { user } = useAuth();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [mealData, setMealData] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [todaysMeals, setTodaysMeals] = useState([]);
    const [loadingMeals, setLoadingMeals] = useState(true);

    // Load today's meals on mount
    useEffect(() => {
        loadTodaysMeals();
    }, [user]);

    const loadTodaysMeals = async () => {
        if (!user?.id) { setLoadingMeals(false); return; }
        try {
            const meals = await fetchTodaysMeals(user.id);
            setTodaysMeals(meals);
        } catch (err) {
            console.error('Failed to load meals:', err);
        } finally {
            setLoadingMeals(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        setError(null);
        setMealData(null);
        setSaved(false);

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Data = reader.result;
            setPreviewImage(base64Data);

            try {
                const data = await analyzeFood(base64Data, 'maintenance', 25);
                setMealData(data);
            } catch (err) {
                setError(err.message || 'Failed to analyze food.');
            } finally {
                setIsAnalyzing(false);
                e.target.value = '';
            }
        };
        reader.readAsDataURL(file);
    };

    const handleLogMeal = async () => {
        if (!user?.id || !mealData) return;
        setIsSaving(true);
        try {
            await saveMeal(user.id, mealData, previewImage);
            await updateDailySummary(user.id, mealData);
            setSaved(true);
            await loadTodaysMeals();
        } catch (err) {
            console.error('Save failed:', err);
            setError('Failed to save meal. Check your Supabase configuration.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setMealData(null);
        setPreviewImage(null);
        setError(null);
        setSaved(false);
    };

    // Calculate today's totals
    const todayTotals = todaysMeals.reduce((acc, meal) => ({
        calories: acc.calories + (Number(meal.calories) || 0),
        protein: acc.protein + (Number(meal.protein) || 0),
        carbs: acc.carbs + (Number(meal.carbs) || 0),
        fats: acc.fats + (Number(meal.fats) || 0),
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Food Scanner</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Upload a food photo for instant AI nutrition analysis and meal logging.</p>

            {error && (
                <div className="mb-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
                </div>
            )}

            {/* Upload Zone */}
            {!mealData && !isAnalyzing && (
                <div>
                    <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" id="food-upload" />
                    <label
                        htmlFor="food-upload"
                        className="block border-2 border-dashed border-primary-200 dark:border-primary-900/50 bg-primary-50/50 dark:bg-primary-900/10 rounded-[2.5rem] p-12 text-center cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group"
                    >
                        <div className="bg-primary-100 dark:bg-primary-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                            <Upload className="text-primary-500" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Upload Food Photo</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto">
                            Tap to select or take a photo for NutriMind AI analysis.
                        </p>
                        <div className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-primary-500/25 inline-block">
                            Select Photo
                        </div>
                    </label>
                </div>
            )}

            {/* Loading State */}
            {isAnalyzing && (
                <div className="bg-primary-50/50 dark:bg-primary-900/10 rounded-[2.5rem] p-12 text-center border border-primary-100 dark:border-primary-900/30">
                    <div className="bg-primary-100 dark:bg-primary-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Loader2 className="text-primary-500 animate-spin" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Analyzing Your Food...</h3>
                    <p className="text-gray-500 dark:text-gray-400">NutriMind AI is identifying nutrients and generating recommendations.</p>
                    {previewImage && (
                        <div className="mt-6 w-32 h-32 rounded-2xl overflow-hidden mx-auto border-2 border-primary-200 dark:border-primary-800">
                            <img src={previewImage} alt="Uploaded" className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>
            )}

            {/* Analysis Results */}
            {mealData && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Header: Food Name + Health Badge */}
                    <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 border border-gray-100 dark:border-dark-700 shadow-sm">
                        <div className="flex flex-col sm:flex-row gap-6">
                            {previewImage && (
                                <div className="w-full sm:w-40 h-40 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-200 dark:border-dark-600">
                                    <img src={previewImage} alt={mealData.foodName} className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="flex-1">
                                <div className="flex items-start justify-between mb-3">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{mealData.foodName}</h2>
                                    <HealthBadge score={mealData.healthScore} />
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Portion: {mealData.portionSize}</p>

                                {/* Macro Summary Cards */}
                                <div className="grid grid-cols-4 gap-2">
                                    <MacroCard label="Calories" value={mealData.estimatedCalories} unit="kcal" icon={Flame} color="text-orange-500" bgColor="bg-orange-100 dark:bg-orange-900/30" />
                                    <MacroCard label="Protein" value={mealData.protein} unit="g" icon={Beef} color="text-blue-500" bgColor="bg-blue-100 dark:bg-blue-900/30" />
                                    <MacroCard label="Carbs" value={mealData.carbs} unit="g" icon={Wheat} color="text-amber-500" bgColor="bg-amber-100 dark:bg-amber-900/30" />
                                    <MacroCard label="Fat" value={mealData.fat} unit="g" icon={Droplets} color="text-primary-500" bgColor="bg-primary-100 dark:bg-primary-900/30" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Full Nutrition Facts */}
                    {mealData.nutritionFacts && (
                        <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 border border-gray-100 dark:border-dark-700 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pb-3 border-b-4 border-gray-900 dark:border-white">Nutrition Facts</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Serving Size: {mealData.nutritionFacts.servingSize}</p>
                            <div className="border-t-8 border-gray-900 dark:border-white pt-2">
                                <NutritionFactRow label="Calories" value={mealData.estimatedCalories} unit="" bold />
                                <div className="border-t-4 border-gray-900 dark:border-white mt-1 pt-1">
                                    <NutritionFactRow label="Total Fat" value={mealData.nutritionFacts.totalFat} unit="g" bold />
                                    <NutritionFactRow label="Saturated Fat" value={mealData.nutritionFacts.saturatedFat} unit="g" indent />
                                    <NutritionFactRow label="Trans Fat" value={mealData.nutritionFacts.transFat} unit="g" indent />
                                    <NutritionFactRow label="Cholesterol" value={mealData.nutritionFacts.cholesterol} unit="mg" bold />
                                    <NutritionFactRow label="Sodium" value={mealData.nutritionFacts.sodium} unit="mg" bold />
                                    <NutritionFactRow label="Total Carbohydrate" value={mealData.nutritionFacts.totalCarbs} unit="g" bold />
                                    <NutritionFactRow label="Dietary Fiber" value={mealData.nutritionFacts.dietaryFiber} unit="g" indent />
                                    <NutritionFactRow label="Total Sugars" value={mealData.nutritionFacts.totalSugars} unit="g" indent />
                                    <NutritionFactRow label="Added Sugars" value={mealData.nutritionFacts.addedSugars} unit="g" indent />
                                    <NutritionFactRow label="Protein" value={mealData.nutritionFacts.protein} unit="g" bold />
                                </div>
                                <div className="border-t-8 border-gray-900 dark:border-white mt-1 pt-2">
                                    <NutritionFactRow label="Vitamin D" value={mealData.nutritionFacts.vitaminD} unit="mcg" />
                                    <NutritionFactRow label="Calcium" value={mealData.nutritionFacts.calcium} unit="mg" />
                                    <NutritionFactRow label="Iron" value={mealData.nutritionFacts.iron} unit="mg" />
                                    <NutritionFactRow label="Potassium" value={mealData.nutritionFacts.potassium} unit="mg" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AI Recommendation */}
                    <div className="bg-gradient-to-br from-dark-800 to-primary-900/40 rounded-3xl p-6 text-white">
                        <h3 className="text-lg font-bold mb-3">NutriMind Recommendation</h3>
                        <p className="text-gray-300 leading-relaxed mb-4">{mealData.recommendation}</p>
                        {mealData.warnings?.length > 0 && (
                            <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
                                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Warnings</p>
                                {mealData.warnings.map((w, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm text-amber-300">
                                        <AlertTriangle size={14} /> {w}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={handleReset}
                            className="flex-1 py-4 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl transition-colors"
                        >
                            Scan Another
                        </button>
                        {!saved ? (
                            <button
                                onClick={handleLogMeal}
                                disabled={isSaving}
                                className="flex-1 py-4 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2"
                            >
                                {isSaving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : 'Log This Meal'}
                            </button>
                        ) : (
                            <div className="flex-1 py-4 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 font-bold rounded-2xl flex items-center justify-center gap-2">
                                <CheckCircle2 size={18} /> Meal Logged
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Today's Logged Meals */}
            <div className="mt-12">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold tracking-widest text-gray-400 uppercase">Today's Meals</h3>
                    {todaysMeals.length > 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {todayTotals.calories} kcal total
                        </span>
                    )}
                </div>

                {/* Running totals bar */}
                {todaysMeals.length > 0 && (
                    <div className="grid grid-cols-4 gap-3 mb-6">
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-2xl text-center">
                            <p className="text-xs text-orange-600 dark:text-orange-400 font-bold">Calories</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{todayTotals.calories}</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-2xl text-center">
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold">Protein</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{todayTotals.protein}g</p>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-2xl text-center">
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">Carbs</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{todayTotals.carbs}g</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-2xl text-center">
                            <p className="text-xs text-green-600 dark:text-green-400 font-bold">Fat</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{todayTotals.fats}g</p>
                        </div>
                    </div>
                )}

                {loadingMeals ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="text-gray-400 animate-spin" size={24} />
                    </div>
                ) : todaysMeals.length === 0 ? (
                    <div className="bg-white dark:bg-dark-800 rounded-3xl p-8 text-center border border-gray-100 dark:border-dark-700">
                        <ScanSearch size={40} className="text-gray-300 dark:text-dark-500 mx-auto mb-3" />
                        <p className="text-gray-400 dark:text-gray-500 text-sm">No meals logged today. Upload a food photo above to get started.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {todaysMeals.map((meal) => (
                            <div key={meal.id} className="bg-white dark:bg-dark-800 p-4 rounded-2xl border border-gray-100 dark:border-dark-700 flex items-center gap-4">
                                {meal.image_base64 && (
                                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200 dark:border-dark-600">
                                        <img src={meal.image_base64} alt={meal.detected_food_name} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 dark:text-white truncate">{meal.detected_food_name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                        <Clock size={12} /> {new Date(meal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <div className="flex gap-4 text-right text-xs">
                                    <div><p className="font-bold text-gray-900 dark:text-white">{meal.calories}</p><p className="text-gray-400">kcal</p></div>
                                    <div><p className="font-bold text-gray-900 dark:text-white">{meal.protein}g</p><p className="text-gray-400">protein</p></div>
                                    <div><p className="font-bold text-gray-900 dark:text-white">{meal.carbs}g</p><p className="text-gray-400">carbs</p></div>
                                    <div><p className="font-bold text-gray-900 dark:text-white">{meal.fats}g</p><p className="text-gray-400">fat</p></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FoodDetection;
