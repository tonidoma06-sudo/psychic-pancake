"""script.py · the narration of "The Worst Race in Olympic History" (1904 St. Louis Olympic marathon), one line per beat.
Each line is spoken exactly as written (captions show the same words); chapters group the lines for the edit."""
LINES = [
  # 1 · the hook
  ('L1',  'hook',   "The 1904 Olympic marathon might be the worst race in history."),
  ('L2',  'hook',   "The first man across the finish line had ridden in a car. The winner was running on rat poison."),
  ('L3',  'hook',   "And a mailman stopped for a nap... and still came fourth."),
  # 2 · the setup
  ('L4',  'setup',  "St. Louis. August 30th, 1904. The Olympics are part of the World's Fair, and it's ninety degrees."),
  ('L5',  'setup',  "The course is twenty-five miles of dusty dirt roads and steep hills."),
  ('L6',  'setup',  "Thirty-two men line up. Most have never run a marathon in their lives."),
  ('L7',  'setup',  "Officials ride ahead in brand-new automobiles, kicking giant clouds of dust right into the runners' faces."),
  ('L8',  'setup',  "And water? There's barely any. The organizer wanted to see what happens when athletes don't drink."),
  # 3 · the man in the car
  ('L9',  'lorz',   "Nine miles in, an American named Fred Lorz gets cramps. So he does what any athlete would do..."),
  ('L10', 'lorz',   "he climbs into his manager's car."),
  ('L11', 'lorz',   "For the next ten miles, he rides past the other runners, waving."),
  ('L12', 'lorz',   "Then the car breaks down. So Lorz hops out, and jogs the rest of the way into the stadium."),
  ('L13', 'lorz',   "The crowd goes wild. He poses with the President's daughter. She's about to hand him the gold medal..."),
  ('L14', 'lorz',   "when someone shouts: he cheated!"),
  ('L15', 'lorz',   "Lorz says it was just a joke. He's banned for life."),
  # 4 · the man on rat poison
  ('L16', 'hicks',  "Meanwhile, the real leader, Thomas Hicks, is falling apart."),
  ('L17', 'hicks',  "So his trainers give him a dose of strychnine. That's rat poison. Mixed with raw egg whites."),
  ('L18', 'hicks',  "When that wears off... another dose. This time with brandy."),
  ('L19', 'hicks',  "Hicks starts hallucinating. He thinks the finish line is still twenty miles away."),
  ('L20', 'hicks',  "His trainers basically carry him across it, his feet still moving like he's running."),
  ('L21', 'hicks',  "He wins gold, eight pounds lighter, with the slowest Olympic marathon time ever."),
  # 5 · the mailman
  ('L22', 'mail',   "But the best story belongs to Felix Carvajal, a mailman from Cuba."),
  ('L23', 'mail',   "He lost all his travel money gambling in New Orleans, and hitchhiked the rest of the way."),
  ('L24', 'mail',   "He showed up in long trousers, so another athlete cut them into shorts."),
  ('L25', 'mail',   "Mid-race, he stops to chat with the crowd. He eats some green apples. He gets cramps..."),
  ('L26', 'mail',   "so he lies down... and takes a nap."),
  ('L27', 'mail',   "Then he wakes up, keeps running, and finishes fourth."),
  # 6 · the dog
  ('L28', 'dog',    "Len Taunyane, one of the first Black Africans at the Olympics, gets chased a mile off course by a dog."),
  ('L29', 'dog',    "He still finishes ninth."),
  # 7 · the ending
  ('L30', 'end',    "More than half the runners never finish. One nearly dies by the side of the road."),
  ('L31', 'end',    "And Fred Lorz? His ban gets lifted. The next year... he wins the Boston Marathon."),
  ('L32', 'end',    "So the man on rat poison got the gold. The man in the car got Boston."),
  ('L33', 'end',    "And the mailman? He got a really good nap."),
]
if __name__ == '__main__':
    full = '\n\n'.join(t for _, _, t in LINES)
    words = sum(len(t.split()) for _, _, t in LINES)
    print(len(full), 'characters,', words, 'words, ~%.0f s at 2.6 w/s' % (words / 2.6))
