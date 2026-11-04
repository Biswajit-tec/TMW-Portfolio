/**
 * boot.js — shared setup for the domain pages (films, brands, sports).
 * Lenis smooth scroll driven by the GSAP ticker, page-transition reveal,
 * back button, and cleanup. `init` builds the page's scroll animations and
 * may return a teardown function.
 */
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initPageTransition, navigateTo } from '../components/transition/PageTransition.js';

gsap.registerPlugin(ScrollTrigger);

export function bootDomainPage(init) {
  const run = () => {
    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    initPageTransition();

    document.getElementById('tmw-film-back')?.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('/');
    });

    const teardown = init();

    // Re-measure once images have their final sizes (pins depend on it).
    window.addEventListener('load', () => ScrollTrigger.refresh());

    window.addEventListener('pagehide', () => {
      teardown?.();
      gsap.ticker.remove(tick);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
}
