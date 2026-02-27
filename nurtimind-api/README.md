# 🧠 NurtiMind API

AI-powered food recognition and nutrition estimation API. Send a food image → get calories, macros, nutrition facts, health score, and personalized recommendations.

## Quick Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Add your Gemini API key**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and replace `your_gemini_api_key_here` with your actual key from [Google AI Studio](https://aistudio.google.com/apikey).

3. **Start the server**
   ```bash
   npm start
   ```
   Server runs at `http://localhost:3000`

## API Endpoint

### `POST /analyze-image`

**Request:**
```json
{
  "image": "base64_encoded_image_string",
  "goal": "fat_loss",
  "age": 25
}
```

| Field | Type | Values |
|-------|------|--------|
| `image` | string | Base64 image (with or without `data:image/...;base64,` prefix) |
| `goal` | string | `fat_loss`, `muscle_gain`, or `maintenance` |
| `age` | number | 1–120 |

**Response:**
```json
{
  "foodName": "Grilled Chicken Breast",
  "portionSize": "1 piece (150g)",
  "estimatedCalories": 248,
  "protein": 38,
  "carbs": 0,
  "fat": 10,
  "nutritionFacts": {
    "servingSize": "1 piece (150g)",
    "totalFat": 10,
    "saturatedFat": 3,
    "transFat": 0,
    "cholesterol": 110,
    "sodium": 75,
    "totalCarbs": 0,
    "dietaryFiber": 0,
    "totalSugars": 0,
    "addedSugars": 0,
    "protein": 38,
    "vitaminD": 0.2,
    "calcium": 15,
    "iron": 1.1,
    "potassium": 358
  },
  "healthScore": 88,
  "warnings": [],
  "recommendation": "Excellent protein source for your muscle gain goal..."
}
```

### `GET /api/health`

Returns `{ "status": "ok", "timestamp": "..." }`

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad request (missing/invalid fields) |
| 422 | Food not recognized in image |
| 503 | API key not configured |
| 500 | Server/AI error |

## Testing with curl

```bash
# Encode an image to base64 and test
base64 food.jpg | curl -X POST http://localhost:3000/analyze-image \
  -H "Content-Type: application/json" \
  -d "{\"image\":\"$(cat)\", \"goal\":\"fat_loss\", \"age\":25}"
```

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express
- **AI**: Google Gemini 2.5 Flash (via @google/generative-ai)
