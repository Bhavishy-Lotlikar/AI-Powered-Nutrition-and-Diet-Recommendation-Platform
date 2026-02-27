import { supabase } from './supabaseClient';

const AI_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const generateExercisePlan = async (nutritionData) => {
    const response = await fetch(`${AI_BASE_URL}/generate-exercise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nutritionData)
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate exercise plan.');
    }

    return await response.json();
};

export const saveExercisePlan = async (userId, plan) => {
    if (!userId) throw new Error('User ID required');

    const { error } = await supabase
        .from('exercise_recommendations')
        .insert([{
            user_id: userId,
            date: new Date().toISOString().split('T')[0],
            summary: plan.summary,
            focus: plan.focus,
            duration: plan.duration,
            exercises: plan.exercises,
            cardio: plan.cardio,
            full_response: plan,
        }]);

    if (error) throw error;
};

export const fetchTodaysPlan = async (userId) => {
    if (!userId) return null;
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('exercise_recommendations')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
};

export const fetchRecentPlans = async (userId, limit = 7) => {
    if (!userId) return [];

    const { data, error } = await supabase
        .from('exercise_recommendations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data || [];
};
