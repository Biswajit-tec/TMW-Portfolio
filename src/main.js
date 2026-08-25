/**
 * main.js — Tubelight Media Works application entry point.
 *
 * Orchestrates the full page experience:
 *   1. Locks scroll (body overflow: hidden) so the user cannot scroll
 *      behind the loader.
 *   2. Runs the RevealLoader, awaiting its Promise.
 *   3. On loader completion: unlocks scroll, makes the site accessible,
 *      and hands off to the HeroSection.
 *
 * This is the only place that wires the two components together.
 * Each component is independently testable — neither knows about the other.
 */

import { initRevealLoader } from './components/reveal/RevealLoader.js';
import { initHeroSection }  from './components/hero/HeroSection.js';

async function bootstrap() {
  const siteEl = document.getElementById('tmw-site');

  // Prevent scroll while the loader is active
  document.body.style.overflowY = 'hidden';

  try {
    // Block until the user triggers the reveal and the animation completes
    await initRevealLoader();
  } catch (err) {
    // If the loader fails for any reason, proceed to the site anyway
    console.warn('[TMW] Reveal loader encountered an error — showing site.', err);
  }

  // Unlock scroll
  document.body.style.overflowY = '';

  // Make the main site accessible to screen readers
  if (siteEl) {
    siteEl.removeAttribute('aria-hidden');
  }

  // Initialise the hero scroll animation + Lenis smooth scroll
  initHeroSection();
}

bootstrap();
