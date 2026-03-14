from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()


client = Groq(api_key=os.getenv("GROQ_API_KEY"))

messages = [
    {
        "role": "system",
        "content": "You are a helpful programming mentor. Explain things clearly and simply."
    }
]

while True:

    user_input = input("You: ")

    messages.append({
        "role": "user",
        "content": user_input
    })

    if len(messages) > 30:
        messages = messages[-30:]

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages
    )

    ai_reply = response.choices[0].message.content

    print("AI:", ai_reply)

    messages.append({
        "role": "assistant",
        "content": ai_reply
    })