"""music.py · score + SFX (+ voice) of "The Great Emu War", synthesised from events.json and timing.json.
  python music.py out/mix.wav voice/take.wav      # with the voice
  python music.py out/mix_novoice.wav none          # score + SFX only
120 BPM in F major: a comic military march (tuba oom-pah, snare, brass fanfares, a piccolo tune). The sections follow
the story: the hook is a fanfare under a stampede; the farm plays light pizzicato; the army marches; the ambush sneaks in
D minor and stops dead on "ran!"; the truck chase is a galop; the retreat gets a sad trombone; the Major's speech is pompous
brass; the emu army is a big minor march; "the army said no" is stop-time; the final score is a victory fanfare for the
emus, and a drum pickup loops back into the stampede. Music sits 16 dB under the voice and ducks."""
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
def W(lid, word):
    for x in LW[lid]:
        if ''.join(ch for ch in x['w'].lower() if ch.isalnum()).startswith(word): return x['t0']
    return LW[lid][0]['t0']
tLOST, tRAN, tNO, tWORLD, tRET = W('L1', 'lost'), W('L4', 'ran'), W('L8', 'no'), W('L7', 'world'), W('L6', 'retreated')
tHE = W('L7', 'he'); tAGAIN = W('L8', 'again')
SECS = [('hook', 0), ('farm', CUT['L2']), ('army', CUT['L3']), ('ambush', CUT['L4']), ('chase', CUT['L5']), ('retreat', CUT['L6']),
        ('press', CUT['L7']), ('emuarmy', tHE - .15), ('farmers', CUT['L8']), ('office', tAGAIN + .42), ('final', W('L9', 'final')), ('loop', LOOP)]
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

# ---------------- harmony: F major march (I–IV–V–I); the ambush / emu army in D minor ----------------
CH = {'F': (41, 48, [65, 69, 72]), 'Bb': (46, 53, [65, 70, 74]), 'C': (36, 43, [64, 67, 72]), 'Dm': (38, 45, [62, 65, 69]), 'Gm': (43, 50, [62, 67, 70]), 'A': (45, 52, [61, 64, 69])}
PROG, MINOR = ['F', 'Bb', 'C', 'F'], ['Dm', 'Gm', 'A', 'Dm']
TUNE = [(0, 72, .5), (.5, 72, .25), (.75, 72, .25), (1, 77, .5), (1.5, 76, .5), (2, 74, .5), (2.5, 72, .5), (3, 69, .5), (3.5, 72, .5)]
def tuba(m, dur=.22): return sbass(m - 12, dur) * 1.1
def stops(t):
    return (abs(t - tLOST) < .45 and t > tLOST - .05) or (tRAN - .05 < t < tRAN + .45) or (tNO - .05 < t < tNO + .5) or (tWORLD - .05 < t < tWORLD + .35)
nb = int(np.ceil(TOTAL / BAR))
for b in range(nb):
    for k in range(4):
        tb = b * BAR + k * BEAT; sec = section(tb + .01)
        if tb >= LOOP - 1e-6: break
        minor = sec in ('ambush', 'emuarmy'); name = (MINOR if minor else PROG)[b % 4]; root, fifth, chord = CH[name]
        if stops(tb) or stops(tb + BEAT / 2): continue
        if sec in ('hook', 'army', 'emuarmy', 'final'):   # the march: oom-pah, snare, brass on the off-beats
            add(tuba(root if k % 2 == 0 else fifth, .24), tb, .9); add(brass(chord, .14), tb + BEAT / 2, .38, .15)
            add(kick(.8), tb, .45) if k % 2 == 0 else add(snare(), tb, .32, .1)
            add(snare(), tb + .75 * BEAT, .12, -.1)
            if sec in ('emuarmy', 'final'): add(snare(), tb + .25 * BEAT, .1, .1)
            if k == 0 and sec in ('hook', 'final'): add(brass([n + 12 for n in chord], .35), tb, .5, -.15)
        elif sec in ('farm', 'farmers'):
            add(pizzN(root, .2), tb, .8); add(pizzN(chord[k % 3], .14), tb + BEAT / 2, .55, .2)
            if k % 2 == 1: add(hat(), tb, .1, .3)
        elif sec == 'ambush':
            add(pizzN(chord[k % 3] - 12, .16), tb, .9); add(pizzN(chord[(k + 1) % 3] - 12, .12), tb + BEAT / 2, .5, .2)
            if k == 0: add(pad([n - 12 for n in chord], BAR), tb, .3)
        elif sec == 'chase':   # the galop
            add(tuba(root if k % 2 == 0 else fifth, .16), tb, .9); add(brass(chord, .1), tb + BEAT / 2, .4)
            for j in range(4): add(snare(), tb + j * BEAT / 4, .08 + (.1 if j == 0 else 0), .1)
            add(kick(.8), tb, .5)
        elif sec == 'retreat':   # slow and sad: long chords, a lonely tuba
            if k % 2 == 0: add(pad([n - 12 for n in chord], BEAT * 2), tb, .5); add(tuba(root, .45), tb, .6)
        elif sec == 'press':
            if k == 0: add(brass(chord, .9), tb, .55); add(timp(root, 1.0), tb, .6)
            if k == 2: add(brass(chord, .4), tb, .4); add(timp(root, .5), tb, .35)
        elif sec == 'office':
            pass
    for o, m, d in TUNE:   # the piccolo tune over the march
        tn = b * BAR + o * BEAT; sec = section(tn + .01)
        if tn >= LOOP - 1e-6 or stops(tn): continue
        if sec in ('hook', 'army', 'final') and b % 2 == 0: add(pluck(m + 12, d * BEAT * 1.2, 1.0), tn, .3, .2)
        if sec == 'emuarmy': add(brass([m - 3], d * BEAT * .9), tn, .5, -.1)
# hits: the first frame, the punchline stops, the sad trombone, the final fanfare, the loop pickup
add(brass([65, 69, 72, 77], .5), 0, 1.0); add(kick(1.0), 0, .8)
add(brass([62, 65, 69], .45), tRAN - .02, .5); add(timp(38, 1.0), tWORLD - .02, .8); add(brass([62, 65, 69, 74], .5), tWORLD - .02, .7)
add(trombone((60, 59, 58, 57)), tRET + .05, .8)
add(brass([65, 69, 72, 77], .6), W('L9', 'final'), .8); add(brass([67, 72, 76, 79], .9), W('L9', '0') - .02, .8)
for k in range(4): add(snare(), LOOP - .02 + k * .12, .12 + .06 * k)

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
for e in EV:
    s, t, d = e['s'], e['t'], e.get('d', 1.0)
    if s == 'stampede': addv(rumble(d), t, .8)
    elif s == 'swish': addv(whoosh(.35, False), t, .35, .3)
    elif s == 'snatch': addv(pop(1100), t, .6); addv(boing(300, 700, .3), t + .02, .35)
    elif s == 'sting': addv(sting_(), t, .45)
    elif s == 'stamp': addv(stamp(True), t, .7)
    elif s == 'slam': addv(stamp(True), t, .75); addv(thump(), t, .6)
    elif s == 'whoosh': addv(whoosh(.6), t - .25, .45)
    elif s == 'cut': addv(whoosh(.25), t - .1, .12)
    elif s == 'pop': addv(pop(900), t, .55); addv(hiss(.35), t + .02, .35)
    elif s == 'counter': addv(roll(d), t, .45)
    elif s == 'pecks': addv(pecks(d), t, .5)
    elif s == 'snap': addv(snap(), t, .6)
    elif s == 'clang': addv(clang(), t, .7); addv(thump(), t, .5)
    elif s == 'thud': addv(thump(), t, .7, rng.uniform(-.3, .3))
    elif s == 'evil': addv(evil(), t, .7)
    elif s == 'scatter': addv(scatter(), t, .7)
    elif s == 'engine': addv(engine(d), t, .6)
    elif s == 'boing': addv(boing(233, 466, .35), t, .35)
    elif s == 'trombone': pass
    elif s == 'flash': addv(flash(), t, .5, rng.uniform(-.4, .4))
    elif s == 'flip': addv(flip(), t, .7)
    elif s == 'squawk': addv(squawk(.4, 300), t, .6, -.2); addv(squawk(.3, 380), t + .12, .5, .3)
    elif s == 'ding': addv(bell(94, 1.2), t, .45)
    elif s == 'march': pass

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
