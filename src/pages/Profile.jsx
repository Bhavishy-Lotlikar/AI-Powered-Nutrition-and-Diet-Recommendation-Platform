import React, { useState, useEffect } from 'react';
import { User, Save, Loader2, CheckCircle2, Bell, MessageSquare, Mail, Activity, Ruler, Weight, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchProfile, saveProfile } from '../api/profileApi';
import { fetchTodaysMeals } from '../api/mealApi';

const AI_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const FITNESS_GOALS = [
    { value: 'fat_loss', label: 'Fat Loss', desc: 'Reduce body fat while maintaining muscle' },
    { value: 'muscle_gain', label: 'Muscle Gain', desc: 'Build lean muscle mass' },
    { value: 'maintenance', label: 'Maintenance', desc: 'Maintain current weight and fitness' },
    { value: 'endurance', label: 'Endurance', desc: 'Improve cardiovascular endurance' },
];

const ACTIVITY_LEVELS = [
    { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
    { value: 'light', label: 'Lightly Active', desc: '1-3 days/week' },
    { value: 'moderate', label: 'Moderately Active', desc: '3-5 days/week' },
    { value: 'active', label: 'Active', desc: '6-7 days/week' },
    { value: 'very_active', label: 'Very Active', desc: 'Intense daily training' },
];

const Profile = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState({
        fitness_goal: 'maintenance',
        activity_level: 'moderate',
        height_cm: '',
        weight_kg: '',
        notification_method: 'none',
        whatsapp_number: '',
    });

    const [sending, setSending] = useState(false);
    const [sendResult, setSendResult] = useState(null);

    useEffect(() => {
        loadProfile();
    }, [user]);

    const loadProfile = async () => {
        if (!user?.id) { setLoading(false); return; }
        try {
            const profile = await fetchProfile(user.id);
            if (profile) {
                setForm({
                    fitness_goal: profile.fitness_goal || 'maintenance',
                    activity_level: profile.activity_level || 'moderate',
                    height_cm: profile.height_cm || '',
                    weight_kg: profile.weight_kg || '',
                    notification_method: profile.notification_method || 'none',
                    whatsapp_number: profile.whatsapp_number || '',
                });
            }
        } catch (err) {
            console.error('Failed to load profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        setSendResult(null);
        try {
            await saveProfile(user.id, form);
            setSaved(true);

            // If notifications enabled, immediately generate & send first workout
            if (form.notification_method !== 'none') {
                setSending(true);
                try {
                    const meals = await fetchTodaysMeals(user.id);
                    const totals = (meals || []).reduce((acc, m) => ({
                        calories: acc.calories + (Number(m.calories) || 0),
                        protein: acc.protein + (Number(m.protein) || 0),
                        carbs: acc.carbs + (Number(m.carbs) || 0),
                        fats: acc.fats + (Number(m.fats) || 0),
                    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

                    const res = await fetch(`${AI_BASE_URL}/send-exercise-now`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            calories: totals.calories || 2000,
                            protein: totals.protein || 60,
                            carbs: totals.carbs || 200,
                            fats: totals.fats || 50,
                            goal: form.fitness_goal,
                            activityLevel: form.activity_level,
                            height: form.height_cm || 170,
                            weight: form.weight_kg || 70,
                            notificationMethod: form.notification_method,
                            whatsappNumber: form.whatsapp_number,
                            email: user?.email,
                        })
                    });
                    const result = await res.json();
                    if (result.sent) {
                        setSendResult({ success: true, method: form.notification_method });
                    } else {
                        setSendResult({ success: false, error: result.whatsappError || result.emailError || 'Delivery failed. Check your Twilio/Email config in .env' });
                    }
                } catch (sendErr) {
                    console.error('Send error:', sendErr);
                    setSendResult({ success: false, error: sendErr.message });
                } finally {
                    setSending(false);
                }
            }

            setTimeout(() => setSaved(false), 5000);
        } catch (err) {
            console.error('Failed to save:', err);
            alert('Failed to save profile. Check Supabase configuration.');
        } finally {
            setSaving(false);
        }
    };

    const update = (field, value) => {
        setSaved(false);
        setSendResult(null);
        setForm(f => ({ ...f, [field]: value }));
    };

    // BMI calculation
    const bmi = form.height_cm && form.weight_kg
        ? (form.weight_kg / ((form.height_cm / 100) ** 2)).toFixed(1)
        : null;
    const bmiCategory = bmi
        ? bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'
        : null;
    const bmiColor = bmi
        ? bmi < 18.5 ? 'text-blue-500' : bmi < 25 ? 'text-primary-500' : bmi < 30 ? 'text-amber-500' : 'text-red-500'
        : '';

    if (loading) {
        return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="text-primary-500 animate-spin" size={32} /></div>;
    }

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Profile</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Set your fitness goals and notification preferences.</p>

            {/* Account Info */}
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 p-6 mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center">
                        <User className="text-primary-500" size={24} />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 dark:text-white">{user?.email}</p>
                        <p className="text-xs text-gray-500">User ID: {user?.id?.slice(0, 8)}...</p>
                    </div>
                </div>
            </div>

            {/* Body Measurements */}
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 p-6 mb-6">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Body Measurements</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><Ruler size={12} /> Height (cm)</label>
                        <input
                            type="number" value={form.height_cm} onChange={e => update('height_cm', Number(e.target.value) || '')}
                            placeholder="170" className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><Weight size={12} /> Weight (kg)</label>
                        <input
                            type="number" value={form.weight_kg} onChange={e => update('weight_kg', Number(e.target.value) || '')}
                            placeholder="70" className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                </div>
                {bmi && (
                    <div className="bg-gray-50 dark:bg-dark-700 rounded-xl p-3 flex items-center justify-between">
                        <span className="text-sm text-gray-500">Your BMI</span>
                        <span className={`text-lg font-bold ${bmiColor}`}>{bmi} <span className="text-xs font-medium">({bmiCategory})</span></span>
                    </div>
                )}
            </div>

            {/* Fitness Goal */}
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 p-6 mb-6">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Activity size={14} /> Fitness Goal</h2>
                <div className="space-y-2">
                    {FITNESS_GOALS.map(g => (
                        <button key={g.value} onClick={() => update('fitness_goal', g.value)}
                            className={`w-full p-4 rounded-2xl text-left transition-all ${form.fitness_goal === g.value
                                ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500'
                                : 'bg-gray-50 dark:bg-dark-700 border-2 border-transparent hover:border-gray-200 dark:hover:border-dark-600'}`}
                        >
                            <p className="font-bold text-gray-900 dark:text-white text-sm">{g.label}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{g.desc}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Activity Level */}
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 p-6 mb-6">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Activity Level</h2>
                <div className="flex flex-wrap gap-2">
                    {ACTIVITY_LEVELS.map(a => (
                        <button key={a.value} onClick={() => update('activity_level', a.value)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${form.activity_level === a.value
                                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                                : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-600'}`}
                        >
                            {a.label}
                        </button>
                    ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                    {ACTIVITY_LEVELS.find(a => a.value === form.activity_level)?.desc}
                </p>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 p-6 mb-6">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Bell size={14} /> Daily Workout Notifications</h2>
                <div className="flex gap-3 mb-4">
                    {[
                        { value: 'none', label: 'Off', icon: Bell },
                        { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
                        { value: 'email', label: 'Email', icon: Mail },
                    ].map(opt => {
                        const Icon = opt.icon;
                        return (
                            <button key={opt.value} onClick={() => update('notification_method', opt.value)}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${form.notification_method === opt.value
                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                                    : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400'}`}
                            >
                                <Icon size={16} /> {opt.label}
                            </button>
                        );
                    })}
                </div>

                {form.notification_method === 'whatsapp' && (
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">WhatsApp Number (with country code)</label>
                        <input
                            type="tel" value={form.whatsapp_number}
                            onChange={e => update('whatsapp_number', e.target.value)}
                            placeholder="+91 9876543210"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-400 mt-1">You'll receive your daily workout plan at 8:00 AM.</p>
                    </div>
                )}

                {form.notification_method === 'email' && (
                    <p className="text-xs text-gray-500 bg-gray-50 dark:bg-dark-700 p-3 rounded-xl">
                        Workout plans will be sent to <strong className="text-gray-800 dark:text-gray-200">{user?.email}</strong> daily at 8:00 AM.
                    </p>
                )}
            </div>

            {/* Save Button */}
            <button onClick={handleSave} disabled={saving || sending}
                className="w-full py-4 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2"
            >
                {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</>
                    : saved ? <><CheckCircle2 size={18} /> Saved!</>
                        : <><Save size={18} /> Save Profile</>}
            </button>

            {/* Sending Status */}
            {sending && (
                <div className="mt-4 bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-900/30 rounded-2xl p-4 flex items-center gap-3">
                    <Loader2 className="text-primary-500 animate-spin shrink-0" size={20} />
                    <p className="text-sm text-primary-700 dark:text-primary-300 font-medium">
                        Generating and sending your first workout plan via {form.notification_method === 'whatsapp' ? 'WhatsApp' : 'Email'}...
                    </p>
                </div>
            )}

            {sendResult?.success && (
                <div className="mt-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-2xl p-4 flex items-center gap-3">
                    <Send className="text-green-500 shrink-0" size={20} />
                    <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                        Your first workout plan has been sent via {sendResult.method === 'whatsapp' ? 'WhatsApp' : 'Email'}! Check your {sendResult.method === 'whatsapp' ? 'phone' : 'inbox'}.
                    </p>
                </div>
            )}

            {sendResult && !sendResult.success && (
                <div className="mt-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-4">
                    <p className="text-sm text-red-700 dark:text-red-300 font-medium">Notification delivery failed: {sendResult.error}</p>
                    <p className="text-xs text-red-500 mt-1">Your profile was saved. Add Twilio/Email credentials to .env to enable notifications.</p>
                </div>
            )}
        </div>
    );
};

export default Profile;
