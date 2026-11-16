"""music.py · score + SFX (+ voice) of "The Luckiest Fool" (Lord Timothy Dexter), synthesised from events.json and timing.json.
  python music.py out/mix.wav voice/take.wav      # with the voice
  python music.py out/mix_novoice.wav none          # score + SFX only
120 BPM in D major: an original 1790s hornpipe (fiddle lead, fife, a bouncing bass, light drum). The rivals scheme over
sneaky B-minor pizzicato; the map voyage swells; the Caribbean turns calypso (steel-pan plucks, syncopated bass); Siberia
gets sleigh bells; the coal town goes heavy B minor with anvil hits; the study is a harpsichord minuet; the punctuation
finale is the full hornpipe, and a drum pickup loops back to the wharf. Music sits 16 dB under the voice and ducks."""
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
tRICH, tSOLD4, tSOLD6, tPUNCT, tREAD = W('L1', 'rich'), W('L4', 'sold'), W('L6', 'sold'), W('L8', 'punctuation'), W('L8', 'readers')
EVT = {}
for e in EV: EVT.setdefault(e['s'], []).append(e['t'])
SECS = [('hook', 0), ('scheme', W('L2', 'rival') - .12), ('voyage', W('L3', 'to', 1) - .1), ('carib', CUT['L4']), ('home', CUT['L5']), ('carib', W('L5', 'to') - .12),
        ('snow', W('L5', 'siberia') - .15), ('coal', CUT['L6']), ('home', W('L6', 'sold') - .12), ('study', CUT['L7']), ('final', CUT['L9']), ('loop', LOOP)]
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

def fiddle(m, dur=.25):   # a bowed saw with vibrato
    n = int(dur * SR); t = tt_(n); f = mtof(m) * (1 + .007 * np.sin(2 * np.pi * 5.5 * t) * np.clip(t / .15, 0, 1))
    ph = np.cumsum(f) / SR; x = 2 * (ph % 1) - 1 + .3 * (2 * ((ph * 2.01) % 1) - 1)
    return bp(x, 300, 3600) * np.minimum(1, t / .025) * np.clip((dur - t) / .04, 0, 1) * .42
def harpsi(m, dur=.3): return pluck(m, dur, 1.6) * .7
def steel(m, dur=.35):
    n = int(dur * SR); t = tt_(n); f = mtof(m)
    return (np.sin(2 * np.pi * f * t) + .45 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t * 9) + .25 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t * 14)) * np.exp(-t * 5) * np.minimum(1, t / .002) * .5
def jingle(dur=.25): n = int(dur * SR); t = tt_(n); return hp(rng.standard_normal(n), 6000) * (np.abs(np.sin(2 * np.pi * 26 * t)) ** 4) * np.exp(-t * 9) * .5
def anvil(): n = int(.8 * SR); t = tt_(n); return sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) * a for f, d, a in [(880, 6, .5), (2310, 9, .3), (3920, 14, .2)]) * .7 + lp(rng.standard_normal(n), 2000) * np.exp(-t * 60) * .4

# ---------------- harmony: D major hornpipe; the scheming / coal in B minor ----------------
CH = {'D': (38, 45, [62, 66, 69]), 'G': (43, 50, [62, 67, 71]), 'A': (45, 52, [61, 64, 69]), 'Bm': (35, 42, [62, 66, 71]), 'Em': (40, 47, [64, 67, 71]), 'F#': (42, 49, [61, 66, 70])}
PROG, MINOR = ['D', 'G', 'A', 'D'], ['Bm', 'Em', 'F#', 'Bm']
TUNE_A = [(0, 74, .5), (.5, 78, .25), (.75, 81, .25), (1, 86, .5), (1.5, 81, .5), (2, 83, .25), (2.25, 81, .25), (2.5, 79, .25), (2.75, 78, .25), (3, 76, .5), (3.5, 69, .5)]
TUNE_B = [(0, 78, .25), (.25, 79, .25), (.5, 81, .5), (1, 78, .25), (1.25, 74, .25), (1.5, 76, .5), (2, 73, .25), (2.25, 74, .25), (2.5, 76, .25), (2.75, 73, .25), (3, 74, 1.0)]
def tuba(m, dur=.22): return sbass(m - 12, dur) * 1.1
def stops(t): return (tREAD + .3 < t < tREAD + .75)
nb = int(np.ceil(TOTAL / BAR))
for b in range(nb):
    for k in range(4):
        tb = b * BAR + k * BEAT; sec = section(tb + .01)
        if tb >= LOOP - 1e-6: break
        minor = sec in ('scheme', 'coal'); name = (MINOR if minor else PROG)[b % 4]; root, fifth, chord = CH[name]
        if stops(tb): continue
        if sec in ('hook', 'voyage', 'home', 'final'):   # the hornpipe band
            add(tuba(root if k % 2 == 0 else fifth, .22), tb, .85); add(harpsi(chord[k % 3], .2), tb + BEAT / 2, .35, .2); add(harpsi(chord[(k + 1) % 3] + 12, .15), tb + .75 * BEAT, .2, -.2)
            add(kick(.7), tb, .4) if k % 2 == 0 else add(snare(), tb, .26, .1)
            if sec in ('voyage', 'final'): add(snare(), tb + .5 * BEAT, .1, -.1)
            if k == 0 and sec in ('hook', 'final', 'voyage'): add(brass([n + 12 for n in chord], .3), tb, .35, -.15)
        elif sec == 'scheme':   # tiptoe pizzicato
            add(pizzN(root + 12, .2), tb, .8); add(pizzN(chord[k % 3] - 12, .14), tb + BEAT / 2, .55, .2)
            if k == 0: add(pad([n - 12 for n in chord], BAR), tb, .22)
        elif sec == 'carib':   # calypso
            add(tuba(root, .2), tb, .8); add(tuba(fifth, .16), tb + .75 * BEAT, .6)
            add(steel(chord[k % 3] + 12, .3), tb + .5 * BEAT, .5, .2); add(steel(chord[(k + 2) % 3] + 12, .25), tb + .25 * BEAT, .3, -.2)
            add(hat(), tb + .5 * BEAT, .12, .3); add(kick(.6), tb, .35) if k % 2 == 0 else add(clap(), tb, .2)
        elif sec == 'snow':
            add(jingle(.3), tb, .5, .3); add(jingle(.2), tb + .5 * BEAT, .35, -.3); add(bell(chord[k % 3] + 12, .8), tb, .25); add(tuba(root, .3), tb, .6) if k == 0 else None
        elif sec == 'coal':   # heavy minor, anvil on the beat
            add(tuba(root, .3), tb, 1.0); add(brass([n - 12 for n in chord], .2), tb + .5 * BEAT, .35); add(kick(1.0), tb, .6)
            if k % 2 == 1: add(anvil(), tb, .22, .2)
        elif sec == 'study':   # a harpsichord minuet
            for j in range(2): add(harpsi(chord[(k + j) % 3] + (12 if j else 0), .3), tb + j * BEAT / 2, .55, (-.2 if j else .2))
            if k == 0: add(harpsi(root, .8), tb, .6)
    for o, m, d in (TUNE_A if b % 2 == 0 else TUNE_B):   # the fiddle + fife tune
        tn = b * BAR + o * BEAT; sec = section(tn + .01)
        if tn >= LOOP - 1e-6 or stops(tn): continue
        if sec in ('hook', 'voyage', 'home', 'final'): add(fiddle(m - 12, d * BEAT * 1.05), tn, .55, -.1); add(pluck(m + 12, d * BEAT, 1.0), tn, .18 if sec != 'final' else .28, .25)
        if sec == 'carib': add(steel(m, d * BEAT * 1.4), tn, .4, -.15)
        if sec == 'snow': add(bell(m + 12, .5), tn, .18)
        if sec == 'study': add(harpsi(m, d * BEAT * 1.3), tn, .35, -.1)
        if sec == 'coal' and b % 2 == 0: add(fiddle(m - 15, d * BEAT), tn, .3)
# hits
add(brass([62, 66, 69, 74], .5), 0, .9); add(kick(1.0), 0, .8)
add(brass([62, 66, 69, 74], .5), tRICH - .02, .6); add(brass([62, 66, 69, 74], .45), tSOLD4 - .02, .55); add(brass([64, 69, 73, 76], .6), tSOLD6 - .02, .65)
add(brass([62, 66, 69, 74], .6), CUT['L9'], .6)
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
def coins(dur):
    n = int(dur * SR); out = np.zeros(n); k = 0
    while k < n - int(.3 * SR): c = clink(rng.uniform(2400, 4200)); out[k:k + len(c)] += c[: n - k] * rng.uniform(.3, 1); k += int(SR * rng.uniform(.012, .05))
    return out * np.clip((dur - tt_(n)) / .2, 0, 1) * .7
def gull(): n = int(.5 * SR); t = tt_(n); f = 1500 - 700 * t / .5 + 200 * np.sin(2 * np.pi * 9 * t); return bp(np.sin(2 * np.pi * np.cumsum(f) / SR) + .2 * rng.standard_normal(n), 900, 3500) * np.sin(np.pi * t / .5) * .35
def waves(dur): n = int(dur * SR); t = tt_(n); return lp(rng.standard_normal(n), 900) * (.6 + .4 * np.sin(2 * np.pi * .4 * t)) * np.minimum(1, t / .3) * np.clip((dur - t) / .3, 0, 1) * .5
def whisper(dur): n = int(dur * SR); t = tt_(n); return bp(rng.standard_normal(n), 2000, 7000) * (.5 + .5 * np.sin(2 * np.pi * 6.5 * t)) ** 2 * np.minimum(1, t / .05) * np.clip((dur - t) / .1, 0, 1) * .5
def glug(): o = np.zeros(int(.6 * SR)); [o.__setitem__(slice(int(k * .12 * SR), int(k * .12 * SR) + int(.25 * SR)), o[int(k * .12 * SR):int(k * .12 * SR) + int(.25 * SR)] + plop()[: int(.25 * SR)] * (1 - k * .2)) for k in range(3)]; return lp(o, 900) * 1.2
def cheer(dur=1.2):
    n = int(dur * SR); t = tt_(n); c = bp(rng.standard_normal(n), 500, 2600) * np.minimum(1, t / .15) * np.exp(-t * 1.8) * .6
    for j in range(8): cl = clap(); i = int(rng.uniform(0, dur - .2) * SR); c[i:i + len(cl)] += cl[: n - i] * .25
    return c
def wind(dur): n = int(dur * SR); t = tt_(n); return bp(rng.standard_normal(n), 300, 1400) * (.5 + .5 * np.sin(2 * np.pi * .7 * t)) * np.minimum(1, t / .3) * np.clip((dur - t) / .3, 0, 1) * .6
def chant(dur):
    n = int(dur * SR); out = np.zeros(n); k = 0
    while k < n - int(.3 * SR): m = int(.22 * SR); tt = tt_(m); out[k:k + m] += bp(rng.standard_normal(m), 300, 1500) * np.sin(np.pi * tt / .22) * .8; k += int(BEAT * SR)
    return out
def scribble(dur):
    n = int(dur * SR); t = tt_(n); x = bp(rng.standard_normal(n), 3000, 9000); g = (np.sin(2 * np.pi * (14 + 6 * np.sin(2 * np.pi * 1.3 * t)) * t) > 0).astype(float)
    return x * lp(g, 60) * .45
def gasp(): n = int(.5 * SR); t = tt_(n); return bp(rng.standard_normal(n), 900, 4000) * (t / .5) ** 2 * np.clip((.5 - t) / .05, 0, 1) * .7
def page(): n = int(.4 * SR); t = tt_(n); return bp(rng.standard_normal(n), 1500, 7000) * np.sin(np.pi * t / .4) * (1 + .5 * np.sin(2 * np.pi * 30 * t)) * .5
def shake(dur):
    n = int(dur * SR); out = np.zeros(n); k = 0
    while k < n - int(.1 * SR): m = int(.06 * SR); tt = tt_(m); out[k:k + m] += hp(rng.standard_normal(m), 4000) * np.exp(-tt * 50) * .6; k += int(SR / 11)
    return out
def sail(dur): n = int(dur * SR); t = tt_(n); return (lp(rng.standard_normal(n), 600) * .6 + bp(rng.standard_normal(n), 120, 300) * .3 * np.sin(2 * np.pi * 1.2 * t) ** 2) * np.sin(np.pi * t / dur) * .7
for e in EV:
    s, t, d = e['s'], e['t'], e.get('d', 1.0)
    if s == 'harbour': addv(waves(d + .4), t, .5); addv(gull(), t + .3, .4, -.4); addv(gull(), t + 1.1, .3, .5)
    elif s == 'coins': addv(coins(d + .3), t, .55)
    elif s == 'sting': addv(sting_(), t, .45)
    elif s == 'stamp': addv(stamp(True), t, .7)
    elif s == 'whoosh': addv(whoosh(.6), t - .25, .45)
    elif s == 'cut': addv(whoosh(.25), t - .1, .12)
    elif s == 'pop': addv(pop(900), t, .55); addv(hiss(.35), t + .02, .3)
    elif s == 'clang': addv(clang(), t, .5)
    elif s == 'evil': addv(evil(), t, .6)
    elif s == 'boing': addv(boing(233, 466, .35), t, .35)
    elif s == 'ding': addv(bell(94, 1.2), t, .45)
    elif s == 'whisper': addv(whisper(d), t, .55, .3)
    elif s == 'sail': addv(sail(d), t, .6)
    elif s == 'glug': addv(glug(), t, .7)
    elif s == 'cheer': addv(cheer(1.2), t, .6)
    elif s == 'wind': addv(wind(d), t, .6)
    elif s == 'chant': addv(chant(d), t, .6)
    elif s == 'scribble': addv(scribble(d), t, .6, .2)
    elif s == 'gasp': addv(gasp(), t, .7)
    elif s == 'page': addv(page(), t, .7)
    elif s == 'shake': addv(shake(d), t, .5, .1)

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
