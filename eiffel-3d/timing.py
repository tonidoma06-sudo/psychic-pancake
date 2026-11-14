"""timing.py · voice → timing.json (the single timeline every other part reads).

  .venv/bin/python timing.py scratch            # place the scratch TTS lines (voice/scratch/L*.wav) on the beat grid
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
  ('L1', 'In 1925, a man sold the Eiffel Tower… for scrap.', {'1925': 5}),
  ('L2', 'Victor Lustig read that the tower was expensive to keep up.', {}),
  ('L3', 'Posing as a government official, he invited scrap dealers to a secret meeting at a luxury Paris hotel.', {}),
  ('L4', 'He told them the city was quietly selling the tower, so it had to stay secret.', {}),
  ('L5', 'One dealer, André Poisson, wanted it so badly he paid, and even slipped him a bribe.', {}),
  ('L6', 'Lustig fled with the money, and Poisson was too embarrassed to go to the police.', {}),
  ('L7', 'So Lustig came back… and tried to sell it again.', {}),
  ('L8', 'This time, a dealer went to the police, and Lustig had to run.', {}),
  ('L9', "If a deal is secret, urgent, and too good to miss, it's probably a scam.", {}),
]

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
        if re.search(r'[,.…]$', w): groups.append(cur); cur = []
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
        cut = snap_cut(segs_abs[0][0] - LEAD, prev); prev = cut
        lines.append({'id': lid, 'text': text, 't0': round(segs_abs[0][0], 3), 't1': round(segs_abs[-1][1], 3), 'cut': cut, 'words': words})
    end = lines[-1]['t1'] + 2.6                      # the report card holds, then the loop cut
    dur = float(np.ceil(end / B) * B)
    return {'bpm': BPM, 'dur': round(dur, 3), 'voice': voice_path, 'audio_dur': round(dur_audio, 3), 'lines': lines}

def scratch():
    sd = os.path.join(D, 'voice/scratch'); sr = None; pieces = []; t = 0.0
    GAP = {'L2': .35, 'L3': .25, 'L4': .25, 'L5': .3, 'L6': .3, 'L7': .45, 'L8': .3, 'L9': .5}
    for i, (lid, text, over) in enumerate(SCRIPT):
        x, sr = sf.read(os.path.join(sd, lid + '.wav'))
        if x.ndim > 1: x = x.mean(1)
        start = 0.25 if i == 0 else t + GAP[lid]
        segs = voiced_segments(x, sr); lead_sil = segs[0][0]
        start -= lead_sil
        pieces.append((start, x, segs)); t = start + segs[-1][1]
    total = int((t + 3.5) * sr); mix = np.zeros(total)
    for start, x, _ in pieces:
        i = int(start * sr); mix[i:i + len(x)] += x[:total - i]
    out = os.path.join(D, 'voice/scratch_full.wav'); sf.write(out, mix, sr)
    return build([(s, segs) for s, _, segs in pieces], 'voice/scratch_full.wav', len(mix) / sr)

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
    T = scratch() if mode == 'scratch' else user(sys.argv[2])
    json.dump(T, open(os.path.join(D, 'timing.json'), 'w'), indent=1, ensure_ascii=False)
    for l in T['lines']: print(f"{l['id']} cut {l['cut']:6.2f}  voice {l['t0']:6.2f}–{l['t1']:6.2f}  {l['text']}")
    print('dur', T['dur'])
