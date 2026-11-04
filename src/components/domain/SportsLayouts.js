/**
 * SportsLayouts — scroll-based layout animations (UI library scroll animation 21).
 * Each gallery is pinned and morphs between two CSS layouts (toggled via the
 * `gallery--switch` class) with Flip, scrubbed by scroll.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import { perf } from '../../utils/perf.js';

gsap.registerPlugin(ScrollTrigger, Flip);

const DEFAULT_FLIP = { absoluteOnLeave: false, absolute: false, scale: true, simple: true };

const GALLERIES = [
  { id: '#gallery-1', flip: { absoluteOnLeave: true, scale: false } },
  { id: '#gallery-2' },
  { id: '#gallery-3', flip: { absolute: true, scale: false }, end: '+=900%', stagger: 0.05 },
  { id: '#gallery-4' },
  { id: '#gallery-5' },
  { id: '#gallery-6' },
  { id: '#gallery-7' },
  { id: '#gallery-8', flip: { scale: false } },
];

function flipOnScroll(gallery, { flip, end = '+=300%', stagger = 0 }) {
  const caption = gallery.querySelector('.caption');
  const items = gallery.querySelectorAll('.gallery__item');
  const inner = [...items].flatMap((item) => [...item.children]);
  const trigger = { trigger: gallery, start: 'center center', end };

  // Capture the switched layout, then revert and animate toward it.
  gallery.classList.add('gallery--switch');
  // Per-item filters (brightness) repaint every frame; weak devices tween opacity only.
  const state = Flip.getState([items, caption], { props: perf.low ? 'opacity' : 'filter, opacity' });
  gallery.classList.remove('gallery--switch');

  const tl = Flip.to(state, {
    ease: 'none',
    ...DEFAULT_FLIP,
    ...flip,
    stagger,
    scrollTrigger: { ...trigger, pin: gallery.parentNode, scrub: true },
  });

  if (inner.length) {
    tl.fromTo(inner, { scale: 2 }, { scale: 1, scrollTrigger: { ...trigger, scrub: true } }, 0);
  }
}

export function initSportsLayouts() {
  const loaded = [...document.querySelectorAll('.gallery__item')].map((el) => {
    const url = el.style.backgroundImage.slice(5, -2);
    return new Promise((done) => Object.assign(new Image(), { onload: done, onerror: done, src: url }));
  });

  Promise.all(loaded).then(() => {
    GALLERIES.forEach(({ id, ...opts }) => {
      const el = document.querySelector(id);
      if (el) flipOnScroll(el, opts);
    });
    ScrollTrigger.refresh();
  });
}
