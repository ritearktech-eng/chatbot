from openai import OpenAI
import os

# Use OpenAI for standard embeddings
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_embedding(text: str) -> list[float]:
    # Ensure text is not empty
    if not text or not text.strip():
        return []
    
    # Simple error handling or fallback could be here
    # For now assume OpenAI key is present
    response = client.embeddings.create(
        input=text,
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

def get_chat_completion(messages: list) -> str:
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages
    )
    return response.choices[0].message.content
