import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Star, Zap, Shield, ArrowRight } from 'lucide-react';
import GlareHover from '../components/common/GlareHover';
import StarBorder from '../components/common/StarBorder';
import { useTransitionNavigate } from '../components/layout/Layout';

const Pricing = () => {
    const navigateWithTransition = useTransitionNavigate();
    const [showNotification, setShowNotification] = useState(false);

    const handleFreeTrial = () => {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
    };

    return (
        <div className="min-h-screen bg-white dark:bg-dark-900 transition-colors pt-20">

            {/* Notification Toast */}
            <AnimatePresence>
                {showNotification && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-primary-500 text-white px-6 py-3 rounded-full shadow-lg font-bold tracking-wide flex items-center gap-2"
                    >
                        <Star size={18} className="fill-white" /> Enjoy your free trial!
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pb-32">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <span className="inline-block py-1 px-3 mb-4 text-xs font-semibold tracking-wider text-primary-500 uppercase rounded-full border border-primary-500/30 bg-primary-500/10">
                        Unlock Your Potential
                    </span>
                    <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
                        Simple, transparent pricing
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Choose the plan that perfectly fits your health journey. No hidden fees.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">

                    {/* Free Tier */}
                    <div className="bg-white dark:bg-dark-800 rounded-[2.5rem] p-8 border border-gray-100 dark:border-dark-700 shadow-xl flex flex-col h-full hover:-translate-y-2 transition-transform duration-300">
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Free Limited</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Perfect to get a taste of AI nutrition.</p>
                        </div>
                        <div className="mb-8">
                            <span className="text-5xl font-black text-gray-900 dark:text-white">$0</span>
                            <span className="text-gray-500 dark:text-gray-400">/forever</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300"><Check className="text-primary-500 shrink-0 mt-0.5" size={20} /> <span className="text-sm">5 Food Scans per day</span></li>
                            <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300"><Check className="text-primary-500 shrink-0 mt-0.5" size={20} /> <span className="text-sm">Basic Macronutrient Tracking</span></li>
                            <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300"><Check className="text-primary-500 shrink-0 mt-0.5" size={20} /> <span className="text-sm">Access to 100+ basic foods</span></li>
                            <li className="flex items-start gap-3 text-gray-400 dark:text-gray-600"><X className="text-gray-300 dark:text-gray-700 shrink-0 mt-0.5" size={20} /> <span className="text-sm">Advanced AI Recommendations</span></li>
                            <li className="flex items-start gap-3 text-gray-400 dark:text-gray-600"><X className="text-gray-300 dark:text-gray-700 shrink-0 mt-0.5" size={20} /> <span className="text-sm">Predictive Health Forecasting</span></li>
                        </ul>
                    </div>

                    {/* Pro Tier (Middle) */}
                    <div className="relative">
                        <div className="absolute -inset-[2px] bg-gradient-to-b from-primary-400 to-primary-600 rounded-[2.6rem] z-0 blur-[2px] opacity-70"></div>
                        <div className="bg-white dark:bg-dark-800 rounded-[2.5rem] p-8 relative z-10 flex flex-col h-full transform md:-translate-y-4 shadow-2xl">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <span className="bg-gradient-to-r from-primary-500 to-primary-400 text-white text-xs font-black uppercase tracking-wider py-1.5 px-4 rounded-full shadow-lg">Most Popular</span>
                            </div>
                            <div className="mb-6 mt-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Star className="text-primary-500 fill-primary-500" size={24} />
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Pro Tier</h3>
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Everything you need for serious result.</p>
                            </div>
                            <div className="mb-8">
                                <span className="text-5xl font-black text-gray-900 dark:text-white">$15</span>
                                <span className="text-gray-500 dark:text-gray-400">/month</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300"><Check className="text-primary-500 shrink-0 mt-0.5" size={20} /> <span className="text-sm font-semibold">Unlimited Food Scans</span></li>
                                <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300"><Check className="text-primary-500 shrink-0 mt-0.5" size={20} /> <span className="text-sm font-semibold">Advanced AI Recommendations</span></li>
                                <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300"><Check className="text-primary-500 shrink-0 mt-0.5" size={20} /> <span className="text-sm font-semibold">6-Month Predictive Health Forecasting</span></li>
                                <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300"><Check className="text-primary-500 shrink-0 mt-0.5" size={20} /> <span className="text-sm font-semibold">Personalized AI Exercise Plans</span></li>
                                <li className="flex items-start gap-3 text-gray-400 dark:text-gray-600"><X className="text-gray-300 dark:text-gray-700 shrink-0 mt-0.5" size={20} /> <span className="text-sm">1-on-1 Dietitian Consultation</span></li>
                            </ul>
                            <StarBorder
                                as="button"
                                color="#22c55e"
                                speed="3s"
                                className="w-full h-[56px] flex items-center justify-center cursor-pointer"
                                onClick={handleFreeTrial}
                            >
                                <span className="flex items-center justify-center gap-2 font-bold tracking-wide text-sm w-full pointer-events-none">
                                    Start 14-Day Free Trial <ArrowRight size={18} />
                                </span>
                            </StarBorder>
                        </div>
                    </div>

                    {/* Elite / Premium Tier */}
                    <div className="bg-white dark:bg-dark-800 rounded-[2.5rem] p-8 border border-gray-100 dark:border-dark-700 shadow-xl flex flex-col h-full hover:-translate-y-2 transition-transform duration-300">
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Mid Tier</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">For the casual health enthusiast.</p>
                        </div>
                        <div className="mb-8">
                            <span className="text-5xl font-black text-gray-900 dark:text-white">$8</span>
                            <span className="text-gray-500 dark:text-gray-400">/month</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300"><Check className="text-primary-500 shrink-0 mt-0.5" size={20} /> <span className="text-sm">50 Food Scans per day</span></li>
                            <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300"><Check className="text-primary-500 shrink-0 mt-0.5" size={20} /> <span className="text-sm">Barcode Scanner Access</span></li>
                            <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300"><Check className="text-primary-500 shrink-0 mt-0.5" size={20} /> <span className="text-sm">Weekly Goal Tracking</span></li>
                            <li className="flex items-start gap-3 text-gray-400 dark:text-gray-600"><X className="text-gray-300 dark:text-gray-700 shrink-0 mt-0.5" size={20} /> <span className="text-sm">Advanced AI Recommendations</span></li>
                            <li className="flex items-start gap-3 text-gray-400 dark:text-gray-600"><X className="text-gray-300 dark:text-gray-700 shrink-0 mt-0.5" size={20} /> <span className="text-sm">Predictive Health Forecasting</span></li>
                        </ul>
                        <button onClick={handleFreeTrial} className="w-full py-4 bg-gray-100 hover:bg-gray-200 dark:bg-dark-700 dark:hover:bg-dark-600 text-gray-900 dark:text-white font-bold rounded-2xl transition-colors">
                            Start Free Trial
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Pricing;
