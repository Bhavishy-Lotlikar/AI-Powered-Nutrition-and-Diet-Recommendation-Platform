const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const { generateExercisePlan } = require('./exerciseService');
const { sendWhatsApp, sendEmail } = require('./notificationService');

function startScheduler() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !serviceKey) {
        console.log('Scheduler: SUPABASE_SERVICE_KEY not set — daily automation disabled');
        return;
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Run every day at 8:00 AM server time
    cron.schedule('0 8 * * *', async () => {
        console.log('[CRON] Running daily exercise generation at', new Date().toISOString());

        try {
            // Fetch users with notifications enabled
            const { data: profiles, error } = await supabase
                .from('user_profiles')
                .select('*')
                .neq('notification_method', 'none');

            if (error) { console.error('[CRON] Failed to fetch profiles:', error); return; }
            if (!profiles?.length) { console.log('[CRON] No users with notifications enabled'); return; }

            for (const profile of profiles) {
                try {
                    // Get today's nutrition from daily_summaries
                    const today = new Date().toISOString().split('T')[0];
                    const { data: summary } = await supabase
                        .from('daily_summaries')
                        .select('*')
                        .eq('user_id', profile.user_id)
                        .eq('date', today)
                        .single();

                    const nutritionData = {
                        calories: summary?.total_calories || 2000,
                        protein: summary?.total_protein || 60,
                        carbs: summary?.total_carbs || 200,
                        fats: summary?.total_fats || 50,
                        goal: profile.fitness_goal || 'maintenance',
                        activityLevel: profile.activity_level || 'moderate',
                        height: profile.height_cm || 170,
                        weight: profile.weight_kg || 70,
                    };

                    // Generate plan
                    const plan = await generateExercisePlan(nutritionData);

                    // Save to database
                    await supabase.from('exercise_recommendations').insert([{
                        user_id: profile.user_id,
                        date: today,
                        summary: plan.summary,
                        focus: plan.focus,
                        duration: plan.duration,
                        exercises: plan.exercises,
                        cardio: plan.cardio,
                        full_response: plan,
                    }]);

                    // Send notification
                    if (profile.notification_method === 'whatsapp' && profile.whatsapp_number) {
                        await sendWhatsApp(profile.whatsapp_number, plan);
                        console.log(`[CRON] WhatsApp sent to user ${profile.user_id}`);
                    } else if (profile.notification_method === 'email') {
                        // Get user email from auth
                        const { data: userData } = await supabase.auth.admin.getUserById(profile.user_id);
                        if (userData?.user?.email) {
                            await sendEmail(userData.user.email, plan);
                            console.log(`[CRON] Email sent to user ${profile.user_id}`);
                        }
                    }
                } catch (userErr) {
                    console.error(`[CRON] Failed for user ${profile.user_id}:`, userErr.message);
                }
            }

            console.log('[CRON] Daily exercise generation complete');
        } catch (err) {
            console.error('[CRON] Scheduler error:', err.message);
        }
    });

    console.log('Daily exercise scheduler started (runs at 8:00 AM)');
}

module.exports = { startScheduler };
