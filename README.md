# NeuralLink AI Terminal

An AI-powered **cyber-style terminal interface** built with **FastAPI** and **Groq LLM API**, featuring session-based memory and an interactive futuristic UI.

This project simulates a **neural terminal system** where users interact with an AI assistant through a visually immersive command-style interface.

---

## Demo

Frontend: *(Add after deployment)*  
Backend API: https://neural-link-ai.onrender.com

---

## Features

- AI chat powered by **Groq LLM API**
- **FastAPI backend** for handling requests
- **Session-based memory** to maintain conversation context
- **Cyberpunk-style interactive UI**
- **Latency tracking** for each response
- **Token estimation**
- **Session reset / memory wipe**
- Real-time **typing indicator**
- Fully separated **frontend + backend architecture**

---

## Tech Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Python
- FastAPI
- Groq LLM API
- Uvicorn

### Deployment
- Backend: Render
- Frontend: Vercel / Netlify

---


## Project Structure

neural-link-ai
│
├── backend
│ ├── app.py
│ ├── requirements.txt
│ └── .env
│
├── frontend
│ ├── index.html
│ ├── style.css
│ └── app.js
│
├── .gitignore
└── README.md


---

## Setup Instructions

### 1. Clone the repository

```bash
 git clone https://github.com/Amrutesh7/neural-link-ai.git
 cd neural-link-ai
```
### 2. Install backend dependencies

```bash
cd backend 
pip install -r requirements.txt
```
### 3. Add environment variables

```bash
Create a .env file inside the backend folder.
GROQ_API_KEY=your_api_key_here
```

### 4. Run the backend server
```bash
uvicorn app:app --reload
```
Server will run at:
http://127.0.0.1:8000

Swagger docs:
http://127.0.0.1:8000/docs

### 5. Run the frontend

Open the frontend folder and run a live server or open:
frontend/index.html

## API Endpoints
- Chat Endpoint
- POST /chat

## Author
Amrutesh Udupa B S
