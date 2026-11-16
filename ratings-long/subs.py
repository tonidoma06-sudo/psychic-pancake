"""subs.py · timing.json → ratings-longform.srt (captions for the upload) and chapters.txt (YouTube chapter timestamps)."""
import json, os
D = os.path.dirname(os.path.abspath(__file__)); T = json.load(open(os.path.join(D, 'timing.json')))
from script import CHAPTERS
def ts(t, sep=','): h, r = divmod(t, 3600); m, s = divmod(r, 60); return f'{int(h):02d}:{int(m):02d}:{int(s):02d}{sep}{int(round((s % 1) * 1000)):03d}'
E = []
for l in T['lines']:
    cur = []
    for x in l['words']:
        cur.append(x)
        if len(' '.join(y['w'] for y in cur)) > 38 or x['w'][-1] in '.?!"': E.append(cur); cur = []
    if cur: E.append(cur)
out = []
for i, c in enumerate(E):
    t1 = c[-1]['t1'] + .15
    if i + 1 < len(E): t1 = min(t1, E[i + 1][0]['t0'] - .02)
    out.append(f"{i + 1}\n{ts(c[0]['t0'])} --> {ts(t1)}\n{' '.join(x['w'] for x in c)}\n")
n = len(out)
open(os.path.join(D, 'ratings-longform.srt'), 'w').write('\n'.join(out))
ch = ['0:00 Cold open'] + [f"{int(c['t1'] // 60)}:{int(c['t1'] % 60):02d} {CHAPTERS[c['ch']][0].title()}: {CHAPTERS[c['ch']][1].title()}" for c in T['chapters']]
open(os.path.join(D, 'chapters.txt'), 'w').write('\n'.join(ch) + '\n'); print('\n'.join(ch)); print(n, 'subtitles')
