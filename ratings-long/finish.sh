#!/bin/sh
# finish.sh · after render.sh: score + mixes, a two-pass web encode (10 Mb/s), loudness to -14 LUFS, voice + no-voice deliverables, thumbnail
set -e
D=$(cd "$(dirname "$0")" && pwd); cd $D
PY=/root/lemo-opuscar/.venv/bin/python
$PY music.py out/mix.wav voice/take.wav; $PY music.py out/mix_novoice.wav none
cd out
ffmpeg -hide_banner -loglevel error -y -i video.mp4 -c:v libx264 -preset slow -b:v 10000k -maxrate 14000k -bufsize 20000k -pass 1 -passlogfile x264pass -pix_fmt yuv420p -an -f mp4 /dev/null
ffmpeg -hide_banner -loglevel error -y -i video.mp4 -c:v libx264 -preset slow -b:v 10000k -maxrate 14000k -bufsize 20000k -pass 2 -passlogfile x264pass -pix_fmt yuv420p -movflags +faststart video_web.mp4
cd $D
for v in voice no-voice; do
  m=out/mix.wav; [ $v = no-voice ] && m=out/mix_novoice.wav
  I=$(ffmpeg -hide_banner -nostats -i $m -af ebur128 -f null - 2>&1 | grep -A1 "Integrated loudness" | grep "I:" | awk '{print $2}')
  G=$(python3 -c "print(round(-14-($I)-0.3,2))")
  ffmpeg -hide_banner -loglevel error -y -i out/video_web.mp4 -i $m -map 0:v -map 1:a -filter:a "volume=${G}dB,alimiter=limit=0.8:level=false" -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart ratings-longform_$v.mp4
  echo "muxed ratings-longform_$v.mp4 (gain $G dB from $I LUFS)"
done
/root/lemo-opuscar/.venv/bin/python subs.py
cd /root/lemo-opuscar && node core/render/still.mjs $D 1 --size 1920x1080 --q "thumb=1" --prefix thumb_ --out $D/out >/dev/null 2>&1 && cp $D/out/thumb_1.jpg $D/thumbnail.jpg && cd $D
ls -la $D/ratings-longform_*.mp4
echo "finished $(date -u +%H:%M)"
