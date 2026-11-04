/**
 * boot.js — shared setup for the domain pages (films, brands, sports).
 * Lenis smooth scroll driven by the GSAP ticker, page-transition reveal,
 * back button, and cleanup. `init({ lenis })` builds the page's scroll animations and
 * may return a teardown function.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initPageTransition, navigateTo } from '../components/transition/PageTransition.js';
import { createLenis, probeFrameRate } from '../utils/perf.js';

gsap.registerPlugin(ScrollTrigger);

/** Resolves after the window `load` event (stylesheets + images) and webfonts, or after 4 s at most. */
function stylesAndFontsReady() {
  const loaded = document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise((r) => window.addEventListener('load', r, { once: true }));
  const fonts = document.fonts?.ready ?? Promise.resolve();
  const timeout = new Promise((r) => setTimeout(r, 4000));
  return Promise.race([Promise.all([loaded, fonts]), timeout]);
}

export function bootDomainPage(init) {
  const run = () => {
    const lenis = createLenis({ lerp: 0.08 });
    probeFrameRate();

    initPageTransition();

    document.getElementById('tmw-film-back')?.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('/');
    });

    // Build the animations only once stylesheets and fonts are in. Module scripts can
    // run before CSS has loaded in Safari/WebKit; Flip and ScrollTrigger would then
    // measure an unstyled page (0×0 text, wrong positions) and bake that in.
    let teardown;
    stylesAndFontsReady().then(() => {
      teardown = init({ lenis });
      ScrollTrigger.refresh();
    });

    // Re-measure once images have their final sizes (pins depend on it).
    window.addEventListener('load', () => ScrollTrigger.refresh());

    window.addEventListener('pagehide', () => {
      teardown?.();
      lenis.destroyTicker();
      lenis.destroy();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
}
