import os
from fastapi import FastAPI
from groq import Groq
from dotenv import load_dotenv
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app = FastAPI()     #create FastAPI instance

app.add_middleware(         #cors handling 
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

""" messages = [
    {
        "role": "system",
        "content": "You are a helpful assistant."
    }
] """

sessions = {}    #in-memory session storage

class ChatRequest(BaseModel):
    message: str
    session_id: str

class ClearRequest(BaseModel):
    session_id: str

@app.get("/")       #1st endpoint
def root():
    return {"status": "LLM API running"}

@app.post("/clear")     #endpoint to clear chat history(2nd)
def clear_chat(req: ClearRequest):
    global sessions
    session_id= req.session_id

    sessions[req.session_id] = [
        {
            "role": "system",
            "content": "You are a helpful assistant."
        }
    ]
    return {"success": True}

@app.post("/chat")      #3rd endpoint for chat
def chat(req: ChatRequest):

    try: 
        global sessions

        session_id= req.session_id

        if session_id not in sessions:
            sessions[session_id] = [
                {
                    "role": "system",
                    "content": "You are a helpful programming mentor. Explain things clearly and simply."
                }
            ]

        sessions[session_id].append({
            "role": "user",
            "content": req.message
        })

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=sessions[session_id]
        )

        ai_reply = response.choices[0].message.content

        sessions[session_id].append({
            "role": "assistant",
            "content": ai_reply
        })

        return {
                    "success": True,
                    "response": ai_reply}
    
    except Exception as e:
        return {
                "success": False,
                "error": str(e)}
