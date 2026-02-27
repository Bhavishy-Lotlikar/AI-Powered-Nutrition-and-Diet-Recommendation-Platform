from google import genai
from PIL import Image

# Create client (API key automatically read from env)
client = genai.Client()

# Load image
img = Image.open("food.jpg")  # make sure path is correct

# Prompt
prompt = """
Identify the food in this image.
Estimate calories, protein, carbs, fats.
Give a short diet recommendation.
"""

# Generate response
response = client.models.generate_content(
    model="gemini-1.5-flash",
    contents=[prompt, img]
)

print(response.text)
