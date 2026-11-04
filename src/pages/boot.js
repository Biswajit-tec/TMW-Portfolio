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

export function bootDomainPage(init) {
  const run = () => {
    const lenis = createLenis({ lerp: 0.08 });
    probeFrameRate();

    initPageTransition();

    document.getElementById('tmw-film-back')?.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('/');
    });

    const teardown = init({ lenis });

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
