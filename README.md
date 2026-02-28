# NutriMind AI

Built in 24 Hours during Code Automata v2.1 Hackathon

---

## Overview

NutriMind AI is an AI-powered nutrition intelligence system that analyzes food images, predicts long-term health impact, and provides actionable insights using machine learning.

The system combines computer vision, predictive modeling, and health analytics to simulate how dietary habits affect a user's health over time.

---

## Features

* Food detection using Gemini Vision API
* Nutritional estimation from detected food
* Health prediction using XGBoost
* Weekly health trend visualization (6 months)
* Ideal vs current diet comparison graph
* Modular backend architecture (Node.js & Supabase)
* React-based frontend integration

---

## Tech Stack

* Node.js (Backend)
* React (Frontend)
* Gemini API (Vision + AI inference)
* XGBoost (Health prediction model)
* PostgreSQL (planned storage layer)
* Matplotlib (Graph visualization)

---

## Project Structure

```
NutriMind-AI/
│
├── backend/
│   ├── main.py
│   ├── tracker_routes.py
│   ├── chat_routes.py
│   ├── alerts_utils.py
│   ├── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│
├── assets/
│   ├── food.jpg
│
├── .env
├── .gitignore
├── run.py
└── README.md
```

---

## Setup Instructions

### 1. Clone Repository

```
git clone <your-repo-link>
cd NutriMind-AI
```

---

### 2. Backend Setup

```
cd backend
pip install -r requirements.txt
```

---

### 3. Environment Variables

Create a `.env` file in the root directory:

```
GOOGLE_API_KEY=your_api_key_here
DATABASE_URL=postgresql://postgres:password@localhost:5432/nutrition_db
```

---

### 4. Run Backend

```
uvicorn main:app --reload
```

Backend will run at:

```
http://127.0.0.1:8000
```

---

### 5. Run Frontend

```
cd frontend
npm install
npm run dev
```

Frontend will run at:

```
http://localhost:5173
```

---

## Health Prediction Logic

* Food image → detected via Gemini
* Nutrition mapped from dataset
* XGBoost predicts health score
* Weekly degradation modeled over 24 weeks
* Compared against constant ideal health baseline

---

## Future Improvements

* PostgreSQL caching for API cost reduction
* Real-time user tracking dashboard
* Personalized diet recommendations
* Advanced nutritional database integration
* Mobile app deployment

---

## Hackathon Details

Event: Code Automata v2.1
Duration: 24 Hours

---

## Team Members

* Param Savla (Team Leader)
* Bhavishy Lotlikar
* Abhishek Singh

---

## License

MIT License
