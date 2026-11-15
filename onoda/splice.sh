#!/bin/sh
# splice.sh full.mp4 out.mp4 a1 b1 fix1.mp4 [a2 b2 fix2.mp4 ...]
# Replace stretches [a, b) of a 24 fps render with re-rendered clips (node core/render/video.mjs . --q 'a=..&b=..').
# Frame-accurate: every piece is cut by frame number and the whole film is encoded once more (crf 14, like the render).
set -e
IN=$1; OUT=$2; shift 2
FPS=24; ARGS="-i $IN"; F=""; n=0; k=1; prev=0; MAP=""
while [ $# -ge 3 ]; do
  a=$(python3 -c "print(round($1*$FPS))"); b=$(python3 -c "print(round($2*$FPS))"); ARGS="$ARGS -i $3"
  F="$F[0:v]trim=start_frame=$prev:end_frame=$a,setpts=PTS-STARTPTS[p$n];"; MAP="$MAP[p$n]"; n=$((n+1))
  F="$F[$k:v]trim=start_frame=0:end_frame=$((b-a)),setpts=PTS-STARTPTS[p$n];"; MAP="$MAP[p$n]"; n=$((n+1))
  prev=$b; k=$((k+1)); shift 3
done
F="$F[0:v]trim=start_frame=$prev,setpts=PTS-STARTPTS[p$n];"; MAP="$MAP[p$n]"; n=$((n+1))
ffmpeg -hide_banner -loglevel error -y $ARGS -filter_complex "${F}${MAP}concat=n=$n:v=1:a=0[v]" -map "[v]" -r $FPS -c:v libx264 -preset medium -crf 14 -pix_fmt yuv420p "$OUT"
echo "spliced $OUT ($(ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 "$OUT") frames)"
