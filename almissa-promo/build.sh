#!/bin/sh
# One-command build: picture, events, sound, master.  LIB = the Lemo-Opuscar library folder.
set -e
LIB=${LIB:-/root/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd)
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/mix.py"
if ! sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/almissa-promo.mp4" 24 0; then
  # ffmpeg 6 fallback: one measured gain to about -14 LUFS plus a limiter
  I=$(ffmpeg -hide_banner -nostats -i "$HERE/out/mix.wav" -af ebur128 -f null - 2>&1 | grep -A1 "Integrated loudness" | grep "I:" | awk '{print $2}')
  G=$(python3 -c "print(round(-14-($I)-0.3,2))")
  ffmpeg -hide_banner -loglevel error -y -i "$HERE/out/video.mp4" -i "$HERE/out/mix.wav" -filter:a "volume=${G}dB,alimiter=limit=0.89:level=false" \
    -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "$HERE/almissa-promo.mp4"
fi
