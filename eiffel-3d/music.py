"""music.py · a 1920s Paris caper score + SFX (+ voice), synthesized from events.json and timing.json.
  python music.py out/mix_voice.wav voice/scratch_full.wav    # with a voice (the scratch read, or YOUR recording)
  python music.py out/mix_novoice.wav none                     # score + SFX only
120 BPM in G minor, swing-musette style: a musette accordion (three detuned reeds) on the tune, "pompe" guitar
(the guitar on every beat, accented on 2 & 4), a two-feel pizzicato double bass (root and fifth) and brushed snare. The sections follow the story:
open = the caper tune; newspaper = celesta and bass only; the scheme = full band; the secret meeting = a sneaky
bassoon over a clock tick that stops dead on "shh"; the deal = the tune again, with a cash register; the getaway =
double time; the embarrassment = everything stops for a sad trombone; "again" = a tape rewind, then the tune restarts;
the chase = a snare roll with police whistles; the lesson = the tune in G major, with a pickup that loops into the start.
The score sits 14 dB under the voice (3 dB quieter than the Rome film) and ducks while the narrator speaks."""
import json, os, sys, wave
import numpy as np
from scipy.signal import resample_poly
D = os.path.dirname(os.path.abspath(__file__)); os.chdir(D)
import synth_lib as S
from synth_lib import *

OUT = sys.argv[1] if len(sys.argv) > 1 else 'out/mix_voice.wav'
VOICE = sys.argv[2] if len(sys.argv) > 2 else 'voice/scratch_full.wav'
EVJ = json.load(open('events.json')); TOTAL = EVJ['dur']; EV = EVJ['ev']
TM = json.load(open('timing.json'))
BEAT = .5; BAR = 2.0
CUT = {l['id']: l['cut'] for l in TM['lines']}
cuts = sorted(e['t'] for e in EV if e['s'] in ('cut', 'car', 'rewind', 'sweep'))
after = lambda t0: next((c for c in cuts if c > t0 + .05), TOTAL)
LOOP = TOTAL - BEAT
SECS = [('open', 0), ('news', CUT['L2']), ('scheme', CUT['L3']), ('meeting', CUT['L4']), ('deal', CUT['L5']), ('getaway', CUT['L6']),
        ('sad', after(CUT['L6'])), ('again', CUT['L7']), ('chase', CUT['L8']), ('lesson', CUT['L9']), ('loop', LOOP)]
def section(t):
    cur = 'open'
    for n, a in SECS:
        if t >= a - 1e-6: cur = n
    return cur
EVT = lambda s: [e['t'] for e in EV if e['s'] == s]
VL = np.zeros(S.N); VR = np.zeros(S.N)
def addv(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= S.N or i < 0: return
    sig = sig[: S.N - i] * gain; l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    VL[i:i + len(sig)] += sig * l * 1.414; VR[i:i + len(sig)] += sig * r * 1.414
tt_ = lambda n: np.arange(n) / SR

# ---------------- instruments ----------------
def accordion(m, dur, bright=1.):
    """musette accordion: three reeds (one in tune, two detuned for the shimmer), bellows envelope"""
    n = int(dur * SR); t = tt_(n); s = np.zeros(n)
    for det in (0, .0015, -.0012):          # a gentle 'swing' tuning: a little shimmer, never out of tune
        f = mtof(m) * (1 + det); ph = 2 * np.pi * f * t
        for h in range(1, 11): s += np.sin(ph * h) * (1 / h) * (1 if h % 2 else .55)
    s = lp(s / 3, 1800 + 1600 * bright)
    return s * np.minimum(1, t / .025) * np.clip((dur - t) / .05, 0, 1) * .16
def gtr(m, dur=.2):
    n = int(dur * SR); t = tt_(n); f = mtof(m)
    s = sum(np.sin(2 * np.pi * f * h * t) * np.exp(-t * (9 + 6 * h)) / h for h in range(1, 7))
    return lp(s, 2600) * np.minimum(1, t / .002) * .3
def strum(ms, t0, g=1., dur=.2):
    for k, m in enumerate(ms): add(gtr(m, dur), t0 + k * .012, .55 * g, .25)
def dbass(m, dur=.45):
    n = int(dur * SR); t = tt_(n); f = mtof(m); ph = 2 * np.pi * f * t
    s = np.sin(ph) + .45 * np.sin(2 * ph) * np.exp(-t * 9) + .2 * np.sin(3 * ph) * np.exp(-t * 14)
    return lp(s, 900) * np.exp(-t * 4.5) * np.minimum(1, t / .006) * .7
def brush(sw=False):
    n = int((.32 if sw else .09) * SR); t = tt_(n)
    x = bp(rng.standard_normal(n), 1800, 8000)
    return x * (np.sin(np.pi * np.clip(t / (n / SR), 0, 1)) ** 1.5 * .32 if sw else np.exp(-t * 45) * .16)
def bassoon(m, dur=.22):
    n = int(dur * SR); t = tt_(n); ph = 2 * np.pi * mtof(m) * t
    s = sum(np.sin(ph * h) * (1 / h if h % 2 else .8 / h) for h in range(1, 9))
    return lp(s, 1100) * np.minimum(1, t / .01) * np.clip((dur - t) / .04, 0, 1) * .3
def trombone(m0, m1, dur, wob=0.):
    n = int(dur * SR); t = tt_(n); f = mtof(m0) * (mtof(m1) / mtof(m0)) ** (t / dur) * (1 + wob * .02 * np.sin(2 * np.pi * 6 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR; s = sum(np.sin(ph * h) / h ** .9 for h in range(1, 12))
    wah = 500 + 1600 * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** .7; out = np.zeros(n)
    for i in range(0, n, 512): out[i:i + 512] = lp(s[max(0, i - 2048):i + 512], float(wah[i]))[-len(s[i:i + 512]):]
    return out * np.minimum(1, t / .04) * np.clip((dur - t) / .08, 0, 1) * .3
def klaxon():
    n = int(.62 * SR); t = tt_(n); f = np.where(t < .22, 260 + 170 * (t / .22), 430) * (1 + .01 * np.sin(2 * np.pi * 30 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR; s = np.sign(np.sin(ph)) * .5 + ((ph / (2 * np.pi)) % 1 - .5)
    return bp(s, 350, 2600) * np.minimum(1, t / .02) * np.clip((.62 - t) / .06, 0, 1) * .55
def whistleP(dur=.7):
    n = int(dur * SR); t = tt_(n); tr = .5 + .5 * np.sign(np.sin(2 * np.pi * 28 * t))
    s = np.sin(2 * np.pi * 2850 * t) * (.6 + .4 * tr) + .5 * np.sin(2 * np.pi * 3050 * t) * tr + .15 * hp(rng.standard_normal(n), 3000)
    return s * np.minimum(1, t / .02) * np.clip((dur - t) / .05, 0, 1) * .28
def engine(dur):
    n = int(dur * SR); t = tt_(n); f = 22 + 30 * (t / dur) ** .7; ph = np.cumsum(f) / SR
    pulses = (np.sin(2 * np.pi * ph) > .6).astype(float)
    s = lp(pulses * (1 + .3 * rng.standard_normal(n)), 380) + .25 * lp(rng.standard_normal(n), 200)
    return s * np.minimum(1, t / .1) * np.clip((dur - t) / .3, 0, 1) * .6
def rewind(dur=.95):
    n = int(dur * SR); t = tt_(n); x = rng.standard_normal(n); out = np.zeros(n)
    for i in range(0, n, 512):
        p = i / n; fc = 1800 + 2600 * np.sin(2 * np.pi * (p * 5)) ** 2
        out[i:i + 512] = bp(x[max(0, i - 2048):i + 512], fc * .8, fc * 1.25)[-len(x[i:i + 512]):]
    chirp = np.sin(2 * np.pi * np.cumsum(900 + 700 * np.sin(2 * np.pi * 9 * t)) / SR) * .25
    return (out * .8 + chirp) * np.minimum(1, t / .03) * np.clip((dur - t) / .05, 0, 1) * .5
def rustle(dur=.3):
    n = int(dur * SR); t = tt_(n); e = np.abs(lp(rng.standard_normal(n), 25)) * 3
    return bp(rng.standard_normal(n), 1400, 7000) * e * np.sin(np.pi * t / dur) * .5
def shh(dur=.55):
    n = int(dur * SR); t = tt_(n); return bp(rng.standard_normal(n), 2500, 7500) * np.sin(np.pi * t / dur) ** .6 * .55
def register():
    out = np.zeros(int(1.2 * SR)); a = bell(98, 1.1) * .5; b = bell(102, 1.0) * .45;   # D + F#: sits on the D7 bar out[:len(a)] += a; i = int(.07 * SR); out[i:i + len(b)] += b[:len(out) - i]
    c = coins_(8); j = int(.12 * SR); out[j:j + len(c)] += c[:len(out) - j] * .6; return out
def coins_(k=10):
    out = np.zeros(int(.9 * SR))
    for _ in range(k): c = clink(rng.uniform(2300, 4300)); i = int(rng.uniform(0, .5) * SR); out[i:i + len(c)] += c[:len(out) - i] * rng.uniform(.4, 1)
    return out
def thud(f=55, dur=.8):
    n = int(dur * SR); t = tt_(n); ff = f * (1 + 1.5 * np.exp(-t * 20))
    return np.tanh(np.sin(2 * np.pi * np.cumsum(ff) / SR) * np.exp(-t * 4) * 2 + lp(rng.standard_normal(n), 300) * np.exp(-t * 10)) * .8
def step():
    n = int(.12 * SR); t = tt_(n); return (lp(rng.standard_normal(n), 900) * np.exp(-t * 40) + np.sin(2 * np.pi * 70 * t) * np.exp(-t * 30)) * .5
def gliss(ms, step_=.045, dur=.35, fn=accordion):
    out = np.zeros(int((len(ms) * step_ + dur) * SR))
    for k, m in enumerate(ms): a = fn(m, dur); i = int(k * step_ * SR); out[i:i + len(a)] += a
    return out

def woodblock_(f=1100):
    n = int(.1 * SR); t = tt_(n); return (np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 1.6 * t)) * np.exp(-t * 55) * .7

def sparkle_gm():
    out = np.zeros(int(.9 * SR))
    for k, m in enumerate([79, 82, 86, 91]): b_ = bell(m, .7) * .35; i = int(k * .05 * SR); out[i:i + len(b_)] += b_[: len(out) - i]
    return out

# ---------------- harmony ----------------
MINOR = ['Gm', 'D7', 'Gm', 'D7', 'Cm', 'Gm', 'D7', 'Gm']; MAJOR = ['G', 'D7', 'G', 'D7', 'C', 'G', 'D7', 'G']
# chord → (root, fifth below or above, the guitar voicing). The bass only ever plays chord tones (root / fifth), so it can't
# clash with the strums; the colour notes stay in the tune.
CH = {'Gm': (43, 38, [62, 67, 70]), 'D7': (38, 45, [60, 62, 66]), 'Cm': (36, 43, [60, 63, 67]), 'G': (43, 38, [62, 67, 71]), 'C': (36, 43, [60, 64, 67])}
MEL = [
    [(0, 67, .5), (.5, 69, .5), (1, 70, .5), (1.5, 74, 1), (2.5, 73, .5), (3, 74, 1)],
    [(0, 72, .5), (.5, 70, .5), (1, 69, .5), (1.5, 66, .5), (2, 69, 1), (3, 62, 1)],
    [(0, 67, .5), (.5, 70, .5), (1, 74, .5), (1.5, 79, 1), (2.5, 78, .5), (3, 79, 1)],
    [(0, 75, .5), (.5, 74, .5), (1, 72, .5), (1.5, 69, .5), (2, 66, 1), (3, 62, 1)],
    [(0, 75, 1), (1, 74, .5), (1.5, 72, .5), (2, 70, 1), (3, 69, 1)],
    [(0, 70, 1), (1, 69, .5), (1.5, 67, .5), (2, 74, 2)],
    [(0, 72, .5), (.5, 69, .5), (1, 66, .5), (1.5, 69, .5), (2, 72, .5), (2.5, 75, .5), (3, 74, 1)],
    [(0, 67, 2), (2.5, 62, .5), (3, 66, .5), (3.5, 69, .5)],
]
major = lambda m: m + 1 if m % 12 in (10, 3) else m        # Bb→B, Eb→E
SWING = .08                                                 # off-beat eighths land a little late
sw = lambda b: b + (SWING if abs(b % 1 - .5) < 1e-6 else 0)
SHH = EVT('shh')[0] if EVT('shh') else 1e9; SAD = EVT('sad')[0] if EVT('sad') else 1e9
REW = EVT('rewind')[0] if EVT('rewind') else 1e9

nb = int(np.ceil(TOTAL / BAR))
for b in range(nb):
    t0 = b * BAR
    for k in range(4):                     # beat by beat: harmony is global, the arrangement follows the section
        tb = t0 + k * BEAT; sec = section(tb + .01)
        if tb >= LOOP - 1e-6: break
        maj = sec == 'lesson'; name = (MAJOR if maj else MINOR)[b % 8]; root, fifth, chord = CH[name]
        bassn = root if k < 2 else fifth                                   # two-feel: root on 1, fifth on 3
        if sec in ('open', 'scheme', 'deal', 'lesson') or (sec == 'again' and tb >= REW + 1.0):
            if k % 2 == 0: add(dbass(bassn), tb, .9)
            strum(chord, tb, .9 if k % 2 else .35)                         # pompe: the guitar on every beat, accented on 2 and 4
            add(brush(True) if k % 2 else brush(), tb, .9, -.2); add(brush(), tb + BEAT / 2 + SWING, .6, -.2)
        elif sec == 'news':
            if k % 2 == 0: add(dbass(bassn, .35), tb, .75)
            if k % 2: add(brush(), tb, .6, -.2)
        elif sec == 'meeting' and tb < SHH - .05:
            if k % 2 == 0: add(dbass(bassn, .2), tb, .8)
            add(woodblock_(1500 if k % 2 else 1100), tb, .25, .4)
            add(bassoon([chord[1], chord[2], chord[0], chord[2]][k] - 12, .2), tb + .25, .9, -.1)
        elif sec == 'getaway':
            for j, m in enumerate([root, root + 12] if k % 2 == 0 else [fifth, fifth + 12]): add(dbass(m, .22), tb + j * BEAT / 2, .8)
            add(snare(), tb, .22, -.2); add(snare(), tb + BEAT / 2, .14, -.2); add(hat(), tb + BEAT / 4, .3, .3)
            if k % 2 == 0: add(gliss([chord[0] + 12, chord[1] + 12, chord[2] + 12, chord[0] + 24, chord[2] + 12, chord[1] + 12], .06, .2), tb, .8, .1)
        elif sec == 'chase':
            add(dbass([root, fifth, root + 12, fifth][k], .22), tb, .8); add(dbass(root + 12 if k % 2 == 0 else fifth, .22), tb + BEAT / 2, .6)
            for j in range(4): add(snare(), tb + j * BEAT / 4, .1 + .1 * (j == 0), -.2)
            if k % 2 == 0: add(accordion(chord[2] + 12, .2), tb, .9); add(accordion(chord[1] + 12, .2), tb + .25, .8)
        elif sec == 'sad':
            if k == 0: add(pad([n - 12 for n in CH['Gm'][2]], BAR), tb, .5)
        elif sec == 'again' and tb < REW + 1.0:
            pass
    # the tune
    for (o, m, d) in MEL[b % 8]:
        tn = t0 + sw(o) * BEAT; sec = section(tn + .01)
        if tn >= LOOP - 1e-6: continue
        if sec in ('open', 'scheme', 'deal', 'lesson') or (sec == 'again' and tn >= REW + 1.0):
            mm = major(m) if sec == 'lesson' else m
            add(accordion(mm, d * BEAT * .92, 1.2 if sec == 'lesson' else 1.), tn, 1.0, .1)
            if sec == 'lesson': add(accordion(mm - 12, d * BEAT * .92, .7), tn, .45, -.1)
        elif sec == 'news':
            add(bell(m + 12, .8), tn, .22, .2)

# the opening flourish, the sad trombone, the loop pickup back into the opening
add(gliss([55, 58, 62, 67, 70, 74, 79], .04, .25), .0, .9)
if SAD < 1e9:
    for k, (a, b_, d) in enumerate([(63, 62.6, .38), (62, 61.6, .38), (61, 60.6, .38), (60, 59.4, 1.25)]):
        add(trombone(a, b_, d, wob=1. if k == 3 else 0.), SAD - .1 + k * .42, 1.0, .1)
add(gliss([62, 66, 69, 72, 74], .08, .2), LOOP + .02, .9)

# ---------------- SFX ----------------
for e in EV:
    s, t = e['s'], e['t']
    if s == 'sting': addv(sparkle_gm(), t, .3)
    elif s == 'tag': addv(whoosh(.4, up=False), t - .38, .5); addv(boing(147, 392, .5), t, .7); addv(thud(60, .6), t, .5)
    elif s == 'tip': addv(pop(1200), t, .3); addv(bell(86, .7), t + .05, .2)
    elif s == 'stamp': addv(stamp(), t, .6)
    elif s == 'cut': addv(whoosh(.3), t - .15, .14)
    elif s == 'paper': addv(rustle(.32), t, .7, -.1)
    elif s == 'pop': addv(pop(900), t, .3)
    elif s == 'ding': addv(bell(86, 1.2), t, .35); addv(sparkle_gm(), t, .25)
    elif s == 'shh': addv(shh(), t - .25, .8)
    elif s == 'cash': addv(register(), t, .7)
    elif s == 'car': addv(engine(2.1), t, .8, -.2); addv(whoosh(.9), t + 1.1, .45, .3)
    elif s == 'honk': addv(klaxon(), t, .6, -.1); addv(klaxon(), t + .7, .55, -.1)
    elif s == 'sad': pass
    elif s == 'rewind': addv(rewind(.95), t, .7); addv(thud(70, .4), t + .95, .5)
    elif s == 'whistle': addv(whistleP(.7), t, .45, .2)
    elif s == 'step': addv(step(), t, .55, -.1); addv(step(), t + .25, .4, .1)
    elif s == 'sweep': addv(whoosh(.8), t - .1, .35); addv(gliss([67, 71, 74, 79, 83, 86], .06, .5, lambda m, d: bell(m, d) * .3), t, .6)
    elif s == 'flip': addv(whoosh(.45), t - .1, .4)
    elif s == 'scam': addv(stamp(big=True), t, .75); add(pad([43, 50, 55, 59], 1.2), t, 1.2)

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
duck = 1 - np.clip(.4 * np.clip(venv * 4, 0, 1), 0, .4)          # gentler ducking: no pumping between lines
rms = lambda x: np.sqrt(np.mean(x ** 2) + 1e-12)
act = np.zeros(S.N, bool)
for l in TM['lines']: act[int(l['t0'] * SR):int(l['t1'] * SR)] = True
MUSIC_DB, SFX_DB = -14, -8                  # re the voice (Rome used −11 / −7: this score is 3 dB quieter)
if VOICE != 'none':
    vr = rms(VB[act]); mg = vr / rms(((ML + MR) / 2 * duck)[act]) * 10 ** (MUSIC_DB / 20); sg = vr / rms(((VL + VR) / 2)[act] + 1e-9) * 10 ** (SFX_DB / 20)
else:
    mg = 1.; sg = rms((ML + MR) / 2) / rms((VL + VR) / 2) * 10 ** (1 / 20); duck = np.ones(S.N)
# after the last line the score lifts 6 dB for the outro (the tag flips to SCAM!) and rolls into the loop
if VOICE != 'none':
    tl = TM['lines'][-1]['t1'] + .25; ts = np.arange(S.N) / SR; duck = duck * (1 + (10 ** (6 / 20) - 1) * np.clip((ts - tl) / .6, 0, 1))
mix = np.stack([ML * duck * mg + VL * sg + VB, MR * duck * mg + VR * sg + VB])[:, : int(TOTAL * SR)]
mix = mix / (np.max(np.abs(mix)) + 1e-9) * 1.25; mix = np.tanh(mix) * .9
os.makedirs(os.path.dirname(OUT) or '.', exist_ok=True)
out = (mix.T * 32767).astype(np.int16)
w = wave.open(OUT, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes()); w.close()
print('ok', OUT, round(TOTAL, 2), 's, voice:', VOICE, '| music', MUSIC_DB, 'dB, sfx', SFX_DB, 'dB re voice')
