"""music.py · the score + SFX (+ voice) of "The Pudding Guy", synthesized from events.json and timing.json.
  python music.py out/mix.wav voice/take.wav      # with the voice (the expressive take, or YOUR recording)
  python music.py out/mix_novoice.wav none          # score + SFX only
120 BPM in F major, a bright 1999 "life hack" groove: a whistled tune, marimba off-beats, a two-feel pizzicato bass
(root and fifth only, so nothing clashes), kick, claps and a shaker. The sections follow the story: the hook starts
loud on the first frame; the store is the groove; the cart run doubles the hats; the "problem" drops to a ticking clock
over D minor; the genius move brings the groove back with claps; the plane soars; the punchline is stop-time, then a
ta-da and a drum pickup that loops into the avalanche. Every pitched effect is tuned to the key.
The score sits 14 dB under the voice and ducks gently while the narrator speaks."""
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
W = lambda lid, k=0: TM['lines'][[l['id'] for l in TM['lines']].index(lid)]['words'][k]['t0']
SECS = [('hook', 0), ('jet', CUT['L2']), ('store', CUT['L3']), ('cart', CUT['L5']), ('problem', CUT['L6']), ('genius', CUT['L7']),
        ('fly', CUT['L8']), ('punch', CUT['L9']), ('loop', LOOP)]
def section(t):
    cur = 'hook'
    for n, a in SECS:
        if t >= a - 1e-6: cur = n
    return cur
VL = np.zeros(S.N); VR = np.zeros(S.N)
def addv(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= S.N or i < 0: return
    sig = sig[: S.N - i] * gain; l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    VL[i:i + len(sig)] += sig * l * 1.414; VR[i:i + len(sig)] += sig * r * 1.414
tt_ = lambda n: np.arange(n) / SR

# ---------------- instruments ----------------
def whistle(m, dur):
    n = int(dur * SR); t = tt_(n); vib = 1 + .006 * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - .08) / .1, 0, 1)
    ph = 2 * np.pi * np.cumsum(mtof(m) * vib) / SR; s = np.sin(ph) + .08 * np.sin(2 * ph) + .02 * hp(rng.standard_normal(n), 3000)
    return s * np.minimum(1, t / .02) * np.clip((dur - t) / .05, 0, 1) * .3
def marimba(m, dur=.35): return pluck(m, dur, .7) * .45
def pbass(m, dur=.3):
    # a round plucked double bass: fundamental + soft 2nd and 3rd partials (no buzzy odd overtones)
    n = int(dur * SR); t = tt_(n); ph = 2 * np.pi * mtof(m) * t
    s = np.sin(ph) + .45 * np.sin(2 * ph) * np.exp(-t * 10) + .18 * np.sin(3 * ph) * np.exp(-t * 16)
    return lp(s, 900) * np.exp(-t * 7) * np.minimum(1, t / .004) * .75
def shaker():
    n = int(.07 * SR); t = tt_(n); return bp(rng.standard_normal(n), 5000, 11000) * np.sin(np.pi * t / (n / SR)) * .22
def stab(ms, dur=.25):
    n = int(dur * SR); t = tt_(n); s = np.zeros(n)
    for m in ms:
        for d in (-.1, 0, .1): ph = np.cumsum(np.full(n, mtof(m) * (1 + d / 100))) / SR; s += 2 * (ph % 1) - 1
    return lp(s / (len(ms) * 3), 1700) * np.minimum(1, t / .008) * np.exp(-t * 6) * .55
def tick():
    n = int(.04 * SR); t = tt_(n); return (np.sin(2 * np.pi * 3200 * t) + .5 * np.sin(2 * np.pi * 5100 * t)) * np.exp(-t * 160) * .5
def clack(f):
    n = int(.08 * SR); t = tt_(n); return (bp(rng.standard_normal(n), f * .6, f * 1.6) * np.exp(-t * 70) + np.sin(2 * np.pi * f * .5 * t) * np.exp(-t * 90) * .5) * .5
def avalanche_sfx(dur=2.6, k=130):
    out = np.zeros(int((dur + .3) * SR))
    for _ in range(k):
        c = clack(rng.uniform(900, 2600)); i = int(rng.uniform(0, dur) ** 1.1 / dur ** .1 * SR); i = min(i, len(out) - len(c)); out[i:i + len(c)] += c * rng.uniform(.3, 1)
    rum = lp(rng.standard_normal(len(out)), 300) * np.sin(np.pi * np.clip(tt_(len(out)) / dur, 0, 1)) * .35
    return out + rum
def jet_sfx(dur=3.2):
    n = int(dur * SR); t = tt_(n); env = np.exp(-((t - dur * .55) / (dur * .28)) ** 2)
    roar = lp(rng.standard_normal(n), 900) * 1.2 + bp(rng.standard_normal(n), 2000, 6000) * .5
    f = 2600 * (1 + .25 * np.tanh((dur * .55 - t) * 2)); whine = np.sin(2 * np.pi * np.cumsum(f) / SR) * .12
    return (roar + whine) * env * .9
def beep(f=2637, dur=.12):
    n = int(dur * SR); t = tt_(n); return np.sign(np.sin(2 * np.pi * f * t)) * .15 * np.minimum(1, t / .003) * np.clip((dur - t) / .01, 0, 1)
def keyc():
    n = int(.03 * SR); t = tt_(n); return bp(rng.standard_normal(n), 2000, 6000) * np.exp(-t * 200) * .6
def clang():
    n = int(1.4 * SR); t = tt_(n); s = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) * a for f, d, a in [(523.3, 3, .5), (1318.5, 5, .3), (2093, 7, .2), (785, 4, .25)])
    return s * .6 + lp(rng.standard_normal(n), 400) * np.exp(-t * 30) * .4
def rattle():
    n = int(.22 * SR); t = tt_(n); return bp(rng.standard_normal(n), 700, 3500) * (np.abs(np.sin(2 * np.pi * 28 * t)) ** 4) * np.exp(-t * 6) * .35
def register():
    out = np.zeros(int(1.3 * SR)); a = bell(96, 1.2) * .5; b = bell(100, 1.1) * .45     # C7 + E7: the C chord of the bar
    out[:len(a)] += a; i = int(.07 * SR); out[i:i + len(b)] += b[:len(out) - i]
    d = lp(rng.standard_normal(int(.25 * SR)), 900) * np.exp(-tt_(int(.25 * SR)) * 15) * .6; j = int(.15 * SR); out[j:j + len(d)] += d
    return out
def rip(dur=.35):
    n = int(dur * SR); t = tt_(n); x = rng.standard_normal(n); out = np.zeros(n)
    for i in range(0, n, 512):
        fc = 1200 + 3000 * (i / n); out[i:i + 512] = bp(x[max(0, i - 2048):i + 512], fc * .7, fc * 1.3)[-len(x[i:i + 512]):]
    return out * (np.abs(np.sin(2 * np.pi * 40 * t)) ** 2) * np.sin(np.pi * t / dur) * .5
def slurp():
    n = int(.5 * SR); t = tt_(n); x = rng.standard_normal(n); out = np.zeros(n)
    for i in range(0, n, 512):
        fc = 600 + 900 * (.5 + .5 * np.sin(2 * np.pi * 9 * i / SR)); out[i:i + 512] = bp(x[max(0, i - 2048):i + 512], fc * .8, fc * 1.25)[-len(x[i:i + 512]):]
    return out * np.sin(np.pi * t / (n / SR)) * .5
def sparkle_f():
    out = np.zeros(int(1.0 * SR))
    for k, m in enumerate([77, 81, 84, 89]): b_ = bell(m, .8) * .35; i = int(k * .05 * SR); out[i:i + len(b_)] += b_[: len(out) - i]
    return out

# ---------------- harmony ----------------
PROG = ['F', 'Dm', 'Bb', 'C']; MINOR = ['Dm', 'Bb', 'Gm', 'A']
CH = {'F': (41, 48, [65, 69, 72]), 'Dm': (38, 45, [62, 65, 69]), 'Bb': (34, 41, [62, 65, 70]), 'C': (36, 43, [64, 67, 72]), 'Gm': (43, 38, [62, 67, 70]), 'A': (33, 40, [61, 64, 69])}
MEL = [
    [(0, 72, .5), (.5, 69, .5), (1, 72, .5), (1.5, 77, 1), (2.5, 76, .5), (3, 77, 1)],
    [(0, 74, .5), (.5, 72, .5), (1, 69, 1), (2, 65, .5), (2.5, 69, .5), (3, 74, 1)],
    [(0, 70, .5), (.5, 74, .5), (1, 77, 1), (2, 74, .5), (2.5, 72, .5), (3, 70, 1)],
    [(0, 72, .5), (.5, 76, .5), (1, 79, 1), (2, 76, .5), (2.5, 74, .5), (3, 72, 1)],
    [(0, 77, 1), (1, 76, .5), (1.5, 74, .5), (2, 72, 1), (3, 69, 1)],
    [(0, 74, 1), (1, 72, .5), (1.5, 69, .5), (2, 65, 1), (3, 69, 1)],
    [(0, 70, .5), (.5, 72, .5), (1, 74, .5), (1.5, 77, .5), (2, 74, 1), (3, 70, 1)],
    [(0, 72, .5), (.5, 74, .5), (1, 76, .5), (1.5, 79, .5), (2, 84, 1.5), (3.5, 79, .5)],
]
SWING = .06; sw = lambda b: b + (SWING if abs(b % 1 - .5) < 1e-6 else 0)
TAX = W('L9', 2); PUD = W('L9', 6)
nb = int(np.ceil(TOTAL / BAR))
for b in range(nb):
    t0 = b * BAR
    for k in range(4):
        tb = t0 + k * BEAT; sec = section(tb + .01)
        if tb >= LOOP - 1e-6: break
        name = (MINOR if sec == 'problem' else PROG)[b % 4]; root, fifth, chord = CH[name]
        groove = sec in ('hook', 'jet', 'store', 'cart', 'genius', 'fly')
        if groove:
            add(pbass(root if k < 2 else fifth, .3), tb, .9); add(pbass((root if k < 2 else fifth) + 12, .15), tb + BEAT / 2 + SWING * BEAT, .5)
            add(kick(.8), tb, .55) if k % 2 == 0 else add(clap(), tb, .32, .1)
            add(marimba(chord[k % 3] + 12, .3), tb + BEAT / 2 + SWING * BEAT, .8, .3)
            for j in range(2 if sec != 'cart' else 4): add(shaker(), tb + j * BEAT / (2 if sec != 'cart' else 4), .8, -.3)
            if sec == 'fly' and k == 0: add(pad([n for n in chord], BAR), tb, .55)
        elif sec == 'problem':
            if k % 2 == 0: add(pbass(root, .25), tb, .8)
            if k == 0: add(pad([n - 12 for n in chord], BAR), tb, .4)
        elif sec == 'punch':
            if tb < TAX - .05 and k % 2 == 0: add(pbass(root, .3), tb, .8)
    for (o, m, d) in MEL[b % 8]:
        tn = t0 + sw(o) * BEAT; sec = section(tn + .01)
        if tn >= LOOP - 1e-6: continue
        if sec in ('store', 'genius', 'fly'): add(whistle(m, d * BEAT * .9), tn, 1.0, .1)
        elif sec in ('hook', 'jet', 'cart'): add(marimba(m, .3), tn, .9, .1)
# the hook: a stab on the first frame; the punchline: stop-time, then a ta-da on "pudding"; the loop pickup
add(stab([65, 69, 72, 77], .5), 0, .9); add(kick(1.0), 0, .8)
add(stab([65, 69, 72, 77], .6), PUD + .05, .8); add(sparkle_f(), PUD + .05, .5)
for k in range(4): add(snare(), LOOP - .02 + k * .12, .12 + .06 * k)

# ---------------- SFX ----------------
for e in EV:
    s, t = e['s'], e['t']
    if s == 'avalanche': addv(avalanche_sfx(2.6), t, .7)
    elif s == 'pop': addv(pop(900), t, .3)
    elif s == 'catch': addv(pop(1400), t, .4)
    elif s == 'jet': addv(jet_sfx(3.2), t, .9, .2)
    elif s == 'sting': addv(sparkle_f(), t, .35)
    elif s == 'cut': addv(whoosh(.3), t - .15, .14)
    elif s == 'beep': addv(beep(), t, .5)
    elif s == 'key': addv(keyc(), t, .5)
    elif s == 'clang': addv(clang(), t, .55)
    elif s == 'rattle': addv(rattle(), t, .7, -.2)
    elif s == 'register': addv(register(), t, .7)
    elif s == 'tick': addv(tick(), t, .6)
    elif s == 'peel': addv(rip(.4), t, .7)
    elif s == 'stamp': addv(stamp(), t, .55)
    elif s == 'ding': addv(bell(89, 1.2), t, .4); addv(sparkle_f(), t, .25)
    elif s == 'peelfast': addv(rip(.1), t, .35, rng.uniform(-.5, .5))
    elif s == 'whoosh': addv(whoosh(.6), t - .25, .4)
    elif s == 'sparkle': addv(sparkle_f(), t, .4)
    elif s == 'slurp': addv(slurp(), t, .6)
    elif s == 'binpop': addv(pop(500), t, .6); addv(clack(800), t + .03, .6)

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
mix = mix / (np.max(np.abs(mix)) + 1e-9) * 1.2; mix = np.tanh(mix) * .9
os.makedirs(os.path.dirname(OUT) or '.', exist_ok=True)
out = (mix.T * 32767).astype(np.int16)
w = wave.open(OUT, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes()); w.close()
print('ok', OUT, round(TOTAL, 2), 's, voice:', VOICE, '| music', MUSIC_DB, 'dB, sfx', SFX_DB, 'dB re voice')
