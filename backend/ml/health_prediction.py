import os
import numpy as np
import matplotlib.pyplot as plt
from dotenv import load_dotenv
from xgboost import XGBRegressor
from PIL import Image
from google import genai

# =========================
# LOAD ENV VARIABLES
# =========================
load_dotenv("../../.env")

API_KEY = os.getenv("GOOGLE_API_KEY")
client = genai.Client(api_key=API_KEY)

# =========================
# LOAD IMAGE
# =========================
image_path = "../../assets/food.jpg"
img = Image.open(image_path)

# =========================
# FOOD DETECTION
# =========================
prompt = "Identify the food in this image. Return only the food name."

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=[prompt, img]
)

food_name = response.text.strip().lower()
print("Detected Food:", food_name)

# =========================
# NUTRITION DATABASE
# =========================
nutrition_db = {
    "burger": {"calories": 500, "fat": 25, "protein": 20},
    "pizza": {"calories": 400, "fat": 20, "protein": 15},
    "salad": {"calories": 150, "fat": 5, "protein": 5},
    "rice": {"calories": 200, "fat": 2, "protein": 4}
}

nutrients = nutrition_db.get(food_name, {"calories": 300, "fat": 10, "protein": 10})
print("Nutrition:", nutrients)

# =========================
# GENERATE SYNTHETIC TRAINING DATA (IMPORTANT FIX)
# =========================
np.random.seed(42)

X_train = []
y_train = []

for _ in range(200):
    calories = np.random.randint(100, 800)
    fat = np.random.randint(1, 50)
    protein = np.random.randint(1, 40)
    weeks = np.random.randint(1, 24)

    # health formula (simulate real behavior)
    health = 100 - (calories * 0.05 + fat * 0.7) + protein * 0.4 - weeks * 1.2

    # add noise
    health += np.random.normal(0, 3)

    health = max(10, min(100, health))

    X_train.append([calories, fat, protein, weeks])
    y_train.append(health)

X_train = np.array(X_train)
y_train = np.array(y_train)

# =========================
# TRAIN MODEL
# =========================
model = XGBRegressor(n_estimators=100, max_depth=4)
model.fit(X_train, y_train)

# =========================
# WEEKLY PREDICTION (24 weeks)
# =========================
weeks = np.arange(1, 25)

unhealthy_scores = []
healthy_scores = []

for w in weeks:
    # -------- CURRENT DIET (declines) --------
    unhealthy_input = [
        nutrients["calories"] + w * 10,
        nutrients["fat"] + w * 1.5,
        nutrients["protein"],
        w
    ]

    unhealthy_score = model.predict([unhealthy_input])[0]
    unhealthy_scores.append(unhealthy_score)

    # -------- IDEAL DIET (IMPROVES / STABLE) --------
    healthy_input = [
        nutrients["calories"] * 0.7,
        nutrients["fat"] * 0.6,
        nutrients["protein"] * 1.5,
        1   # 👈 KEY FIX: REMOVE WEEK EFFECT
    ]

    healthy_score = model.predict([healthy_input])[0]

    # simulate gradual improvement
    healthy_score = min(95, healthy_score + w * 0.5)

    healthy_scores.append(healthy_score)
	
# =========================
# PLOT GRAPH
# =========================
plt.figure(figsize=(10, 5))

plt.plot(weeks, unhealthy_scores, label="Your Current Diet", linewidth=2)
plt.plot(weeks, healthy_scores, linestyle="--", label="Ideal Healthy Diet", linewidth=2)

plt.xlabel("Weeks (6 Months)")
plt.ylabel("Health Score (0-100)")
plt.title(f"Weekly Health Prediction - Eating {food_name}")
plt.legend()
plt.grid()

plt.savefig("health_prediction.png")
plt.show()

print("\nGraph saved as health_prediction.png")