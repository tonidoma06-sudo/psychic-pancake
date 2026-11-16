#!/bin/sh
# One command, from your voice to the finished 3D Short.
#   sh build.sh                 → timed to the scratch read  → pudding-3d_voice.mp4 (+ pudding-3d_no-voice.mp4)
#   sh build.sh my-voice.wav    → re-timed to YOUR recording → pudding-3d.mp4 (wav, mp3 or m4a)
set -e
LIB=${LIB:-/root/lemo-opuscar}; export LIB
HERE=$(cd "$(dirname "$0")" && pwd); cd "$HERE"
PY="$LIB/.venv/bin/python"
if [ -z "$1" ]; then "$PY" timing.py take; V=voice/take.wav; OUT=pudding-3d_voice.mp4
else
  case "$1" in *.wav) SRC="$1" ;; *) ffmpeg -hide_banner -loglevel error -y -i "$1" -ac 1 -ar 44100 voice/user.wav; SRC=voice/user.wav ;; esac
  "$PY" timing.py user "$SRC"; V="$SRC"; OUT=pudding-3d.mp4
fi
cd "$LIB"
node core/render/events.mjs "$HERE" --size 1080x1920
node core/render/readcheck.mjs "$HERE" --size 1080x1920 || echo "! readcheck: some text is shorter than its reading time (see above)"
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --size 1080x1920 --out "$HERE/out/video.mp4"
cd "$HERE"
"$PY" music.py out/mix.wav "$V"
sh mux.sh out/video.mp4 out/mix.wav "$OUT"
[ -n "$1" ] || { "$PY" music.py out/mix_novoice.wav none; sh mux.sh out/video.mp4 out/mix_novoice.wav pudding-3d_no-voice.mp4; }
"$PY" -c "
import json; T = json.load(open('timing.json'))
c = [{'t0': l['t0'], 't1': max(l['t1'] + .3, l['t0'] + 1.8), 'text': l['text']} for l in T['lines']]
for a, b in zip(c, c[1:]): a['t1'] = min(a['t1'], b['t0'] - .02)
json.dump(c, open('out/cues.json', 'w'))"
"$PY" "$LIB/core/render/srt.py" out/cues.json pudding-3d.srt
echo "done → $OUT"
