#!/bin/sh
# render.sh · the film in 30-second segments (each survives a restart), then joined frame-accurately
D=$(cd "$(dirname "$0")" && pwd); cd /root/lemo-opuscar; mkdir -p $D/out
DUR=$(python3 -c "import json; print(json.load(open('$D/timing.json'))['dur'])")
SEGS=$(python3 -c "
d=$DUR; a=0.0; out=[]
while a < d - 1e-6: b=min(d, a+30); out.append(f'{a:g}:{b:g}'); a=b
print(' '.join(out))")
: > $D/out/segs.txt
for ab in $SEGS; do
  a=${ab%:*}; b=${ab#*:}; f=$D/out/seg_$a.mp4; echo "file 'seg_$a.mp4'" >> $D/out/segs.txt
  [ -s $f ] && continue
  node core/render/video.mjs $D --size 1920x1080 --workers 3 --q "a=$a&b=$b" --out $f.tmp.mp4 && mv $f.tmp.mp4 $f || exit 1
  echo "seg $a done $(date -u +%H:%M)"
done
cd $D/out && ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i segs.txt -c copy video.mp4 && echo "joined $(ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 video.mp4) frames"
