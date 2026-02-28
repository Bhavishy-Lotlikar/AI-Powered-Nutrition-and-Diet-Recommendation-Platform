import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Upload, ScanSearch, CheckCircle2, AlertTriangle, Loader2,
    ShieldCheck, ShieldAlert, Flame, Beef, Wheat, Droplets, Clock, Trash2,
    Camera, ScanBarcode, X
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { analyzeFood, saveMeal, fetchTodaysMeals } from '../api/mealApi';
import { updateDailySummary } from '../api/summaryApi';

const NutritionFactRow = ({ label, value, unit, bold = false, indent = false }) => (
    <div className={clsx(
        "flex justify-between py-2 border-b border-gray-100 dark:border-dark-700 last:border-b-0",
        indent && "pl-4"
    )}>
        <span className={clsx("text-sm text-gray-600 dark:text-gray-400", bold && "font-bold text-gray-900 dark:text-white")}>{label}</span>
        <span className={clsx("text-sm", bold ? "font-bold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300")}>{value}{unit}</span>
    </div>
);

// Animated version of the row for staggered lists
const AnimatedNutritionRow = ({ label, value, unit, bold = false, indent = false }) => {
    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <motion.div variants={itemVariants} className={clsx(
            "flex justify-between py-2 border-b border-gray-100 dark:border-dark-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-dark-700/50 rounded-lg px-2 -mx-2 transition-colors",
            indent && "pl-6"
        )}>
            <span className={clsx("text-sm text-gray-600 dark:text-gray-400", bold && "font-bold text-gray-900 dark:text-white")}>{label}</span>
            <span className={clsx("text-sm", bold ? "font-bold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300")}>{value}{unit}</span>
        </motion.div>
    );
};

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

const MacroCard = ({ label, value, unit, icon: Icon, color, bgColor, index = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
        whileHover={{ scale: 1.02 }}
        className="bg-white dark:bg-dark-800 p-4 rounded-2xl border border-gray-100 dark:border-dark-700 flex flex-col items-center gap-1 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
    >
        {/* Subtle background glow on hover */}
        <div className={clsx("absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none", bgColor)} />

        <div className={clsx("p-2 rounded-xl mb-1 transition-transform group-hover:scale-110 duration-300 relative z-10", bgColor)}>
            <Icon size={16} className={color} />
        </div>
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider relative z-10">{label}</span>
        <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            className="text-2xl font-bold text-gray-900 dark:text-white relative z-10"
        >
            {value}<span className="text-sm font-normal text-gray-400">{unit}</span>
        </motion.span>
    </motion.div>
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

    // Camera & Barcode
    const [mode, setMode] = useState(null); // 'camera' | 'barcode' | null
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [barcodeResult, setBarcodeResult] = useState(null);
    const scanIntervalRef = useRef(null);
    const [showManualBarcode, setShowManualBarcode] = useState(false);
    const [manualBarcodeInput, setManualBarcodeInput] = useState('');

    // Portion calculator
    const [customPortion, setCustomPortion] = useState('');
    const [originalPortion, setOriginalPortion] = useState(100); // grams from API

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
                // Extract numeric portion for calculator (e.g. "66g" -> 66)
                const portionNum = parseFloat(data.portionSize?.replace(/[^0-9.]/g, '')) || 100;
                setOriginalPortion(portionNum);
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
        setBarcodeResult(null);
        setCustomPortion('');
        setOriginalPortion(100);
        setShowManualBarcode(false);
        setManualBarcodeInput('');
        stopCamera();
    };

    // ===== CAMERA =====
    const startCamera = async (forBarcode = false) => {
        setError(null);
        setMealData(null);
        setPreviewImage(null);
        setSaved(false);
        setBarcodeResult(null);
        setMode(forBarcode ? 'barcode' : 'camera');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            streamRef.current = stream;
            // Wait for videoRef to mount
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
                // Start barcode scanning loop if barcode mode
                if (forBarcode) startBarcodeScanning();
            }, 100);
        } catch (err) {
            console.error('Camera error:', err);
            setError('Camera access denied. Please allow camera permissions and try again.');
            setMode(null);
        }
    };

    const stopCamera = () => {
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setMode(null);
    };

    const capturePhoto = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPreviewImage(dataUrl);
        stopCamera();
        setIsAnalyzing(true);

        try {
            const data = await analyzeFood(dataUrl, 'maintenance', 25);
            setMealData(data);
            const portionNum = parseFloat(data.portionSize?.replace(/[^0-9.]/g, '')) || 100;
            setOriginalPortion(portionNum);
        } catch (err) {
            setError(err.message || 'Failed to analyze food.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // ===== BARCODE SCANNER =====
    const startBarcodeScanning = () => {
        if (scanIntervalRef.current) return;

        // Use BarcodeDetector API if available
        const hasDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;

        scanIntervalRef.current = setInterval(async () => {
            if (!videoRef.current || !canvasRef.current) return;

            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);

            if (hasDetector) {
                try {
                    const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'] });
                    const barcodes = await detector.detect(canvas);
                    if (barcodes.length > 0) {
                        const code = barcodes[0].rawValue;
                        console.log('Barcode detected:', code);
                        clearInterval(scanIntervalRef.current);
                        scanIntervalRef.current = null;
                        handleBarcodeFound(code);
                    }
                } catch (err) {
                    // Silently retry
                }
            } else {
                // Fallback: capture the frame and send to AI to read the barcode
                // Only try once every 3 seconds to avoid overload
            }
        }, 500);
    };

    const handleBarcodeFound = async (barcode) => {
        setBarcodeResult(barcode);
        stopCamera();
        setIsAnalyzing(true);

        try {
            // Try OpenFoodFacts API first
            const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
            const data = await res.json();

            if (data.status === 1 && data.product) {
                const p = data.product;
                const nutrients = p.nutriments || {};
                const foodName = p.product_name || 'Unknown Product';
                const imgUrl = p.image_url || null;

                if (imgUrl) setPreviewImage(imgUrl);

                setMealData({
                    foodName,
                    estimatedCalories: Math.round(nutrients['energy-kcal_100g'] || nutrients['energy-kcal'] || 0),
                    protein: Math.round(nutrients.proteins_100g || nutrients.proteins || 0),
                    carbs: Math.round(nutrients.carbohydrates_100g || nutrients.carbohydrates || 0),
                    fat: Math.round(nutrients.fat_100g || nutrients.fat || 0),
                    portionSize: p.quantity || '100g',
                    healthScore: Math.min(100, Math.round((nutrients.proteins_100g || 10) * 2 + 30)),
                    recommendation: `${foodName} — scanned via barcode (${barcode}). Nutrition per 100g from OpenFoodFacts.`,
                    warnings: [],
                    nutritionFacts: {
                        servingSize: p.serving_size || p.quantity || '100g',
                        totalFat: Math.round(nutrients.fat_100g || 0),
                        saturatedFat: Math.round(nutrients['saturated-fat_100g'] || 0),
                        transFat: 0,
                        cholesterol: 0,
                        sodium: Math.round(nutrients.sodium_100g * 1000 || 0),
                        totalCarbs: Math.round(nutrients.carbohydrates_100g || 0),
                        dietaryFiber: Math.round(nutrients.fiber_100g || 0),
                        totalSugars: Math.round(nutrients.sugars_100g || 0),
                        addedSugars: 0,
                        protein: Math.round(nutrients.proteins_100g || 0),
                        vitaminD: 0,
                        calcium: Math.round(nutrients.calcium_100g || 0),
                        iron: Math.round(nutrients.iron_100g || 0),
                        potassium: Math.round(nutrients.potassium_100g || 0),
                    }
                });
                setOriginalPortion(100); // OpenFoodFacts data is per 100g
            } else {
                setError(`Product not found in database for barcode: ${barcode}. Try uploading a photo instead.`);
            }
        } catch (err) {
            setError(`Failed to look up barcode ${barcode}: ${err.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Manual barcode entry
    const handleManualBarcode = () => {
        const code = manualBarcodeInput.trim();
        if (!code) return;
        setShowManualBarcode(false);
        handleBarcodeFound(code);
    };

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
            if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        };
    }, []);

    // Portion scaling
    const portionRatio = customPortion && originalPortion ? parseFloat(customPortion) / originalPortion : 1;
    const scale = (val) => Math.round((Number(val) || 0) * portionRatio * 10) / 10;

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

            {/* Upload / Camera / Barcode Options */}
            {!mealData && !isAnalyzing && !mode && (
                <div className="space-y-4">
                    {/* Upload */}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="food-upload" />
                    <label
                        htmlFor="food-upload"
                        className="block border-2 border-dashed border-primary-200 dark:border-primary-900/50 bg-primary-50/50 dark:bg-primary-900/10 rounded-3xl p-8 text-center cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group"
                    >
                        <div className="bg-primary-100 dark:bg-primary-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <Upload className="text-primary-500" size={28} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Upload Photo</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Select a food image from your gallery</p>
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Camera */}
                        <button
                            onClick={() => startCamera(false)}
                            className="border-2 border-dashed border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl p-6 text-center cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
                        >
                            <div className="bg-blue-100 dark:bg-blue-900/30 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                <Camera className="text-blue-500" size={24} />
                            </div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Camera</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Take a live photo</p>
                        </button>

                        {/* Barcode */}
                        <button
                            onClick={() => startCamera(true)}
                            className="border-2 border-dashed border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-900/10 rounded-3xl p-6 text-center cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors group"
                        >
                            <div className="bg-amber-100 dark:bg-amber-900/30 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                <ScanBarcode className="text-amber-500" size={24} />
                            </div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Barcode</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Scan product barcode</p>
                        </button>
                    </div>

                    {/* Manual Barcode Entry */}
                    <div className="mt-4 bg-white dark:bg-dark-800 rounded-2xl p-4 border border-gray-100 dark:border-dark-700">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Or enter barcode manually:</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={manualBarcodeInput}
                                onChange={(e) => setManualBarcodeInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleManualBarcode()}
                                placeholder="e.g. 8901063065109"
                                className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <button
                                onClick={handleManualBarcode}
                                disabled={!manualBarcodeInput.trim()}
                                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-colors"
                            >
                                Look Up
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Camera / Barcode Live View */}
            {mode && (
                <div className="relative bg-black rounded-3xl overflow-hidden">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-3xl" style={{ maxHeight: '60vh' }} />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Barcode scanning overlay */}
                    {mode === 'barcode' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-64 h-32 border-2 border-amber-400 rounded-xl relative">
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                                    Point at barcode
                                </div>
                                <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-amber-400 rounded-tl-lg" />
                                <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-amber-400 rounded-tr-lg" />
                                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-amber-400 rounded-bl-lg" />
                                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-amber-400 rounded-br-lg" />
                                {/* Scanning line animation */}
                                <div className="absolute top-2 left-2 right-2 h-0.5 bg-amber-400 animate-pulse" />
                            </div>
                        </div>
                    )}

                    {/* Camera Controls */}
                    <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4 px-4">
                        <button onClick={stopCamera}
                            className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition">
                            <X size={24} />
                        </button>
                        {mode === 'camera' && (
                            <button onClick={capturePhoto}
                                className="bg-white text-gray-900 font-bold px-8 py-3 rounded-full hover:bg-gray-100 transition shadow-lg flex items-center gap-2">
                                <Camera size={20} /> Capture
                            </button>
                        )}
                        {mode === 'barcode' && (
                            <>
                                <div className="bg-white/20 backdrop-blur-sm text-white font-medium px-6 py-3 rounded-full flex items-center gap-2">
                                    <Loader2 size={18} className="animate-spin" /> Scanning...
                                </div>
                                <button onClick={() => { stopCamera(); setShowManualBarcode(true); }}
                                    className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-4 py-2 rounded-full hover:bg-white/30 transition">
                                    Enter manually
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Loading State */}
            <AnimatePresence>
                {isAnalyzing && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="bg-white dark:bg-dark-800 rounded-[2rem] p-10 text-center border border-gray-100 dark:border-dark-700 shadow-xl max-w-lg mx-auto relative overflow-hidden"
                    >
                        {/* Shimmer effect */}
                        <motion.div
                            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary-500/5 to-transparent z-0"
                            animate={{ translateX: ['-100%', '200%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />

                        <div className="relative z-10">
                            {previewImage ? (
                                <motion.div
                                    initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                                    className="w-24 h-24 rounded-2xl overflow-hidden mx-auto mb-6 border-4 border-primary-100 dark:border-primary-900 shadow-inner relative"
                                >
                                    <img src={previewImage} alt="Scanning" className="w-full h-full object-cover opacity-70" />
                                    {/* Scanning line over image */}
                                    <motion.div
                                        className="absolute left-0 right-0 h-1 bg-primary-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"
                                        animate={{ top: ['0%', '100%', '0%'] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    />
                                </motion.div>
                            ) : (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    className="bg-primary-50 dark:bg-primary-900/20 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary-100 dark:border-primary-800"
                                >
                                    <ScanSearch className="text-primary-500" size={32} />
                                </motion.div>
                            )}

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Analyzing Nutrition...</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">AI is processing pixels to extract macronutrients and generate health insights.</p>

                            {/* Animated Progress Bar */}
                            <div className="h-2 w-full bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-primary-500 rounded-full"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "95%" }}
                                    transition={{ duration: 15, ease: "easeOut" }} // Fake progress that stalls at 95% until done
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Analysis Results - Advanced 2-Column Sticky Layout */}
            {mealData && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                        {/* LEFT COLUMN: Sticky Overview & Actions */}
                        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                className="bg-white dark:bg-dark-800 rounded-3xl p-6 border border-gray-100 dark:border-dark-700 shadow-xl shadow-gray-200/50 dark:shadow-none"
                            >
                                {previewImage && (
                                    <div className="w-full aspect-square rounded-2xl overflow-hidden mb-6 border-2 border-primary-50 dark:border-dark-600 shadow-inner group">
                                        <motion.img
                                            whileHover={{ scale: 1.05 }}
                                            transition={{ duration: 0.4 }}
                                            src={previewImage}
                                            alt={mealData.foodName}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}

                                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">{mealData.foodName}</h2>
                                <div className="mb-6">
                                    <HealthBadge score={mealData.healthScore} />
                                </div>

                                <div className="bg-gray-50 dark:bg-dark-700/50 rounded-2xl p-4 mb-6">
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Adjust Portion</p>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={customPortion}
                                            onChange={(e) => setCustomPortion(e.target.value)}
                                            placeholder={String(originalPortion)}
                                            className="w-full px-4 py-2 bg-white dark:bg-dark-600 border border-gray-200 dark:border-dark-500 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                                        />
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">grams</span>
                                    </div>
                                    {customPortion && portionRatio !== 1 && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="mt-2 text-xs font-bold text-primary-500 bg-primary-50 dark:bg-primary-500/10 py-1.5 px-3 rounded-lg inline-block"
                                        >
                                            Scaling: {Math.round(portionRatio * 100)}%
                                        </motion.div>
                                    )}
                                </div>

                                {/* Action Buttons Moved to Sticky Column */}
                                <div className="flex flex-col gap-3">
                                    {!saved ? (
                                        <motion.button
                                            whileHover={{ scale: 1.02, y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleLogMeal}
                                            disabled={isSaving}
                                            className="w-full py-4 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2"
                                        >
                                            {isSaving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : 'Log This Meal'}
                                        </motion.button>
                                    ) : (
                                        <motion.div
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="w-full py-4 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 font-bold rounded-2xl flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 size={18} /> Meal Logged
                                        </motion.div>
                                    )}
                                    <button
                                        onClick={handleReset}
                                        className="w-full py-3 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl transition-colors"
                                    >
                                        Scan Another
                                    </button>
                                </div>
                            </motion.div>
                        </div>

                        {/* RIGHT COLUMN: Scrolling Details */}
                        <div className="lg:col-span-8 space-y-6">

                            {/* Macro Summary Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <MacroCard label="Calories" value={scale(mealData.estimatedCalories)} unit="kcal" icon={Flame} color="text-orange-500" bgColor="bg-orange-100 dark:bg-orange-900/30" index={0} />
                                <MacroCard label="Protein" value={scale(mealData.protein)} unit="g" icon={Beef} color="text-blue-500" bgColor="bg-blue-100 dark:bg-blue-900/30" index={1} />
                                <MacroCard label="Carbs" value={scale(mealData.carbs)} unit="g" icon={Wheat} color="text-amber-500" bgColor="bg-amber-100 dark:bg-amber-900/30" index={2} />
                                <MacroCard label="Fat" value={scale(mealData.fat)} unit="g" icon={Droplets} color="text-primary-500" bgColor="bg-primary-100 dark:bg-primary-900/30" index={3} />
                            </div>

                            {/* Full Nutrition Facts with Staggered Rows */}
                            {mealData.nutritionFacts && (
                                <motion.div
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, margin: "-100px" }}
                                    variants={{
                                        visible: { transition: { staggerChildren: 0.08 } },
                                        hidden: {}
                                    }}
                                    className="bg-white dark:bg-dark-800 rounded-3xl p-8 border border-gray-100 dark:border-dark-700 shadow-sm"
                                >
                                    <motion.h3 variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                        Nutrition Facts Panel
                                        <div className="h-px flex-1 bg-gradient-to-r from-gray-200 dark:from-dark-600 to-transparent ml-4"></div>
                                    </motion.h3>

                                    <div className="border-t-4 border-gray-900 dark:border-white pt-2">
                                        <AnimatedNutritionRow label="Calories" value={scale(mealData.estimatedCalories)} unit="" bold />
                                        <div className="border-t-2 border-gray-900 dark:border-white mt-1 pt-1">
                                            <AnimatedNutritionRow label="Total Fat" value={scale(mealData.nutritionFacts.totalFat)} unit="g" bold />
                                            <AnimatedNutritionRow label="Saturated Fat" value={scale(mealData.nutritionFacts.saturatedFat)} unit="g" indent />
                                            <AnimatedNutritionRow label="Trans Fat" value={scale(mealData.nutritionFacts.transFat)} unit="g" indent />
                                            <AnimatedNutritionRow label="Cholesterol" value={scale(mealData.nutritionFacts.cholesterol)} unit="mg" bold />
                                            <AnimatedNutritionRow label="Sodium" value={scale(mealData.nutritionFacts.sodium)} unit="mg" bold />
                                            <AnimatedNutritionRow label="Total Carbohydrate" value={scale(mealData.nutritionFacts.totalCarbs)} unit="g" bold />
                                            <AnimatedNutritionRow label="Dietary Fiber" value={scale(mealData.nutritionFacts.dietaryFiber)} unit="g" indent />
                                            <AnimatedNutritionRow label="Total Sugars" value={scale(mealData.nutritionFacts.totalSugars)} unit="g" indent />
                                            <AnimatedNutritionRow label="Added Sugars" value={scale(mealData.nutritionFacts.addedSugars)} unit="g" indent />
                                            <AnimatedNutritionRow label="Protein" value={scale(mealData.nutritionFacts.protein)} unit="g" bold />
                                        </div>
                                        <div className="border-t-4 border-gray-900 dark:border-white mt-1 pt-2">
                                            <AnimatedNutritionRow label="Vitamin D" value={scale(mealData.nutritionFacts.vitaminD)} unit="mcg" />
                                            <AnimatedNutritionRow label="Calcium" value={scale(mealData.nutritionFacts.calcium)} unit="mg" />
                                            <AnimatedNutritionRow label="Iron" value={scale(mealData.nutritionFacts.iron)} unit="mg" />
                                            <AnimatedNutritionRow label="Potassium" value={scale(mealData.nutritionFacts.potassium)} unit="mg" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* AI Recommendation - Pulsing Edge */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.7, type: "spring" }}
                                className="relative rounded-3xl bg-gradient-to-br from-dark-800 to-primary-900/40 p-1 md:p-8 overflow-hidden group"
                            >
                                {/* Animated scanning beam in background */}
                                <motion.div
                                    animate={{
                                        rotate: [0, 360],
                                    }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(34,197,94,0.1)_180deg,transparent_360deg)] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity"
                                />

                                <div className="relative z-10 text-white p-6 md:p-0">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-primary-500/20 p-2 rounded-xl backdrop-blur-md">
                                            <ShieldCheck className="text-primary-400" size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold">NutriMind Insight</h3>
                                    </div>

                                    <p className="text-gray-300 leading-relaxed text-lg mb-4">{mealData.recommendation}</p>

                                    {mealData.warnings?.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            whileInView={{ opacity: 1, height: 'auto' }}
                                            transition={{ delay: 0.3 }}
                                            className="space-y-3 mt-6 pt-6 border-t border-white/10"
                                        >
                                            <p className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                                <AlertTriangle size={14} /> Critical Warnings
                                            </p>
                                            {mealData.warnings.map((w, i) => (
                                                <div key={i} className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm text-amber-200">
                                                    {w}
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            )}

            {/* Today's Logged Meals */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6 }}
                className="mt-12"
            >
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
            </motion.div>
        </div>
    );
};

export default FoodDetection;
