from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from alerts_utils import check_health_risks
import motor.motor_asyncio
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# MongoDB setup
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client["nutrition_db"]
meals_collection = db["meals"]

class MealLogRequest(BaseModel):
    user_id: str
    food_name: str
    calories: int
    protein: float = 0
    carbs: float = 0
    fats: float = 0

@router.post("/log-meal")
async def log_meal(meal: MealLogRequest):
    # Standardize data
    meal_doc = meal.dict()
    # In a real app we'd add a timestamp here
    
    # Store in MongoDB
    await meals_collection.insert_one(meal_doc)
    return {"status": "success", "message": "Meal logged successfully"}

@router.get("/get-dashboard/{user_id}")
async def get_dashboard(user_id: str):
    # Fetch today's meals for the user
    # Simplified logic: fetching all meals for the user to simulate daily view
    cursor = meals_collection.find({"user_id": user_id})
    meals = await cursor.to_list(length=100)
    
    # Calculate totals
    total_cals = sum(m.get("calories", 0) for m in meals)
    total_protein = sum(m.get("protein", 0) for m in meals)
    total_carbs = sum(m.get("carbs", 0) for m in meals)
    total_fats = sum(m.get("fats", 0) for m in meals)
    
    # Format meals for response (excluding internal _id)
    formatted_meals = [
        {k: v for k, v in m.items() if k != "_id"} 
        for m in meals
    ]
    
    # Daily Summary Object
    daily_summary = {
        "total_calories": total_cals,
        "total_protein": total_protein,
        "total_carbs": total_carbs,
        "total_fats": total_fats
    }
    
    # Goal object (could be fetched from user profile in DB)
    goals = {
        "calorie_limit": 2000,
        "min_protein": 50,
        "max_carbs": 250   # Used as an approximation to watch excessive sugar/carb intake
    }

    # Generate Alerts (Feature 5) based on the current totals
    alerts = check_health_risks(daily_summary, goals)
    
    return {
        "calories": total_cals,
        "protein": total_protein,
        "carbs": total_carbs,
        "fats": total_fats,
        "meals": formatted_meals,
        "alerts": alerts
    }
