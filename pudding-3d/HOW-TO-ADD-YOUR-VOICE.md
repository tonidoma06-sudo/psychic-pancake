# Adding your voice

The film ships with an expressive AI read (ElevenLabs, voice "Harrison"). To use your own voice instead:

1. Record the 9 lines below, word for word, with a short breath between lines. Aim for 33–37 s in total; read with energy, the way you'd tell a friend a crazy story (hook line fast and excited, the "…" beats slow, the last line deadpan).
2. Send the file (wav, mp3 or m4a). Your voice only, no music.
3. I run `sh build.sh your-voice.wav`: every shot, counter and caption is re-timed to your words, the score is regenerated around them, and you get `pudding-3d.mp4` (+ `pudding-3d.srt`).

> This man bought 12,000 cups of pudding…
> and turned them into over a MILLION airline miles!
> In 1999, a pudding brand was giving away airline miles for every barcode.
> And engineer David Phillips did the math. The miles were worth WAY more than the pudding!
> So he bought every cup he could find. 12,150!
> But there was a problem: 12,000 labels to peel… before the deadline.
> His genius move? He gave the pudding to charity… and the volunteers peeled them for him!
> 1.25 million miles. Lifetime elite status.
> And a tax write-off… for the pudding.

Say the numbers as words: "twelve thousand", "nineteen ninety-nine", "twelve thousand, one hundred and fifty", "one point two five million".
