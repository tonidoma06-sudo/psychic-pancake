"""timing.py · voice → timing.json (the single timeline every other part reads).

  .venv/bin/python timing.py take               # the expressive ElevenLabs take: tighten pauses, speed up 15 %, time the words
  .venv/bin/python timing.py user voice.wav     # use YOUR recording: finds each line by its pauses (or Whisper words if a
                                                # model is available: WHISPER_MODEL=/path/to/faster-whisper-base.en)

Output: timing.json = { bpm, dur, voice, lines: [{id, t0, t1, cut, words: [{w, t0, t1}]}] }
  t0/t1 = when the line is spoken; cut = the beat its scene starts on (at or just before t0);
  words = the caption words (as displayed: digits) with their times.
"""
import json, os, re, sys
import numpy as np, soundfile as sf
D = os.path.dirname(os.path.abspath(__file__))
BPM = 120; B = 60 / BPM
LEAD = 0.20              # the scene cut lands this long (at most a beat) before the line is heard

# caption words as shown on screen, with a syllable weight for timing (spoken form)
SCRIPT = [
  ('L1', 'This man bought 12,000 cups of pudding…', {'12,000': 4}),
  ('L2', 'and turned them into over a MILLION airline miles!', {}),
  ('L3', 'In 1999, a pudding brand was giving away airline miles for every barcode.', {'1999,': 5}),
  ('L4', 'And engineer David Phillips did the math. The miles were worth WAY more than the pudding!', {}),
  ('L5', 'So he bought every cup he could find. 12,150!', {'12,150!': 9}),
  ('L6', 'But there was a problem: 12,000 labels to peel… before the deadline.', {'12,000': 4}),
  ('L7', 'His genius move? He gave the pudding to charity… and the volunteers peeled them for him!', {}),
  ('L8', '1.25 million miles. Lifetime elite status.', {'1.25': 5}),
  ('L9', 'And a tax write-off… for the pudding.', {}),
]
# the expressive take (ElevenLabs v4, voice "Harrison", one read of all 9 lines): where each line sits in the raw file
TAKE = 'voice/harrison_full.wav'
TAKE_SPLITS = [3.22, 6.63, 12.30, 17.92, 23.69, 29.38, 35.18, 40.25]   # mid-pause between lines (s)
TEMPO = 1.22                       # sped up 22 % (pitch unchanged): ~3.2 spoken words/s, like the v4 reference
GAPS = {'L2': .1, 'L3': .16, 'L4': .14, 'L5': .14, 'L6': .16, 'L7': .16, 'L8': .18, 'L9': .24}   # pause before each line
MAXP = .2                         # longest pause kept inside a line (the "…" beats)

def syl(w, over):
    if w in over: return over[w]
    w = re.sub(r'[^a-z]', '', w.lower())
    n = len(re.findall(r'[aeiouy]+', w)) - (1 if w.endswith('e') and len(w) > 3 and not w.endswith('le') else 0)
    return max(1, n)

def words_of(text):
    return text.replace('…', '… ').split()

def env(x, sr, hop=0.01):
    h = int(sr * hop); n = len(x) // h
    return np.array([np.sqrt(np.mean(x[i * h:(i + 1) * h] ** 2)) for i in range(n)]), hop

def voiced_segments(x, sr, gap=0.14):
    e, hop = env(x, sr); thr = max(1e-4, 0.08 * np.percentile(e, 95))
    on = e > thr; segs = []; i = 0
    while i < len(on):
        if on[i]:
            j = i
            while j < len(on) and on[j]: j += 1
            segs.append([i * hop, j * hop]); i = j
        else: i += 1
    merged = []
    for s in segs:
        if merged and s[0] - merged[-1][1] < gap: merged[-1][1] = s[1]
        else: merged.append(s)
    return merged

def place_words(text, over, segs):
    """Spread the caption words over the voiced segments, phrase by phrase where the pauses allow."""
    ws = words_of(text)
    groups, cur = [], []
    for w in ws:
        cur.append(w)
        if re.search(r'[,.…!?:]$', w): groups.append(cur); cur = []
    if cur: groups.append(cur)
    t0, t1 = segs[0][0], segs[-1][1]
    if len(groups) == len(segs):
        spans = [(a, b) for a, b in segs]
    else:                                    # one span per group, proportional to syllables over the whole line
        tot = sum(sum(syl(w, over) for w in g) for g in groups); spans = []; acc = t0
        for g in groups:
            d = (t1 - t0) * sum(syl(w, over) for w in g) / tot; spans.append((acc, acc + d)); acc += d
    out = []
    for g, (a, b) in zip(groups, spans):
        tot = sum(syl(w, over) for w in g); acc = a
        for w in g:
            d = (b - a) * syl(w, over) / tot; out.append({'w': w, 't0': round(acc, 3), 't1': round(acc + d, 3)}); acc += d
    return out

def snap_cut(t, prev_cut):
    c = np.floor((t - 0.02) / B) * B                 # the beat at or before the voice
    if t - c > B - 1e-6: c += B
    c = max(c, prev_cut + 2 * B)                     # every scene gets at least two beats
    return round(float(c), 3)

def build(lines_audio, voice_path, dur_audio):
    lines, prev = [], -9
    for (lid, text, over), (a, segs) in zip(SCRIPT, lines_audio):
        segs_abs = [[a + s0, a + s1] for s0, s1 in segs]
        words = place_words(text, over, segs_abs)
        cut = 0.0 if not lines else snap_cut(segs_abs[0][0] - LEAD, prev); prev = cut
        lines.append({'id': lid, 'text': text, 't0': round(segs_abs[0][0], 3), 't1': round(segs_abs[-1][1], 3), 'cut': cut, 'words': words})
    end = lines[-1]['t1'] + 1.8                      # the punchline holds, then the loop cut
    dur = float(np.ceil(end / B) * B)
    return {'bpm': BPM, 'dur': round(dur, 3), 'voice': voice_path, 'audio_dur': round(dur_audio, 3), 'lines': lines}

def take():
    """The expressive take → voice/take.wav: tighten the pauses, speed it up (ffmpeg atempo), then time every word."""
    import subprocess, tempfile
    x, sr = sf.read(os.path.join(D, TAKE))
    if x.ndim > 1: x = x.mean(1)
    edges = [0.0] + TAKE_SPLITS + [len(x) / sr]; parts = []
    for i, (lid, _, _) in enumerate(SCRIPT):
        a, b = edges[i], edges[i + 1]; seg = x[int(a * sr):int(b * sr)]
        vs = voiced_segments(seg, sr, gap=0.10); out = []
        for k, (s0, s1) in enumerate(vs):
            if k: out.append(np.zeros(int(min(MAXP, s0 - vs[k - 1][1]) * sr)))
            out.append(seg[max(0, int((s0 - .02) * sr)):int((s1 + .04) * sr)])
        parts.append((lid, np.concatenate(out)))
    full = [np.zeros(int(.12 * sr))]
    for lid, p in parts:
        if lid in GAPS: full.append(np.zeros(int(GAPS[lid] * sr)))
        full.append(p)
    full.append(np.zeros(int(.6 * sr))); full = np.concatenate(full)
    tmp = os.path.join(tempfile.mkdtemp(), 'j.wav'); sf.write(tmp, full, sr)
    out = os.path.join(D, 'voice/take.wav')
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', tmp, '-filter:a', f'atempo={TEMPO}', '-ar', str(sr), out], check=True)
    y, _ = sf.read(out)
    # where each line landed: walk the same layout, scaled by the tempo
    t = .12; spans = []
    for lid, p in parts:
        t += GAPS.get(lid, 0); spans.append((t / TEMPO, (t + len(p) / sr) / TEMPO)); t += len(p) / sr
    lines_audio = []
    for a, b in spans:
        seg = y[int(max(0, a - .05) * sr):int((b + .05) * sr)]
        vs = voiced_segments(seg, sr, gap=0.14); off = max(0, a - .05)
        lines_audio.append((off, vs))
    json.dump({lid: round((b - a), 3) for (lid, _, _), (a, b) in zip(SCRIPT, spans)}, open(os.path.join(D, 'voice/scratch/dur.json'), 'w'), indent=1)
    return build(lines_audio, 'voice/take.wav', len(y) / sr)

def user(path):
    x, sr = sf.read(path)
    if x.ndim > 1: x = x.mean(1)
    model = os.environ.get('WHISPER_MODEL')
    if model:
        from faster_whisper import WhisperModel
        segs, _ = WhisperModel(model, compute_type='int8').transcribe(path, language='en', word_timestamps=True)
        heard = [w for s in segs for w in s.words]
        print(f'whisper: {len(heard)} words heard')
        # split the heard words into the 8 script lines by word count (the script is read as written)
        counts = [len(words_of(t)) for _, t, _ in SCRIPT]; tot = sum(counts); idx = 0; per = []
        for c in counts:
            k = round(c * len(heard) / tot); chunk = heard[idx:idx + max(1, k)]; idx += max(1, k)
            per.append([[chunk[0].start, chunk[-1].end]] if chunk else [[0, 0.1]])
        per[-1] = [[per[-1][0][0], heard[-1].end]]
        return build([(0.0, p) for p in per], os.path.relpath(path, D), len(x) / sr)
    # no model: split the voiced segments into the 8 lines where pauses are long AND each line's length matches
    # its share of the script (syllables) — dynamic programming over every possible set of 7 boundaries
    segs = voiced_segments(x, sr, gap=0.10)
    n, L = len(segs), len(SCRIPT)
    if n < L: raise SystemExit(f'only {n} voiced parts found: read with a short pause between lines')
    ref = os.path.join(D, 'voice/scratch/dur.json')            # the scratch read's line lengths are the best guess of the proportions
    if os.path.exists(ref): rd = json.load(open(ref)); sy = [rd[lid] for lid, _, _ in SCRIPT]
    else: sy = [sum(syl(w, over) for w in words_of(t)) for _, t, over in SCRIPT]
    span = segs[-1][1] - segs[0][0]
    voiced = sum(e - s0 for s0, e in segs); pause_share = (span - voiced) / L
    exp_ = [voiced * k / sum(sy) + pause_share * .5 for k in sy]
    gap = [0] + [segs[i][0] - segs[i - 1][1] for i in range(1, n)]
    INF = 1e18; best = [[INF] * (n + 1) for _ in range(L + 1)]; arg = [[0] * (n + 1) for _ in range(L + 1)]
    best[0][0] = 0
    for k in range(1, L + 1):
        for b in range(k, n - (L - k) + 1):
            for a in range(k - 1, b):
                if best[k - 1][a] >= INF: continue
                d = segs[b - 1][1] - segs[a][0]
                c = best[k - 1][a] + ((d - exp_[k - 1]) / exp_[k - 1]) ** 2 - (float(os.environ.get('GAPW', 0.3)) * min(gap[a], .8) if a > 0 else 0)
                if c < best[k][b]: best[k][b] = c; arg[k][b] = a
    bounds = [n]; b = n
    for k in range(L, 0, -1): b = arg[k][b]; bounds.append(b)
    bounds = bounds[::-1]
    per = [segs[bounds[k]:bounds[k + 1]] for k in range(L)]
    return build([(0.0, p) for p in per], os.path.relpath(path, D), len(x) / sr)

if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'scratch'
    T = take() if mode in ('take', 'scratch') else user(sys.argv[2])
    json.dump(T, open(os.path.join(D, 'timing.json'), 'w'), indent=1, ensure_ascii=False)
    for l in T['lines']: print(f"{l['id']} cut {l['cut']:6.2f}  voice {l['t0']:6.2f}–{l['t1']:6.2f}  {l['text']}")
    print('dur', T['dur'])
