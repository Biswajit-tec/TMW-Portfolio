/**
 * BrandsTypography — expanding image inside typography (UI library scroll animation 17).
 * Each `[data-expand-N]` headline has inline image slots that grow as it scrolls
 * through the viewport (Flip scrubbed by ScrollTrigger), while the paragraph
 * below drifts away. The five variants differ only in config below.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(ScrollTrigger, Flip);

const ALL = (el, sel) => el.querySelectorAll(sel);

const EFFECTS = {
  1: {
    targets: (el) => [ALL(el, '.type__expand-img')[0], ALL(el, '.anim')],
    flip: { props: 'transform', ease: 'power1.inOut', start: 'clamp(top bottom)', end: '+=135%' },
    text: { to: { yPercent: -150, opacity: 0.2, skewX: -8 }, start: 'top bottom', end: 'bottom top' },
  },
  2: {
    targets: (el) => [ALL(el, '.type__expand-img')[0], ALL(el, '.anim')],
    flip: { props: 'transform', ease: 'sine.inOut', simple: true, start: 'center bottom', end: 'center top' },
    text: { from: { xPercent: 15, skewX: -5 }, to: { xPercent: -15, skewX: 5, opacity: 0.2 }, start: 'top bottom', end: 'bottom top' },
  },
  3: {
    targets: (el) => ALL(el, '.type__expand-img')[0],
    flip: { ease: 'sine', simple: true, start: 'center bottom', end: 'center top' },
    text: { from: { lineHeight: 1.2, willChange: 'line-height' }, to: { yPercent: -40, skewX: -2, lineHeight: 2, opacity: 0.2 }, start: 'top bottom', end: 'bottom top' },
  },
  4: {
    targets: (el) => [ALL(el, '.type__expand--stack')[0], ALL(el, '.type__expand-img'), ALL(el, '.anim')],
    flip: { props: 'transform', ease: 'sine.inOut', absoluteOnLeave: true, nested: true, start: 'top bottom', end: 'bottom top' },
    text: { to: { yPercent: -50, skewX: -4, rotation: 2, opacity: 0.2 }, start: 'top bottom', end: 'bottom top' },
  },
  5: {
    targets: (el) => ALL(el, '.type__expand-img'),
    flip: { ease: 'sine.inOut', simple: true, start: 'top bottom', end: 'center top' },
    text: { to: { yPercent: -60, opacity: 0.2 }, start: 'top bottom', end: 'clamp(bottom top)' },
  },
};

function expand(el, { targets, flip, text }) {
  const { start, end, props, ...flipVars } = flip;
  const textBlock = el.nextElementSibling;

  // Capture the "open" state, then revert to the closed layout and animate between them.
  el.style.minHeight = '';
  el.classList.add('type--open');
  const state = Flip.getState(targets(el), props ? { props } : undefined);
  const openHeight = el.offsetHeight;
  el.classList.remove('type--open');
  // Reserve the taller of the two layouts so content below never jumps mid-scrub.
  el.style.minHeight = `${Math.max(openHeight, el.offsetHeight)}px`;

  const tl = Flip.to(state, { ...flipVars, scrollTrigger: { trigger: el, start, end, scrub: true } });

  const textTrigger = { trigger: textBlock, start: text.start, end: text.end, scrub: true };
  const vars = { ease: 'sine.inOut', ...text.to, scrollTrigger: textTrigger };
  if (text.from) tl.fromTo(textBlock, text.from, vars, 0);
  else tl.to(textBlock, vars, 0);
}

export function initBrandsTypography() {
  // Flip measures the final layout, so wait for the images to size it.
  const loaded = [...document.querySelectorAll('.type__expand-img-inner')].map((el) => {
    const url = el.style.backgroundImage.slice(5, -2);
    return new Promise((done) => Object.assign(new Image(), { onload: done, onerror: done, src: url }));
  });

  Promise.all(loaded).then(() => {
    Object.entries(EFFECTS).forEach(([n, cfg]) =>
      document.querySelectorAll(`[data-expand-${n}]`).forEach((el) => expand(el, cfg))
    );
    ScrollTrigger.refresh();
  });
}
