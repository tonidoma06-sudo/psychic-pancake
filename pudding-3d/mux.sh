#!/bin/sh
# mux.sh video.mp4 mix.wav out.mp4 · the library's mux.sh first (ffmpeg 7+); on ffmpeg 6, one measured gain to about −14 LUFS + a limiter
set -e
LIB=${LIB:-/root/lemo-opuscar}
if sh "$LIB/core/render/mux.sh" "$1" "$2" "$3" 24 0 2>/dev/null; then exit 0; fi
I=$(ffmpeg -hide_banner -nostats -i "$2" -af ebur128 -f null - 2>&1 | grep -A1 "Integrated loudness" | grep "I:" | awk '{print $2}')
G=$(python3 -c "print(round(-14-($I)-0.3,2))")
ffmpeg -hide_banner -loglevel error -y -i "$1" -i "$2" -filter:a "volume=${G}dB,alimiter=limit=0.8:level=false" \
  -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "$3"
echo "muxed $3 (gain ${G} dB from ${I} LUFS)"
