import { supabase } from './supabaseClient';

export const fetchProfile = async (userId) => {
    if (!userId) return null;

    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
};

export const saveProfile = async (userId, profile) => {
    if (!userId) throw new Error('User ID required');

    const payload = {
        user_id: userId,
        fitness_goal: profile.fitness_goal || 'maintenance',
        activity_level: profile.activity_level || 'moderate',
        height_cm: profile.height_cm || null,
        weight_kg: profile.weight_kg || null,
        notification_method: profile.notification_method || 'none',
        whatsapp_number: profile.whatsapp_number || null,
        updated_at: new Date().toISOString(),
    };

    // Try upsert first
    const { error } = await supabase
        .from('user_profiles')
        .upsert(payload, { onConflict: 'user_id' });

    if (error) {
        // If upsert fails, try insert (first time) or update
        console.error('Upsert error:', error);
        const { error: insertError } = await supabase
            .from('user_profiles')
            .insert([payload]);
        if (insertError) throw insertError;
    }
};
