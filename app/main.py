from google import genai
from PIL import Image
from app.config import API_KEY

# Initialize client
client = genai.Client(api_key=API_KEY)


def analyze_food(image_path):
    img = Image.open(image_path)

    user_profile = {
        "age": 21,
        "goal": "fat loss",
        "activity": "moderate",
        "diet": "vegetarian"
    }

    prompt = f"""
    You are an AI nutrition assistant.

    User Profile:
    Age: {user_profile['age']}
    Goal: {user_profile['goal']}
    Activity: {user_profile['activity']}
    Diet: {user_profile['diet']}

    Tasks:
    1. Identify the food.
    2. Estimate calories, protein, carbs, fats.
    3. Say if it's good for the goal.
    4. Suggest improvements.

    Keep it short.
    """

    response = client.models.generate_content(
        model="models/gemini-2.5-flash",
        contents=[prompt, img]
    )

    return response.text
