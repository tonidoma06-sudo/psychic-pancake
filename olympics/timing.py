"""timing.py · voice → timing.json for "The Worst Race in Olympic History".
The ElevenLabs take (George, eleven_v4, one read of all 33 lines) is split into its lines by its pauses (dynamic programming
against each line's expected length), inner pauses are capped, the lines are re-joined with short gaps (a longer breath before
each chapter), and every caption word is timed by syllables inside its line's voiced parts.
  .venv/bin/python timing.py"""
import json, os, sys
import numpy as np, soundfile as sf
D = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, D)
from timing_lib import voiced_segments, place_words, syl, words_of
from script import LINES
BPM = 120; B = 60 / BPM
TAKE = 'voice/george_full.wav'
GAP, CH_GAP, MAXP, LEAD = .32, 2.6, .32, .2

def split(x, sr):
    segs = voiced_segments(x, sr, gap=0.10); n, L = len(segs), len(LINES)
    sy = [sum(syl(w, {}) for w in words_of(t)) for _, _, t in LINES]
    span = segs[-1][1] - segs[0][0]; voiced = sum(e - s for s, e in segs)
    exp_ = [voiced * k / sum(sy) for k in sy]
    gap = [0] + [segs[i][0] - segs[i - 1][1] for i in range(1, n)]
    INF = 1e18; best = [[INF] * (n + 1) for _ in range(L + 1)]; arg = [[0] * (n + 1) for _ in range(L + 1)]; best[0][0] = 0
    for k in range(1, L + 1):
        for b in range(k, n - (L - k) + 1):
            for a in range(max(k - 1, b - 12), b):
                if best[k - 1][a] >= INF: continue
                v = sum(segs[j][1] - segs[j][0] for j in range(a, b))
                c = best[k - 1][a] + ((v - exp_[k - 1]) / exp_[k - 1]) ** 2 - (1.2 * min(gap[a], .9) if a > 0 else 0)
                if c < best[k][b]: best[k][b] = c; arg[k][b] = a
    bounds = [n]; b = n
    for k in range(L, 0, -1): b = arg[k][b]; bounds.append(b)
    bounds = bounds[::-1]
    return [segs[bounds[k]:bounds[k + 1]] for k in range(L)]

x, sr = sf.read(os.path.join(D, TAKE))
if x.ndim > 1: x = x.mean(1)
per = split(x, sr)
out = [np.zeros(int(.25 * sr))]; t = .25; lines = []; prev_ch = None; prev_cut = -9
for (lid, ch, text), segs in zip(LINES, per):
    if lines: g = CH_GAP if ch != prev_ch else GAP; out.append(np.zeros(int(g * sr))); t += g
    a0 = t; parts = []; rel = []
    for k, (s0, s1) in enumerate(segs):
        if k: p = min(MAXP, s0 - segs[k - 1][1]); out.append(np.zeros(int(p * sr))); t += p
        chunk = x[max(0, int((s0 - .03) * sr)):int((s1 + .05) * sr)]; out.append(chunk); rel.append([t + .03, t + len(chunk) / sr - .05]); t += len(chunk) / sr
    words = place_words(text, {}, rel)
    v0 = rel[0][0]; c = np.floor((v0 - LEAD) / B) * B
    if ch != prev_ch and lines: c = max(c, lines[-1]['t1'] + .15)
    cut = round(float(max(c, prev_cut + 2 * B if lines else 0)), 3) if lines else 0.0
    if lines and cut > v0: cut = round(v0 - .05, 3)
    prev_cut = cut
    lines.append({'id': lid, 'ch': ch, 'text': text, 't0': round(v0, 3), 't1': round(rel[-1][1], 3), 'cut': cut, 'words': words}); prev_ch = ch
end = lines[-1]["t1"] + 5.5; out.append(np.zeros(int((end - t + 1) * sr))); y = np.concatenate(out)
y = y / max(1e-6, np.abs(y).max()) * .89; sf.write(os.path.join(D, 'voice/take.wav'), y, sr)
dur = float(np.ceil(end / B) * B)
chapters = []; [chapters.append({'ch': l['ch'], 't0': l['cut']}) for i, l in enumerate(lines) if i == 0 or l['ch'] != lines[i - 1]['ch']]
json.dump({'bpm': BPM, 'dur': round(dur, 3), 'voice': 'voice/take.wav', 'chapters': chapters, 'lines': lines}, open(os.path.join(D, 'timing.json'), 'w'), indent=1, ensure_ascii=False)
for l in lines: print(f"{l['id']:4} {l['ch']:6} cut {l['cut']:7.2f} voice {l['t0']:7.2f}–{l['t1']:7.2f} ({len(l['words'])}w) {l['text'][:60]}")
print('dur', dur, 'words', sum(len(l['words']) for l in lines))
