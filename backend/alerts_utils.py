from typing import List, Dict, Any

def check_health_risks(daily_summary: Dict[str, Any], goals: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Rule-based system to check health risks based on daily nutritional summary.
    Does NOT use any AI. Returns a list of alert objects.
    """
    alerts = []
    
    total_calories = daily_summary.get("total_calories", 0)
    total_protein = daily_summary.get("total_protein", 0)
    total_carbs = daily_summary.get("total_carbs", 0)  # Used as proxy for sugar limit warnings
    
    calorie_limit = goals.get("calorie_limit", 2000)
    min_protein = goals.get("min_protein", 50)
    max_carbs = goals.get("max_carbs", 300)
    
    # 1. Calorie rules
    if total_calories > calorie_limit:
        alerts.append({
            "type": "danger",
            "title": "Overeating Warning",
            "message": f"You have exceeded your daily goal of {calorie_limit} kcal. Consider a lighter meal."
        })
    elif total_calories > calorie_limit * 0.9:
         alerts.append({
            "type": "warning",
            "title": "Approaching Calorie Limit",
            "message": "You are within 10% of your daily calorie limit."
        })

    # 2. Protein rules
    if total_calories > 0 and total_protein < min_protein:
        alerts.append({
            "type": "warning",
            "title": "Low Protein Intake",
            "message": f"Your protein intake ({total_protein}g) is below the minimum goal. Try adding lean meats, tofu, or dairy."
        })
        
    # 3. Sugar/Carbohydrates rules
    if total_carbs > max_carbs:
        alerts.append({
            "type": "danger",
            "title": "High Carb/Sugar Risk",
            "message": f"Your carbohydrate intake ({total_carbs}g) is very high. Monitor your sugar consumption closely."
        })
        
    # Success State if eating perfectly (just a positive nudge, represented as info/success)
    if total_calories > 0 and not alerts:
        alerts.append({
            "type": "info",
            "title": "On Track!",
            "message": "Your nutrition is perfectly balanced today. Keep it up!"
        })
        
    return alerts
