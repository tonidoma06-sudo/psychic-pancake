"""music.py · the Roman epic score + SFX (+ voice), synthesized from events.json and timing.json.
  python music.py out/mix_voice.wav voice/scratch_full.wav    # with a voice (the scratch read, or YOUR recording)
  python music.py out/mix_novoice.wav none                     # score + SFX only
120 BPM in D minor. open = horn call + war drums building; palace = a tense march (snare, low brass); camp = driving
ostinato (plucked lyre + toms) rising through the bids; senate = a triumphant major fanfare; 66 days = a ticking lyre
time-lapse; road = war drums and horns; doors = drop to a heartbeat, a doom hit on "executed"; end = fanfare reprise
that rolls back into the opening (seamless loop). Music ducks under the voice; −14 LUFS is set by the mux."""
import json, os, sys, wave
import numpy as np
from scipy.signal import resample_poly
D = os.path.dirname(os.path.abspath(__file__)); os.chdir(D)
import synth_lib as S
from synth_lib import *

OUT = sys.argv[1] if len(sys.argv) > 1 else 'out/mix_voice.wav'
VOICE = sys.argv[2] if len(sys.argv) > 2 else 'voice/scratch_full.wav'
EVJ = json.load(open('events.json')); TOTAL = EVJ['dur']; EV = EVJ['ev']
BEAT = .5; BAR = 2.0
SEC = {e['n']: e['t'] for e in EV if e['s'] == 'sec'}
ORDER = sorted(SEC.items(), key=lambda x: x[1])
def section(t):
    cur = 'open'
    for n, a in ORDER:
        if t >= a - 1e-6: cur = n
    return cur
VL = np.zeros(S.N); VR = np.zeros(S.N)
def addv(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= S.N or i < 0: return
    sig = sig[: S.N - i] * gain; l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    VL[i:i + len(sig)] += sig * l * 1.414; VR[i:i + len(sig)] += sig * r * 1.414
def env_(n, a, d): t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)

# ---------------- instruments ----------------
def woodblock(f=1100):
    n = int(0.12 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 1.6 * t)) * np.exp(-t * 55) * 0.8
def tom(f=90, dur=.6, g=1.):
    n = int(dur * SR); t = np.arange(n) / SR; ff = f * (1 + .6 * np.exp(-t * 28))
    s = np.sin(2 * np.pi * np.cumsum(ff) / SR) * np.exp(-t * 6) + lp(rng.standard_normal(n), 900) * np.exp(-t * 40) * .5
    return np.tanh(s * 1.6) * g
def timp_roll(t0, t1, f=73):
    t = t0
    while t < t1: p = (t - t0) / max(t1 - t0, 1e-3); add(tom(f, .3, .25 + .5 * p), t, .5, rng.uniform(-.2, .2)); t += .06
def brass(ms, dur=.5, bright=1.):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for m in ms:
        for d in (-.12, 0, .12): ph = np.cumsum(np.full(n, mtof(m) * (1 + d / 100) * (1 + .003 * np.sin(2 * np.pi * 5 * t)))) / SR; s += 2 * (ph % 1) - 1
    s /= len(ms) * 3; k = np.minimum(1, t / .06)
    out = lp(s, 900 + 2600 * bright) * k * np.clip((dur - t) / .08, 0, 1)
    return out * .55
def horn(m, dur=1.4):
    n = int(dur * SR); t = np.arange(n) / SR; f = mtof(m) * (1 + .004 * np.sin(2 * np.pi * 4.5 * t)); ph = 2 * np.pi * np.cumsum(f) / SR
    s = sum(np.sin(ph * h) / h ** 1.1 for h in range(1, 9)); s = lp(s, 1600)
    return s * np.minimum(1, t / .12) * np.clip((dur - t) / .25, 0, 1) * .35
def lyre(m, dur=1.2):
    n = int(dur * SR); P = max(2, int(SR / mtof(m))); y = np.zeros(n + P); y[:P] = rng.uniform(-1, 1, P)
    for s0 in range(P, n + P, P):
        e = min(s0 + P, n + P); prev = y[s0 - P:e - P]; prev2 = np.concatenate([[y[s0 - P - 1]], prev[:-1]]); y[s0:e] = .996 * .5 * (prev + prev2)
    return hp(y[P:], 120) * .5
def choir(ms, dur):
    n = int(dur * SR); t = np.arange(n) / SR; out = np.zeros(n)
    for m in ms:
        f = mtof(m) * (1 + .004 * np.sin(2 * np.pi * 5.2 * t + m)); ph = 2 * np.pi * np.cumsum(f) / SR; s = np.zeros(n)
        for h in range(1, 18):
            fh = mtof(m) * h; a = np.exp(-((fh - 700) / 220) ** 2) + .7 * np.exp(-((fh - 1150) / 260) ** 2) + .25 * np.exp(-((fh - 2600) / 400) ** 2) + .03
            s += a * np.sin(ph * h)
        out += s
    return out / len(ms) * np.minimum(1, t / .4) * np.clip((dur - t) / .4, 0, 1) * .12
def cymbal(dur=2.):
    n = int(dur * SR); t = np.arange(n) / SR; return hp(rng.standard_normal(n), 4000) * np.exp(-t * 2.2) * .3
def crowd(dur=1.6, roar=1.):
    n = int(dur * SR); t = np.arange(n) / SR; x = rng.standard_normal(n)
    v = sum(np.sin(2 * np.pi * np.cumsum(rng.uniform(170, 330) * (1 + .1 * np.sin(2 * np.pi * rng.uniform(2, 6) * t))) / SR) for _ in range(8))
    return (bp(x, 350, 3200) * .55 + lp(v, 1300) * .07) * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** .5 * .7 * roar
def coins(k=14):
    out = np.zeros(int(1.4 * SR))
    for _ in range(k): c = clink(rng.uniform(2300, 4300)); i = int(rng.uniform(0, .9) * SR); out[i:i + len(c)] += c[:len(out) - i] * rng.uniform(.4, 1)
    return out
def thud(f=55, dur=1.2):
    n = int(dur * SR); t = np.arange(n) / SR; ff = f * (1 + 1.5 * np.exp(-t * 20))
    return np.tanh(np.sin(2 * np.pi * np.cumsum(ff) / SR) * np.exp(-t * 3) * 2 + lp(rng.standard_normal(n), 300) * np.exp(-t * 10)) * .9
def creak(dur=.6):
    n = int(dur * SR); t = np.arange(n) / SR; f = 90 + 60 * np.sin(2 * np.pi * 3 * t)
    return bp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (1 + rng.standard_normal(n) * .3), 300, 2500) * np.sin(np.pi * t / dur) * .3
def heartbeat():
    out = np.zeros(int(.6 * SR)); a = tom(48, .25, .9); out[:len(a)] += a; b = tom(44, .25, .6); i = int(.18 * SR); out[i:i + len(b)] += b[:len(out) - i]; return out

# ---------------- arrangement ----------------
CH = {'Dm': (38, [62, 65, 69]), 'Bb': (34, [62, 65, 70]), 'C': (36, [64, 67, 72]), 'A': (33, [61, 64, 69]), 'F': (41, [65, 69, 72]), 'Gm': (31, [62, 67, 70]), 'D': (38, [62, 66, 69])}
PROG = ['Dm', 'Bb', 'C', 'A']; PROG_MAJ = ['F', 'C', 'Bb', 'C']
ARP = [0, 1, 2, 1, 0, 2, 1, 2]
nb = int(np.ceil(TOTAL / BAR))
for b in range(nb):
    t0 = b * BAR; sec = section(t0 + .01); nxt = section(t0 + BAR - .01)
    if t0 >= SEC['loop'] - 1e-6: break
    prog = PROG_MAJ if sec == 'senate' else PROG
    root, ch = CH[prog[b % 4]]
    if sec == 'open':
        for k in range(4): add(tom(70 if k % 2 == 0 else 95, .6, .8), t0 + k * BEAT, .6, -.1 if k % 2 else .1)
        add(brass([n - 12 for n in ch], BAR, .5), t0, .35); add(choir([n - 12 for n in ch], BAR), t0, 1)
    elif sec == 'palace':
        for k in range(8): add(snare(), t0 + k * BEAT / 2, .18 + (.12 if k % 2 == 0 else 0), .1)
        add(tom(62, .6, .9), t0, .6); add(tom(62, .6, .9), t0 + 2 * BEAT, .5)
        add(brass([root + 12, root + 19], BAR, .3), t0, .3); add(choir([n - 12 for n in ch], BAR), t0, .8)
    elif sec in ('camp', 'bid2'):
        for k in range(8): add(lyre(ch[ARP[k]] + (12 if sec == 'bid2' else 0), .5), t0 + k * BEAT / 2, .32, .25)
        for k in range(4): add(tom(80 if k in (0, 2) else 110, .5, .8), t0 + k * BEAT, .55)
        if sec == 'bid2':
            for k in range(8): add(hat(), t0 + k * BEAT / 2, .3, .3)
        add(brass([n - 12 for n in ch], BAR, .6), t0, .28); add(kick(), t0, .5); add(kick(), t0 + 2 * BEAT, .45)
    elif sec == 'senate':
        for k, m in enumerate([0, 4, 7, 12]): add(brass([ch[0] + m - 2, ch[0] + m + 2], .22, 1), t0 + k * BEAT / 3, .35)
        add(brass(ch, BAR * .9, 1), t0 + BEAT * 1.33, .45); add(cymbal(), t0, .6); add(choir(ch, BAR), t0, 1.4)
        for k in range(4): add(tom(90, .4, .9), t0 + k * BEAT, .5); add(snare(), t0 + (k + .5) * BEAT, .25)
    elif sec == 'lapse':
        for k in range(16): add(lyre(ch[k % 3] + 12, .35), t0 + k * BEAT / 4, .22, .3 * (1 if k % 2 else -1))
        add(woodblock(1400) if False else bell(84, .3) * .0, t0, 0)
        add(choir([n - 12 for n in ch], BAR), t0, .9); add(tom(70, .5, .7), t0, .4)
    elif sec == 'road':
        for k in range(8): add(tom(70 if k % 2 == 0 else 100, .45, 1), t0 + k * BEAT / 2, .55 if k % 2 == 0 else .35, .2 * (1 if k % 2 else -1))
        add(horn(root + 24, BAR * .95), t0, .9); add(brass([n - 12 for n in ch], BAR, .8), t0, .35); add(cymbal(1.), t0, .3)
    elif sec == 'doors':
        pass
    elif sec == 'end':
        for k, m in enumerate([0, 4, 7]): add(brass([ch[0] + m], .2, 1), t0 + k * BEAT / 3, .3)
        add(brass(ch, BAR * .9, .8), t0 + BEAT, .35); add(choir(ch, BAR), t0, 1.1)
        for k in range(4): add(tom(75 if k % 2 == 0 else 100, .5, .8), t0 + k * BEAT, .5)
# the first bar's horn call and the loop pickup back into it
add(horn(62, 1.6), .05, 1.0); add(horn(69, 1.0), .85, .8); add(cymbal(2.5), 0, .5)
timp_roll(SEC['loop'], TOTAL - .02)
# doors: a heartbeat under the silence
for t in np.arange(SEC['doors'], SEC['end'] - .3, .75): add(heartbeat(), t, .7)

# ---------------- SFX ----------------
for e in EV:
    s, t, f = e['s'], e['t'], e.get('f', 900)
    if s == 'gavel': addv(woodblock(520), t, .9); addv(thud(70, .5), t, .7); add(cymbal(), t, .5)
    elif s == 'sting': addv(sparkle(), t, .3); addv(whoosh(.3), t - .15, .25)
    elif s == 'crowd': addv(crowd(1.8), t, .55)
    elif s == 'cut': addv(whoosh(.35), t - .18, .18)
    elif s == 'march': addv(kick(.6)[: int(.12 * SR)], t, .4); addv(clink(1900), t + .02, .15)
    elif s == 'scuffle':
        nx = next((x['t'] for x in EV if x['s'] == 'poof' and x['t'] > t), t + .5)
        for k in range(int((nx - t) / .07)): addv([pop(rng.uniform(300, 900)), pssh_ if False else whoosh(.12), clink(rng.uniform(1500, 2800))][k % 3], t + k * .07, .35, rng.uniform(-.4, .4))
    elif s == 'poof': addv(lp(rng.standard_normal(int(.5 * SR)), 1200) * np.sin(np.pi * np.arange(int(.5 * SR)) / (.5 * SR)) ** 2 * .6, t - .1, .8)
    elif s == 'roll': addv(np.concatenate([clink(rng.uniform(1600, 2600)) for _ in range(6)]), t, .25)
    elif s == 'unroll': addv(whoosh(.8), t, .45)
    elif s == 'banner': addv(stamp(), t, .4)
    elif s == 'tick': addv(woodblock(f), t, .4); addv(key_click(), t, .3)
    elif s == 'slam': addv(stamp(big=True), t, .6); add(cymbal(), t, .5)
    elif s == 'bigslam': addv(stamp(big=True), t, .8); addv(coins(10), t, .4); add(cymbal(2.2), t, .7)
    elif s == 'coins': addv(coins(18), t, .6)
    elif s == 'whip': addv(whoosh(.55), t - .05, .5)
    elif s == 'fanfare': addv(crowd(2.2, 1.2), t, .55)
    elif s == 'clap':
        for k in range(10): addv(clap(), t + k * .11 + rng.uniform(0, .04), .25, rng.uniform(-.6, .6))
    elif s == 'ding': addv(sparkle(), t, .4); addv(bell(88, 1.5), t, .3)
    elif s == 'timelapse': addv(whoosh(1.4), t, .3)
    elif s == 'step': addv(tom(55, .25, .7), t, .35); addv(pssh_ if False else hat(), t + .01, .15)
    elif s == 'doors': addv(creak(.7), t, .6); addv(thud(45, 1.5), t + .3, .9)
    elif s == 'doom': addv(thud(38, 2.2), t, 1.0); add(cymbal(3.), t, .6); add(choir([50, 53, 57], 1.6), t, 1.5)
    elif s == 'stamp': addv(stamp(), t, .55)

# ---------------- voice ----------------
VB = np.zeros(S.N)
if VOICE != 'none':
    import soundfile as sf
    v, sr = sf.read(VOICE)
    if v.ndim > 1: v = v.mean(1)
    if sr != SR: v = resample_poly(v, SR, sr)
    v = hp(v, 80); v = v / (np.max(np.abs(v)) + 1e-9)
    e_ = lp(np.abs(v), 30, order=1); v = v / np.maximum(1, (e_ / .25) ** .55); v = v / (np.max(np.abs(v)) + 1e-9)
    VB[: min(len(v), S.N)] = v[: S.N] * .95

# ---------------- mix ----------------
def tame(x): x = hp(x, 35); return x - .4 * lp(x, 100)
ML, MR = tame(S.L), tame(S.R)
venv = lp(np.abs(VB), 8, order=1); venv /= (np.max(venv) + 1e-9)
duck = 1 - np.clip(.6 * np.clip(venv * 4, 0, 1), 0, .6)
rms = lambda x: np.sqrt(np.mean(x ** 2) + 1e-12)
TM = json.load(open('timing.json')); act = np.zeros(S.N, bool)
for l in TM['lines']: act[int(l['t0'] * SR):int(l['t1'] * SR)] = True
if VOICE != 'none':
    vr = rms(VB[act]); mg = vr / rms(((ML + MR) / 2 * duck)[act]) * 10 ** (-11 / 20); sg = vr / rms(((VL + VR) / 2)[act] + 1e-9) * 10 ** (-7 / 20)
else:
    mg = 1.; sg = rms((ML + MR) / 2) / rms((VL + VR) / 2) * 10 ** (1 / 20); duck = np.ones(S.N)
mix = np.stack([ML * duck * mg + VL * sg + VB, MR * duck * mg + VR * sg + VB])[:, : int(TOTAL * SR)]
mix = mix / (np.max(np.abs(mix)) + 1e-9) * 1.25; mix = np.tanh(mix) * .9
os.makedirs(os.path.dirname(OUT) or '.', exist_ok=True)
out = (mix.T * 32767).astype(np.int16)
w = wave.open(OUT, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes()); w.close()
print('ok', OUT, round(TOTAL, 2), 's, voice:', VOICE)
