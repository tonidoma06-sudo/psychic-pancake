"""music.py · score + SFX (+ voice) of "The Worst Race in Olympic History", synthesised from events.json and timing.json.
  python music.py out/mix.wav voice/take.wav      # with the voice
  python music.py out/mix_novoice.wav none          # score + SFX only
An original St. Louis ragtime at 120 BPM in C (stride piano: bass on 1 and 3, chords on 2 and 4, a syncopated right hand),
with chapter colours: the man in the car gets the full rag with a tuba; the rat-poison chapter goes woozy (detuned piano,
a warped dream for the hallucination); the Cuban mailman gets a habanera; his nap is a music box; the dog is a galop; the
dropouts get slow chords and Boston a fanfare. Each chapter card lands on a piano glissando and a chord hit."""
import json, os, sys, wave
import numpy as np
from scipy.signal import resample_poly
D = os.path.dirname(os.path.abspath(__file__)); os.chdir(D)
import synth_lib as S
from synth_lib import *

OUT = sys.argv[1] if len(sys.argv) > 1 else 'out/mix.wav'
VOICE = sys.argv[2] if len(sys.argv) > 2 else 'voice/take.wav'
EVJ = json.load(open('events.json')); TOTAL = EVJ['dur']; EV = EVJ['ev']
TM = json.load(open('timing.json'))
BEAT = .5; BAR = 2.0; LOOP = TOTAL - BEAT
CUT = {l['id']: l['cut'] for l in TM['lines']}
LW = {l['id']: l['words'] for l in TM['lines']}
def W(lid, word, k=0):
    ws = [x['t0'] for x in LW[lid] if ''.join(ch for ch in x['w'].lower() if ch.isalnum()).startswith(word)]
    return ws[k] if len(ws) > k else (ws[-1] if ws else LW[lid][0]['t0'])
CH = {l['id']: l['ch'] for l in TM['lines']}
CARDS = [(e['t']) for e in EV if e['s'] == 'card']
SECS = [('hook', 0)] + [(l['ch'], l['cut']) for i, l in enumerate(TM['lines']) if i and l['ch'] != TM['lines'][i - 1]['ch']]
SECS += [('hicks2', W('L19', 'hicks')), ('hicks', CUT['L20']), ('nap', W('L26', 'lies')), ('mail', CUT['L27']), ('dnf', CUT['L30']), ('end', CUT['L31']), ('nap', CUT['L33'])]
SECS.sort(key=lambda x: x[1])
tCHEAT, tBANNED, tSLOW = W('L14', 'cheated'), W('L15', 'banned'), W('L21', 'slowest')
def section(t):
    cur = 'hook'
    for n, a in SECS:
        if t >= a - 1e-6: cur = n
    return cur
tt_ = lambda n: np.arange(n) / SR
VL = np.zeros(S.N); VR = np.zeros(S.N)
def addv(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= S.N or i < 0: return
    sig = sig[: S.N - i] * gain; l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    VL[i:i + len(sig)] += sig * l * 1.414; VR[i:i + len(sig)] += sig * r * 1.414
TVL = np.zeros(S.N)   # the jingle heard through the TV speaker (band-limited later)
def addtv(sig, t0, gain=1.0):
    i = int(t0 * SR); sig = sig[: S.N - i] * gain; TVL[i:i + len(sig)] += sig

# ---------------- instruments ----------------
def sbass(m, dur=.25):   # a punchy slap-ish synth bass: sine + a quick bright pluck on the attack
    n = int(dur * SR); t = tt_(n); ph = 2 * np.pi * mtof(m) * t
    s = np.sin(ph) + .5 * np.sin(2 * ph) * np.exp(-t * 18) + .25 * np.sin(3 * ph) * np.exp(-t * 30)
    return lp(s, 1200) * np.exp(-t * 6) * np.minimum(1, t / .003) * .8
def brass(ms, dur=.3):
    n = int(dur * SR); t = tt_(n); s = np.zeros(n)
    for m in ms:
        for d in (-.12, .12): ph = np.cumsum(np.full(n, mtof(m) * (1 + d / 100))) / SR; s += 2 * (ph % 1) - 1
    fc = 900 + 2600 * np.exp(-t * 9); out = np.zeros(n)
    for i in range(0, n, 512): out[i:i + 512] = lp(s[max(0, i - 1024):i + 512], float(fc[min(i, n - 1)]))[-len(s[i:i + 512]):]
    return out / (len(ms) * 2) * np.minimum(1, t / .015) * np.clip((dur - t) / .05, 0, 1) * .55
def pizzN(m, dur=.16): return pizz(m, dur) * .8
def timp(m=43, dur=.9):
    n = int(dur * SR); t = tt_(n); f = mtof(m) * (1 + .06 * np.exp(-t * 20)); return (np.sin(2 * np.pi * np.cumsum(f) / SR) + .3 * lp(rng.standard_normal(n), 400) * np.exp(-t * 30)) * np.exp(-t * 4) * .9
def trombone(ms=(62, 61, 60, 59), dur=1.6):   # the sad "wah wah wah waaah"
    out = np.zeros(int(dur * SR)); seg_ = [.32, .32, .32, .64]; at = 0
    for m, d in zip(ms, seg_):
        n = int(d * SR); t = tt_(n); vib = 1 + (.012 * np.sin(2 * np.pi * 6 * t) if d > .5 else 0) - (.03 * (t / d) if d > .5 else 0)
        ph = np.cumsum(mtof(m - 12) * vib) / SR; s = 2 * (ph % 1) - 1; w = .5 - .5 * np.cos(2 * np.pi * np.clip(t / .3, 0, 1))
        s = lp(s, 700) * (.4 + .6 * w); s *= np.minimum(1, t / .03) * np.clip((d - t) / .06, 0, 1)
        i = int(at * SR); out[i:i + n] += s[: len(out) - i]; at += d
    return out * .9

def piano(m, dur=.4, vel=1.0, detune=0.0):
    n = int(max(dur, .25) * SR) + int(.3 * SR); t = tt_(n); f = mtof(m) * (1 + detune * np.sin(2 * np.pi * 5 * t))
    ph = np.cumsum(f) / SR; s = np.zeros(n)
    for k in range(1, 7): s += np.sin(2 * np.pi * ph * k * (1 + .0007 * k * k)) * (1 / k ** 1.3) * np.exp(-t * (1.6 + k * 1.1))
    s += lp(rng.standard_normal(n), 3000) * np.exp(-t * 90) * .15
    rel = np.clip((dur + .25 - t) / .25, 0, 1)
    return s * rel * np.minimum(1, t / .002) * .35 * vel
def chordp(ms, dur, vel=1.0, detune=0.0): return sum(piano(m, dur, vel * .8, detune) for m in ms)
def gliss(up=True, dur=.45):
    out = np.zeros(int((dur + .5) * SR)); notes = list(range(60, 96, 2)) if up else list(range(96, 60, -2))
    for k, m in enumerate(notes): p_ = piano(m, .15, .5); i = int(k * dur / len(notes) * SR); out[i:i + len(p_)] += p_[: len(out) - i]
    return out
def music_box(m, dur=.6): return bell(m + 12, dur) * .5
def trombone(ms=(62, 61, 60, 59), dur=1.6):
    out = np.zeros(int(dur * SR)); seg_ = [.32, .32, .32, .64]; at = 0
    for m, d in zip(ms, seg_):
        n = int(d * SR); t = tt_(n); vib = 1 + (.012 * np.sin(2 * np.pi * 6 * t) if d > .5 else 0) - (.03 * (t / d) if d > .5 else 0)
        ph = np.cumsum(mtof(m - 12) * vib) / SR; s_ = 2 * (ph % 1) - 1; w_ = .5 - .5 * np.cos(2 * np.pi * np.clip(t / .3, 0, 1))
        s_ = lp(s_, 700) * (.4 + .6 * w_); s_ *= np.minimum(1, t / .03) * np.clip((d - t) / .06, 0, 1)
        i = int(at * SR); out[i:i + n] += s_[: len(out) - i]; at += d
    return out * .9

# ---------------- harmony: C major rag (C–A7–D7–G7 turnaround); woozy/dnf in A minor ----------------
CHD = {'C': (36, 43, [60, 64, 67]), 'A7': (33, 40, [61, 64, 67]), 'D7': (38, 45, [60, 62, 66]), 'G7': (31, 38, [59, 62, 65]), 'F': (41, 48, [60, 65, 69]),
       'Am': (33, 40, [60, 64, 69]), 'Dm': (38, 45, [62, 65, 69]), 'E7': (40, 47, [59, 62, 68]), 'Fm': (41, 48, [60, 65, 68])}
PROG = ['C', 'A7', 'D7', 'G7']; PROG2 = ['F', 'C', 'G7', 'C']; MIN = ['Am', 'Dm', 'E7', 'Am']
RAG_A = [(0, 76, .5), (.75, 79, .25), (1, 84, .5), (1.75, 79, .25), (2, 76, .25), (2.5, 77, .5), (3.25, 76, .25), (3.5, 74, .5)]
RAG_B = [(0, 73, .25), (.25, 74, .25), (.75, 76, .5), (1.5, 79, .5), (2, 78, .25), (2.25, 79, .25), (2.75, 74, .5), (3.5, 71, .5)]
HAB = [0, .75, 1, 1.5]   # habanera bass: dotted eighth, sixteenth, two eighths
def stops(t): return (tCHEAT - .1 < t < tCHEAT + .6) or any(c - .05 < t < c + .25 for c in CARDS)
nb = int(np.ceil(TOTAL / BAR))
for b in range(nb):
    for k in range(4):
        tb = b * BAR + k * BEAT; sec = section(tb + .01)
        if tb >= TOTAL - 2.5: break
        if stops(tb): continue
        minor = sec in ('hicks2', 'dnf'); prog = MIN if minor else (PROG2 if sec in ('mail', 'end') else PROG); name = prog[b % 4]; root, fifth, chord = CHD[name]
        det = .004 if sec in ('hicks', 'hicks2') else 0
        if sec in ('hook', 'setup', 'lorz', 'hicks', 'end', 'dog'):   # stride piano
            add(piano(root if k % 2 == 0 else fifth, .3, 1.0, det), tb, .9, -.1)
            if k % 2 == 1: add(chordp(chord, .2, .9, det), tb, .7, .1)
            else: add(chordp([c + 12 for c in chord], .12, .5, det), tb + BEAT / 2, .35, .15)
            if sec in ('lorz', 'dog', 'end'): add(sbass(root if k % 2 == 0 else fifth, .22), tb, .5); add(snare(), tb + BEAT / 2, .1, .1) if k % 2 else add(kick(.6), tb, .25)
            if sec == 'dog': add(snare(), tb + .25 * BEAT, .1); add(snare(), tb + .75 * BEAT, .1)
        elif sec == 'hicks2':   # the hallucination: a warped dream
            if k % 2 == 0: add(pad([c - 12 for c in chord], BEAT * 2), tb, .5); add(piano(chord[k % 3] + 12, .8, .8, .02), tb, .6)
        elif sec == 'mail':   # habanera
            for o in HAB: add(piano((root if o < 1 else fifth) + 12, .2, .9), b * BAR + o * BEAT + (k // 2) * 2 * BEAT, .45, -.1) if k % 2 == 0 else None
            add(chordp(chord, .16, .7), tb + BEAT / 2, .4, .1); add(hat(), tb + BEAT / 2, .08, .3)
        elif sec == 'nap':
            add(music_box(chord[k % 3] + 12, .7), tb, .5); add(music_box(chord[(k + 1) % 3] + 12, .5), tb + BEAT / 2, .3)
        elif sec == 'dnf':
            if k == 0: add(pad([c - 12 for c in chord], BAR), tb, .45); add(piano(root, 1.6, .7), tb, .5)
    melody = RAG_A if b % 2 == 0 else RAG_B
    for o, m, d in melody:
        tn = b * BAR + o * BEAT; sec = section(tn + .01)
        if tn >= TOTAL - 2.5 or stops(tn): continue
        det = .004 if sec == 'hicks' else 0
        if sec in ('hook', 'setup', 'lorz', 'hicks', 'end', 'dog'): add(piano(m, d * BEAT * 1.1, 1.0 if sec != 'setup' else .8, det), tn, .55, .15)
        if sec == 'mail': add(piano(m - 12 + 12, d * BEAT * 1.4, .8), tn, .45, .15)
        if sec == 'hicks2': add(piano(m + 12, d * BEAT * 2, .5, .03), tn, .3, .3)
        if sec == 'nap' and b % 2 == 0: add(music_box(m, .8), tn, .35)
# hits: chapter cards (glissando + chord), the cheat (stop), banned (trombone), slowest (trombone), Boston (fanfare), the end
for c in CARDS: add(gliss(True), c - .45, .5); add(chordp([60, 64, 67, 72], .9, 1.2), c + .02, .6); add(kick(1.0), c + .02, .5)
add(trombone((60, 59, 58, 57)), tBANNED + .05, .7); add(trombone((55, 54, 53, 52)), tSLOW + .1, .7)
add(brass([60, 64, 67, 72], .9), W('L31', 'boston'), .7); add(brass([60, 64, 67, 72], .6), 0, .6)
add(chordp([48, 60, 64, 67, 72], 3.0, 1.2), TOTAL - 4.6, .7)

# ---------------- SFX ----------------
def jet_sfx(dur=3.0):
    n = int(dur * SR); t = tt_(n); env = np.minimum(1, t / .05) * np.clip((dur - t) / .8, 0, 1)
    roar = lp(rng.standard_normal(n), 700) * 1.2 + bp(rng.standard_normal(n), 1800, 6000) * .45
    f = 2400 + 300 * np.sin(2 * np.pi * .4 * t); whine = np.sin(2 * np.pi * np.cumsum(f) / SR) * .1
    return (roar + whine) * env * .9
def hiss(dur=.5): n = int(dur * SR); t = tt_(n); return hp(rng.standard_normal(n), 3000) * np.exp(-t * 6) * .5
def cash(): n = int(.5 * SR); t = tt_(n); return bp(rng.standard_normal(n), 2000, 7000) * (np.abs(np.sin(2 * np.pi * 18 * t)) ** 3) * np.exp(-t * 4) * .6
def tvclick():
    n = int(.35 * SR); t = tt_(n); c = np.zeros(n); c[:200] = np.hanning(200) * .8
    return c + hp(rng.standard_normal(n), 2500) * np.exp(-t * 10) * .25
def marker(dur=.6): n = int(dur * SR); t = tt_(n); f = 2600 + 400 * np.sin(2 * np.pi * 7 * t); return np.sin(2 * np.pi * np.cumsum(f) / SR) * bp(rng.standard_normal(n), 1500, 4000) * .4 * np.sin(np.pi * t / dur)
def register_():
    out = np.zeros(int(1.3 * SR)); a = bell(94, 1.2) * .5; b = bell(98, 1.1) * .45
    out[:len(a)] += a; i = int(.07 * SR); out[i:i + len(b)] += b[:len(out) - i]; return out
def thump(): n = int(.3 * SR); t = tt_(n); return (np.sin(2 * np.pi * (90 + 60 * np.exp(-t * 25)) * t) * np.exp(-t * 14) + lp(rng.standard_normal(n), 900) * np.exp(-t * 30) * .4) * .8
def crumple(dur=.5): n = int(dur * SR); t = tt_(n); return bp(rng.standard_normal(n), 1500, 6000) * (rng.random(n) < .02).astype(float).cumsum() % 2 * np.exp(-t * 3) * .35
def gavel_(): n = int(.35 * SR); t = tt_(n); return (np.sin(2 * np.pi * 180 * t) * np.exp(-t * 25) + bp(rng.standard_normal(n), 600, 2400) * np.exp(-t * 45)) * 1.0
def roll(dur=.7):
    out = np.zeros(int(dur * SR)); tt = 0; k = 0
    while tt < dur - .02: c = bell(96 + (k % 3), .08) * .25; i = int(tt * SR); out[i:i + len(c)] += c[: len(out) - i]; tt += .09 * (1 - .6 * tt / dur); k += 1
    return out
def sting_():
    o = np.zeros(int(1.0 * SR))
    for k, m in enumerate([77, 82, 86, 89]):
        b_ = bell(m, .8) * .35; i = int(k * .05 * SR); o[i:i + len(b_)] += b_[: len(o) - i]
    return o
def rumble(dur):   # a stampede: low rumble + a patter of big feet
    n = int(dur * SR); t = tt_(n); env_ = np.minimum(1, t / .2) * np.clip((dur - t) / .4, 0, 1)
    out = lp(rng.standard_normal(n), 160) * 1.4 * env_
    k = 0
    while k < n - 4000: c = thump() * (.25 + .35 * rng.random()); out[k:k + len(c)] += c[: n - k] * env_[k]; k += int(SR * (.035 + .05 * rng.random()))
    return out * .6
def pecks(dur):
    n = int(dur * SR); out = np.zeros(n); k = int(.05 * SR)
    while k < n - 3000: c = key_click() * (.4 + .6 * rng.random()); out[k:k + len(c)] += c[: n - k]; k += int(SR * (.05 + .12 * rng.random()))
    return out * .7
def clang():
    n = int(.9 * SR); t = tt_(n); s_ = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) * a for f, d, a in [(523, 5, .5), (1340, 7, .35), (2210, 9, .25), (3170, 12, .18)])
    return s_ * .6
def squawk(dur=.35, f0=320):   # an emu honk: a buzzy FM grunt with a quick fall
    n = int(dur * SR); t = tt_(n); f = f0 * (1 + .25 * np.exp(-t * 8)) * (1 + .04 * np.sin(2 * np.pi * 28 * t))
    ph = np.cumsum(f) / SR; s_ = np.sign(np.sin(2 * np.pi * ph)) * .5 + np.sin(2 * np.pi * ph * 2) * .3
    return bp(s_, 200, 2500) * np.minimum(1, t / .01) * np.clip((dur - t) / .08, 0, 1) * .5
def scatter():
    out = np.zeros(int(1.4 * SR))
    for j in range(9): c = squawk(.25 + .15 * rng.random(), 260 + 220 * rng.random()); i = int(rng.random() * .9 * SR); out[i:i + len(c)] += c[: len(out) - i] * .7
    r = rumble(1.3); out[:len(r)] += r * .8
    return out
def engine(dur):   # an old truck: a lumpy low putt-putt with rattles
    n = int(dur * SR); t = tt_(n); f = 34 + 10 * np.clip(t / .8, 0, 1)
    ph = np.cumsum(f) / SR; pulse = (np.sin(2 * np.pi * ph) > .6).astype(float)
    body = lp(pulse * lp(rng.standard_normal(n), 900) + (2 * (ph * 2 % 1) - 1) * .4, 500)
    rattle = bp(rng.standard_normal(n), 2500, 6000) * (np.sin(2 * np.pi * 9 * t) > .5) * .12
    return (body + rattle) * np.minimum(1, t / .1) * np.clip((dur - t) / .3, 0, 1) * .9
def flash():
    n = int(.4 * SR); t = tt_(n); c = np.zeros(n); c[:120] = np.hanning(120)
    return c * .6 + hp(rng.standard_normal(n), 3000) * np.exp(-t * 25) * .5 + np.sin(2 * np.pi * (3000 - 1500 * t) * t) * np.exp(-t * 6) * .08
def flip(): n = int(.18 * SR); t = tt_(n); return bp(rng.standard_normal(n), 800, 3000) * np.exp(-t * 40) * .9 + np.sin(2 * np.pi * 400 * t) * np.exp(-t * 30) * .4
def evil(): o = np.zeros(int(1.2 * SR)); a = timp(38, .6); o[:len(a)] += a; b_ = timp(37, .9); i = int(.3 * SR); o[i:i + len(b_)] += b_[: len(o) - i]; return o * .8
def gun(): n = int(.6 * SR); t = tt_(n); return (lp(rng.standard_normal(n), 2500) * np.exp(-t * 25) + np.sin(2 * np.pi * 80 * t) * np.exp(-t * 18)) * 1.0
def crowd(dur, hype=1.0):
    n = int(dur * SR); t = tt_(n); c = bp(rng.standard_normal(n), 400, 2600) * (.6 + .4 * np.sin(2 * np.pi * .7 * t + 1)) * np.minimum(1, t / .3) * np.clip((dur - t) / .5, 0, 1) * .5 * hype
    for j in range(int(dur * 4)): cl = clap(); i = int(rng.uniform(0, max(.01, dur - .2)) * SR); c[i:i + len(cl)] += cl[: n - i] * .12
    return c
def car_(dur):
    n = int(dur * SR); t = tt_(n); f = 24 + 4 * np.sin(2 * np.pi * .3 * t); ph = np.cumsum(f) / SR; pulse = (np.sin(2 * np.pi * ph) > .5).astype(float)
    return (lp(pulse * lp(rng.standard_normal(n), 800) + (2 * (ph * 2 % 1) - 1) * .3, 600) + bp(rng.standard_normal(n), 2000, 6000) * .05) * np.minimum(1, t / .2) * np.clip((dur - t) / .3, 0, 1) * .8
def horn(): n = int(.6 * SR); t = tt_(n); f = 330 * (1 + .2 * (t < .25)); ph = np.cumsum(f) / SR; return bp(np.sign(np.sin(2 * np.pi * ph)), 300, 2000) * np.minimum(1, t / .02) * np.clip((.6 - t) / .05, 0, 1) * (1 - .9 * ((t > .22) & (t < .3))) * .5
def cough(): o = np.zeros(int(.8 * SR)); [o.__setitem__(slice(int(k * .22 * SR), int(k * .22 * SR) + int(.15 * SR)), o[int(k * .22 * SR):int(k * .22 * SR) + int(.15 * SR)] + bp(rng.standard_normal(int(.15 * SR)), 300, 2500) * np.exp(-tt_(int(.15 * SR)) * 25)) for k in range(3)]; return o * .8
def snore(dur):
    n = int(dur * SR); t = tt_(n); cyc = (t % 1.6) / 1.6; inh = np.clip(np.sin(np.pi * cyc / .6), 0, 1) * (cyc < .6)
    return (lp(rng.standard_normal(n), 300) * inh * (1 + .6 * np.sin(2 * np.pi * 34 * t)) * .5 + np.sin(2 * np.pi * (900 - 400 * (cyc - .6)) * t) * (cyc > .7) * np.clip(1 - (cyc - .7) / .3, 0, 1) * .05) * np.clip((dur - t) / .3, 0, 1)
def card_(): return whoosh(.5)
def slide(): n = int(.8 * SR); t = tt_(n); f = 300 + 900 * t / .8; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2) * .3
def creak(): n = int(.5 * SR); t = tt_(n); f = 180 + 60 * np.sin(2 * np.pi * 3 * t); return bp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 200, 1800) * np.sin(np.pi * t / .5) * .2
def drip(): return plop() * .5
def sip(): n = int(.5 * SR); t = tt_(n); return bp(rng.standard_normal(n), 800, 3000) * (np.sin(2 * np.pi * 9 * t) > 0) * np.sin(np.pi * t / .5) * .3
def sputter():
    n = int(1.6 * SR); out = np.zeros(n); k = 0
    while k < n - int(.2 * SR): b_ = lp(rng.standard_normal(int(.08 * SR)), 900) * np.exp(-tt_(int(.08 * SR)) * 30); out[k:k + len(b_)] += b_; k += int(SR * rng.uniform(.08, .3))
    return out * 1.2
def flash(): n = int(.5 * SR); t = tt_(n); c = np.zeros(n); c[:200] = np.hanning(200); return c * .6 + hp(rng.standard_normal(n), 3000) * np.exp(-t * 20) * .5
def shimmer(): return sparkle()
def scratch(): n = int(.45 * SR); t = tt_(n); f = 900 * (1 - t / .45) + 200; return bp(rng.standard_normal(n), 300, 4000) * (np.sin(2 * np.pi * np.cumsum(f) / SR) > 0) * .6
def crack(): n = int(.25 * SR); t = tt_(n); return (bp(rng.standard_normal(n), 1500, 6000) * np.exp(-t * 60) + plop()[:n] * .3) * .9
def glug(): o = np.zeros(int(.6 * SR)); [o.__setitem__(slice(int(k * .14 * SR), int(k * .14 * SR) + int(.25 * SR)), o[int(k * .14 * SR):int(k * .14 * SR) + int(.25 * SR)] + plop()[: int(.25 * SR)] * (1 - k * .2)) for k in range(3)]; return lp(o, 900) * 1.2
def warp(dur): n = int(dur * SR); t = tt_(n); f = 200 + 120 * np.sin(2 * np.pi * .5 * t); return (np.sin(2 * np.pi * np.cumsum(f) / SR) * .2 + bp(rng.standard_normal(n), 500, 1500) * .1) * np.sin(np.pi * t / dur) * .6
def deflate(): n = int(.8 * SR); t = tt_(n); f = 500 * np.exp(-t * 2) + 120; return bp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) + rng.standard_normal(n) * .4, 200, 3000) * np.minimum(1, t / .02) * np.clip((.8 - t) / .1, 0, 1) * .35
def dice_(): o = np.zeros(int(1.0 * SR)); [o.__setitem__(slice(int(x * SR), int(x * SR) + 1300), o[int(x * SR):int(x * SR) + 1300] + bp(rng.standard_normal(1300), 1500, 7000) * np.exp(-tt_(1300) * 80)) for x in [0, .12, .21, .27, .32, .36]]; return o
def snip(): n = int(.2 * SR); t = tt_(n); return (bp(rng.standard_normal(n), 3000, 9000) * np.exp(-t * 50) + np.sin(2 * np.pi * 3200 * t) * np.exp(-t * 40) * .3) * .8
def chatter(dur): n = int(dur * SR); t = tt_(n); return bp(rng.standard_normal(n), 300, 2400) * (.5 + .5 * np.abs(np.sin(2 * np.pi * 3.3 * t) * np.sin(2 * np.pi * 1.1 * t))) * np.minimum(1, t / .2) * np.clip((dur - t) / .3, 0, 1) * .4
def crunch(): n = int(.25 * SR); t = tt_(n); return bp(rng.standard_normal(n), 1500, 7000) * (rng.random(n) < .3) * np.exp(-t * 18) * 1.2
def gurgle(): n = int(.9 * SR); t = tt_(n); f = 120 + 80 * np.sin(2 * np.pi * 7 * t) + 40 * np.sin(2 * np.pi * 13 * t); return lp(np.sin(2 * np.pi * np.cumsum(f) / SR) + rng.standard_normal(n) * .3, 500) * np.sin(np.pi * t / .9) * .7
def bark():
    n = int(.22 * SR); t = tt_(n); f = 520 * np.exp(-t * 6) + 220; s_ = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .6 + rng.standard_normal(n) * .3
    return bp(s_, 300, 3000) * np.minimum(1, t / .005) * np.exp(-t * 9) * .8
def wind(dur): n = int(dur * SR); t = tt_(n); return bp(rng.standard_normal(n), 300, 1400) * (.5 + .5 * np.sin(2 * np.pi * .7 * t)) * np.minimum(1, t / .3) * np.clip((dur - t) / .3, 0, 1) * .5
for e in EV:
    s, t, d = e['s'], e['t'], e.get('d', 1.0)
    if s == 'gun': addv(gun(), t, .8)
    elif s == 'crowd': addv(crowd(d), t, .55)
    elif s == 'car': addv(car_(d), t, .5)
    elif s == 'horn': addv(horn(), t, .45, .2)
    elif s == 'cough': addv(cough(), t, .6, rng.uniform(-.3, .3))
    elif s == 'cut': addv(whoosh(.25), t - .1, .12)
    elif s == 'whoosh': addv(whoosh(.6), t - .25, .4)
    elif s == 'pop': addv(pop(900), t, .5); addv(hiss(.3), t + .02, .25)
    elif s == 'snore': addv(snore(d), t, .5)
    elif s == 'ding': addv(bell(94, 1.2), t, .45)
    elif s == 'card': addv(card_(), t - .2, .4)
    elif s == 'slide': addv(slide(), t, .5)
    elif s == 'creak': addv(creak(), t, .6)
    elif s == 'drip': addv(drip(), t, .7)
    elif s == 'sip': addv(sip(), t, .5)
    elif s == 'boing': addv(boing(233, 466, .35), t, .35)
    elif s == 'sputter': addv(sputter(), t, .7)
    elif s == 'flash': addv(flash(), t, .5, rng.uniform(-.3, .3))
    elif s == 'shimmer': addv(shimmer(), t, .4)
    elif s == 'scratch': addv(scratch(), t, .7)
    elif s == 'stamp': addv(stamp(True), t, .65)
    elif s == 'sting': addv(sting_(), t, .45)
    elif s == 'crack': addv(crack(), t, .7)
    elif s == 'glug': addv(glug(), t, .7)
    elif s == 'warp': addv(warp(d), t, .5)
    elif s == 'deflate': addv(deflate(), t, .6)
    elif s == 'trombone' or s == 'trombone_s': addv(trombone((60, 59, 58, 57)), t + .05, .45) if s == 'trombone_s' else None
    elif s == 'dice': addv(dice_(), t + .1, .7)
    elif s == 'snip': addv(snip(), t, .7)
    elif s == 'chatter': addv(chatter(d), t, .5)
    elif s == 'crunch': addv(crunch(), t, .7)
    elif s == 'gurgle': addv(gurgle(), t, .7)
    elif s == 'bark': addv(bark(), t, .8, -.2); addv(bark(), t + .18, .6, -.2)
    elif s == 'wind': addv(wind(d), t, .5)
    elif s == 'fanfare': addv(brass([60, 64, 67, 72], .8), t, .5)

# ---------------- voice ----------------
VB = np.zeros(S.N)
if VOICE != 'none':
    import soundfile as sf
    v, sr = sf.read(VOICE)
    if v.ndim > 1: v = v.mean(1)
    if sr != SR: v = resample_poly(v, SR, sr)
    v = hp(v, 80); v = v / (np.max(np.abs(v)) + 1e-9)
    e_ = lp(np.abs(v), 30, order=1); v = v / np.maximum(1, (e_ / .3) ** .45); v = v / (np.max(np.abs(v)) + 1e-9)
    VB[: min(len(v), S.N)] = v[: S.N] * .95

# ---------------- mix ----------------
def tame(x): x = hp(x, 35); return x - .4 * lp(x, 100)
tv = bp(TVL, 350, 4500) * 1.4   # the TV speaker
ML, MR = tame(S.L) + tv, tame(S.R) + tv
venv = lp(np.abs(VB), 8, order=1); venv /= (np.max(venv) + 1e-9)
duck = 1 - np.clip(.4 * np.clip(venv * 4, 0, 1), 0, .4)
rms = lambda x: np.sqrt(np.mean(x ** 2) + 1e-12)
act = np.zeros(S.N, bool)
for l in TM['lines']: act[int(l['t0'] * SR):int(l['t1'] * SR)] = True
MUSIC_DB, SFX_DB = -16, -8
if VOICE != 'none':
    vr = rms(VB[act]); mg = vr / rms(((ML + MR) / 2 * duck)[act]) * 10 ** (MUSIC_DB / 20); sg = vr / rms(((VL + VR) / 2)[act] + 1e-9) * 10 ** (SFX_DB / 20)
    tl = TM['lines'][-1]['t1'] + .2; ts = np.arange(S.N) / SR; duck = duck * (1 + (10 ** (6 / 20) - 1) * np.clip((ts - tl) / .4, 0, 1))
else:
    mg = 1.; sg = rms((ML + MR) / 2) / rms((VL + VR) / 2) * 10 ** (1 / 20); duck = np.ones(S.N)
mix = np.stack([ML * duck * mg + VL * sg + VB, MR * duck * mg + VR * sg + VB])[:, : int(TOTAL * SR)]
mix = mix / (np.max(np.abs(mix)) + 1e-9) * 1.3; mix = np.tanh(mix) * .9
os.makedirs(os.path.dirname(OUT) or '.', exist_ok=True)
out = (mix.T * 32767).astype(np.int16)
w = wave.open(OUT, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes()); w.close()
print('ok', OUT, round(TOTAL, 2), 's, voice:', VOICE, '| music', MUSIC_DB, 'dB, sfx', SFX_DB, 'dB re voice')
