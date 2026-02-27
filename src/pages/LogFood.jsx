import React, { useState, useRef } from 'react';
import {
    Type,
    Mic,
    Camera,
    Scan,
    Upload,
    CheckCircle2,
    AlertTriangle,
    Loader2
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { analyzeFood, saveMeal } from '../api/mealApi';
import { updateDailySummary } from '../api/summaryApi';

const LogFood = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('photo');
    const [isAnalyzed, setIsAnalyzed] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [mealData, setMealData] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [error, setError] = useState(null);

    const tabs = [
        { id: 'text', label: 'Text', icon: Type },
        { id: 'voice', label: 'Voice', icon: Mic },
        { id: 'photo', label: 'Photo', icon: Camera },
        { id: 'scan', label: 'Scan', icon: Scan },
    ];

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsAnalyzing(true);
            setError(null);

            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64Data = reader.result;
                setPreviewImage(base64Data);

                try {
                    // Call the API
                    const data = await analyzeFood(base64Data, 'maintenance', 25);
                    setMealData(data);
                    setIsAnalyzed(true);

                    // Save to DB silently if authed
                    if (user?.id) {
                        try {
                            await saveMeal(user.id, data);
                            await updateDailySummary(user.id, data);
                        } catch (dbErr) {
                            console.error('Failed to save to database:', dbErr);
                            // We don't block the UI if saving fails, but report in console
                        }
                    }
                } catch (err) {
                    setError(err.message || 'Failed to analyze food.');
                } finally {
                    setIsAnalyzing(false);
                    // Reset file input so same file can be selected again
                    e.target.value = '';
                }
            };
            reader.readAsDataURL(file);
        } catch (err) {
            setError('Failed to process image.');
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Log Food</h1>
                <span className="text-primary-500 text-sm font-medium cursor-pointer">Help</span>
            </div>

            {/* Method Tabs */}
            <div className="bg-white dark:bg-dark-800 p-2 rounded-3xl mb-8 flex items-center justify-between shadow-sm border border-gray-100 dark:border-dark-700">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setIsAnalyzed(false); setError(null); }}
                            className={clsx(
                                "flex flex-col items-center justify-center p-4 rounded-2xl flex-1 transition-all relative",
                                isActive
                                    ? "bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                                    : "text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-700 dark:text-gray-400"
                            )}
                        >
                            {isActive && (
                                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
                            )}
                            <Icon size={24} className="mb-2" />
                            <span className="text-xs font-bold uppercase tracking-wider">{tab.label}</span>
                        </button>
                    )
                })}
            </div>

            {error && (
                <div className="mb-6 bg-red-50 sm:bg-red-500/10 border border-red-200 sm:border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
                </div>
            )}

            {/* Main Upload Area */}
            {!isAnalyzed ? (
                <div>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="food-upload"
                        disabled={isAnalyzing}
                    />
                    <label
                        htmlFor="food-upload"
                        className={clsx(
                            "block border-2 border-dashed border-primary-200 dark:border-primary-900/50 bg-primary-50/50 dark:bg-primary-900/10 rounded-[2.5rem] p-12 text-center transition-colors group",
                            isAnalyzing ? "cursor-wait opacity-70" : "cursor-pointer hover:bg-primary-50"
                        )}
                    >
                        <div className="bg-primary-100 dark:bg-primary-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                            {isAnalyzing ? (
                                <Loader2 className="text-primary-500 animate-spin" size={32} />
                            ) : (
                                <Upload className="text-primary-500" size={32} />
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {isAnalyzing ? 'Analyzing Image...' : 'Upload Food Photo'}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto">
                            {isAnalyzing ? 'Please wait while NutriMind inspects your food.' : 'Tap to select or drag an image here for NutriMind analysis.'}
                        </p>
                        <div className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-primary-500/25 inline-block">
                            {isAnalyzing ? 'Processing...' : 'Select Photo'}
                        </div>
                    </label>
                </div>
            ) : (
                /* AI Analysis Results Area */
                <div className="bg-primary-50/50 dark:bg-primary-900/10 rounded-[2.5rem] p-6 border border-primary-100 dark:border-primary-900/30 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="text-primary-500" size={24} />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Analysis Ready</h3>
                        </div>
                        <span className="bg-primary-200/50 text-primary-800 dark:bg-primary-500/20 dark:text-primary-400 px-3 py-1 rounded-full text-xs font-bold">
                            Score: {mealData?.healthScore || 'N/A'}
                        </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 mb-6">
                        <div className="w-full sm:w-32 h-32 bg-gray-200 dark:bg-dark-700 rounded-3xl flex-shrink-0 animate-pulse flex items-center justify-center overflow-hidden relative">
                            {previewImage ? (
                                <img src={previewImage} alt="Uploaded Food" className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                                <img src="/api/placeholder/400/320" alt="Placeholder" className="absolute inset-0 w-full h-full object-cover" />
                            )}
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                {mealData?.foodName || 'Unknown Food'}
                            </h4>
                            <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                                Portion: {mealData?.portionSize || 'N/A'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-dark-800 p-5 rounded-3xl mb-6 shadow-sm">
                        <p className="text-gray-700 dark:text-gray-300">
                            <span className="font-bold text-primary-600 dark:text-primary-400">NutriMind: </span>
                            {mealData?.recommendation || 'No specific recommendation provided.'}
                            Approximately <span className="font-bold text-gray-900 dark:text-white">{mealData?.estimatedCalories || 0} calories</span>.
                        </p>
                        {mealData?.warnings?.length > 0 && (
                            <ul className="mt-3 space-y-1">
                                {mealData.warnings.map((w, i) => (
                                    <li key={i} className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                        <AlertTriangle size={12} /> {w}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="bg-white dark:bg-dark-800 p-4 rounded-2xl flex flex-col items-center">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Protein</span>
                            <span className="text-xl font-bold text-gray-900 dark:text-white mb-3">{mealData?.protein || 0}g</span>
                            <div className="w-full h-1.5 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (mealData?.protein || 0) * 2)}%` }}></div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-dark-800 p-4 rounded-2xl flex flex-col items-center">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Carbs</span>
                            <span className="text-xl font-bold text-gray-900 dark:text-white mb-3">{mealData?.carbs || 0}g</span>
                            <div className="w-full h-1.5 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(100, (mealData?.carbs || 0) * 2)}%` }}></div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-dark-800 p-4 rounded-2xl flex flex-col items-center">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Fats</span>
                            <span className="text-xl font-bold text-gray-900 dark:text-white mb-3">{mealData?.fat || 0}g</span>
                            <div className="w-full h-1.5 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                                <div className="h-full bg-primary-500 rounded-full" style={{ width: `${Math.min(100, (mealData?.fat || 0) * 2)}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => { setIsAnalyzed(false); setPreviewImage(null); }}
                            className="flex-1 py-4 bg-white dark:bg-dark-800 border border-primary-200 dark:border-primary-900/50 hover:bg-primary-50 dark:hover:bg-dark-700 text-primary-600 dark:text-primary-400 font-bold rounded-2xl transition-colors"
                        >
                            Log Another Meal
                        </button>
                    </div>
                </div>
            )}

            {/* Recent Logs Hint */}
            <div className="mt-12">
                <h3 className="text-sm font-bold tracking-widest text-gray-400 uppercase mb-6">Recent Logs</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {/* Skeleton/Placeholder Logs */}
                    <div className="bg-white dark:bg-dark-800 p-3 rounded-3xl border border-gray-100 dark:border-dark-700">
                        <div className="w-full aspect-square bg-gray-100 dark:bg-dark-700 rounded-2xl mb-3 relative overflow-hidden">
                            <img src="/api/placeholder/200/200" className="absolute inset-0 w-full h-full object-cover opacity-80" alt="burger" />
                        </div>
                        <p className="font-bold text-sm text-gray-900 dark:text-white">Cheeseburger</p>
                        <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 font-medium">Lunch • 540 kcal</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogFood;
