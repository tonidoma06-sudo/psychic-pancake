# Reference analysis: "This Shape Saved Roller Coasters" (@RicksClips3000, 177K likes)

Source: an 11.4 s screen recording of the Short (1170×2532, iPhone). Studied frame by frame (4 fps contact sheets, full-res key frames), with frame-difference motion analysis and a spectrogram/loudness pass.
We borrow **techniques**, not the channel's characters, story or branding: our cast, palette and worlds are original.

## What makes it work

### 1. Characters: toon-shaded 3D bodies + flat 2D faces
- A big **white ball head** (≈ 1/3 of body height) with a **hand-drawn face**: solid black oval eyes, thick black brows, a huge D-shaped grin with a white teeth band. No nose.
- **Expressions snap** on story beats instead of morphing: laughing `><` eyes while working → proud grin → instant **deadpan half-lidded** stare on the punchline ("it cost him… everything.") → **evil** narrowed eyes + zigzag grin for the villain.
- **Bean-shaped body** with richly textured clothes (denim with stitching, patches, buttons), **thick black ink outline** around head/body/hat, **thin black stick limbs**, chunky shoes.
- One strong silhouette per role: hero (cap + overalls), rival (slicked hair + coat). Readable at phone size.

### 2. World: rich, saturated, game-engine look
- Deep **saturated blue sky** with puffy white clouds, sunny key light, soft shadows.
- **Dense detail everywhere:** textured grass, dozens of trees, rolling hills in haze, fences, bunting, a Ferris wheel and fair on the horizon, construction props (crane, scaffolding).
- Environment is **not** outlined, characters **are**, so the cast pops off the background.
- **Lighting changes carry the story:** day → night ("the night before opening") with warm lamps and a blue night.

### 3. Camera: never still
- **Low, wide-lens close-ups** of the character (perspective exaggeration), face filling 40–90% of the frame on emotional beats.
- **Push-ins to an extreme close-up** for the punchline, then hold while the expression snaps.
- **FPV/drone fly-throughs** connect locations: 0.6–0.8 s rushes along the track/over the ground (motion analysis: big frame-difference spikes at 2.8–3.6 s and 4.5–5.2 s with no hard cut).
- **Follow moves** track the action (the car climbing the loop).
- **Double-exposure dissolves** (the face ghosts over the next wide shot) instead of hard cuts for time jumps.
- A new camera move roughly every **1–1.5 s**; slow orbits on wides.

### 4. Captions
- **1–3 words at a time**, centred around 55–60% of the height, as spoken (sentence case, punctuation kept: "down,", "everything.").
- **Heavy white sans with a thick black outline and soft drop shadow**, a small pop-in. No colour highlight, no plates.

### 5. Voice, pace, sound
- **≈ 3.3 words/s** with almost no pauses (RMS never drops below ~-34 dB); energetic male narrator. (Our Pudding Guy runs at 2.6 words/s.)
- **Quiet tonal music bed** under the voice (sustained pad tones visible in the spectrogram), **whooshes on fast camera moves**, sparks/impacts on actions.
- Master ≈ **-14 LUFS, LRA 1.5 LU** (heavily compressed, constant level).

## What we change in our pipeline (style v4, `toon-3d/`)

| Reference technique | Our v3 (Pudding Guy) | v4 (this kit) |
|---|---|---|
| Toon cast, 2D faces, ink outlines | semi-realistic toy people, sculpted faces | `toon.js`: cel ramp, inverted-hull ink, canvas face decal, 11 snap expressions, talk/blink |
| Rich saturated world | clean, sparse sets | `world.js`: textured grass + 9k tufts, 140 trees, hills in haze, cloud band, bunting, Ferris wheel, tents, fence; night variant with string lights |
| Constant camera motion, FPV rushes | mostly slow dollies + hard cuts with a white flash | FPV Catmull-Rom rushes with speed blur, push-ins to ECU, orbits, handheld noise, impact shake |
| Double-exposure dissolves | hard cuts | outgoing shot keeps moving and fades over the incoming one (0.3 s) |
| 1–3 word centred captions | phrase line, yellow karaoke highlight at the bottom | Montserrat Black, white + 26 px black outline + shadow, pop-in, y = 1080 |
| 3.3 words/s, no pauses | 2.6 words/s with gaps | tighter script, faster read, ≤ 0.12 s gaps |
| Whooshes on moves, loud compressed master | music-led with SFX hits | whoosh on every rush/dissolve, music −3 dB under SFX in the test; under voice −16…−18 dB |

Keep from v3: the retention structure (payoff in the first line, a number on screen from frame 1, punchline ending that loops), sourced facts, the expressive AI voice.
