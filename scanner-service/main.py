import os
import io
import json
import base64
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

# Configure Groq using OpenAI-compatible client
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise ValueError("GROQ_API_KEY is not set. Please check your .env file.")

# Set up Groq via OpenAI client as shown in USER_REQUEST
client = OpenAI(
    api_key=api_key,
    base_url="https://api.groq.com/openai/v1",
)

app = FastAPI()

# Enable CORS for mobile app access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SCAN_PROMPT = """
You are a 'Guardian AI' shopping assistant for tourists in India. 
Your task is to analyze the attached image of a product/item.

1. Identify the item precisely (e.g., 'Hand-painted Blue Pottery Plate', 'Silk Pashmina Shawl').
2. Provide a 'Fair Market Price Range' in Indian Rupees (INR) specifically for local Indian street markets or artisan shops.
3. Search (simulate) and suggest real-world shopping links from Amazon.in and Flipkart for similar items.
4. Provide a 1-sentence 'Authenticity Tip' for a tourist buying this.

IMPORTANT: Return the response ONLY as a clean JSON object with this exact structure:
{
  "success": true,
  "item_name": "string",
  "fair_price_inr": "min-max",
  "market_context": "string (brief context on local pricing)",
  "shopping_links": {
    "amazon": "URL or search link",
    "flipkart": "URL or search link"
  },
  "authenticity_tip": "string"
}
"""

@app.get("/")
def read_root():
    return {"status": "Groq & ElevenLabs AI Brain is online", "version": "2.1.0-FIXED"}

import requests
from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str
    preferences: Optional[dict] = None
    history: Optional[List[dict]] = []

class TTSRequest(BaseModel):
    text: str
    voice_id: str = "CwhRBWXzGAHq8TQ4Fs17" # Verified voice ID from your account

@app.post("/chat")
async def chat_with_ai(req: ChatRequest):
    print(f"\n--- AI CHAT REQUEST RECEIVED: {req.message[:50]}... ---")
    try:
        # Use f-string or replace to avoid .format() escaping issues with JSON braces
        prefs_json = json.dumps(req.preferences) if req.preferences else "{}"
        system_prompt = f"""
        You are 'Aegis', a warm, highly professional AI Tourist Guide for travelers in India. 
        Your goal is to sound like a friendly human guide.
        
        CONVERSATIONAL GUIDELINES:
        - Speak in a natural, polite style. Use short, simple paragraphs (2-3 lines max each).
        - NEVER use bullet points, symbols like *, or markdown.
        - Use VERY SIMPLE language.
        
        TRIP & ROUTE FORMATTING (ROAD MAP STYLE):
        - If planning a trip or route, present it as a clear sequence using the '→' symbol.
        - Example: Delhi → Agra → Jaipur.
        - Explain each stop in 1 simple sentence. 
        
        SAFETY & EMERGENCY:
        - If the user is in danger, tell them to dial 112 immediately.
        
        User Preferences: {prefs_json}
        
        TECHNICAL RULES:
        1. If you suggest a route, include the 'route' key with a GeoJSON LineString.
        2. DO NOT show coordinates or JSON code in the 'text' field.
        3. Your response must be ONLY a valid JSON object. 
        
        JSON STRUCTURE:
        {{
            "text": "Your warm, natural response with small paragraphs and 'Stop A → Stop B' style for trips",
            "route": {{ "type": "LineString", "coordinates": [[lon1, lat1], [lon2, lat2], ...] }}
        }}
        """

        messages = [{"role": "system", "content": system_prompt}]
        if req.history:
            # Clean history to ensure it's in the correct format for Groq
            for m in req.history:
                if isinstance(m, dict) and "role" in m and "content" in m:
                    messages.append({"role": m["role"], "content": str(m["content"])})
        
        messages.append({"role": "user", "content": req.message})

        print(f"Sending to Groq with {len(messages)} messages...")
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=1000,
            temperature=0.7
        )

        text_response = response.choices[0].message.content
        print(f"--- RAW AI CHAT RESPONSE ---\n{text_response}\n-----------------------")

        # Robust JSON cleaning
        clean_text = text_response.strip()
        if "```json" in clean_text:
            clean_text = clean_text.split("```json")[1].split("```")[0].strip()
        elif "```" in clean_text:
            clean_text = clean_text.split("```")[1].split("```")[0].strip()
        
        if "{" in clean_text and "}" in clean_text:
            start = clean_text.find("{")
            end = clean_text.rfind("}") + 1
            clean_text = clean_text[start:end]

        try:
            ai_data = json.loads(clean_text)
            # Ensure required keys exist
            if "text" not in ai_data:
                ai_data["text"] = clean_text
            return ai_data
        except json.JSONDecodeError:
            print("Failed to parse JSON, returning raw text")
            return {"text": text_response}

    except Exception as e:
        print(f"Chat Error: {str(e)}")
        return {"text": "I'm having trouble connecting to my brain right now. Please try again later.", "error": str(e)}

@app.post("/tts")
async def text_to_speech(req: TTSRequest):
    print(f"\n--- TTS REQUEST RECEIVED: {req.text[:30]}... ---")
    try:
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{req.voice_id}"
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": os.getenv("ELEVENLABS_API_KEY")
        }
        data = {
            "text": req.text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        }

        response = requests.post(url, json=data, headers=headers)
        if response.status_code == 200:
            audio_base64 = base64.b64encode(response.content).decode('utf-8')
            return {"success": True, "audio": audio_base64}
        else:
            return {"success": False, "error": response.text}

    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/stt")
async def speech_to_text(file: UploadFile = File(...)):
    print("\n--- STT REQUEST RECEIVED ---")
    try:
        # Read the audio file
        contents = await file.read()
        
        # Groq Whisper expects a file-like object with a name
        audio_file = io.BytesIO(contents)
        audio_file.name = "recording.m4a" # Generic name for Groq

        # Call Groq's Whisper model (translation translates to English)
        translation = client.audio.translations.create(
            file=audio_file,
            model="whisper-large-v3",
            response_format="json"
        )
        
        # Original language transcript
        transcription = client.audio.transcriptions.create(
            file=audio_file,
            model="whisper-large-v3",
            response_format="json"
        )

        print(f"Transcription: {transcription.text}")
        return {"success": True, "text": transcription.text}

    except Exception as e:
        print(f"STT Error: {str(e)}")
        return {"success": False, "error": str(e)}


@app.post("/translate-audio")
async def translate_audio(file: UploadFile = File(...)):
    """
    Accepts any audio file spoken in any language.
    Uses Groq Whisper to:
    1. Transcribe the original speech
    2. Translate it directly into English
    Returns both the recognized original text and the English translation.
    """
    print("\n--- TRANSLATE-AUDIO REQUEST RECEIVED ---")
    try:
        contents = await file.read()

        # Pass 1: Get English translation (Whisper translation = always outputs English)
        audio_for_translation = io.BytesIO(contents)
        audio_for_translation.name = "recording.webm"
        translation_result = client.audio.translations.create(
            file=audio_for_translation,
            model="whisper-large-v3",
            response_format="verbose_json"  # gives us language detection
        )

        # Pass 2: Get original language transcription + detected language
        audio_for_transcription = io.BytesIO(contents)
        audio_for_transcription.name = "recording.webm"
        transcription_result = client.audio.transcriptions.create(
            file=audio_for_transcription,
            model="whisper-large-v3",
            response_format="verbose_json"
        )

        detected_language = getattr(transcription_result, 'language', 'unknown')
        original_text = getattr(transcription_result, 'text', '').strip()
        english_text = getattr(translation_result, 'text', '').strip()

        print(f"Detected Language: {detected_language}")
        print(f"Original: {original_text}")
        print(f"Translated: {english_text}")

        return {
            "success": True,
            "detected_language": detected_language,
            "original_text": original_text,
            "english_text": english_text
        }

    except Exception as e:
        print(f"Translate-Audio Error: {str(e)}")
        return {"success": False, "error": str(e)}

@app.post("/scan")
async def scan_item(file: UploadFile = File(...)):
    print("\n--- GROQ SCAN REQUEST RECEIVED ---")
    try:
        # Read image
        contents = await file.read()
        
        # Convert image to base64 for vision tasks
        base64_image = base64.b64encode(contents).decode('utf-8')

        # Call Groq Vision
        # We REMOVE response_format={"type": "json_object"} because some OSS 
        # models return empty strings when they are restricted by strict JSON mode 
        # while processing images.
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "ANALYZE THE IMAGE COMPLETELY. IDENTIFY THE OBJECT. " + SCAN_PROMPT},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            },
                        },
                    ],
                }
            ],
            max_tokens=600,
            temperature=0.2
        )

        # Parse the JSON response
        text_response = response.choices[0].message.content
        print(f"--- RAW AI RESPONSE ---\n{text_response}\n-----------------------")
        
        # Robust JSON cleaning
        if "```json" in text_response:
            text_response = text_response.split("```json")[1].split("```")[0].strip()
        elif "```" in text_response:
            text_response = text_response.split("```")[1].split("```")[0].strip()
        
        # If it's still empty, try to find the { ... } block
        if "{" in text_response and "}" in text_response:
            start = text_response.find("{")
            end = text_response.rfind("}") + 1
            text_response = text_response[start:end]
            
        data = json.loads(text_response)
        
        # Ensure success is set to True
        data["success"] = True
        
        print(f"Item Identified: {data.get('item_name')}")
        print(f"Price Range: {data.get('fair_price_inr')}")
        
        return data

    except Exception as e:
        print(f"Error during scan: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    # Using host 0.0.0.0 for external mobile access
    uvicorn.run(app, host="0.0.0.0", port=8000)
