"""mix.py · score + foley + ambience → out/mix.wav (all synthesized in code; no samples).
Score: plucked nylon-ish guitar (Karplus–Strong) + cajón-like hits, 96 bpm, D minor → D major at the lockup.
Foley: squeegee on mesh per pull (band-passed noise with a ~240 Hz mesh grain), wet ink squelch, diagonal re-ink whoosh,
clamp snap, paper stamps per printed item. Ambience: room tone, paper hiss, harbour lapping, a few gulls."""
import json, os, sys
import numpy as np, soundfile as sf
D = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB', '/root/lemo-opuscar')
sys.path.insert(0, os.path.join(LIB, 'core/audio'))
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, brown, clack, thump, whoosh, compress, limit, add

EVJ = json.load(open(os.path.join(D, 'events.json')))
EV, DUR = EVJ['ev'], EVJ['dur']
N = int((DUR + 1) * SR)
mus, fol, amb = (np.zeros((N, 2)) for _ in range(3))
tt = np.arange(N) / SR
rng = np.random.default_rng(7)
evs = lambda tp: [e for e in EV if e['type'] == tp]

# ---------- instruments ----------
def ks(f, d=2.4, decay=.996, bright=.55):
    """Karplus–Strong pluck, vectorised one period at a time."""
    n, P = int(d * SR), max(2, int(SR / f))
    y = np.zeros(n + P)
    y[:P] = lp(rng.uniform(-1, 1, P * 4), 1500 + 5000 * bright)[:P]
    for s in range(P, n + P, P):
        e = min(s + P, n + P)
        prev = y[s - P:e - P]; prev2 = np.concatenate([[y[s - P - 1] if s - P - 1 >= 0 else 0], prev[:-1]])
        y[s:e] = decay * .5 * (prev + prev2)
    y = y[P:]
    return norm(hp(y, 70)) * np.minimum(1, (d - t_(d)[:len(y)]) / .08)
def midi(m): return 440 * 2 ** ((m - 69) / 12)
CH = {'Dm': [50, 57, 62, 65, 69], 'C': [48, 55, 60, 64, 67], 'Bb': [46, 53, 58, 62, 65], 'A': [45, 52, 57, 61, 64], 'D': [50, 57, 62, 66, 69], 'G': [43, 50, 55, 59, 62]}
def strum(at, ch, v=.5, down=True, d=2.0):
    notes = CH[ch] if down else CH[ch][::-1]
    for i, m in enumerate(notes):
        add(mus, ks(midi(m), d, .9965, .5), at + i * .016, v * (.8 if i == 0 else .6), pan=-.25 + .12 * i)
def pluck(at, m, v=.5, pan=0, d=2.2): add(mus, ks(midi(m), d, .997, .65), at, v, pan)
def cajon_low(v=1.):
    d = .25; x = t_(d); return norm(np.sin(2 * np.pi * (95 - 40 * x / d) * x) * env_exp(d, .06) + lp(noise(d), 400) * env_exp(d, .02) * .4) * v
def cajon_slap(v=1.):
    d = .18; return norm(bp(noise(d), 1200, 6000) * env_exp(d, .035) + bp(noise(d), 250, 600) * env_exp(d, .02) * .6) * v

BEAT = 60 / 96
# 1) intro: one pluck per pull (rising D-minor arpeggio)
for e, m in zip([e for e in evs('pull') if e['t'] < 7], [62, 65, 69, 74, 72, 69, 77]):
    pluck(e['t'], m, .45, pan=.2)
# 2) groove from the header to the drift: chord every 2 beats, cajón on the beats
prog = ['Dm', 'C', 'Bb', 'A']
g0, g1 = 6.4, 17.4
k = 0; t = g0
while t < g1 - .05:
    bar = int((t - g0) / (BEAT * 4))
    strum(t, prog[bar % 4], .38, down=(k % 2 == 0), d=1.6); k += 1; t += BEAT * 2
t = g0
i = 0
while t < g1 - .05:
    add(mus, cajon_low(.55) if i % 2 == 0 else cajon_slap(.32), t, 1, 0); i += 1; t += BEAT
for e in evs('sweep'): strum(e['t'], 'A' if e['t'] > 14 else 'Bb', .5, True, 2.0)
# 3) snap: the music drops out during the drift, returns on the clamp
sn = evs('snap')[0]['t']
add(mus, cajon_low(1.0), sn, 1, 0); strum(sn + .02, 'Dm', .55, True, 2.4)
# 4) band: a small melody, one note per printed item, soft strums underneath
mel = [69, 72, 74, 76, 77]
for e, m in zip(evs('stamp'), mel): pluck(e['t'], m, .5, pan=-.15)
t = sn + BEAT * 4; c = 0
while t < 25.4:
    strum(t, ['Bb', 'C', 'Dm', 'A'][c % 4], .26, c % 2 == 0, 1.8); c += 1; t += BEAT * 2
# 5) lockup: the major chord rings out
stub_t = [e for e in evs('stamp') if e.get('id') == 'stub'][0]['t']
strum(stub_t, 'D', .6, True, 4.5)
for j, m in enumerate([74, 78, 81, 86]): pluck(stub_t + .35 + j * .22, m, .32, pan=.25, d=3.5)
add(mus, cajon_low(.7), stub_t, 1, 0)

# ---------- foley ----------
def scrape(d, bright=1.0):
    x_t = t_(d); n = noise(d)
    grain = .65 + .35 * np.abs(np.sin(2 * np.pi * 240 * x_t + rng.random() * 6)) ** 2
    x = bp(n, 700 * bright, min(9000, 5200 * bright), 2) * grain + lp(noise(d), 380) * .3
    return norm(x * np.minimum(1, x_t / .02) * np.minimum(1, (d - x_t) / .06))
def squelch():
    d = .16; x_t = t_(d)
    return norm(np.sin(2 * np.pi * 140 * x_t * (1 - .9 * x_t)) * env_exp(d, .05) + lp(noise(d), 900) * env_exp(d, .03) * .5)
def stamp():
    d = .14; x_t = t_(d)
    return norm(lp(noise(d), 1200) * env_exp(d, .012) + np.sin(2 * np.pi * 160 * x_t) * env_exp(d, .03) * .7)
for e in evs('pull'):
    add(fol, scrape(e['d'], 1.0 + .3 / max(e['d'], .3)), e['t'], .22, pan=-.3)
    add(fol, squelch(), e['t'] + e['d'] - .05, .18, pan=.2)
for e in evs('sweep'):
    add(fol, scrape(e['d'] + .05, 1.6), e['t'], .26, pan=.1); add(fol, whoosh(.4), e['t'], .2, pan=.3)
add(fol, clack(1.0), sn, .7, 0); add(fol, thump(1.0), sn, .55, 0)
for e in evs('stamp'): add(fol, stamp(), e['t'], .35, pan=.1)

# ---------- ambience ----------
room = lp(brown(DUR + 1), 240)[:N] * .5
hiss = hp(noise(DUR + 1), 3000)[:N] * .012
lap = lp(noise(DUR + 1), 700)[:N] * (.5 + .5 * np.sin(2 * np.pi * .35 * tt) ** 2)
lap_env = np.clip((tt - 5.5) / 1.0, 0, 1) * (1 - .6 * ((tt > 17.4) & (tt < sn)))
for ch, sh in ((0, 0), (1, 700)):
    amb[:, ch] += room * .04 + np.roll(hiss, sh) + np.roll(lap, sh) * lap_env * .05
def gull(d=.5):
    x_t = t_(d); f = np.interp(x_t, [0, .08, .3, d], [1500, 2300, 1900, 1400])
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + .4 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return norm(bp(tone, 900, 5000) * np.sin(np.pi * x_t / d) ** 1.5)
for gt, gp in ((6.9, .6), (11.2, -.5), (21.8, .4), (27.5, -.3)): add(amb, gull(), gt, .05, pan=gp)

# ---------- balance ----------
drop = np.ones(N); drop[(tt > 17.4) & (tt < sn)] = 0.0                     # the silence before the facts
mus *= drop[:, None]
mus = np.stack([compress(mus[:, 0], .35, 2.5), compress(mus[:, 1], .35, 2.5)], 1)
mix = mus * .9 + fol * .8 + amb
mix = limit(mix / max(1e-6, np.abs(mix).max()) * .85)
os.makedirs(os.path.join(D, 'out'), exist_ok=True)
sf.write(os.path.join(D, 'out/mix.wav'), mix[:int(DUR * SR)], SR)
print('wrote out/mix.wav', round(DUR, 2), 's')
