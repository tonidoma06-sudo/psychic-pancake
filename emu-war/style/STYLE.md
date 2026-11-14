# Style v4 · "Toon 3D": how to build the next Short with this kit

Rules for every shot (from `REFERENCE.md`):
1. **Something moves in every frame.** No locked-off shots: dolly, orbit, push or FPV, plus a little handheld noise (`hand()`).
2. **A new camera idea every 1–1.5 s.** Change location with an **FPV rush** (0.7–0.9 s, speed blur, whoosh), or with a **0.3 s double-exposure dissolve** for time jumps. Use hard cuts only on impacts.
3. **Punchlines get a push-in to an extreme close-up** and an **expression snap** (grin → deadpan, smug → evil) on the stressed word, with a pop SFX and the music cut out for half a second.
4. **Characters:** `makeToon({ top, pants, outfit: 'hoodie'|'tee'|'suit', hair: 'beanie'|'messy'|'slick', ... })`. One silhouette and one colour per role. Faces: `happy, laugh, smile, deadpan, smug, evil, shock, worried, angry, calm, proud`. Mouth flaps with `talk` (0–1).
5. **Environment is PBR without outlines; characters and hero props are toon with ink** (`TM(geo, color, parent, x, y, z, inkWidth)`).
6. **Lighting tells time:** `DAY` / `NIGHT` presets (night: blue moon, string lights, warm lamp, crickets).
7. **Captions:** 1–3 words, Montserrat Black 108 px, white, black 26 px outline, shadow, centred at y = 1080, pop-in 0.12 s, sentence case with punctuation.
8. **Voice ≈ 3.3 words/s, gaps ≤ 0.12 s**; music −16…−18 dB under the voice; whoosh on every rush/dissolve; master −14 LUFS.
9. Keep the v3 retention rules: the absurd result in the first line at 0.1 s, a big number or stake on screen from frame 1, punchline ending that loops into the opening.

Files: `toon.js` (cast, faces, poses), `world.js` (park world, props), `main.js` (shots, camera language, dissolves, captions), `music.py` (score + SFX).
Check a cast's faces with `?sheet=1` (six expressions in one frame).
