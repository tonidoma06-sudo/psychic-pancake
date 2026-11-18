"""timing.py · voice → timing.json for "The Man in the Box" (vertical Short).
  v2: the same voiceover with the backstory lines and the spoken question dropped (DROP), the voice from frame 0,
  and no tail: the last line runs straight back into the first, so the Short loops.

  .venv/bin/python timing.py draft                  # no voice yet: an estimated timeline from the script (to build the shots)
  .venv/bin/python timing.py take voice/vo.mp3      # the voiceover (one read of every line): speed-up (TEMPO), split into the
                                                    # script's lines by its pauses, pauses tightened, a breath before each
                                                    # chapter (the chapter card), every caption word timed by syllables

Output: timing.json = { bpm, dur, voice, chapters: [{ch, t0, t1}], lines: [{id, ch, text, t0, t1, cut, words: [{w, t0, t1}]}] }
  t0/t1 = when the line is spoken; cut = the beat its scene starts on; chapters = when each chapter card shows.
"""
import json, os, re, sys, subprocess, tempfile
import numpy as np, soundfile as sf
D = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, D)
from script import LINES
BPM = 120; B = 60 / BPM
LEAD = .20                                   # the scene cut lands this long (at most a beat) before the line is heard
GAP, CH_GAP, MAXP = .22, .22, .32             # pause between lines (no chapters in a Short), longest pause kept inside a line
TEMPO = float(os.environ.get('TEMPO', 1.1))  # sped up like the other Shorts (pitch unchanged)
# line starts checked by ear/eye in the take, where the pauses alone are ambiguous (seconds in the raw file, before the speed-up):
# "9. 6. 4." belongs to the freeze, "Second place." to its own line, "The screen spins." to the partner reveal
FORCE = {}
DROP = set()                    # lines cut from the take (the film still splits the read by all lines)
HEAD, TAIL = .03, .45                         # silence before the first word, after the last (then the loop)

def syl(w, over):
    if w in over: return over[w]
    w = re.sub(r'[^a-z]', '', w.lower())
    n = len(re.findall(r'[aeiouy]+', w)) - (1 if w.endswith('e') and len(w) > 3 and not w.endswith('le') else 0)
    return max(1, n)

def words_of(text): return text.replace('…', '… ').split()

def env(x, sr, hop=0.01):
    h = int(sr * hop); n = len(x) // h
    return np.sqrt(np.mean(x[:n * h].reshape(n, h) ** 2, axis=1)), hop

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
    return [s for s in merged if s[1] - s[0] > .06]

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
    ws = words_of(text); groups, cur = [], []
    for w in ws:
        cur.append(w)
        if re.search(r'[,.…!?:]"?$', w): groups.append(cur); cur = []
    if cur: groups.append(cur)
    sw = lambda g: sum(syl(w, over) for w in g)
    if len(groups) >= len(segs):
        cuts = dp_split([sw(g) for g in groups], [b - a for a, b in segs]) if len(segs) > 1 else [0, len(groups)]
        pairs = [(sum(groups[cuts[j]:cuts[j + 1]], []), [segs[j]]) for j in range(len(segs))]
    else:
        cuts = dp_split([b - a for a, b in segs], [sw(g) for g in groups]) if len(groups) > 1 else [0, len(segs)]
        pairs = [(groups[j], segs[cuts[j]:cuts[j + 1]]) for j in range(len(groups))]
    out = []
    for words, parts in pairs:
        if not words: continue
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

def build(per_line, voice, LS=LINES):
    """per_line: for each script line, its voiced parts (absolute times in the final voice track) → the timeline."""
    lines, prev_cut = [], -9
    for (lid, ch, text, over), segs in zip(LS, per_line):
        v0 = segs[0][0]; words = place_words(text, over, segs)
        if not lines: cut = 0.0
        else:
            c = np.floor((v0 - LEAD) / B) * B
            if ch != lines[-1]['ch']: c = max(c, lines[-1]['t1'] + 1.6)        # the chapter card gets its moment
            c = max(c, prev_cut + 2 * B)
            if c > v0 - .02: c = v0 - .05
            cut = round(float(c), 3)
        prev_cut = cut
        lines.append({'id': lid, 'ch': ch, 'text': text, 't0': round(v0, 3), 't1': round(segs[-1][1], 3), 'cut': cut, 'words': words})
    chapters = []
    for i, l in enumerate(lines):
        if i and l['ch'] != lines[i - 1]['ch']: chapters.append({'ch': l['ch'], 't0': round(lines[i - 1]['t1'] + .35, 3), 't1': l['cut']})
    end = lines[-1]['t1'] + TAIL; dur = float(np.ceil(end * 24) / 24)   # no hold: straight back to the first frame
    return {'bpm': BPM, 'dur': round(dur, 3), 'voice': voice, 'chapters': chapters, 'lines': lines}

def gap_before(i): return 0 if i == 0 else (CH_GAP if LINES[i][1] != LINES[i - 1][1] else GAP)

def draft(rate=5.1):
    """No audio yet: lay the lines out at a brisk read (syllables per second), with short pauses at punctuation."""
    t = .25; per = []
    for i, (lid, ch, text, over) in enumerate(LINES):
        t += gap_before(i); segs = []; a = t
        for w in words_of(text):
            t += syl(w, over) / rate
            if re.search(r'[.!?:,…]"?$', w): segs.append([a, t]); t += .26 if w[-1] != ',' else .14; a = t
        if a < t - .01: segs.append([a, t])
        else: t -= .26
        per.append(segs)
    return build(per, None)

def split_lines(segs):
    """Split the take's voiced parts into the script's lines: each line's voiced length should match its share of the
    syllables, and lines should end at the longer pauses (dynamic programming over all boundaries)."""
    n, L = len(segs), len(LINES)
    if n < L: raise SystemExit(f'only {n} voiced parts found for {L} lines: read with a short pause between lines')
    sy = [sum(syl(w, over) for w in words_of(t)) for _, _, t, over in LINES]
    voiced = sum(e - s for s, e in segs); exp_ = [voiced * k / sum(sy) for k in sy]
    gap = [0] + [segs[i][0] - segs[i - 1][1] for i in range(1, n)]
    vs = np.concatenate([[0], np.cumsum([e - s for s, e in segs])])
    fx = {i: int(np.argmin([abs(s0 - FORCE[l[0]] / TEMPO) for s0, _ in segs])) for i, l in enumerate(LINES) if l[0] in FORCE}
    INF = 1e18; best = np.full((L + 1, n + 1), INF); arg = np.zeros((L + 1, n + 1), int); best[0][0] = 0
    for k in range(1, L + 1):
        for b in range(k, n - (L - k) + 1):
            if k in fx and b != fx[k]: continue          # the next line must start where it was checked
            for a in range(max(k - 1, b - 40), b):
                if best[k - 1][a] >= INF: continue
                if (k - 1) in fx and a != fx[k - 1]: continue
                v = vs[b] - vs[a]
                c = best[k - 1][a] + ((v - exp_[k - 1]) / exp_[k - 1]) ** 2 - (1.2 * min(gap[a], .9) if a > 0 else 0)
                if c < best[k][b]: best[k][b] = c; arg[k][b] = a
    bounds = [n]; b = n
    for k in range(L, 0, -1): b = arg[k][b]; bounds.append(b)
    bounds = bounds[::-1]
    return [segs[bounds[k]:bounds[k + 1]] for k in range(L)]

def take(path):
    """The voiceover → voice/take.wav (sped up, pauses tightened, chapter breaths) and its timeline."""
    tmp = os.path.join(tempfile.mkdtemp(), 'fast.wav')
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', path, '-ac', '1', '-ar', '44100', '-filter:a', f'atempo={TEMPO}', tmp], check=True)
    x, sr = sf.read(tmp)
    per = split_lines(voiced_segments(x, sr, gap=.10))
    out = [np.zeros(int(HEAD * sr))]; t = HEAD; lines = []; kept = []
    for i, segs in enumerate(per):
        if LINES[i][0] in DROP: continue
        kept.append(LINES[i])
        g = gap_before(i) if len(kept) > 1 else 0
        if g: out.append(np.zeros(int(g * sr))); t += g
        rel = []
        for k, (s0, s1) in enumerate(segs):
            if k: p = min(MAXP, s0 - segs[k - 1][1]); out.append(np.zeros(int(p * sr))); t += p
            chunk = x[max(0, int((s0 - .03) * sr)):int((s1 + .05) * sr)]; out.append(chunk); rel.append([t + .03, t + len(chunk) / sr - .05]); t += len(chunk) / sr
        lines.append(rel)
    T = build(lines, 'voice/take.wav', kept)
    out.append(np.zeros(int((T['dur'] - t + 1) * sr))); y = np.concatenate(out)
    y = y / max(1e-6, np.abs(y).max()) * .89; sf.write(os.path.join(D, 'voice/take.wav'), y, sr)
    return T

if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'draft'
    T = draft() if mode == 'draft' else take(sys.argv[2])
    json.dump(T, open(os.path.join(D, 'timing.json'), 'w'), indent=1, ensure_ascii=False)
    for l in T['lines']: print(f"{l['id']:4} {l['ch']:5} cut {l['cut']:7.2f}  voice {l['t0']:7.2f}–{l['t1']:7.2f}  {l['text'][:70]}")
    for c in T['chapters']: print(f"card {c['ch']:5} {c['t0']:7.2f}–{c['t1']:7.2f}")
    print('dur', T['dur'], 'words', sum(len(l['words']) for l in T['lines']))
