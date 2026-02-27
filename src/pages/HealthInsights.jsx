import React from 'react';
import {
    Heart,
    TrendingUp,
    AlertCircle,
    Sun,
    Droplet,
    MoreHorizontal
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const data = [
    { name: 'Jan', value: 40 },
    { name: 'Mar', value: 65 },
    { name: 'May', value: 55 },
    { name: 'Jul', value: 80 },
    { name: 'Sep', value: 95 },
    { name: 'Nov', value: 110 },
];

const HealthInsights = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Health Insights</h1>
            </div>

            {/* Top Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 mb-8">
                {/* BMI Card */}
                <div className="bg-white dark:bg-dark-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-dark-700">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <div className="w-2 h-2 rounded bg-primary-500"></div>
                        </div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current BMI</span>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white mb-2">22.4</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-400 w-max">
                            Normal Weight
                        </span>
                    </div>
                </div>

                {/* Status Card */}
                <div className="bg-white dark:bg-dark-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-dark-700">
                    <div className="flex items-center gap-2 mb-4">
                        <Heart size={20} className="text-primary-500" fill="currentColor" />
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Overall Status</span>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Good</span>
                        <span className="inline-flex items-center text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded-full w-max">
                            +2% vs Last Month
                        </span>
                    </div>
                </div>
            </div>

            {/* Projection Chart */}
            <div className="bg-white dark:bg-dark-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-dark-700 mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Long-term Health Projection</h2>
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <MoreHorizontal size={20} />
                    </button>
                </div>

                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-dark-600" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(34, 197, 94, 0.1)' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="value" fill="#34d399" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Nutrient Risks */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nutrient Risks</h2>
                    <button className="text-primary-500 text-sm font-medium hover:text-primary-600">View All</button>
                </div>

                <div className="space-y-4">
                    {/* Risk Item 1 */}
                    <div className="bg-white dark:bg-dark-800 rounded-3xl border border-red-100 dark:border-red-900/30 overflow-hidden">
                        <div className="p-5 flex items-start gap-4">
                            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-2xl flex-shrink-0">
                                <Droplet className="text-red-500" size={24} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-bold text-gray-900 dark:text-white">Iron Deficiency</h3>
                                    <span className="text-xs font-semibold px-2 py-1 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full">High Risk</span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Fatigue levels suggest low iron intake.</p>
                            </div>
                        </div>
                        <div className="bg-red-50/50 dark:bg-red-900/10 px-5 py-3 flex items-center gap-2 border-t border-red-100 dark:border-red-900/30">
                            <AlertCircle size={16} className="text-red-500" />
                            <span className="text-xs font-medium text-red-700 dark:text-red-400">Suggestion: Increase leafy greens & red meat</span>
                        </div>
                    </div>

                    {/* Risk Item 2 */}
                    <div className="bg-white dark:bg-dark-800 rounded-3xl border border-amber-100 dark:border-amber-900/30 overflow-hidden">
                        <div className="p-5 flex items-start gap-4">
                            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-2xl flex-shrink-0">
                                <Sun className="text-amber-500" size={24} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-bold text-gray-900 dark:text-white">Vitamin D</h3>
                                    <span className="text-xs font-semibold px-2 py-1 bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">Moderate Risk</span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Lower exposure detected this month.</p>
                            </div>
                        </div>
                        <div className="bg-amber-50/50 dark:bg-amber-900/10 px-5 py-3 flex items-center gap-2 border-t border-amber-100 dark:border-amber-900/30">
                            <AlertCircle size={16} className="text-amber-600" />
                            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Suggestion: 15 mins morning sun exposure</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default HealthInsights;
