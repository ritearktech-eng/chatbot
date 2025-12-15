import base64
import io
import os
from openai import OpenAI

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def transcribe_audio(base64_audio: str) -> str:
    """
    Transcribes base64 encoded audio to text using OpenAI Whisper.
    """
    try:
        # Decode base64 string to bytes
        audio_data = base64.b64decode(base64_audio)
        
        # Create a file-like object
        audio_file = io.BytesIO(audio_data)
        audio_file.name = "audio.mp3" # OpenAI requires a filename with extension
        
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file
        )
        return transcript.text
    except Exception as e:
        print(f"Error transcribing audio: {e}")
        return ""

def generate_speech(text: str) -> str:
    """
    Generates speech from text using OpenAI TTS and returns base64 encoded audio.
    """
    try:
        response = client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=text
        )
        
        # Get binary content
        audio_content = response.content
        
        # Encode to base64
        base64_audio = base64.b64encode(audio_content).decode("utf-8")
        return base64_audio
    except Exception as e:
        print(f"Error generating speech: {e}")
        return ""
