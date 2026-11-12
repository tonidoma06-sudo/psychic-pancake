"""music.py · score + SFX (+ voice) of "Pepsi, where's my jet?", synthesised from events.json and timing.json.
  python music.py out/mix.wav voice/take.wav      # with the voice
  python music.py out/mix_novoice.wav none          # score + SFX only
120 BPM in B-flat major: a bright 90s TV-ad groove (slap-ish bass, brass stabs, claps, hats). The sections follow the
story: the hook hits on frame 1 under a jet roar; the ad scenes play the jingle "through the TV" (band-limited);
the scheme and the courtroom go sneaky/dramatic in G minor; "Pepsi said no." and "just kidding" are stop-time
(a sad trombone on the second); a drum pickup loops back into the jet. Music sits 16 dB under the voice and ducks."""
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
tNO, tKID = W('L7', 'no'), W('L9', 'just')
SECS = [('hook', 0), ('money', CUT['L2']), ('tv', CUT['L3']), ('scheme', CUT['L4']), ('deal', CUT['L5']), ('invest', CUT['L6']),
        ('no', CUT['L7']), ('court', CUT['L8']), ('tv2', CUT['L9']), ('loop', LOOP)]
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

# ---------------- harmony: Bb major, I–vi–IV–V; the dark sections in G minor ----------------
CH = {'Bb': (46, 53, [70, 74, 77]), 'Gm': (43, 50, [67, 70, 74]), 'Eb': (39, 46, [67, 70, 75]), 'F': (41, 48, [69, 72, 77]), 'Cm': (36, 43, [67, 72, 75]), 'D': (38, 45, [66, 69, 74])}
PROG, DARK = ['Bb', 'Gm', 'Eb', 'F'], ['Gm', 'Eb', 'Cm', 'D']
HOOK = [(0, 77, .5), (.5, 74, .5), (1, 77, .5), (1.5, 79, .5), (2, 82, 1), (3, 79, .5), (3.5, 77, .5)]
nb = int(np.ceil(TOTAL / BAR))
for b in range(nb):
    for k in range(4):
        tb = b * BAR + k * BEAT; sec = section(tb + .01)
        if tb >= LOOP - 1e-6: break
        dark = sec in ('scheme', 'court', 'no'); name = (DARK if dark else PROG)[b % 4]; root, fifth, chord = CH[name]
        stop = (sec == 'no' and abs(tb - tNO) < 1.2) or (sec == 'tv2' and tb > tKID - .6)
        if stop: continue
        if sec in ('hook', 'money', 'deal', 'invest'):
            add(sbass(root if k % 2 == 0 else root + 12, .22), tb, .9); add(sbass(fifth, .14), tb + .75 * BEAT, .55)
            add(kick(.85), tb, .55) if k % 2 == 0 else add(clap(), tb, .35, .1)
            add(hat(), tb + BEAT / 2, .14, .3); add(hat(), tb, .08, -.3)
            if k == 0: add(brass(chord, .22), tb + BEAT * 1.5, .7, -.15)
            if sec == 'invest': add(hat(), tb + BEAT / 4, .08, .3); add(hat(), tb + .75 * BEAT, .08, -.3)
        elif sec in ('tv', 'tv2'):   # the jingle, through the TV
            addtv(sbass(root, .2), tb, .9); addtv(kick(.7), tb, .5) if k % 2 == 0 else addtv(clap(), tb, .35)
            if k == 0: addtv(brass(chord, .3), tb, .8)
        elif sec == 'scheme':
            add(pizzN(chord[k % 3] - 12, .16), tb, .9); add(pizzN(chord[(k + 1) % 3] - 12, .14), tb + BEAT / 2, .6, .2)
            if k == 0: add(pad([n - 12 for n in chord], BAR), tb, .35)
        elif sec == 'court':
            if k == 0: add(pad([n - 12 for n in chord], BAR), tb, .5); add(timp(root, 1.0), tb, .7)
            if k == 2: add(timp(root, .6), tb, .4)
    for o, m, d in HOOK:
        tn = b * BAR + o * BEAT; sec = section(tn + .01)
        if tn >= LOOP - 1e-6: continue
        if sec in ('hook', 'deal', 'invest') and b % 2 == 0: add(pluck(m, d * BEAT * 1.4, 1.0), tn, .45, .15)
        if sec in ('tv', 'tv2') and tn < tKID - .6: addtv(brass([m], d * BEAT * .95), tn, .7)
# hits: the first frame, the "no" stop, the trombone, the loop pickup
add(brass([70, 74, 77, 82], .5), 0, 1.0); add(kick(1.0), 0, .8)
add(brass([67, 70, 74], .45), tNO - .02, .8); add(timp(43, 1.2), tNO - .02, .8)
add(trombone(), tKID - .05, .75)
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
for e in EV:
    s, t = e['s'], e['t']
    if s == 'jet': addv(jet_sfx(3.0), t, .8, .1)
    elif s == 'stab': pass
    elif s == 'whoosh': addv(whoosh(.6), t - .25, .45)
    elif s == 'swish': addv(whoosh(.35, False), t - .15, .3)
    elif s == 'cut': addv(whoosh(.25), t - .1, .12)
    elif s == 'hiss': addv(hiss(), t, .5)
    elif s == 'pop': addv(pop(900), t, .55); addv(hiss(.35), t + .02, .35)
    elif s == 'cash': addv(cash(), t, .6)
    elif s == 'tv': addv(tvclick(), t, .5)
    elif s == 'sting': addv(sting_(), t, .45)
    elif s == 'boing': addv(boing(233, 466, .35), t, .3)
    elif s == 'marker': addv(marker(), t, .45)
    elif s == 'ding': addv(bell(94, 1.2), t, .45)
    elif s == 'snap': addv(snap(), t, .7); addv(pop(1200), t + .01, .4)
    elif s == 'register': addv(register_(), t, .6)
    elif s == 'toss': addv(whoosh(.3), t, .25, rng.uniform(-.5, .5))
    elif s == 'thump': addv(thump(), t, .7)
    elif s == 'stuff': addv(crumple(.5), t, .7)
    elif s == 'whooshUp': addv(whoosh(.7, True), t, .55)
    elif s == 'stamp': addv(stamp(True), t, .7)
    elif s == 'slam': addv(stamp(True), t, .6); addv(thump(), t, .6)
    elif s == 'gavel': addv(gavel_(), t, .9)
    elif s == 'roll': addv(roll(), t, .5)
    elif s == 'trombone': pass

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
