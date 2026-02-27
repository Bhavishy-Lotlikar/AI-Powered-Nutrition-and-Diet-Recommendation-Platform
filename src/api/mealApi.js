import { supabase } from './supabaseClient';

const AI_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const analyzeFood = async (base64Image, goal = 'maintenance', age = 25) => {
    const response = await fetch(`${AI_BASE_URL}/analyze-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image, goal, age })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to analyze image.');
    }

    return await response.json();
};

export const saveMeal = async (userId, data, imageBase64 = null) => {
    if (!userId) throw new Error('User ID is required to save meal.');

    const { error } = await supabase
        .from('meals')
        .insert([{
            user_id: userId,
            detected_food_name: data.foodName,
            calories: data.estimatedCalories,
            protein: data.protein,
            carbs: data.carbs,
            fats: data.fat,
            portion_size: data.portionSize,
            health_score: data.healthScore,
            recommendation: data.recommendation,
            warnings: data.warnings,
            full_raw_response: data,
            image_base64: imageBase64
        }]);

    if (error) throw error;
};

export const fetchMeals = async (userId) => {
    if (!userId) return [];

    const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

export const fetchTodaysMeals = async (userId) => {
    if (!userId) return [];

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

    const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startOfDay)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};
