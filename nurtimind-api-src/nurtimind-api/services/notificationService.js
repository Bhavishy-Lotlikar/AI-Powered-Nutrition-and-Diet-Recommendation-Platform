const twilio = require('twilio');
const nodemailer = require('nodemailer');

// Twilio WhatsApp
function getWhatsAppClient() {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
    if (!sid || !token) return null;
    return { client: twilio(sid, token), from };
}

// Gmail SMTP
function getEmailTransporter() {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_APP_PASSWORD;
    if (!user || !pass) return null;
    return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
    });
}

// Format workout plan into a compact WhatsApp message (max 1600 chars)
function formatPlanAsText(plan) {
    let msg = `*NutriMind Workout*\n`;
    msg += `Focus: ${plan.focus || 'Full Body'} | ${plan.duration || '45 min'} | ~${plan.caloriesBurned || 300} kcal\n\n`;

    if (plan.exercises?.length) {
        plan.exercises.slice(0, 6).forEach((ex, i) => {
            msg += `${i + 1}. ${ex.name} - ${ex.sets}x${ex.reps} (${ex.rest})\n`;
        });
        msg += '\n';
    }

    if (plan.cardio) {
        msg += `Cardio: ${plan.cardio.type} - ${plan.cardio.duration}\n`;
    }

    msg += `\n_Sent by NutriMind AI_`;

    // Hard truncate safety net
    if (msg.length > 1550) msg = msg.substring(0, 1550) + '...';
    return msg;
}

// Format as HTML email
function formatPlanAsHTML(plan) {
    let html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">`;
    html += `<h1 style="color:#22c55e;margin-bottom:4px;">🏋️ NutriMind Daily Workout</h1>`;
    html += `<p style="color:#666;"><strong>Focus:</strong> ${plan.focus} | <strong>Duration:</strong> ${plan.duration} | <strong>Burn:</strong> ~${plan.caloriesBurned || 300} kcal</p>`;
    html += `<p>${plan.summary}</p>`;

    if (plan.warmup) html += `<p><strong>🟡 Warmup:</strong> ${plan.warmup}</p>`;

    if (plan.exercises?.length) {
        html += `<h2 style="color:#333;">💪 Exercises</h2><table style="width:100%;border-collapse:collapse;">`;
        html += `<tr style="background:#f6f6f6;"><th style="padding:8px;text-align:left;">#</th><th style="padding:8px;text-align:left;">Exercise</th><th style="padding:8px;">Sets×Reps</th><th style="padding:8px;">Rest</th></tr>`;
        plan.exercises.forEach((ex, i) => {
            html += `<tr style="border-bottom:1px solid #eee;"><td style="padding:8px;">${i + 1}</td><td style="padding:8px;"><strong>${ex.name}</strong>${ex.notes ? `<br><small style="color:#888;">${ex.notes}</small>` : ''}</td><td style="padding:8px;text-align:center;">${ex.sets}×${ex.reps}</td><td style="padding:8px;text-align:center;">${ex.rest}</td></tr>`;
        });
        html += `</table>`;
    }

    if (plan.cardio) {
        html += `<h2 style="color:#333;">🏃 Cardio</h2>`;
        html += `<p><strong>${plan.cardio.type}</strong> — ${plan.cardio.duration} (${plan.cardio.intensity})</p>`;
        if (plan.cardio.notes) html += `<p style="color:#666;"><em>${plan.cardio.notes}</em></p>`;
    }

    if (plan.cooldown) html += `<p><strong>🧘 Cooldown:</strong> ${plan.cooldown}</p>`;

    html += `<hr style="border:none;border-top:1px solid #eee;margin:20px 0;"><p style="color:#999;font-size:12px;">Sent by NutriMind AI — Your daily fitness companion</p></div>`;
    return html;
}

async function sendWhatsApp(phone, plan) {
    const wa = getWhatsAppClient();
    if (!wa) throw new Error('Twilio not configured. Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to .env');

    // Clean phone number: remove spaces, dashes, parentheses
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    const toNumber = cleanPhone.startsWith('whatsapp:') ? cleanPhone : `whatsapp:${cleanPhone}`;
    const body = formatPlanAsText(plan);

    const message = await wa.client.messages.create({
        from: wa.from,
        to: toNumber,
        body,
    });
    console.log('WhatsApp sent:', message.sid);
    return message.sid;
}

async function sendEmail(email, plan) {
    const transporter = getEmailTransporter();
    if (!transporter) throw new Error('Email not configured. Add EMAIL_USER and EMAIL_APP_PASSWORD to .env');

    const info = await transporter.sendMail({
        from: `"NutriMind AI" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `🏋️ Your Daily Workout — ${plan.focus || 'Full Body'}`,
        html: formatPlanAsHTML(plan),
    });
    console.log('Email sent:', info.messageId);
    return info.messageId;
}

module.exports = { sendWhatsApp, sendEmail, formatPlanAsText };
