"""timing.py · voice → timing.json  (Ratings, part 1) (the single timeline every other part reads).

  .venv/bin/python timing.py draft              # no voice yet: an estimated timeline from the script (to build the shots)
  .venv/bin/python timing.py take               # the voiceover: tighten pauses, optional speed-up (TEMPO), time the words
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
  ('L1', 'What if everyone had ratings above their heads?', {}),
  ('L2', 'Strength. Athleticism. Health. IQ. EQ. Mental health. Potential.', {'IQ.': 2, 'EQ.': 2}),
  ('L3', 'They update live. Go for a run, athleticism goes up. Skip sleep, health goes down.', {}),
  ('L4', 'And nobody dates more than ten points away from their own overall.', {}),
  ('L5', 'This is Theo. Overall 52. Painfully average.', {'52.': 3}),
  ('L6', 'At the bottom of his card there\'s a small grey number. Potential: 99. Nobody reads the small grey number.', {'99.': 4}),
  ('L7', 'Theo is in love with Mia. Overall 88. That\'s a 36-point gap. In this city, that\'s not a crush. That\'s a joke.', {'88.': 3, '36-point': 4}),
  ('L8', 'The day they meet, Theo\'s mental health has been sinking for weeks. 61. 52. 44. Thousands of people walked past that number.', {'61.': 3, '52.': 3, '44.': 3}),
  ('L9', 'Mia is the first one who stops and asks, "Are you okay?" And every time she laughs at his jokes, his mental health goes up by one.', {}),
  ('L10', 'When two people look at each other, one more number appears. Compatibility.', {}),
  ('L11', 'Theo and Mia: zero percent. Mia and the highest-rated guy in the city: 97. Follow for part 2.', {'97.': 3, '2.': 1}),
]
# the voiceover (the creator's ElevenLabs read, one take of all lines): where each line sits in the raw file
TAKE = os.environ.get('TAKE', 'voice/vo.wav')
TAKE_SPLITS = [2.65, 8.935, 14.885, 18.615, 22.915, 30.045, 38.72, 48.205, 56.01, 60.61]   # mid-pause between lines (s), measured from the recording
TEMPO = float(os.environ.get('TEMPO', 1.2))   # sped up (pitch unchanged), like the other Shorts
GAPS = {f'L{i}': .15 for i in range(2, 12)}   # pause before each line
MAXP = .2                          # longest pause kept inside a line (the "…" beats)

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

def dp_split(wa, wb):
    """Split list A (weights wa) into len(wb) contiguous blocks whose weight shares best match wb's shares → block start indices."""
    n, k = len(wa), len(wb); SA, SB = sum(wa), sum(wb); INF = 1e18
    best = [[INF] * (n + 1) for _ in range(k + 1)]; arg = [[0] * (n + 1) for _ in range(k + 1)]; best[0][0] = 0
    for j in range(1, k + 1):
        for e in range(j, n - (k - j) + 1):
            for st in range(j - 1, e):
                if best[j - 1][st] >= INF: continue
                c = best[j - 1][st] + (sum(wa[st:e]) / SA - wb[j - 1] / SB) ** 2
                if c < best[j][e]: best[j][e] = c; arg[j][e] = st
    cuts = [n]; e = n
    for j in range(k, 0, -1): e = arg[j][e]; cuts.append(e)
    return cuts[::-1]

def place_words(text, over, segs):
    """Spread the caption words over the voiced parts: phrases (split at punctuation) are paired with runs of voiced parts
    first; a phrase spoken across several parts is then split between them word by word (by syllables)."""
    ws = words_of(text)
    groups, cur = [], []
    for w in ws:
        cur.append(w)
        if re.search(r'[,.…!?:]$', w): groups.append(cur); cur = []
    if cur: groups.append(cur)
    sw = lambda g: sum(syl(w, over) for w in g)
    pairs = []                                   # (words, [voiced parts])
    if len(groups) >= len(segs):                 # more phrases than parts: merge neighbouring phrases
        cuts = dp_split([sw(g) for g in groups], [b - a for a, b in segs]) if len(segs) > 1 else [0, len(groups)]
        pairs = [(sum(groups[cuts[j]:cuts[j + 1]], []), [segs[j]]) for j in range(len(segs))]
    else:                                        # more parts than phrases: give each phrase a run of parts
        cuts = dp_split([b - a for a, b in segs], [sw(g) for g in groups]) if len(groups) > 1 else [0, len(segs)]
        pairs = [(groups[j], segs[cuts[j]:cuts[j + 1]]) for j in range(len(groups))]
    out = []
    for words, parts in pairs:
        if len(parts) > len(words): parts = [[parts[0][0], parts[-1][1]]]
        if len(parts) > 1:
            wc = dp_split([syl(w, over) for w in words], [b - a for a, b in parts])
            runs = [(words[wc[j]:wc[j + 1]], parts[j]) for j in range(len(parts))]
        else: runs = [(words, parts[0])]
        for rw, (a, b) in runs:
            tot = sum(syl(w, over) for w in rw); acc = a
            for w in rw:
                d = (b - a) * syl(w, over) / tot; out.append({'w': w, 't0': round(acc, 3), 't1': round(acc + d, 3)}); acc += d
    return out

def snap_cut(t, prev_cut, prev_end=-9, v0=9e9):
    c = np.floor((t - 0.02) / B) * B                 # the beat at or before the voice
    if t - c > B - 1e-6: c += B
    c = max(c, prev_cut + 2 * B)                     # every scene gets at least two beats
    while c < prev_end - .05 and c + B <= v0 + .1: c += B   # never cut away while the last line is still being said
    return round(float(c), 3)

def build(lines_audio, voice_path, dur_audio):
    lines, prev = [], -9
    for (lid, text, over), (a, segs) in zip(SCRIPT, lines_audio):
        segs_abs = [[a + s0, a + s1] for s0, s1 in segs]
        words = place_words(text, over, segs_abs)
        cut = 0.0 if not lines else snap_cut(segs_abs[0][0] - LEAD, prev, lines[-1]['t1'], segs_abs[0][0]); prev = cut
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

def draft(rate=5.1, gap=.22):
    """No audio yet: lay the lines out at a brisk read (syllables per second), with short pauses and the "…" beats."""
    t = .12; lines_audio = []
    for lid, text, over in SCRIPT:
        t += GAPS.get(lid, 0) + (gap if lid != 'L1' else 0); segs = []; a = t
        for w in words_of(text):
            d = syl(w, over) / rate; t += d
            if w.endswith('…'): segs.append([a, t]); t += .2; a = t
            elif re.search(r'[.!?:,]$', w): segs.append([a, t]); t += .08; a = t
        if a < t: segs.append([a, t])
        lines_audio.append((0.0, segs))
    return build(lines_audio, None, t + .6)

if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'scratch'
    T = draft() if mode == 'draft' else take() if mode in ('take', 'scratch') else user(sys.argv[2])
    json.dump(T, open(os.path.join(D, 'timing.json'), 'w'), indent=1, ensure_ascii=False)
    for l in T['lines']: print(f"{l['id']} cut {l['cut']:6.2f}  voice {l['t0']:6.2f}–{l['t1']:6.2f}  {l['text']}")
    print('dur', T['dur'])
