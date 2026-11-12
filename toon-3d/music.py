# music.py · score + SFX for the v4 look test (7 s). Synthesised; no samples.
# Reference mix: a quiet pad/pluck bed under the voice, whooshes on every fast camera move, hits on actions, ~-14 LUFS, compressed.
# The bed cuts to silence on the deadpan beat (comedy needs the gap), comes back sneaky and minor for the rival, crickets at night.
import os, sys, wave
import numpy as np
import synth_lib as S
from synth_lib import *

SR = S.SR; TOTAL = 7.0; OUT = sys.argv[1] if len(sys.argv) > 1 else 'out/mix.wav'
BPM = 120; B = 60 / BPM
HITS, S2, S3, SNAP, S4, STING, S5 = [.62, 1.3], 1.55, 2.4, 3.15, 4.0, 4.95, 5.6
ML = np.zeros(S.N); MR = np.zeros(S.N)
def addm(sig, t0, gain=1., pan=0.):
    i = int(t0 * SR); sig = sig[: S.N - i] * gain; l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    ML[i:i + len(sig)] += sig * l * 1.414; MR[i:i + len(sig)] += sig * r * 1.414
VL = np.zeros(S.N); VR = np.zeros(S.N)
def adds(sig, t0, gain=1., pan=0.):
    i = int(t0 * SR); sig = sig[: S.N - i] * gain; l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    VL[i:i + len(sig)] += sig * l * 1.414; VR[i:i + len(sig)] += sig * r * 1.414

# ---- the bed: D major, bouncy plucks over a soft pad (0 → SNAP) ----
D, Bm, G_, A_ = [62, 66, 69], [59, 62, 66], [55, 59, 62], [57, 61, 64]
prog = [D, D, Bm, G_]
for bar in range(2):
    ch = prog[bar * 2]; t0 = bar * 4 * B
    if t0 < SNAP: addm(pad([m - 12 for m in ch], min(4 * B, SNAP - t0)), t0, .35)
mel = [74, 78, 81, 78, 76, 74, 73, 74, 78, 81, 83, 81]
for i, m in enumerate(mel):
    t = i * B / 2
    if t < SNAP - .05: addm(pluck(m, .25, .9), t, .32, .2 * ((i % 2) * 2 - 1))
for i in range(int(SNAP / B)):
    t = i * B; addm(bass([50, 50, 47, 43][(i // 2) % 4], .2), t, .5)
    if t < SNAP - .1: addm(kick(.8), t, .35); addm(hat(), t + B / 2, .12, .3)
# ---- the rival: D minor, sneaky pizzicato + low pad (S4 → end) ----
sneak = [50, 53, 57, 56, 57, 53, 50, 49]
for i, m in enumerate(sneak * 2):
    t = S4 - .05 + i * B / 2
    if t < TOTAL: addm(pizz(m + 12, .16), t, .5, -.2)
addm(pad([50, 53, 57], S5 - S4 + .2), S4, .3)
addm(pad([38, 45, 50], TOTAL - S5 + .2), S5, .35)

# ---- SFX ----
def thud():
    n = int(.4 * SR); t = np.arange(n) / SR
    knock = np.sin(2 * np.pi * (110 + 60 * np.exp(-t * 30)) * t) * np.exp(-t * 16)
    wood = bp(rng.standard_normal(n), 500, 1800) * np.exp(-t * 40) * .6
    return knock + wood
def flutter(dur=.8):
    n = int(dur * SR); t = np.arange(n) / SR
    return bp(rng.standard_normal(n), 900, 3000) * (.5 + .5 * np.sin(2 * np.pi * 26 * t)) ** 2 * np.sin(np.pi * t / dur) * .7
def crickets(dur):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for k, f in enumerate([4300, 4700]):
        gate = (np.sin(2 * np.pi * (2.3 + k * .4) * t + k) > .2) * (np.sin(2 * np.pi * 30 * t) > 0)
        s += np.sin(2 * np.pi * f * t) * lp(gate.astype(float), 400) * .25
    return s * np.minimum(1, t / .3)
def sting():
    return bell(86, 1.2) * .6 + bell(81, 1.2) * .4
adds(stamp(True) * .5, 0.0)                          # the first-frame hit
for h in HITS: adds(thud(), h, 1.0)
adds(whoosh(.85, True), S2 - .05, .9)                  # the FPV rush
adds(snap(), SNAP, .9); adds(pop(1200), SNAP + .02, .6)  # the expression snap
adds(flutter(), SNAP + .1, .5, .3)
adds(whoosh(.35, False), S4 - .18, .5); adds(whoosh(.35, False), S5 - .18, .5)
adds(sting(), STING, .55)
adds(crickets(TOTAL - S5 + .1), S5, .35)

# ---- mix: music under SFX; master is compressed and loud like the reference (mux.sh normalises to -14 LUFS) ----
def tame(x): x = hp(x, 35); return x - .3 * lp(x, 100)
rms = lambda x: np.sqrt(np.mean(x ** 2) + 1e-12)
ml, mr = tame(ML), tame(MR); n = int(TOTAL * SR)
g = rms((VL + VR)[:n] / 2) / rms((ml + mr)[:n] / 2) * 10 ** (-3 / 20)
mix = np.stack([ml * g + VL, mr * g + VR])[:, :n]
mix = mix / (np.max(np.abs(mix)) + 1e-9) * 1.6; mix = np.tanh(mix) * .9
os.makedirs(os.path.dirname(OUT) or '.', exist_ok=True)
w = wave.open(OUT, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix.T * 32767).astype(np.int16).tobytes()); w.close()
print('ok', OUT, TOTAL, 's')
