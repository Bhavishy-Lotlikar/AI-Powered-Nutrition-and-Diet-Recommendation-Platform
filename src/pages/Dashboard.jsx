import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Droplets, Flame, Dumbbell, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { fetchMeals, fetchTodaysMeals } from '../api/mealApi';
import { fetchNutritionGoals } from '../api/summaryApi';

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
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [todaysMeals, setTodaysMeals] = useState([]);
    const [allMeals, setAllMeals] = useState([]);
    const [goals, setGoals] = useState(null);

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        if (!user?.id) { setLoading(false); return; }
        try {
            const [today, all, savedGoals] = await Promise.all([
                fetchTodaysMeals(user.id),
                fetchMeals(user.id),
                fetchNutritionGoals(user.id)
            ]);
            setTodaysMeals(today || []);
            setAllMeals(all || []);
            setGoals(savedGoals);
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Today's totals
    const todayTotals = useMemo(() => todaysMeals.reduce((acc, m) => ({
        calories: acc.calories + (Number(m.calories) || 0),
        protein: acc.protein + (Number(m.protein) || 0),
        carbs: acc.carbs + (Number(m.carbs) || 0),
        fats: acc.fats + (Number(m.fats) || 0),
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 }), [todaysMeals]);

    // Weekly calories chart from real meals (last 7 days)
    const weeklyData = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const last7 = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayMeals = allMeals.filter(m => m.created_at?.startsWith(dateStr));
            const totalCal = dayMeals.reduce((s, m) => s + (Number(m.calories) || 0), 0);
            last7.push({ day: days[d.getDay()], calories: totalCal });
        }
        return last7;
    }, [allMeals]);

    // Macro pie chart from today's data
    const macroData = useMemo(() => {
        const total = todayTotals.protein + todayTotals.carbs + todayTotals.fats;
        if (total === 0) return [
            { name: 'Protein', value: 33 },
            { name: 'Carbs', value: 34 },
            { name: 'Fats', value: 33 },
        ];
        return [
            { name: 'Protein', value: Math.round((todayTotals.protein / total) * 100) },
            { name: 'Carbs', value: Math.round((todayTotals.carbs / total) * 100) },
            { name: 'Fats', value: Math.round((todayTotals.fats / total) * 100) },
        ];
    }, [todayTotals]);

    // Activity score based on how close to goals
    const activityScore = useMemo(() => {
        if (!goals || todayTotals.calories === 0) return 0;
        const calRatio = Math.min(1, todayTotals.calories / (goals.calories || 2200));
        const proRatio = Math.min(1, todayTotals.protein / (goals.protein || 90));
        return Math.round((calRatio * 50 + proRatio * 50));
    }, [todayTotals, goals]);

    // AI summary message
    const aiSummary = useMemo(() => {
        if (todaysMeals.length === 0) return "No meals logged today yet. Head to the Food Scanner to start tracking your nutrition.";
        const prot = todayTotals.protein;
        const cal = todayTotals.calories;
        const goalCal = goals?.calories || 2200;
        const goalProt = goals?.protein || 90;

        let msg = "";
        if (cal < goalCal * 0.7) msg += `You've consumed ${cal} kcal so far, which is under your ${goalCal} kcal target. `;
        else if (cal > goalCal) msg += `You've exceeded your calorie goal (${cal}/${goalCal} kcal). Consider lighter meals for the rest of the day. `;
        else msg += `You're on track with ${cal} kcal today. `;

        if (prot < goalProt * 0.6) msg += `Your protein intake (${prot}g) is below target. Add a protein-rich snack like eggs or yogurt.`;
        else if (prot >= goalProt) msg += `Great protein intake at ${prot}g! You've met your daily target.`;
        else msg += `Protein is at ${prot}g/${goalProt}g — almost there!`;

        return msg;
    }, [todaysMeals, todayTotals, goals]);

    if (loading) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <Loader2 className="text-primary-500 animate-spin" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Dashboard</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard title="Calories Today" value={todayTotals.calories.toLocaleString()} unit="kcal" icon={Flame} color="bg-orange-100 text-orange-500 dark:bg-orange-900/30" />
                <StatCard title="Protein" value={todayTotals.protein} unit="g" icon={Dumbbell} color="bg-blue-100 text-blue-500 dark:bg-blue-900/30" />
                <StatCard title="Meals Logged" value={todaysMeals.length} unit="today" icon={Droplets} color="bg-cyan-100 text-cyan-500 dark:bg-cyan-900/30" />
                <StatCard title="Activity Score" value={activityScore} unit="/100" icon={Activity} color="bg-primary-100 text-primary-600 dark:bg-primary-900/30" />
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
                    {aiSummary}
                </p>
            </div>
        </div>
    );
};

export default Dashboard;
