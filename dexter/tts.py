"""tts.py · the narration with the free local Kokoro model (one file per line) → voice/lines/L*.wav
   /root/tts-venv/bin/python tts.py [voice] [speed]"""
import os, sys, json, soundfile as sf
from kokoro_onnx import Kokoro
D = os.path.dirname(os.path.abspath(__file__))
LINES = [
  ('L1', 'The dumbest man in America got rich... from terrible advice!'),
  ('L2', 'Seventeen nineties. Rival merchants wanted Timothy Dexter broke.'),
  ('L3', 'So they told him: ship bed warmers... to the Caribbean!'),
  ('L4', 'He did. They used them as molasses ladles. Sold out!'),
  ('L5', 'Next: wool mittens... to the tropics. Traders bought them all, for Siberia!'),
  ('L6', 'Then: coal... to a coal town. The miners were on strike. Sold out again!'),
  ('L7', 'So Dexter wrote a book... with no punctuation at all.'),
  ('L8', 'Readers complained. So the second edition added a page of just punctuation...'),
  ('L9', 'so they could salt and pepper it as they please.'),
]
voice = sys.argv[1] if len(sys.argv) > 1 else 'am_michael'; speed = float(sys.argv[2]) if len(sys.argv) > 2 else 1.15
k = Kokoro('/root/kokoro/kokoro-v1.0.onnx', '/root/kokoro/voices-v1.0.bin')
out = os.path.join(D, 'voice', 'lines', voice); os.makedirs(out, exist_ok=True); info = {}
for lid, text in LINES:
    s, sr = k.create(text, voice=voice, speed=speed, lang='en-us')
    sf.write(os.path.join(out, lid + '.wav'), s, sr); info[lid] = round(len(s) / sr, 2)
print(voice, speed, info, 'total', round(sum(info.values()), 2))
