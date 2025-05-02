from textblob import TextBlob
import json
from colorama import init, Fore

init(autoreset=True)

# Load songs based on mood
with open('songs.json', 'r') as f:
    songs = json.load(f)

# Ask user for input
user_input = input(Fore.CYAN + "👋 Hey! How are you feeling today?\n> ")

# Sentiment analysis
blob = TextBlob(user_input)
sentiment = blob.sentiment.polarity

# Mood classification
if sentiment > 0.5:
    mood = "Happy"
elif sentiment < -0.2:
    mood = "Sad"
else:
    mood = "Neutral"

# Recommend song
song = songs.get(mood, ["No songs found"])[0]

# Output
print(Fore.YELLOW + f"\n🧠 Detected Mood: {mood}")
print(Fore.GREEN + f"🎵 Recommended Song: {song}")
