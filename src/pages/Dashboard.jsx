import React from 'react';
import { Activity, Droplets, Flame, Dumbbell } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const weeklyData = [
    { day: 'Mon', calories: 1800 },
    { day: 'Tue', calories: 2100 },
    { day: 'Wed', calories: 1750 },
    { day: 'Thu', calories: 2300 },
    { day: 'Fri', calories: 1950 },
    { day: 'Sat', calories: 2150 },
    { day: 'Sun', calories: 1600 },
];

const macroData = [
    { name: 'Protein', value: 30 },
    { name: 'Carbs', value: 50 },
    { name: 'Fats', value: 20 },
];

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b'];

const StatCard = ({ title, value, unit, icon: Icon, color }) => (
    <div className="bg-white dark:bg-dark-800 p-6 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm">
        <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</span>
            <div className={`p-2 rounded-xl ${color}`}>
                <Icon size={18} />
            </div>
        </div>
        <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{value}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{unit}</span>
        </div>
    </div>
);

const Dashboard = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Dashboard</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard title="Calories Today" value="1,850" unit="kcal" icon={Flame} color="bg-orange-100 text-orange-500 dark:bg-orange-900/30" />
                <StatCard title="Protein" value="72" unit="g" icon={Dumbbell} color="bg-blue-100 text-blue-500 dark:bg-blue-900/30" />
                <StatCard title="Water" value="1.8" unit="L" icon={Droplets} color="bg-cyan-100 text-cyan-500 dark:bg-cyan-900/30" />
                <StatCard title="Activity Score" value="84" unit="/100" icon={Activity} color="bg-primary-100 text-primary-600 dark:bg-primary-900/30" />
            </div>

            <div className="grid lg:grid-cols-3 gap-8 mb-8">
                {/* Weekly Calories Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-dark-800 p-6 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Weekly Calories</h2>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                <Line type="monotone" dataKey="calories" stroke="#22c55e" strokeWidth={3} dot={{ fill: '#22c55e', strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Macro Pie Chart */}
                <div className="bg-white dark:bg-dark-800 p-6 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Macro Split</h2>
                    <div className="h-40 mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={macroData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
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

            {/* AI Summary Card */}
            <div className="bg-gradient-to-br from-dark-800 to-primary-900/50 rounded-3xl p-8 text-white">
                <h2 className="text-lg font-bold mb-2">AI Health Summary</h2>
                <p className="text-gray-300 leading-relaxed">
                    You are on track today. Your protein intake is slightly below target. Consider adding a protein-rich snack in the afternoon. Your hydration has improved 12% compared to last week. Keep it up.
                </p>
            </div>
        </div>
    );
};

export default Dashboard;
