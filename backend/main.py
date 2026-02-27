from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from chat_routes import router as chat_router
from tracker_routes import router as tracker_router

app = FastAPI(title="AI Nutrition System API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev purposes; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat_router)
app.include_router(tracker_router)

@app.get("/")
async def root():
    return {"message": "AI Nutrition System API is running."}
