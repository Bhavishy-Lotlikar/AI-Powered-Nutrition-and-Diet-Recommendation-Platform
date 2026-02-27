from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

HF_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
# Using a lightweight, fast, free-tier model suitable for conversational chat
API_URL = "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta"
headers = {"Authorization": f"Bearer {HF_API_KEY}"} if HF_API_KEY else {}

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    user_message = request.message
    
    # 1. Provide a rule-based fallback if no API key is specified (Lightweight setup)
    if not HF_API_KEY:
        return {"reply": _rule_based_fallback(user_message)}

    prompt = f"<|system|>\nYou are a helpful and concise AI Nutrition Assistant. Keep responses under 3 sentences.</s>\n<|user|>\n{user_message}</s>\n<|assistant|>"

    # 2. Use Hugging Face Inference API
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                API_URL, 
                headers=headers, 
                json={"inputs": prompt, "parameters": {"max_new_tokens": 100, "temperature": 0.7}}
            )
            
            if response.status_code == 200:
                data = response.json()
                # Extracting just the assistant's reply part from Zephyr's output format
                generated_text = data[0]['generated_text']
                reply = generated_text.split("<|assistant|>")[-1].strip()
                return {"reply": reply}
            else:
                print(f"HF API Error: {response.text}")
                # Fallback on rate limit or API error
                return {"reply": _rule_based_fallback(user_message)}
                
    except Exception as e:
        print(f"Error calling Hugging Face: {e}")
        return {"reply": _rule_based_fallback(user_message)}

def _rule_based_fallback(message: str) -> str:
    msg = message.lower()
    if "calorie" in msg:
        return "To calculate your calories accurately, aim for a balanced diet and log your meals consistently in the dashboard."
    elif "protein" in msg:
        return "Protein is great for muscle recovery! Good sources include chicken, tofu, lentils, and eggs."
    elif "lose weight" in msg or "fat" in msg:
        return "For fat loss, focus on a slight caloric deficit and maintain high protein intake to preserve muscle mass."
    else:
        return "I'm a lightweight nutrition assistant. I perform best when you ask me specific questions about calories, macros, or general diet tips."
