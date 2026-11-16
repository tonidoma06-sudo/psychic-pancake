"""music.py · score + SFX (+ voice) of "The Soldier Who Kept Fighting" (Hiroo Onoda), synthesised from events.json and timing.json.
  python music.py out/mix.wav voice/take.wav      # with the voice
  python music.py out/mix_novoice.wav none          # score + SFX only
120 BPM in D minor. The hook and the landing are a taut military march (taiko-like drums, snare, low brass, a koto-like pluck
motif in the Japanese "in" scale); the leaflets are light and comic; each "fake" stops the music dead on a stamp; under the raids
the score drops to one quiet low chord; 1974 swings into a 70s groove (funky bass, hats) for the backpacker; the campfire is
sparse plucks and crickets; the bookshop is a music box; the surrender swells, and "still works!" lands on a bright sting.
Music sits 16 dB under the voice and ducks."""
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
tF = [W('L3', 'fake')] + [W('L4', 'fake', k) for k in range(3)]
tNEVER, tWORKS, tSURR, tAND8 = W('L2', 'never'), W('L9', 'works'), W('L9', 'surrenders'), W('L8', 'and')
SECS = [('hook', 0), ('landing', CUT['L2']), ('leaflets', CUT['L3']), ('fakes', CUT['L4']), ('somber', CUT['L5']), ('seventies', CUT['L6']),
        ('night', CUT['L7']), ('shop', CUT['L8']), ('flight', tAND8 - .05), ('finale', CUT['L9']), ('loop', LOOP)]
def section(t):
    cur = 'hook'
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
def sbass(m, dur=.25):
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
def taiko(g=1.0, f0=58):   # a deep drum: pitched thump + skin noise
    n = int(.7 * SR); t = tt_(n); f = f0 * (1 + .5 * np.exp(-t * 30))
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6) + lp(rng.standard_normal(n), 500) * np.exp(-t * 25) * .5) * g
def koto(m, dur=.6):   # a bright plucked zither: pluck + a little metallic overtone
    a_ = pluck(m, dur, 1.3) * .8; b_ = pluck(m + 12, dur * .6, 1.6) * .2; a_[:len(b_)] += b_[:len(a_)]; return a_
def timp(m=43, dur=.9):
    n = int(dur * SR); t = tt_(n); f = mtof(m) * (1 + .06 * np.exp(-t * 20)); return (np.sin(2 * np.pi * np.cumsum(f) / SR) + .3 * lp(rng.standard_normal(n), 400) * np.exp(-t * 30)) * np.exp(-t * 4) * .9
def funk(m, dur=.2):   # a 70s funk bass: rounder, with a little wah
    n = int(dur * SR); t = tt_(n); ph = 2 * np.pi * mtof(m) * t; s = np.sin(ph) + .6 * np.sin(2 * ph) + .3 * np.sin(3 * ph)
    k_ = np.exp(-t * 12); return (lp(s, 2000) * k_ + lp(s, 600) * (1 - k_)) * np.exp(-t * 5) * np.minimum(1, t / .004) * .7

# ---------------- harmony ----------------
# D minor ("in" scale colour for the motif: D Eb G A Bb); the 70s groove in G major; the finale in D minor → F major
CH = {'Dm': (38, 45, [62, 65, 69]), 'Bb': (34, 41, [62, 65, 70]), 'Gm': (43, 50, [62, 67, 70]), 'A': (33, 40, [61, 64, 69]),
      'G': (43, 50, [62, 67, 71]), 'C': (36, 43, [64, 67, 72]), 'Em': (40, 47, [64, 67, 71]), 'D': (38, 45, [62, 66, 69]), 'F': (41, 48, [65, 69, 72])}
MARCH, GROOVE, FIN = ['Dm', 'Bb', 'Gm', 'A'], ['G', 'C', 'Em', 'D'], ['Dm', 'Bb', 'F', 'C']
MOTIF = [(0, 74, .5), (.5, 75, .5), (1, 74, .25), (1.25, 69, .25), (1.5, 70, .5), (2, 69, 1), (3, 67, .5), (3.5, 69, .5)]   # D Eb D A Bb A G A
def stops(t):
    return any(x - .05 < t < x + .32 for x in tF) or (tNEVER - .05 < t < tNEVER + .3) or (tWORKS - .05 < t < tWORKS + .3)
nb = int(np.ceil(TOTAL / BAR))
for b in range(nb):
    for k in range(4):
        tb = b * BAR + k * BEAT; sec = section(tb + .01)
        if tb >= LOOP - 1e-6: break
        if stops(tb) or stops(tb + BEAT / 2): continue
        if sec in ('hook', 'landing'):
            name = MARCH[b % 4]; root, fifth, chord = CH[name]
            add(sbass(root if k % 2 == 0 else fifth, .26), tb, .8)
            add(taiko(.9 if k == 0 else .55), tb, .6) if k in (0, 2) else add(snare(), tb, .3, .1)
            add(snare(), tb + .75 * BEAT, .12, -.1); add(snare(), tb + .25 * BEAT, .07, .1)
            if k == 0: add(brass([n - 12 for n in chord], .5), tb, .32, -.15)
            if sec == 'landing' and k == 2: add(brass(chord, .3), tb, .3, .15)
        elif sec == 'leaflets':
            name = MARCH[b % 4]; root, fifth, chord = CH[name]
            add(pizz(root + 12, .2), tb, .7); add(pizz(chord[k % 3], .14), tb + BEAT / 2, .5, .2)
            if k % 2 == 1: add(hat(), tb, .1, .3)
        elif sec == 'fakes':
            name = MARCH[b % 4]; root, fifth, chord = CH[name]
            add(pizz(root + 12, .16), tb, .8); add(pizz(chord[(k + 1) % 3], .12), tb + BEAT / 2, .5, -.2)
        elif sec == 'somber':
            if k == 0 and b % 2 == 0: add(pad([50, 57, 62, 65], BAR * 2 - .1), tb, .32)
        elif sec == 'seventies':
            name = GROOVE[b % 4]; root, fifth, chord = CH[name]
            for j, (o, m) in enumerate([(0, root), (.75, root), (1.0, fifth), (1.5, root + 12)]):
                if k == 0 or k == 2: add(funk(m - 12 + (0 if j < 3 else 0), .18), tb + o * BEAT, .75)
            add(hat(), tb, .14, .3); add(hat(), tb + BEAT / 2, .1, -.3)
            if k % 2 == 1: add(clap(), tb, .3)
            add(kick(.8), tb, .45) if k % 2 == 0 else None
            if k == 0: add(pad(chord, BAR - .05), tb, .2)
        elif sec == 'night':
            name = MARCH[b % 4]; root, fifth, chord = CH[name]
            if k in (0, 2): add(koto(chord[(b + k) % 3], .7), tb, .4, -.2)
            if k == 0: add(pad([n - 12 for n in chord], BAR - .05), tb, .2)
        elif sec == 'shop':
            name = ['F', 'C', 'Dm', 'Bb'][b % 4]; root, fifth, chord = CH[name]
            add(bell(chord[k % 3] + 12, .6), tb, .22, .2); add(bell(chord[(k + 2) % 3] + 12, .5), tb + BEAT / 2, .14, -.2)
            if k == 0: add(pad([root + 12, fifth + 12], BAR - .05), tb, .25)
        elif sec == 'flight':
            if k == 0: add(brass([62, 69, 74], .9), tb, .35)
        elif sec == 'finale':
            name = FIN[b % 4]; root, fifth, chord = CH[name]
            if k == 0: add(pad(chord + [root + 12], BAR - .05), tb, .45); add(sbass(root, 1.0), tb, .6); add(timp(root, 1.0), tb, .35)
            if k == 2: add(brass(chord, .6), tb, .3)
    for o, m, d in MOTIF:   # the koto motif over the march
        tn = b * BAR + o * BEAT; sec = section(tn + .01)
        if tn >= LOOP - 1e-6 or stops(tn): continue
        if sec in ('hook', 'landing') and b % 2 == 0: add(koto(m, d * BEAT * 1.6), tn, .45, .2)
        if sec == 'finale' and b % 2 == 1: add(brass([m], d * BEAT * .95), tn, .35, -.1)
# hits: the first frame, the stamps, the finale swell, the punchline sting, the loop pickup
add(taiko(1.2, 50), 0, .9); add(brass([50, 57, 62, 65], .6), 0, .8)
add(brass([62, 65, 69, 74], .5), tNEVER - .02, .6); add(taiko(1.1), tNEVER - .02, .7)
add(pad([62, 65, 69, 74], 2.2), tSURR - .05, .4)
add(brass([65, 69, 72, 77], .9), tWORKS - .02, .9); add(sparkle(), tWORKS, .6)
for k in range(4): add(snare(), LOOP - .02 + k * .12, .12 + .06 * k)

# ---------------- SFX ----------------
def hiss(dur=.5): n = int(dur * SR); t = tt_(n); return hp(rng.standard_normal(n), 3000) * np.exp(-t * 6) * .5
def thump(): n = int(.3 * SR); t = tt_(n); return (np.sin(2 * np.pi * (90 + 60 * np.exp(-t * 25)) * t) * np.exp(-t * 14) + lp(rng.standard_normal(n), 900) * np.exp(-t * 30) * .4) * .8
def rollc(dur=.7):
    out = np.zeros(int(dur * SR)); tt = 0; k = 0
    while tt < dur - .02: c = bell(96 + (k % 3), .08) * .25; i = int(tt * SR); out[i:i + len(c)] += c[: len(out) - i]; tt += .09 * (1 - .6 * tt / dur); k += 1
    return out
def jungle(dur):   # birds and insects
    n = int(dur * SR); t = tt_(n); out = bp(rng.standard_normal(n), 3500, 7000) * (.5 + .5 * np.sin(2 * np.pi * 13 * t)) * .05
    k = int(.1 * SR)
    while k < n - 9000:
        f0 = 1800 + 2200 * rng.random(); m_ = int(.12 * SR); tm = tt_(m_); c = np.sin(2 * np.pi * np.cumsum(f0 * (1 + .3 * np.sin(2 * np.pi * 18 * tm))) / SR) * np.sin(np.pi * tm / .12) * .12
        out[k:k + m_] += c; k += int(SR * (.25 + .5 * rng.random()))
    return out * np.minimum(1, t / .3) * np.clip((dur - t) / .3, 0, 1)
def waves(dur):
    n = int(dur * SR); t = tt_(n); sw = (.5 + .5 * np.sin(2 * np.pi * t / 2.6 - 1.2)) ** 2
    return lp(rng.standard_normal(n), 900) * sw * .5 * np.minimum(1, t / .3) * np.clip((dur - t) / .3, 0, 1)
def splash(): n = int(.6 * SR); t = tt_(n); return bp(rng.standard_normal(n), 400, 5000) * np.exp(-t * 7) * .8
def prop_plane(dur):   # four radial engines: a throbbing drone that swells and passes
    n = int(dur * SR); t = tt_(n); u = t / dur; env_ = np.sin(np.pi * np.clip(u, 0, 1)) ** 1.5
    f = 52 * (1.04 - .08 * u); ph = np.cumsum(f) / SR; s = np.sign(np.sin(2 * np.pi * ph)) * .5 + np.sin(4 * np.pi * ph) * .4
    return (lp(s, 500) + lp(rng.standard_normal(n), 300) * .5) * env_ * .9
def flutter(dur):
    n = int(dur * SR); out = np.zeros(n); k = 0
    while k < n - 4000: c = bp(rng.standard_normal(int(.08 * SR)), 1200, 5000) * np.hanning(int(.08 * SR)) * .3; out[k:k + len(c)] += c[: n - k]; k += int(SR * (.03 + .06 * rng.random()))
    return out
def paper(): n = int(.3 * SR); t = tt_(n); return bp(rng.standard_normal(n), 1500, 7000) * np.exp(-t * 12) * .5
def scratch(dur):
    n = int(dur * SR); t = tt_(n); return bp(rng.standard_normal(n), 2000, 6000) * (np.abs(np.sin(2 * np.pi * 3.5 * t)) ** 4) * .35
def tickf(): n = int(.12 * SR); t = tt_(n); return (np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 60) + hp(rng.standard_normal(n), 3000) * np.exp(-t * 80) * .3) * .6
def fire(dur):
    n = int(dur * SR); t = tt_(n); out = lp(rng.standard_normal(n), 400) * .25
    k = 0
    while k < n - 2000: c = hp(rng.standard_normal(300), 2000) * np.hanning(300) * (.3 + .7 * rng.random()); out[k:k + 300] += c; k += int(SR * (.02 + .12 * rng.random()))
    cr = bp(rng.standard_normal(n), 4000, 6000) * (np.sin(2 * np.pi * 40 * t) > .9) * (np.sin(2 * np.pi * .7 * t) > 0) * .08   # crickets
    return (out + cr) * np.minimum(1, t / .3) * np.clip((dur - t) / .3, 0, 1)
def rustle(): n = int(.7 * SR); t = tt_(n); return bp(rng.standard_normal(n), 800, 4000) * np.sin(np.pi * t / .7) * .5
def cock(): o = np.zeros(int(.4 * SR)); a = clink(1800); o[:len(a)] += a[:len(o)] * .6; b_ = snap(); i = int(.12 * SR); o[i:i + len(b_)] += b_[: len(o) - i]; return o
def buzz(): n = int(.45 * SR); t = tt_(n); ph = np.cumsum(np.full(n, 110.)) / SR; return lp(np.sign(np.sin(2 * np.pi * ph)), 1200) * np.minimum(1, t / .01) * np.clip((.45 - t) / .05, 0, 1) * .35
def shopbell(): o = np.zeros(int(1.4 * SR)); a = bell(93, 1.2) * .5; o[:len(a)] += a; b_ = bell(97, 1.1) * .4; i = int(.09 * SR); o[i:i + len(b_)] += b_[: len(o) - i]; return o
def jet(dur):
    n = int(dur * SR); t = tt_(n); env_ = np.minimum(1, t / .15) * np.clip((dur - t) / .5, 0, 1)
    return (lp(rng.standard_normal(n), 700) * 1.1 + bp(rng.standard_normal(n), 1800, 6000) * .35) * env_ * .8
for e in EV:
    s, t, d = e['s'], e['t'], e.get('d', 1.0)
    if s == 'jungle': addv(jungle(d), t, .5)
    elif s == 'boom': addv(thump(), t, .7)
    elif s == 'hit': addv(thump(), t, .5); addv(snap(), t, .3)
    elif s == 'swish': addv(whoosh(.35, False), t, .35, .3)
    elif s == 'stamp': addv(stamp(True), t, .7)
    elif s == 'whoosh': addv(whoosh(.6), t - .25, .45)
    elif s == 'cut': addv(whoosh(.25), t - .1, .12)
    elif s == 'pop': addv(pop(900), t, .55); addv(hiss(.35), t + .02, .35)
    elif s == 'counter': addv(rollc(d), t, .45)
    elif s == 'waves': addv(waves(d), t, .7)
    elif s == 'splash': addv(splash(), t, .6)
    elif s == 'ding': addv(bell(94, 1.2), t, .45)
    elif s == 'plane': addv(prop_plane(d), t, .9)
    elif s == 'flutter': addv(flutter(d), t, .5)
    elif s == 'paper': addv(paper(), t, .6)
    elif s == 'somber': pass
    elif s == 'scratch': addv(scratch(d), t, .6)
    elif s == 'tick': addv(tickf(), t, .6); addv(pop(1200), t, .25)
    elif s == 'fire': addv(fire(d), t, .7)
    elif s == 'rustle': addv(rustle(), t, .6)
    elif s == 'cock': addv(cock(), t, .7)
    elif s == 'buzz': addv(buzz(), t, .5)
    elif s == 'bell': addv(shopbell(), t, .45)
    elif s == 'jet': addv(jet(d), t, .7)
    elif s == 'swell': pass
    elif s == 'sting': addv(sparkle(), t, .4)
    elif s == 'shine': addv(bell(100, .8), t, .3); addv(bell(105, .7), t + .06, .25)

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
tv = 0
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
