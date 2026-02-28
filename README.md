# NutriMind AI

Built in 24 Hours during Code Automata v2.1 Hackathon

---

## Overview

NutriMind AI is an AI-powered nutrition intelligence system that analyzes food images, scans barcodes, predicts long-term health impact, and provides actionable insights using machine learning.

The system combines computer vision, predictive modeling, and health analytics to simulate how dietary habits affect a user's health over time — with AI-powered exercise plans, personalized nutrition recommendations, and real-time notifications.

---

## Features

* Food detection via camera capture and image upload (Gemini Vision)
* Barcode scanning with OpenFoodFacts lookup + manual barcode entry
* Portion size calculator with proportional nutrient scaling
* Nutritional estimation with full Nutrition Facts panel
* AI-powered personalized meal recommendations
* AI-powered exercise plan generation (personal trainer style)
* Health prediction using XGBoost (6-month weekly trend)
* Ideal vs current diet comparison graph
* WhatsApp & Email exercise notifications (Twilio + Gmail SMTP)
* Daily 8 AM scheduled workout delivery
* AI Health Consultant
* Dark mode support
* Mobile-responsive design

---

## Tech Stack

* **Frontend:** React + Vite
* **Styling:** Tailwind CSS v4
* **Backend:** Node.js + Express
* **AI Model:** Google Gemini 2.5 Flash (Gemini pro API)
* **Database:** Supabase (PostgreSQL + Auth + RLS)
* **Barcode API:** OpenFoodFacts
* **Notifications:** Twilio (WhatsApp) + Nodemailer (Gmail SMTP)
* **Health Prediction:** XGBoost (Python model)
* **AI Consultant:** HeyGen Streaming Avatar
* **Icons:** Lucide React

---

## Project Structure

```
NutriMind-AI/
│
├── src/                              # Frontend (React + Vite)
│   ├── api/
│   │   ├── supabaseClient.js         # Supabase connection
│   │   ├── mealApi.js                # Food analysis & meal CRUD
│   │   ├── exerciseApi.js            # Exercise plan generation & storage
│   │   ├── summaryApi.js             # Daily summaries & nutrition goals
│   │   └── profileApi.js             # User profile management
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx            # Navigation bar
│   │   │   ├── Layout.jsx            # App layout wrapper
│   │   │   └── Footer.jsx            # Footer component
│   │   ├── auth/
│   │   │   └── ProtectedRoute.jsx    # Auth guard
│   │   └── common/                   # Shared UI components
│   │
│   ├── context/
│   │   ├── AuthContext.jsx           # Authentication state
│   │   └── ThemeContext.jsx          # Dark/Light mode toggle
│   │
│   ├── pages/
│   │   ├── Landing.jsx               # Homepage / landing page
│   │   ├── AuthPage.jsx              # Login / Signup
│   │   ├── Dashboard.jsx             # Main dashboard with nutrition overview
│   │   ├── FoodDetection.jsx         # Camera, upload, barcode scanner + portion calculator
│   │   ├── NutritionAnalysis.jsx     # Detailed nutrition breakdown
│   │   ├── ExercisePlan.jsx          # AI exercise plan + saved workout logs
│   │   ├── Recommendations.jsx       # AI-powered meal recommendations
│   │   ├── PredictiveHealth.jsx      # XGBoost health prediction graphs
│   │   ├── HealthInsights.jsx        # AI Health Consultant (HeyGen avatar)
│   │   ├── Profile.jsx               # User profile + notification settings
│   │   ├── LogFood.jsx               # Manual food logging
│   │   └── AIDemo.jsx                # AI demo page
│   │
│   ├── routes/
│   │   └── AppRoutes.jsx             # Route definitions
│   │
│   ├── model/
│   │   └── healthPredictor.js        # XGBoost health prediction logic
│   │
│   ├── App.jsx                       # Root component
│   ├── main.jsx                      # Vite entry point
│   └── index.css                     # Global styles
│
├── nurtimind-api-src/nurtimind-api/  # Backend (Node.js + Express)
│   ├── server.js                     # Express server + API endpoints
│   ├── services/
│   │   ├── geminiService.js          # Gemini API (food image analysis)
│   │   ├── exerciseService.js        # Gemini API (exercise plan generation)
│   │   ├── notificationService.js    # Twilio WhatsApp + Gmail email sending
│   │   └── schedulerService.js       # Daily 8 AM notification scheduler
│   ├── package.json
│   └── .env.example
│
├── public/                           # Static assets
│   └── Home/                         # Dashboard images - add images from our drive link: [https://drive.google.com/drive/folders/1fZlrYqaV-m32lS4qrbPEs0JhPk5NdsHu](url)
│
├── .env                              # Environment variables (not in git)
├── .gitignore
├── index.html                        # Vite HTML entry
├── vite.config.js                    # Vite configuration
├── package.json
├── requirements.txt                  # Python dependencies (XGBoost model training)
└── README.md
```

---

## Setup Instructions

### 1. Clone Repository

```bash
git clone <your-repo-link>
cd NutriMind-AI
```

---

### 2. Frontend Setup

```bash
npm install
```

---

### 3. Backend Setup

```bash
cd nurtimind-api-src/nurtimind-api
npm install
```

---

### 4. Python Dependencies (for Health Prediction Model)

```bash
pip install -r requirements.txt
```

---

### 5. Environment Variables

Create a `.env` file in the project root:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:3000

# Gemini pro (Gemini 2.5 Flash)
GEMINI_API_KEY=your_gemini_api_key

# Twilio (WhatsApp notifications)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Gmail SMTP (Email notifications)
EMAIL_USER=your_gmail@gmail.com
EMAIL_APP_PASSWORD=your_gmail_app_password

# Supabase Service Key (for daily scheduler)
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

---

### 6. Run Backend

```bash
cd nurtimind-api-src/nurtimind-api
node server.js
```

Backend runs at: `http://localhost:3000`

---

### 7. Run Frontend

```bash
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/analyze-image` | Analyze food image via AI |
| POST | `/generate-exercise` | Generate AI exercise plan |
| POST | `/generate-recommendations` | Get AI meal recommendations |
| POST | `/send-exercise-now` | Send workout via WhatsApp + Email |
| GET | `/api/health` | Health check |

---

## Database Schema (Supabase)

* **meals** — Logged food with calories, macros, health score
* **daily_summaries** — Aggregated daily nutrition totals
* **nutrition_goals** — User's calorie/macro targets
* **user_profiles** — Fitness goal, activity level, notification preferences
* **exercise_recommendations** — Saved AI-generated workout plans

All tables use Row Level Security (RLS).

---

## Health Prediction Logic

* Food image → detected via Gemini Vision AI
* Nutrition mapped from AI response + OpenFoodFacts
* XGBoost predicts health score trajectory
* Weekly degradation modeled over 24 weeks
* Compared against constant ideal health baseline

---

## Future Improvements

* PostgreSQL caching for API cost reduction
* Real-time user tracking dashboard
* Advanced nutritional database integration
* Mobile app deployment (React Native)
* Meal planning with grocery list generation

---

## Hackathon Details

**Event:** Code Automata v2.1
**Duration:** 24 Hours

---

## Team Members

* Param Savla (Team Leader)
* Bhavishy Lotlikar
* Abhishek Singh

---

## License

MIT License
