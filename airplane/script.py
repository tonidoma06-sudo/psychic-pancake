"""script.py · the narration of "The Man Who Ate an Airplane" (Michel Lotito, "Monsieur Mangetout"), one line per beat.
Each line is (id, chapter, caption text, syllable overrides); digits in captions, their spoken syllables in the overrides."""
LINES = [
  ('L1', 'main', "This man ate an entire airplane. Not a bite. The whole plane.", {}),
  ('L2', 'main', "Michel Lotito was a French entertainer who could eat metal.", {'Lotito': 3}),
  ('L3', 'main', "He cut it into tiny pieces, drank mineral oil, and washed it down with water. Up to two pounds a day.", {}),
  ('L4', 'main', "He ate 18 bicycles. 15 shopping carts. 7 TVs. And a coffin… handles and all.", {'18': 2, '15': 2, '7': 2, 'TVs.': 2}),
  ('L5', 'main', "Then he started on a Cessna 150. A real airplane. Piece by piece. It took him two years.", {'150.': 3}),
  ('L6', 'main', "Doctors found his stomach walls were twice as thick as normal.", {}),
  ('L7', 'main', "Guinness gave him a brass plaque for the strangest diet in the world. Legend says he ate that too.", {}),
  ('L8', 'main', "And the only foods that made him sick? Bananas… and hard-boiled eggs.", {}),
  ('L9', 'main', "What's the weirdest thing you've ever eaten?", {}),
]
CHAPTERS = {}
