"""music.py · score + SFX (+ voice) of "What If Everyone Had Ratings Above Their Heads?" part 3 ("The Final"), from events.json and timing.json.
  python music.py out/mix.wav voice/take.wav      # with the voice
  python music.py out/mix_novoice.wav none          # score + SFX only
120 BPM. A low drone and a heartbeat on the wall; a soft piano when Theo climbs back down; it builds as the number comes back
(10, 25, 40) and lands on the finish; ticking suspense for the judges; the brass anthem for the gold card; bells and a slow pad
for the night; a warm, gentle loop for fifty years later. Music sits 16 dB under the voice and ducks."""
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
    hits = [x['t0'] for x in LW[lid] if ''.join(ch for ch in x['w'].lower() if ch.isalnum()).startswith(word)]
    return hits[min(k, len(hits) - 1)] if hits else LW[lid][0]['t0']
t9, tFREEZE, tINSTEAD, t10, t40, tCROSS, tLAST, tNOT, tBY, tGOLD, tSMALL, tZERO7, tPOINT, t100 = W('L2', '9'), W('L2', 'freezes'), W('L3', 'instead'), W('L4', '10'), W('L4', '40'), W('L4', 'cross'), W('L4', 'last'), W('L5', 'not'), W('L5', 'by', 1), W('L6', 'gold'), W('L6', 'small'), W('L7', 'zero'), W('L7', 'point'), W('L8', '100')
SECS = [('tension', 0), ('hope', tINSTEAD - .1), ('rise', t10 - .05), ('lift', tCROSS - .05), ('suspense', CUT['L5']), ('anthem', CUT['L6']), ('night', CUT['L7']), ('warm', CUT['L8']), ('loop', LOOP)]
def section(t):
    cur = 'recap'
    for n, a_ in SECS:
        if t >= a_ - 1e-6: cur = n
    return cur
tt_ = lambda n: np.arange(n) / SR
VL = np.zeros(S.N); VR = np.zeros(S.N)
def addv(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= S.N or i < 0: return
    sig = sig[: S.N - i] * gain; l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    VL[i:i + len(sig)] += sig * l * 1.414; VR[i:i + len(sig)] += sig * r * 1.414

# ---------------- instruments ----------------
def brass_(ms, dur=.3): return brass(ms, dur)
def tuba(m, dur=.25):
    n = int(dur * SR); t = tt_(n); ph = 2 * np.pi * mtof(m) * t
    s = np.sin(ph) + .55 * np.sin(2 * ph) + .3 * np.sin(3 * ph) + .12 * np.sin(4 * ph)
    return lp(s, 900) * np.minimum(1, t / .02) * np.clip((dur - t) / .04, 0, 1) * np.exp(-t * 2) * .55
def brass(ms, dur=.3):
    n = int(dur * SR); t = tt_(n); s = np.zeros(n)
    for m in ms:
        for d in (-.12, .12): ph = np.cumsum(np.full(n, mtof(m) * (1 + d / 100))) / SR; s += 2 * (ph % 1) - 1
    fc = 900 + 2600 * np.exp(-t * 9); out = np.zeros(n)
    for i in range(0, n, 512): out[i:i + 512] = lp(s[max(0, i - 1024):i + 512], float(fc[min(i, n - 1)]))[-len(s[i:i + 512]):]
    return out / (len(ms) * 2) * np.minimum(1, t / .015) * np.clip((dur - t) / .05, 0, 1) * .55
def bala(m, dur=.25, trem=True):   # a balalaika-like pluck: bright, tremolo-picked on long notes
    if not trem or dur < .2: return pluck(m, dur + .1, 1.8) * .7
    n = int((dur + .1) * SR); out = np.zeros(n); k = 0; step = int(.062 * SR)
    while k < int(dur * SR): c = pluck(m, .14, 1.8) * (.55 + .2 * (k // step % 2)); out[k:k + len(c)] += c[: n - k]; k += step
    return out * .6
def squeeze(ms, dur):   # a squeezebox: two detuned reeds, a little bellows swell
    n = int(dur * SR); t = tt_(n); s = np.zeros(n)
    for m in ms:
        for d in (-.18, .18): ph = np.cumsum(np.full(n, mtof(m) * (1 + d / 100))) / SR; s += np.sign(np.sin(2 * np.pi * ph)) * .5 + (2 * (ph % 1) - 1) * .3
    s = lp(s, 2200) / (len(ms) * 2); sw = .75 + .25 * np.sin(np.pi * np.clip(t / dur, 0, 1))
    return s * sw * np.minimum(1, t / .04) * np.clip((dur - t) / .06, 0, 1) * .45
def tamb(): n = int(.18 * SR); t = tt_(n); return hp(rng.standard_normal(n), 5000) * np.exp(-t * 22) * .45 + bp(rng.standard_normal(n), 3000, 7000) * np.exp(-t * 40) * .3
def timp(m=43, dur=.9):
    n = int(dur * SR); t = tt_(n); f = mtof(m) * (1 + .06 * np.exp(-t * 20)); return (np.sin(2 * np.pi * np.cumsum(f) / SR) + .3 * lp(rng.standard_normal(n), 400) * np.exp(-t * 30)) * np.exp(-t * 4) * .9
def funk(m, dur=.2):
    n = int(dur * SR); t = tt_(n); ph = 2 * np.pi * mtof(m) * t; s = np.sin(ph) + .6 * np.sin(2 * ph) + .3 * np.sin(3 * ph)
    k_ = np.exp(-t * 12); return (lp(s, 2000) * k_ + lp(s, 600) * (1 - k_)) * np.exp(-t * 5) * np.minimum(1, t / .004) * .7
def xylo(m, dur=.3): n = int(dur * SR); t = tt_(n); f = mtof(m); return (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 30)) * np.exp(-t * 14) * .5
def trombone(m0, m1, dur):   # the sad slide
    n = int(dur * SR); t = tt_(n); f = mtof(m0) * (2 ** ((m1 - m0) / 12)) ** np.clip(t / dur * 1.3 - .15, 0, 1); f = f * (1 + .012 * np.sin(2 * np.pi * 6 * t) * np.clip(t / dur, 0, 1))
    ph = np.cumsum(f) / SR; s = 2 * (ph % 1) - 1; return lp(s, 1400) * np.minimum(1, t / .03) * np.clip((dur - t) / .08, 0, 1) * .4

def piano(m, dur=1.2):
    n = int(dur * SR); t = tt_(n); f = mtof(m); s = sum(np.sin(2 * np.pi * f * k * t) * np.exp(-t * (2.5 + k * 1.6)) / k for k in (1, 2, 3, 4))
    return s * np.minimum(1, t / .004) * .35
def synpluck(m, dur=.25): return pluck(m, dur + .1, 1.4) * .6
# ---------------- harmony ----------------
CH = {'C': (36, 43, [64, 67, 72]), 'G': (43, 50, [62, 67, 71]), 'Am': (45, 52, [64, 69, 72]), 'F': (41, 48, [65, 69, 72]), 'Em': (40, 47, [64, 67, 71]), 'Dm': (38, 45, [62, 65, 69]), 'E': (40, 47, [64, 68, 71])}
HOPE, HERO, ROM, WARM = ['F', 'C', 'G', 'Am'], ['C', 'F', 'G', 'C'], ['C', 'Em', 'F', 'G'], ['F', 'C', 'G', 'C']
FANF = [(0, 72, .5), (.5, 72, .25), (.75, 72, .25), (1, 79, 1.0), (2, 77, .5), (2.5, 76, .5), (3, 74, .5), (3.5, 76, .5)]
nb = int(np.ceil(TOTAL / BAR))
for b in range(nb):
    for k in range(4):
        tb = b * BAR + k * BEAT; sec = section(tb + .01)
        if tb >= LOOP - 1e-6: break
        if sec == 'tension':
            if k == 0: add(pad([38, 45, 50, 53], BAR - .05), tb, .38)
            if k in (0, 2): add(kick(.55), tb, .3)
            if tb > tFREEZE - .1 and k % 2 == 1: add(bell(81, .4), tb, .06)
        elif sec == 'hope':
            name = HOPE[b % 4]; root, fifth, chord = CH[name]
            if k == 0: add(pad(chord, BAR - .05), tb, .2); add(piano(root + 12, 1.8), tb, .45)
            add(piano(chord[k % 3] + 12, .8), tb + BEAT / 2, .26, .1)
        elif sec == 'rise':
            name = HOPE[b % 4]; root, fifth, chord = CH[name]; up = np.clip((tb - t10) / (tCROSS - t10), 0, 1)
            if k == 0: add(pad(chord + [root + 12], BAR - .05), tb, .25 + .1 * up); add(bass(root, .6), tb, .55)
            add(piano(chord[k % 3] + 12, .5), tb, .3); add(piano(chord[(k + 1) % 3] + 24, .3), tb + BEAT / 2, .18 + .1 * up, .15)
            add(kick(.7 + .4 * up), tb, .3 + .3 * up)
            if up > .5: add(hat(), tb + BEAT / 2, .12, .3)
        elif sec == 'lift':
            name = HERO[b % 4]; root, fifth, chord = CH[name]
            add(kick(1.0), tb, .5); add(bass(root, .3), tb, .7); add(hat(), tb + BEAT / 2, .14, .3)
            if k == 0: add(pad(chord + [root + 12], BAR - .05), tb, .3); add(brass_(chord, .9), tb, .3)
        elif sec == 'suspense':
            add(xylo(84 if k % 2 == 0 else 79, .12), tb, .22); add(xylo(84 if k % 2 == 0 else 79, .12), tb + BEAT / 2, .14)
            if k == 0: add(pad([45, 52, 57, 60], BAR - .05), tb, .3)
        elif sec == 'anthem':
            name = HERO[b % 4]; root, fifth, chord = CH[name]
            add(kick(1.0), tb, .55); add(snare(), tb + BEAT / 2, .18); add(bass(root, .4), tb, .8)
            if k == 0: add(brass_(chord, 1.0), tb, .36); add(pad(chord + [root + 12], BAR - .05), tb, .25)
        elif sec == 'night':
            name = ROM[b % 4]; root, fifth, chord = CH[name]
            if k == 0: add(pad(chord, BAR - .05), tb, .3); add(bass(root, .9), tb, .4); add(piano(root + 12, 1.8), tb, .35)
            add(bell(chord[(k + b) % 3] + 12, .8), tb, .16, .15)
        elif sec == 'warm':
            name = WARM[b % 4]; root, fifth, chord = CH[name]
            if k == 0: add(pad(chord + [root + 12], BAR - .05), tb, .3); add(bass(root, .5), tb, .5); add(piano(root + 12, 1.6), tb, .4)
            add(piano(chord[k % 3] + 12, .6), tb + BEAT / 2, .22, .1); add(bell(chord[(k + 1) % 3] + 24, .5), tb, .07, -.2)
    for o, m, d in FANF:
        tn = b * BAR + o * BEAT
        if section(tn + .01) == 'anthem' and tn < LOOP: add(brass_([m], d * BEAT * .95), tn, .33, -.1)
# hits
add(pad([38, 45, 50, 53, 57], 2.0), 0, .35); add(kick(1.2), 0, .7)
add(kick(1.3), tCROSS - .02, .7); add(brass_([60, 64, 67, 72], 1.2), tCROSS, .45)
add(brass_([60, 64, 67, 72], 1.4), tGOLD - .02, .55); add(sparkle(), tGOLD, .5)
add(bell(88, 1.4), tPOINT, .25); add(bell(84, 1.6), t100, .25)
add(bell(84, 2.0), LOOP - .02, .3)

# ---------------- SFX ----------------
def thump(): n = int(.3 * SR); t = tt_(n); return (np.sin(2 * np.pi * (90 + 60 * np.exp(-t * 25)) * t) * np.exp(-t * 14) + lp(rng.standard_normal(n), 900) * np.exp(-t * 30) * .4) * .8
def hiss(dur=.5): n = int(dur * SR); t = tt_(n); return hp(rng.standard_normal(n), 3000) * np.exp(-t * 6) * .5
def rollc(dur=.7):
    out = np.zeros(int(dur * SR)); tt = 0; k = 0
    while tt < dur - .02: c = bell(96 + (k % 3), .08) * .25; i = int(tt * SR); out[i:i + len(c)] += c[: len(out) - i]; tt += .09 * (1 - .6 * tt / dur); k += 1
    return out
def harbor(dur):   # cold wind, water slapping the quay, a far ship's horn
    n = int(dur * SR); t = tt_(n); wind = bp(rng.standard_normal(n), 300, 1600) * (.6 + .4 * np.sin(2 * np.pi * t / 3.1)) * .22
    slap = lp(rng.standard_normal(n), 700) * (np.sin(2 * np.pi * t / 1.7) > .7) * .25
    return (wind + slap) * np.minimum(1, t / .25) * np.clip((dur - t) / .25, 0, 1)
def surface(): n = int(1.4 * SR); t = tt_(n); return (lp(rng.standard_normal(n), 300) * np.sin(np.pi * t / 1.4) * 1.0 + bp(rng.standard_normal(n), 600, 4000) * np.clip((t - .5) / .4, 0, 1) * np.exp(-np.maximum(0, t - .9) * 4) * .7)
def splash(): n = int(1.0 * SR); t = tt_(n); return bp(rng.standard_normal(n), 300, 6000) * np.exp(-t * 4) * .9
def crowd(dur):
    n = int(dur * SR); t = tt_(n); s = np.zeros(n)
    for f0 in (180, 230, 310, 260, 150):
        ph = np.cumsum(f0 * (1 + .25 * np.sin(2 * np.pi * (2 + rng.random() * 3) * t + rng.random() * 6))) / SR; s += np.sign(np.sin(2 * np.pi * ph)) * (np.sin(2 * np.pi * (1.5 + rng.random()) * t) > 0)
    return bp(s, 300, 2500) * .05 * np.minimum(1, t / .3) * np.clip((dur - t) / .3, 0, 1)
def pour(): n = int(.6 * SR); t = tt_(n); return bp(rng.standard_normal(n), 1500 + 0 * t[0], 5000) * (.6 + .4 * np.sin(2 * np.pi * 23 * t)) * np.sin(np.pi * t / .6) * .4
def slurp(): n = int(.35 * SR); t = tt_(n); f = 500 + 900 * t / .35; return bp(rng.standard_normal(n), 400, 3000) * np.sin(np.pi * t / .35) * .5 + np.sin(2 * np.pi * np.cumsum(f) / SR) * .08 * np.sin(np.pi * t / .35)
def clock(dur):
    n = int(dur * SR); out = np.zeros(n); k = 0; i = 0
    while k < n - 3000: c = (bp(rng.standard_normal(1500), 2500 if i % 2 else 1800, 7000) * np.exp(-tt_(1500) * 90)) * .5; out[k:k + 1500] += c; k += int(.5 * SR); i += 1
    return out
def slap_(): n = int(.2 * SR); t = tt_(n); return (bp(rng.standard_normal(n), 800, 5000) * np.exp(-t * 40) + np.sin(2 * np.pi * 120 * t) * np.exp(-t * 30) * .5) * .8
def deflate(): n = int(.7 * SR); t = tt_(n); f = 900 * (1 - .65 * t / .7); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / .7) * .3 + bp(rng.standard_normal(n), 800, 3000) * np.sin(np.pi * t / .7) * .15
def slide(): n = int(.5 * SR); t = tt_(n); return bp(rng.standard_normal(n), 200, 1500) * (.7 + .3 * np.sin(2 * np.pi * 37 * t)) * np.sin(np.pi * t / .5) * .6
def register():
    o = np.zeros(int(.6 * SR)); a = clink(3200) * .8; o[:len(a)] += a; b_ = bell(98, .5) * .5; i = int(.06 * SR); o[i:i + len(b_)] += b_[: len(o) - i]; c = bell(103, .45) * .4; i = int(.1 * SR); o[i:i + len(c)] += c[: len(o) - i]; return o
def tickf(): n = int(.12 * SR); t = tt_(n); return (np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 60) + hp(rng.standard_normal(n), 3000) * np.exp(-t * 80) * .3) * .6
def glug(dur):
    out = np.zeros(int(dur * SR)); k = 0
    while k < len(out) - 4000: c = plop() * .5; out[k:k + len(c)] += c[: len(out) - k]; k += int(.13 * SR)
    return out
def slam(): o = thump(); a = clink(1500) * .5; o[:len(a)] += a; return o
def whip(): n = int(.3 * SR); t = tt_(n); return bp(rng.standard_normal(n), 1000, 6000) * np.sin(np.pi * t / .3) ** 3 * .7
def dial():
    o = np.zeros(int(1.2 * SR)); k = int(.05 * SR)
    for d in (3, 5, 2):
        for _ in range(d): c = key_click(); o[k:k + len(c)] += c[: len(o) - k] * 1.4; k += int(.06 * SR)
        k += int(.18 * SR)
    return o
def spit(): n = int(.5 * SR); t = tt_(n); return (bp(rng.standard_normal(n), 600, 5000) * np.exp(-t * 7) * .8 + np.sin(2 * np.pi * 160 * t) * np.exp(-t * 20) * .3)
def buzz(): n = int(.45 * SR); t = tt_(n); ph = np.cumsum(np.full(n, 110.)) / SR; return lp(np.sign(np.sin(2 * np.pi * ph)), 1200) * np.minimum(1, t / .01) * np.clip((.45 - t) / .05, 0, 1) * .35
def creak(): n = int(.5 * SR); t = tt_(n); f = 140 + 60 * np.sin(2 * np.pi * 3 * t); return lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (np.sin(2 * np.pi * 31 * t) > 0), 1500) * np.sin(np.pi * t / .5) * .3
def clang(): n = int(1.0 * SR); t = tt_(n); s = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, d in ((420, 4), (1130, 6), (2370, 9), (3190, 12))); return s * .25
def sizzle(dur): n = int(dur * SR); t = tt_(n); return hp(rng.standard_normal(n), 4000) * (.5 + .5 * (rng.random(n) > .97)) * .22 * np.minimum(1, t / .1) * np.clip((dur - t) / .2, 0, 1)
def scribble(): n = int(.8 * SR); t = tt_(n); return bp(rng.standard_normal(n), 2000, 7000) * (np.abs(np.sin(2 * np.pi * 7 * t)) ** 3) * .35
def rumble(dur): n = int(dur * SR); t = tt_(n); return lp(rng.standard_normal(n), 120) * 2.2 * np.minimum(1, t / .2) * np.clip((dur - t) / .3, 0, 1) + lp(rng.standard_normal(n), 600) * .3 * (rng.random(n) > .996)
def crash(): o = np.zeros(int(1.4 * SR)); a = thump() * 1.4; o[:len(a)] += a; g_ = crash_glass() * .5; o[:len(g_)] += g_[: len(o)]; n = len(o); o += bp(rng.standard_normal(n), 200, 3000) * np.exp(-tt_(n) * 3) * .6; return o
def bubbles(dur):
    out = np.zeros(int(dur * SR)); k = 0
    while k < len(out) - 4000: c = plop() * (.25 + .3 * rng.random()); out[k:k + len(c)] += c[: len(out) - k]; k += int(SR * (.04 + .09 * rng.random()))
    return out
def street(dur):   # far traffic, a few birds
    n = int(dur * SR); t = tt_(n); hum = lp(rng.standard_normal(n), 250) * .5 + bp(rng.standard_normal(n), 400, 1500) * (.5 + .5 * np.sin(2 * np.pi * t / 4.3)) * .15
    out = hum.copy(); k = int(.4 * SR)
    while k < n - 9000: f0 = 2600 + 1600 * rng.random(); m_ = int(.09 * SR); tm = tt_(m_); out[k:k + m_] += np.sin(2 * np.pi * np.cumsum(f0 * (1 + .25 * np.sin(2 * np.pi * 22 * tm))) / SR) * np.sin(np.pi * tm / .09) * .06; k += int(SR * (.6 + 1.2 * rng.random()))
    return out * np.minimum(1, t / .3) * np.clip((dur - t) / .3, 0, 1)
def chime(up=True):
    o = np.zeros(int(.5 * SR))
    for i, m in enumerate([84, 88, 91] if up else [76, 72]): c = bell(m, .35) * .5; j = int(i * .06 * SR); o[j:j + len(c)] += c[: len(o) - j]
    return o
def errbuzz(): n = int(.4 * SR); t = tt_(n); ph = np.cumsum(np.full(n, 140.)) / SR; return lp(np.sign(np.sin(2 * np.pi * ph)), 1500) * np.minimum(1, t / .01) * np.clip((.4 - t) / .05, 0, 1) * .35
def steps(dur, rate=6.5):
    o = np.zeros(int(dur * SR)); k = 0
    while k < len(o) - 3000: c = lp(rng.standard_normal(1800), 900) * np.exp(-tt_(1800) * 40) * .5; o[k:k + 1800] += c; k += int(SR / rate)
    return o
def yawn(): n = int(.9 * SR); t = tt_(n); f = 180 + 120 * np.sin(np.pi * t / .9); return bp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 200, 1500) * np.sin(np.pi * t / .9) * .25
def cafe(dur):
    n = int(dur * SR); t = tt_(n); out = bp(rng.standard_normal(n), 300, 2500) * .04 * (1 + .3 * np.sin(2 * np.pi * 1.3 * t)); k = int(.3 * SR)
    while k < n - 9000: c = clink(2400 + 800 * rng.random()) * .4; out[k:k + len(c)] += c[: n - k]; k += int(SR * (.5 + rng.random()))
    return out * np.minimum(1, t / .3) * np.clip((dur - t) / .3, 0, 1)
def tick(n_): return xylo(84 + n_ * 2, .25)
def xylo(m, dur=.3): n = int(dur * SR); t = tt_(n); f = mtof(m); return (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 30)) * np.exp(-t * 14) * .5
def rain(dur): n = int(dur * SR); t = tt_(n); return hp(rng.standard_normal(n), 2500) * .08 * np.minimum(1, t / .5) * np.clip((dur - t) / .5, 0, 1) + lp(rng.standard_normal(n), 300) * .2 * np.minimum(1, t / .5) * np.clip((dur - t) / .5, 0, 1)
def heartbeat(dur):
    o = np.zeros(int(dur * SR)); k = 0
    while k < len(o) - 9000:
        for off in (0, .18): c = (np.sin(2 * np.pi * 55 * tt_(4000)) * np.exp(-tt_(4000) * 18)) * .8; j = k + int(off * SR); o[j:j + 4000] += c[: len(o) - j]
        k += int(.85 * SR)
    return o
def crack(): n = int(.5 * SR); t = tt_(n); return hp(rng.standard_normal(n), 2000) * np.exp(-t * 14) * .7 + crash_glass()[:n] * .3
def zip_(): n = int(.35 * SR); t = tt_(n); f = 600 + 2400 * t / .35; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / .35) * .2
def stadium(dur):
    n = int(dur * SR); t = tt_(n); return (bp(rng.standard_normal(n), 300, 3000) * (.6 + .4 * np.sin(2 * np.pi * t / 5.1)) * .18) * np.minimum(1, t / .4) * np.clip((dur - t) / .4, 0, 1)
def laughter(dur):
    n = int(dur * SR); t = tt_(n); out = np.zeros(n)
    for v in range(14):
        f0 = 180 + rng.random() * 220; rate = 5 + rng.random() * 3; ph = rng.random() * 6
        env_ = (np.sin(2 * np.pi * rate * t + ph) > .2) * np.minimum(1, t / .2) * np.clip((dur - t) / .4, 0, 1)
        out += bp(np.sign(np.sin(2 * np.pi * np.cumsum(f0 * (1 + .1 * np.sin(2 * np.pi * 3 * t))) / SR)), 300, 2500) * env_ * .05
    return out
def gun(): n = int(.6 * SR); t = tt_(n); return (hp(rng.standard_normal(n), 800) * np.exp(-t * 18) + lp(rng.standard_normal(n), 300) * np.exp(-t * 8) * .6) * .9
def glitch():
    n = int(.6 * SR); t = tt_(n); s = np.sign(np.sin(2 * np.pi * np.cumsum(200 + 1800 * (rng.random(n) > .5)) / SR)) * (rng.random(n) > .3)
    return lp(s, 4000) * np.exp(-t * 3) * .35
def night(dur):   # crickets, a far car
    n = int(dur * SR); t = tt_(n); cr = sum(bp(rng.standard_normal(n), f, f * 1.08) * (np.sin(2 * np.pi * r * t + ph) > .6) for f, r, ph in ((4200, 2.7, 0), (4600, 3.3, 1.7), (3900, 2.2, 3.1))) * .12
    return (cr + lp(rng.standard_normal(n), 200) * .05) * np.minimum(1, t / .4) * np.clip((dur - t) / .4, 0, 1)
def birds(dur):
    n = int(dur * SR); t = tt_(n); out = lp(rng.standard_normal(n), 400) * .03
    for k in range(int(dur * 1.2)):
        t0 = rng.random() * (dur - .5); m = int(t0 * SR); ln = int(.25 * SR); tt2 = tt_(ln); f = 2600 + 1200 * np.sin(2 * np.pi * 9 * tt2) + rng.random() * 600
        out[m:m + ln] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt2 / .25) * .06
    return out * np.minimum(1, t / .4) * np.clip((dur - t) / .4, 0, 1)
def alarm(): n = int(.9 * SR); t = tt_(n); f = np.where((t * 6).astype(int) % 2 == 0, 880, 660); return np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .18 * np.clip((.9 - t) / .1, 0, 1)
for e in EV:
    s_, t, d = e['s'], e['t'], e.get('d', 1.0)
    if s_ == 'street': addv(street(d), t, .5)
    elif s_ == 'boom': addv(kick(1.2), t, .5)
    elif s_ == 'pop': addv(pop(900), t, .55)
    elif s_ == 'blip': addv(xylo(91, .3), t, .4)
    elif s_ == 'tick': addv(tick(e.get('n', 0)), t, .5)
    elif s_ == 'up': addv(chime(True), t, .45); addv(xylo(84 + 3 * e.get('n', 0), .3), t + .05, .2)
    elif s_ == 'down': addv(chime(False), t, .45); addv(errbuzz(), t, .12)
    elif s_ == 'steps': addv(steps(d, 9), t, .6)
    elif s_ == 'steps1': addv(steps(d, 4.5), t, .45)
    elif s_ == 'night': addv(night(d), t, .7)
    elif s_ == 'birds': addv(birds(d), t, .6)
    elif s_ == 'yawn': addv(yawn(), t, .5)
    elif s_ == 'cafe': addv(cafe(d), t, .5)
    elif s_ == 'ok': addv(chime(True), t, .5)
    elif s_ == 'error': addv(errbuzz(), t, .55)
    elif s_ == 'whoosh': addv(whoosh(.6), t - .25, .45)
    elif s_ == 'shrug': addv(boing(260, 200, .3), t, .3)
    elif s_ == 'shine': addv(sparkle(), t, .45)
    elif s_ == 'ruler': addv(zip_(), t, .5)
    elif s_ == 'laugh': addv(boing(320, 640, .3), t, .25); addv(boing(340, 680, .3), t + .15, .2)
    elif s_ == 'rain': addv(rain(d), t, .7)
    elif s_ == 'rush': addv(whoosh(d), t, .5)
    elif s_ == 'heart': addv(heartbeat(d), t, .6)
    elif s_ == 'crack': addv(crack(), t, .7)
    elif s_ == 'hit': addv(kick(1.3), t, .7)
    elif s_ == 'sparkle': addv(sparkle(), t, .5)
    elif s_ == 'sting': addv(bell(88, 1.0), t, .4)
    elif s_ == 'stadium': addv(stadium(d), t, .6)
    elif s_ == 'laughter': addv(laughter(d), t, .8)
    elif s_ == 'gun': addv(gun(), t, .7)
    elif s_ == 'cheer': addv(stadium(2.0), t, 1.2)
    elif s_ == 'scribble': addv(bp(rng.standard_normal(int(.8 * SR)), 2000, 7000) * (np.abs(np.sin(2 * np.pi * 7 * tt_(int(.8 * SR)))) ** 3) * .35, t, .5)
    elif s_ == 'glitch': addv(glitch(), t, .7)
    elif s_ == 'alarm': addv(alarm(), t, .45)
    elif s_ == 'hit2': addv(kick(1.4), t, .8); addv(crash_glass()[: int(.6 * SR)] * .3, t, .4)
    elif s_ == 'spin':
        k = 0.0
        while k < d - .03: addv(xylo(90 + int(k * 37) % 5, .06), t + k, .22); k += .07

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
ML, MR = tame(S.L), tame(S.R)
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
