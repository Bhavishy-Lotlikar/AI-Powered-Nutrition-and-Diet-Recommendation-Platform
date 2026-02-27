import { supabase } from './supabaseClient';

export const fetchDailySummary = async (userId, dateStr) => {
    if (!userId) return null;

    const { data, error } = await supabase
        .from('daily_summaries')
        .select('*')
        .eq('user_id', userId)
        .eq('date', dateStr)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
};

export const updateDailySummary = async (userId, mealData) => {
    if (!userId) return;

    const today = new Date().toISOString().split('T')[0];
    let current = await fetchDailySummary(userId, today);

    if (!current) {
        current = {
            user_id: userId,
            date: today,
            total_calories: 0,
            total_protein: 0,
            total_carbs: 0,
            total_fats: 0
        };
    }

    const addSafe = (a, b) => (Number(a) || 0) + (Number(b) || 0);

    const newSummary = {
        ...current,
        total_calories: addSafe(current.total_calories, mealData.estimatedCalories),
        total_protein: addSafe(current.total_protein, mealData.protein),
        total_carbs: addSafe(current.total_carbs, mealData.carbs),
        total_fats: addSafe(current.total_fats, mealData.fat),
    };

    const { error } = await supabase
        .from('daily_summaries')
        .upsert(newSummary, { onConflict: 'user_id, date' });

    if (error) throw error;
};

export const fetchNutritionGoals = async (userId) => {
    if (!userId) return null;

    const { data, error } = await supabase
        .from('nutrition_goals')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
};

export const saveNutritionGoals = async (userId, goals) => {
    if (!userId) throw new Error('User ID required');

    const { error } = await supabase
        .from('nutrition_goals')
        .upsert({
            user_id: userId,
            calories: goals.calories,
            protein: goals.protein,
            carbs: goals.carbs,
            fat: goals.fat,
            fiber: goals.fiber,
        }, { onConflict: 'user_id' });

    if (error) throw error;
};
