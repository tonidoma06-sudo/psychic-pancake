"""script.py · the narration of "The Man in the Box" (1964: Reg Spiers mailed himself from London to Perth in a crate), one line per beat.
Each line is (id, chapter, caption text, syllable overrides); digits in captions, their spoken syllables in the overrides."""
LINES = [
  ('L1', 'main', "He mailed himself across the world… in a wooden box.", {}),
  ('L2', 'main', "1964. Reg Spiers, an Australian javelin thrower, was stuck in London. Broke. And his daughter's birthday was coming.", {'1964.': 5}),
  ('L3', 'main', "So a friend nailed him into a crate and shipped it as air cargo. Cash on delivery.", {}),
  ('L4', 'main', "Inside: a pillow, a flashlight, some canned food… and a bottle to pee in.", {}),
  ('L5', 'main', "Sixty-three hours later, the crate landed in Perth. He climbed out, walked out of the airport… and made it home.", {}),
]
CHAPTERS = {}
