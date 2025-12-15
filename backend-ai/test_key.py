from dotenv import load_dotenv
import os
from openai import OpenAI

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
print(f"Loaded API Key: {api_key[:10]}...{api_key[-4:] if api_key else 'None'}")
print(f"Key Length: {len(api_key) if api_key else 0}")

try:
    client = OpenAI(api_key=api_key)
    response = client.embeddings.create(
        input="test",
        model="text-embedding-3-small"
    )
    print("✅ API Key is working! Embedding generated.")
except Exception as e:
    print(f"❌ Error: {e}")
