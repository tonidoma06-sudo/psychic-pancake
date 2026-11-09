import { setup, render, texts, DUR } from './film.js';
await Promise.all(['900 40px BigShoulders', '800 40px BigShoulders', '600 40px Outfit'].map(f => document.fonts.load(f, 'AŠ€')));
const TL = setup(document.getElementById('c'));
window.DUR = DUR;
window.EV = TL.ev;
window.render = render;
window.TEXTS = texts;
window.READY = true;
