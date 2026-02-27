import React from 'react';
import { Leaf, Ban, Bell, MapPin } from 'lucide-react';

const meals = [
    { name: 'Grilled Salmon Bowl', desc: 'High in Omega-3, Vitamin D, and lean protein', tags: ['High Protein', 'Omega-3'] },
    { name: 'Spinach & Lentil Soup', desc: 'Iron-rich, fiber-packed, and budget-friendly', tags: ['Iron Rich', 'Budget Pick'] },
    { name: 'Avocado Toast + Egg', desc: 'Balanced macros with healthy fats for sustained energy', tags: ['Balanced', 'Quick Prep'] },
];

const avoidFoods = [
    { name: 'White Bread', reason: 'Spikes blood sugar — switch to whole grain' },
    { name: 'Sugary Drinks', reason: 'High fructose linked to energy crashes' },
];

const Recommendations = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Recommendations</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Personalized suggestions based on your nutrition profile.</p>

            {/* Today's Meals */}
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Today's Recommended Meals</h2>
            <div className="space-y-4 mb-10">
                {meals.map(meal => (
                    <div key={meal.name} className="bg-white dark:bg-dark-800 p-5 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm flex items-start gap-4">
                        <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-2xl flex-shrink-0">
                            <Leaf className="text-primary-500" size={22} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">{meal.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{meal.desc}</p>
                            <div className="flex gap-2 flex-wrap">
                                {meal.tags.map(tag => (
                                    <span key={tag} className="text-xs font-semibold px-2.5 py-1 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 rounded-full">{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Avoid Foods */}
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Foods to Avoid Today</h2>
            <div className="space-y-4 mb-10">
                {avoidFoods.map(food => (
                    <div key={food.name} className="bg-white dark:bg-dark-800 p-5 rounded-3xl border border-red-100 dark:border-red-900/30 shadow-sm flex items-start gap-4">
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

            {/* Budget & Context-Aware */}
            <div className="bg-white dark:bg-dark-800 p-6 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-xl">
                        <MapPin className="text-blue-500" size={20} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Context-Aware Suggestions</h2>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Based on your region and budget preferences:</p>
                <div className="grid sm:grid-cols-2 gap-4">
                    {['Chana Dal (Chickpea Curry)', 'Mixed Veg Omelette', 'Brown Rice + Rajma', 'Banana + Peanut Butter'].map(name => (
                        <div key={name} className="bg-gray-50 dark:bg-dark-700 px-4 py-3 rounded-2xl flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{name}</span>
                            <span className="text-xs text-primary-600 dark:text-primary-400 font-bold">Budget Pick</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Recommendations;
