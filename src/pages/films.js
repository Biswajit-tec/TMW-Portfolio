/**
 * films.js — Entry Orchestrator for Tubelight Media Works Films Portfolio
 *
 * Sequence:
 *   1. Initialize single Lenis smooth-scroll instance bound to GSAP ticker.
 *   2. Initialize Page Transition revealer (staggered blinds reveal).
 *   3. Bind minimal Back navigation control to Page Transition exit.
 *   4. Initialize Film Hero (scrubbed pinned sequence with parting outro).
 *   5. Initialize Film Sec2 (sticky 3-column converging grid with aperture reveal).
 *   6. Authoritative ScrollTrigger refresh.
 */

import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initPageTransition, navigateTo } from '../components/transition/PageTransition.js';
import { initFilmHero } from '../components/film/FilmHero.js';
import { initFilmSec2 } from '../components/film/FilmSec2.js';

gsap.registerPlugin(ScrollTrigger);

function initFilmsPage() {
  // ── 1. Global Smooth Scroll Architecture ──────────────────────────────
  const lenis = new Lenis({
    lerp: 0.08,
    smoothWheel: true,
  });

  lenis.on('scroll', ScrollTrigger.update);

  const tickerCallback = (time) => {
    lenis.raf(time * 1000);
  };
  gsap.ticker.add(tickerCallback);
  gsap.ticker.lagSmoothing(0);

  // ── 2. Page Transition Reveal ─────────────────────────────────────────
  initPageTransition();

  // ── 3. Subtle Back Control ────────────────────────────────────────────
  const backBtn = document.getElementById('tmw-film-back');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('/');
    });
  }

  // ── 4. Initialize Film Hero & Film Sec2 ───────────────────────────────
  initFilmHero();
  initFilmSec2();

  // ── 5. Authoritative ScrollTrigger Measurement ────────────────────────
  // Refresh on full asset readiness
  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
  });

  // Handle window resize cleanly
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);
  });

  // ── 6. Cleanup on Page Unload ─────────────────────────────────────────
  window.addEventListener('pagehide', () => {
    gsap.ticker.remove(tickerCallback);
    lenis.destroy();
    ScrollTrigger.getAll().forEach(st => st.kill());
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFilmsPage);
} else {
  initFilmsPage();
}
