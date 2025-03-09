from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import dotenv
from google import genai
from fastapi.middleware.cors import CORSMiddleware

dotenv.load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY is not set in environment variables")

client = genai.Client(api_key=api_key)

app = FastAPI()

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow requests from any origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

system_prompt = (
    "You are a helpful AI assistant specialized in answering queries about X-ray imaging, "
    "X-ray report generation, our website, platform, and services. "
    "Ensure responses are clear, accurate, and aligned with our guidelines. "
    "Reject inappropriate requests and maintain professionalism."
)

class QueryRequest(BaseModel):
    query: str

@app.post("/chat")
async def chat(request: QueryRequest):
    if not request.query:
        raise HTTPException(status_code=400, detail="Query is required")
    
    print(request.query)

    response = client.models.generate_content(
        model="gemini-2.0-flash", contents=f"{system_prompt}\nUser: {request.query}"
    )
    print(response.text)

    return {"response": response.text}
