# Toy Theatre 3D · 3D 玩具剧场 — Style Prompt

Made from a blank page; techniques from Tilt-Shift Miniature (tilt-shift) in Lemo-Opuscar, with telop and caption moves borrowed from Game Show Flat (game-show).
Default size: 1080×1920.

## 1. Essence, and what it is not
Story Shorts acted by **stylised 3D people about seven heads tall** (rounded primitives, simple readable faces, costumes built from shapes) in **bright, story-specific sets**, filmed by a **moving perspective camera** (cranes, dollies, whip pans, orbits) with real sun, soft shadows, ambient occlusion and a touch of depth of field. One action per shot, a cut on every line. Not photoreal, not clay, not low-poly facets, not 2D.

## 2. Materials & rendering
three.js, `MeshStandardMaterial` with roughness .5–.9, metals .6–.8 for gold and steel; Neutral tone mapping; PCF soft shadows from one sun fitted per shot; RoomEnvironment PMREM at ≈.45; post `core/three/post.js`: GTAO (≈.7) → physical DOF (focus on the speaker, aperture 4–10) → light bloom (threshold .95) → grade (saturation 1.15, soft contrast, vignette .3). Characters: ellipsoid torso, tapered limbs with sphere joints, box hands and sandals, a face of sclera + iris + pupil + catch-light, skin eyelids, capsule brows and lips, cheeks, ears, hair or helmet. Sets are built from primitives and canvas textures (frescoes, paving, stripes); crowds far from camera are instanced bodies.

## 3. Colour logic
Saturated, warm, toy-bright: one ground family per set, gold and one strong costume colour (red, purple, teal) as accents, skin in warm peach. Each set has its own light colour (dusk orange, golden hour, cool day, warm interior). Neighbouring shots differ in set or light.

## 4. Type & subtitles
Fredoka 700. Captions: one line of 2–4 words, bold white with a 15 px dark stroke and drop shadow, the spoken word yellow (#FFD23F) and popping; at y ≈ 1480 (clear of Shorts UI). Telops: names on coloured plates, verdict words (SOLD!, TIME'S UP!) huge with a thick stroke, back-eased pop. Hold texts ≥ letters ÷ 15 + 1.5 s; verdict words are read at a glance.

## 5. Motion quality
Poses are keyframed angles blended with smoothstep; walks and marches are phase cycles; hits squash; numbers race with ease-out and slam with a back-ease; faces blink. Everything is a pure function of t.

## 6. Camera grammar
| Move | Serves |
|---|---|
| Crane down / up | establishing a place; a reveal of a banner or a crowd |
| Dolly behind / in front of a walker | marching guards; a man walking to power |
| 180° whip pan (yaw interpolation) | one side answering another (wall ↔ bidder) |
| Low angle push | a number, a bid, a threat |
| Drone along a road | an army, a journey |
| POV of the object | doors bursting open as seen by the throne |
| Follow cam at floor height | a crown rolling away |
Hard cuts with a 0.08 s white flash; no dissolves.

## 7. Sound palette
Synthesized period score from the picture's events: war drums (toms), brass stabs and swells, horn calls, plucked lyre (Karplus–Strong), choir pad (formants), cymbals; foley for gavels, coins, crowds, doors, footsteps. One silence (heartbeat only) before the turn. Voice ≈11 dB over the ducked music, −14 LUFS.

## 8. Native moves
- **The place changes with the line**: each sentence of the script gets its own set and camera.
- **Numbers as objects**: bids float above the bidder as camera-facing 3D numbers that race and slam.
- **Time-lapse by light**: the sun sweeps the room while a counter ticks.
- **The loop**: the last beat returns to the first frame.

## 9. Pitfalls of the medium
- Instanced crowds at the wrong scale break the proportions: match them to the hero rig.
- Cylinder capes: `thetaStart` around π is the back; rotating by π puts them on the chest.
- Text on a held prop reads mirrored from behind: use camera-facing sprites, offset toward the camera.
- A camera inside a column renders a blank frame: check every shot's path against the set.
- A vertical frame is narrow (≈26° horizontal at a 44° vertical fov): stage action within ±13° of the look direction.
- SwiftShader renders ≈4–5 s per frame at 1080×1920: budget the render.

## 10. Engine
`kit.js` (materials, primitives, canvas text), `person.js` (rig, costumes, poses, faces, props, faceLabels), `sets.js` / `sets2.js` (places, instanced crowds), `main.js` (shots from timing.json, acting, overlay telops and captions, events), `music.py` (score + SFX + mix), `timing.py` (voice → timing). Techniques from `$LIB/styles/tilt-shift/`.

## 11. Variation space
Any story with a few places and people: a startup's first year in an office, a recipe in a kitchen, a history episode. Openings: a crane into the place, a close object, the verdict first. Endings: the loop, a pull-out, the object left alone.
