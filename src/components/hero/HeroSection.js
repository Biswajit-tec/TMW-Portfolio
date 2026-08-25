/**
 * HeroSection.js — Scroll-driven cinematic hero for Tubelight Media Works.
 *
 * Adapted from the purchased VoyeurVerite scroll animation.
 * All class names scoped to `.tmw-hero-*` to prevent global style collisions.
 *
 * Scroll phases (pinned section, 5× viewport height of scroll space):
 *   Phase 1 (0–25%)  — Foreground clips to a centre slit; dark overlay fades in
 *   Phase 2 (25–45%) — Foreground rotates 65°
 *   Phase 3 (45–65%) — Foreground scales to 0; background copy slides out; accent flash
 *   Phase 4 (65–85%) — Two outro images wipe in from top + bottom edges
 *   Phase 5 (90%+)   — Outro headline reveals via SplitText line masking
 *
 * Call `initHeroSection()` after the reveal loader resolves.
 * Returns the Lenis smooth-scroll instance so main.js can reference it if needed.
 */

import gsap             from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText }     from 'gsap/SplitText';
import Lenis             from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

export function initHeroSection() {
  // ─── Reduced-motion: skip scroll animation, show content statically ───────
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  // ─── Smooth scroll (Lenis) ────────────────────────────────────────────────
  const lenis = new Lenis();

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  if (prefersReducedMotion) {
    // Just show the hero at its natural state, no scroll animation
    const fgContent = document.querySelector('.tmw-hero-fg');
    if (fgContent) {
      fgContent.style.clipPath  = 'none';
      fgContent.style.transform = 'none';
    }
    return lenis;
  }

  // ─── Hero entrance animation ──────────────────────────────────────────
  // Delay 3.2s from page load = 1.2s into the 2s-delayed 3s dissolve.
  // At that point the WebGL canvas center is clearing, so the headline
  // appears to be born out of the dissolve rather than appearing afterward.
  const heroHeadline = document.querySelector('.tmw-hero-fg-header h1');
  if (heroHeadline) {
    gsap.fromTo(
      heroHeadline,
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 1.4, delay: 3.2, ease: 'power3.out' }
    );
  }


  // ─── SplitText — outro headline ───────────────────────────────────────────
  const outroHeaderSplit = SplitText.create('.tmw-hero-outro-header h3', {
    type: 'lines',
    mask: 'lines',
    linesClass: 'tmw-split-line',
  });
  gsap.set(outroHeaderSplit.lines, { y: '100%' });

  // ─── Element refs ──────────────────────────────────────────────────────────
  const fgContent       = document.querySelector('.tmw-hero-fg');
  const fgOverlayDark   = document.querySelector('.tmw-hero-overlay-dark');
  const fgOverlayAccent = document.querySelector('.tmw-hero-overlay-accent');
  const bgCopyLeft      = document.querySelectorAll('.tmw-hero-bg-copy')[0];
  const bgCopyRight     = document.querySelectorAll('.tmw-hero-bg-copy')[1];
  const outroImgTop     = document.querySelectorAll('.tmw-hero-outro-img')[0];
  const outroImgBottom  = document.querySelectorAll('.tmw-hero-outro-img')[1];

  let areOutroLinesRevealed = false;

  // ─── Scroll-triggered cinematic sequence ──────────────────────────────────
  ScrollTrigger.create({
    trigger: '.tmw-hero',
    start:   'top top',
    end:     `+=${window.innerHeight * 5}px`,
    pin:     true,
    pinSpacing: true,
    scrub:   1,

    onUpdate: (self) => {
      const p = self.progress;

      // ── Phase 1 (0–25%): clip foreground to a thin vertical slit ──────────
      const p1    = gsap.utils.clamp(0, 1, p / 0.25);
      const slitL = gsap.utils.interpolate(0,   48, p1);
      const slitR = gsap.utils.interpolate(100, 52, p1);
      gsap.set(fgContent, {
        clipPath: `polygon(${slitL}% 0%, ${slitR}% 0%, ${slitR}% 100%, ${slitL}% 100%)`,
      });
      gsap.set(fgOverlayDark, { opacity: gsap.utils.interpolate(0, 1, p1) });

      // ── Phase 2 (25–45%): rotate the slit 65° ────────────────────────────
      const p2 = gsap.utils.clamp(0, 1, (p - 0.25) / 0.2);
      gsap.set(fgContent, { rotate: gsap.utils.interpolate(0, 65, p2) });

      // ── Phase 3 (45–65%): scale to zero + slide bg copy out + accent flash ─
      const p3 = gsap.utils.clamp(0, 1, (p - 0.45) / 0.2);
      gsap.set(fgContent, { scale: gsap.utils.interpolate(1, 0, p3) });
      gsap.set(bgCopyLeft,  { x: `${gsap.utils.interpolate(0,  100, p3)}%` });
      gsap.set(bgCopyRight, { x: `${gsap.utils.interpolate(0, -100, p3)}%` });

      const p3a = gsap.utils.clamp(0, 1, (p - 0.45) / 0.05);
      gsap.set(fgOverlayAccent, { opacity: gsap.utils.interpolate(0, 1, p3a) });

      // ── Phase 4 (65–85%): outro images wipe in from top + bottom ──────────
      const p4 = gsap.utils.clamp(0, 1, (p - 0.65) / 0.2);
      gsap.set(outroImgTop, {
        clipPath: `polygon(0% 0%, 100% 0%, 100% ${gsap.utils.interpolate(0, 100, p4)}%, 0% ${gsap.utils.interpolate(0, 100, p4)}%)`,
      });
      gsap.set(outroImgBottom, {
        clipPath: `polygon(0% ${gsap.utils.interpolate(100, 0, p4)}%, 100% ${gsap.utils.interpolate(100, 0, p4)}%, 100% 100%, 0% 100%)`,
      });

      // ── Phase 5 (90%+): SplitText outro headline ──────────────────────────
      if (p >= 0.9 && !areOutroLinesRevealed) {
        areOutroLinesRevealed = true;
        gsap.to(outroHeaderSplit.lines, {
          y:        '0%',
          duration: 0.75,
          stagger:  0.1,
          ease:     'power3.out',
        });
      } else if (p < 0.9 && areOutroLinesRevealed) {
        areOutroLinesRevealed = false;
        gsap.to(outroHeaderSplit.lines, {
          y:        '100%',
          duration: 0.25,
          stagger:  -0.05,
          ease:     'power3.out',
        });
      }
    },
  });

  return lenis;
}
