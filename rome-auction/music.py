"""music.py · score + SFX (+ voice) for "SOLD!", all synthesized from events.json and timing.json.
  python music.py out/mix_voice.wav  voice/scratch_full.wav     # with a voice (the scratch read, or YOUR recording)
  python music.py out/mix_novoice.wav none                      # music + SFX only
120 BPM, bars start at t = 0. One chord per bar, a bright I–V–vi–IV pop loop in F; each round has its own flavour:
open = brass fanfare, round 1 = funk slap bass, round 2 = quiz (marimba arps + cowbell, drums only before the 25,000 hit),
SOLD = crash + bright lead, round 3 = minor march (hats subdivide with the calendar, snare roll into TIME'S UP), end = fanfare bookend.
Voice + SFX sit on their own bus; the music ducks under it; soft clip; −14 LUFS is set later by the mux."""
import json, os, sys
import numpy as np
from scipy.signal import resample_poly
D = os.path.dirname(os.path.abspath(__file__)); os.chdir(D)
import synth_lib as S
from synth_lib import *

OUT = sys.argv[1] if len(sys.argv) > 1 else 'out/mix_voice.wav'
VOICE = sys.argv[2] if len(sys.argv) > 2 else 'voice/scratch_full.wav'
EVJ = json.load(open('events.json')); TOTAL = EVJ['dur']; EV = EVJ['ev']
BEAT = 0.5; BAR = 4 * BEAT
SEC = {e['n']: e['t'] for e in EV if e['s'] == 'sec'}
VL = np.zeros(S.N); VR = np.zeros(S.N)
def addv(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= S.N or i < 0: return
    sig = sig[: S.N - i] * gain; l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    VL[i:i + len(sig)] += sig * l * 1.414; VR[i:i + len(sig)] += sig * r * 1.414

# ---------------- instruments (from the style's demo palette) ----------------
def square_lead(m, dur=0.2, vib=0.004):
    n = int(dur * SR); t = np.arange(n) / SR; f = mtof(m) * (1 + vib * np.sin(2 * np.pi * 6 * t)); ph = np.cumsum(f) / SR
    s = lp(np.sign(np.sin(2 * np.pi * ph)) * 0.5 + 0.5 * np.sin(2 * np.pi * ph), 3500)
    return s * np.minimum(1, t / 0.005) * np.clip((dur - t) / 0.03, 0, 1) * 0.45
def brass_stab(ms, dur=0.16):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for m in ms:
        for d in (-0.08, 0.08): ph = np.cumsum(np.full(n, mtof(m) * (1 + d / 100))) / SR; s += 2 * (ph % 1) - 1
    s /= len(ms) * 2; k = np.exp(-t * 25)
    return (lp(s, 4000) * k + lp(s, 900) * (1 - k)) * np.minimum(1, t / 0.004) * np.clip((dur - t) / 0.04, 0, 1) * 0.8
def slap(m, dur=0.2):
    n = int(dur * SR); t = np.arange(n) / SR; f = mtof(m); ph = 2 * np.pi * f * t
    s = np.sin(ph) + 0.5 * np.sin(2 * ph) * np.exp(-t * 30) + 0.3 * (2 * ((f * t) % 1) - 1) * np.exp(-t * 20)
    return lp(s, 1600) * np.minimum(1, t / 0.003) * np.exp(-t * 7) * 0.7
def marimba(m, dur=0.3):
    n = int(dur * SR); t = np.arange(n) / SR; f = mtof(m)
    return (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 40)) * np.exp(-t * 11) * 0.5
def woodblock(f=1100):
    n = int(0.12 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 1.6 * t)) * np.exp(-t * 55) * 0.8
def cowbell():
    n = int(0.25 * SR); t = np.arange(n) / SR
    return bp(np.sign(np.sin(2 * np.pi * 560 * t)) + np.sign(np.sin(2 * np.pi * 845 * t)), 500, 3000) * np.exp(-t * 14) * 0.3
def crash(dur=1.4):
    n = int(dur * SR); t = np.arange(n) / SR; return hp(rng.standard_normal(n), 3500) * np.exp(-t * 2.8) * 0.35
def puff(dur=0.4):
    n = int(dur * SR); t = np.arange(n) / SR; return lp(rng.standard_normal(n), 1200) * np.sin(np.pi * t / dur) ** 2 * 0.6
def pssh(dur=0.22):
    n = int(dur * SR); t = np.arange(n) / SR; return bp(rng.standard_normal(n), 1500, 7000) * np.exp(-t * 9) * 0.7
def buzz():
    n = int(0.6 * SR); t = np.arange(n) / SR
    return lp(np.sign(np.sin(2 * np.pi * 110 * t)) + np.sign(np.sin(2 * np.pi * 116 * t)), 1500) * np.clip((0.6 - t) / 0.05, 0, 1) * 0.35
def ding():
    return bell(96, 1.2) * 0.6 + np.concatenate([np.zeros(int(0.09 * SR)), bell(100, 1.2) * 0.6])[: int(1.2 * SR)]
def register():                      # cash-register "cha-ching"
    out = np.zeros(int(1.0 * SR)); a = clink(3200); out[:len(a)] += a; b = ding(); out[int(.08 * SR):int(.08 * SR) + len(b)] += b[:len(out) - int(.08 * SR)]; return out * .8
def coin_jingle(n=10):
    out = np.zeros(int(1.2 * SR))
    for k in range(n):
        c = clink(rng.uniform(2400, 4200)); i = int(rng.uniform(0, .7) * SR); out[i:i + len(c)] += c[:len(out) - i] * rng.uniform(.4, 1)
    return out
def crowd(dur=1.4, gasp=False):
    n = int(dur * SR); t = np.arange(n) / SR; x = rng.standard_normal(n)
    if gasp: return bp(x, 600, 3500) * np.exp(-t * 5) * np.minimum(1, t / .03) * 0.6
    voices = sum(np.sin(2 * np.pi * np.cumsum(rng.uniform(180, 320) * (1 + .08 * np.sin(2 * np.pi * rng.uniform(3, 6) * t))) / SR) for _ in range(6))
    return (bp(x, 400, 3000) * 0.5 + lp(voices, 1200) * .08) * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** .6 * 0.7
def fight(dur):
    out = np.zeros(int(dur * SR) + 1)
    for k in range(int(dur / .07)):
        s = [pop(rng.uniform(300, 900)), pssh(.1), woodblock(rng.uniform(500, 900))][k % 3]; i = int(k * .07 * SR); out[i:i + len(s)] += s[:len(out) - i] * .6
    return out
def fanfare(t0, top=72):
    for k, m in enumerate([top, top + 4, top + 7, top + 12]): add(brass_stab([m, m + 4], 0.16), t0 + k * BEAT / 3, 0.55)
    add(brass_stab([top, top + 4, top + 7, top + 12], 1.0), t0 + BEAT * 4 / 3, 0.6); add(crash(2.0), t0, 0.7)

# ---------------- arrangement ----------------
CH = {'F': (41, [65, 69, 72]), 'C': (36, [64, 67, 72]), 'Dm': (38, [62, 65, 69]), 'Bb': (34, [62, 65, 70]), 'A': (45, [61, 64, 69]), 'Gm': (43, [62, 67, 70])}
LOOP_MAJ = ['F', 'C', 'Dm', 'Bb']; LOOP_MIN = ['Dm', 'Bb', 'Gm', 'A']
MEL = [[72, 0, 74, 76, 0, 79, 76, 74], [76, 0, 74, 72, 0, 67, 69, 72], [74, 0, 76, 77, 0, 81, 79, 77], [74, 72, 70, 0, 72, 0, 74, 77]]
def drums(t0, g=1.0, hats=8, snare_on=True, kick_pat=(0, 2), extra=True):
    for k in kick_pat: add(kick(), t0 + k * BEAT, .85 * g)
    if extra: add(kick(.7), t0 + 2.5 * BEAT, .45 * g)
    if snare_on:
        for k in (1, 3): add(snare(), t0 + k * BEAT, .45 * g); add(clap(), t0 + k * BEAT, .3 * g, .15)
    for k in range(hats): add(hat(k == hats - 1), t0 + k * (4 / hats) * BEAT + (.01 if k % 2 else 0), .38 * g, .35)
def bassline(t0, root, style):
    pats = {'funk': [(0, 0), (.75, 12), (1.5, 0), (2, 7), (2.5, 12), (3.25, 0), (3.5, 10)], 'drive': [(k * .5, 0 if k % 2 == 0 else 12) for k in range(8)],
            'pump': [(0, 0), (1, 0), (2, 0), (3, 0)], 'march': [(0, 0), (1, 7), (2, 0), (3, 7)]}
    for b, o in pats[style]: add(slap(root + o, .18), t0 + b * BEAT, .55)
def section(t):
    for n, a in sorted(SEC.items(), key=lambda x: -x[1]):
        if t >= a - 1e-6: return n
    return 'open'
nbars = int(np.ceil(TOTAL / BAR))
t25 = next((e['t'] for e in EV if e['s'] == 'bigslam'), 17)
for b in range(nbars):
    t0 = b * BAR; sec = section(t0 + .01)
    if t0 >= SEC['loop']: break
    loop = LOOP_MIN if sec in ('r3', 'r3b', 'ex') else LOOP_MAJ
    root, chord = CH[loop[b % 4]]; mel = MEL[b % 4]
    pad_g = .10
    if sec == 'open':
        drums(t0, .8, hats=8); bassline(t0, root, 'pump')
        for k, m in enumerate(mel):
            if m: add(bell(m + 12, .6), t0 + k * BEAT / 2, .12, .3)
    elif sec == 'r1':
        drums(t0, 1.0, hats=8); bassline(t0, root, 'funk')
        for k in (1, 3): add(brass_stab([n + 12 for n in chord], .12), t0 + (k + .5) * BEAT, .22)
    elif sec in ('r2', 'r2b'):
        quiet = (t25 - BAR / 2) <= t0 + 1e-6 < t25 or (t25 - BAR / 2 < t0 + BAR and t0 < t25 and t0 + BAR / 2 >= t25 - BAR / 2 and False)
        drums(t0, 1.0, hats=16 if sec == 'r2b' else 8)
        for k in (1, 3): add(cowbell(), t0 + k * BEAT, .5, -.3)
        for k in range(8):
            tt = t0 + k * BEAT / 2
            if not (t25 - BAR / 2 <= tt < t25): add(marimba(chord[k % 3] + (12 if k >= 4 else 0)), tt, .55, .25)
        for b2, o in [(0, 0), (1.5, 7), (2, 0), (3, 12)]:
            tt = t0 + b2 * BEAT
            if not (t25 - BAR / 2 <= tt < t25): add(slap(root + o, .18), tt, .55)
    elif sec == 'sold':
        drums(t0, 1.1, hats=8); bassline(t0, root, 'drive')
        for k, m in enumerate(mel):
            if m: add(square_lead(m + 12, .19), t0 + k * BEAT / 2, .3, -.15)
    elif sec in ('r3', 'r3b', 'ex'):
        first = abs(t0 - (np.floor(SEC['r3'] / BAR) * BAR)) < 1e-6
        if first: drums(t0, 1.0, hats=0, extra=False)
        else: drums(t0, 1.0, hats=16 if sec == 'r3b' else 8); bassline(t0, root, 'march')
        add(pad([n - 12 for n in chord], BAR), t0, pad_g)
    elif sec == 'end':
        drums(t0, .9, hats=8); bassline(t0, root, 'pump')
        for k, m in enumerate(mel):
            if m: add(bell(m + 12, .7), t0 + k * BEAT / 2, .14, .3)
        add(pad(chord, BAR), t0, pad_g)
fanfare(0); fanfare(SEC['sold'], 77); fanfare(SEC['end'])
roll(SEC['r3b'], SEC['ex'] - .02)
roll(SEC['loop'], TOTAL - .02)                                      # the pickup back into the opening fanfare: a seamless loop

# ---------------- SFX from the picture's events ----------------
for e in EV:
    s, t, f = e['s'], e['t'], e.get('f', 900)
    if s == 'slam': addv(stamp(big=True), t, .55); add(crash(), t, .5); addv(woodblock(500), t, .6)
    elif s == 'bigslam': addv(stamp(big=True), t, .7); addv(register(), t, .5); add(crash(2.0), t, .6)
    elif s == 'sticker': addv(pop(1100), t, .3); addv(boing(300, 650, .3), t, .2)
    elif s == 'pop': addv(pop(f), t, .28, rng.uniform(-.4, .4))
    elif s == 'cheer': addv(crowd(1.6), t, .55)
    elif s == 'gasp': addv(crowd(.8, gasp=True), t, .6)
    elif s == 'land': addv(plop(), t, .7); addv(boing(260, 520, .3), t, .3)
    elif s == 'fight': pass
    elif s == 'poof': addv(puff(), t - .1, .7); addv(sparkle(), t, .3)
    elif s == 'boing': addv(boing(200, 600, .4), t, .45)
    elif s == 'ding': addv(ding(), t, .5)
    elif s == 'coins': addv(coin_jingle(12), t, .5); addv(register(), t, .35)
    elif s == 'tick': addv(woodblock(f), t, .45); addv(key_click(), t, .3)
    elif s == 'flip': addv(key_click(), t, .5); addv(woodblock(f), t, .35); addv(pssh(.06), t, .25)
    elif s == 'lights': addv(clink(1800), t, .4); addv(whoosh(.3), t - .1, .25)
    elif s == 'whoosh': addv(whoosh(.4), t - .2, .3)
    elif s == 'stamp': addv(stamp(), t, .6); addv(woodblock(400), t, .4)
    elif s == 'step': addv(kick(.6)[: int(.12 * SR)], t, .45); addv(pssh(.08), t, .2)
    elif s == 'buzz': addv(buzz(), t, .7)
    elif s == 'type': addv(key_click(), t, .32, rng.uniform(-.2, .2))
fs = [e['t'] for e in EV if e['s'] == 'fight']
for t in fs:
    nxt = next((e['t'] for e in EV if e['s'] == 'poof' and e['t'] > t), t + 1); addv(fight(nxt - t), t, .5)

# ---------------- voice ----------------
VB = np.zeros(S.N)
if VOICE != 'none':
    import soundfile as sf
    v, sr = sf.read(VOICE)
    if v.ndim > 1: v = v.mean(1)
    if sr != SR: v = resample_poly(v, SR, sr)
    v = hp(v, 80); v = v / (np.max(np.abs(v)) + 1e-9)
    env_ = lp(np.abs(v), 30, order=1); g = 1 / np.maximum(1, (env_ / .25) ** .55)        # gentle compression
    v = v * g; v = v / (np.max(np.abs(v)) + 1e-9)
    VB[: min(len(v), S.N)] = v[: S.N] * 0.95

# ---------------- mix: music ducks under the voice and the SFX, balanced by measured RMS ----------------
def tame(x): x = hp(x, 38); return x - 0.45 * lp(x, 110)                       # lighter low end (keeps 20–120 Hz near −3 dB)
ML, MR = tame(S.L), tame(S.R)
sfx = np.abs(VL) + np.abs(VR)
venv = lp(np.abs(VB), 8, order=1); venv /= (np.max(venv) + 1e-9)
senv = lp(sfx, 12, order=1); senv /= (np.max(senv) + 1e-9)
duck = 1 - np.clip(0.6 * np.clip(venv * 4, 0, 1) + 0.25 * np.clip(senv * 3, 0, 1), 0, .65)
rms = lambda x: np.sqrt(np.mean(x ** 2) + 1e-12)
T_ = json.load(open('timing.json')); act = np.zeros(S.N, bool)
for l in T_['lines']: act[int(l['t0'] * SR):int(l['t1'] * SR)] = True
if VOICE != 'none':
    vr = rms(VB[act]); mr = rms(((ML + MR) / 2 * duck)[act]); sr_ = rms(((VL + VR) / 2)[act] + 1e-9)
    mg = vr / mr * 10 ** (-11 / 20); sg = vr / sr_ * 10 ** (-7 / 20)
else:
    mg = 1.0; sg = rms((ML + MR) / 2) / rms((VL + VR) / 2) * 10 ** (2 / 20); duck = np.ones(S.N)
mL = ML * duck * mg + VL * sg + VB; mR = MR * duck * mg + VR * sg + VB
mix = np.stack([mL, mR])[:, : int(TOTAL * SR)]
mix = mix / (np.max(np.abs(mix)) + 1e-9) * 1.25
mix = np.tanh(mix) * .9
os.makedirs(os.path.dirname(OUT) or '.', exist_ok=True)
import wave
out = (mix.T * 32767).astype(np.int16)
w = wave.open(OUT, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes()); w.close()
print('ok', OUT, round(TOTAL, 2), 's, voice:', VOICE)
