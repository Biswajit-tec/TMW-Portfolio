/**
 * ProjectSection.js — Scroll-driven Projects section, Tubelight Media Works.
 *
 * Adapted from the purchased scroll animation component.
 * All selectors scoped to .tmw-project-* to prevent global collisions.
 *
 * ── SCROLL ARCHITECTURE ────────────────────────────────────────────────
 * Operates entirely within the existing Lenis → ScrollTrigger system.
 * HeroSection.js already established:
 *   lenis.on('scroll', ScrollTrigger.update)    ← every Lenis tick updates ST
 *   gsap.ticker.add(t => lenis.raf(t * 1000))  ← Lenis drives via GSAP ticker
 *
 * Any ScrollTrigger created here automatically uses Lenis-smoothed positions.
 * No second Lenis instance. No scroll-system conflicts.
 *
 * ── ANIMATION SEQUENCE ─────────────────────────────────────────────────
 * 1. MARQUEE ENTRY (as .tmw-project-marquee scrolls into view):
 *    .tmw-project-marquee-images x: -75% → -50%  (strip drifts right slightly)
 *
 * 2. MARQUEE PIN (marquee top = viewport top):
 *    Clone .tmw-pin img → fixed overlay at exact screen position, rotated -5°
 *    (matches the marquee rotation, so the image appears frozen in place)
 *
 * 3. FLIP SETUP (.tmw-project-hscroll at 50% viewport):
 *    Capture Flip state of clone → reposition clone to 100% × 100svh
 *    Create paused Flip animation (small → fullscreen transition)
 *
 * 4. HORIZONTAL SCROLL (.tmw-project-hscroll pinned, 5×vh scroll space):
 *    0–5%   : bg interpolates light → dark (chapter transition)
 *    0–20%  : Flip animation scrubs (clone expands to fullscreen)
 *    20–95% : clone parallax-translates with slides (-0% → -200%)
 *             hscroll-wrapper translates 0% → -66.67%
 *    95–100%: snapped to final positions
 *
 * 5. CLEANUP: All triggers killed by ID prefix on resize/destroy.
 *    Clone removed. Flip animation killed.
 *
 * ── MOBILE ─────────────────────────────────────────────────────────────
 * Identical animation mechanic on ALL screen sizes (per product requirement).
 * The horizontal slide LAYOUT adapts via CSS (text stacks above image).
 * The JS pin, Flip, and translate operations are screen-size agnostic.
 */

import gsap             from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip }          from 'gsap/Flip';

gsap.registerPlugin(ScrollTrigger, Flip);

export function initProjectSection() {
  // ── Element refs ──────────────────────────────────────────────────────
  const container      = document.querySelector('.tmw-project-container');
  const marqueeImages  = document.querySelector('.tmw-project-marquee-images');
  const marquee        = document.querySelector('.tmw-project-marquee');
  const hscroll        = document.querySelector('.tmw-project-hscroll');
  const hscrollWrapper = document.querySelector('.tmw-project-hscroll-wrapper');

  if (!container || !marqueeImages || !marquee || !hscroll || !hscrollWrapper) {
    console.warn('[TMW] ProjectSection: required elements not found — skipping init.');
    return;
  }

  // ── Reduced-motion check ──────────────────────────────────────────────
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  // ── CSS color tokens ──────────────────────────────────────────────────
  const cs         = getComputedStyle(document.documentElement);
  const lightColor = cs.getPropertyValue('--tmw-project-light').trim() || '#edf1e8';
  const darkColor  = cs.getPropertyValue('--tmw-black').trim()         || '#0a0703';

  // ── Flip state ────────────────────────────────────────────────────────
  let pinnedClone   = null;
  let isCloneActive = false;
  let flipAnimation = null;

  function createClone() {
    if (isCloneActive) return;
    const originalImg = container.querySelector('.tmw-project-marquee-img.tmw-pin img');
    if (!originalImg) return;

    const rect  = originalImg.getBoundingClientRect();
    pinnedClone = originalImg.cloneNode(true);

    gsap.set(pinnedClone, {
      position:        'fixed',
      left:            rect.left,
      top:             rect.top,
      width:           rect.width,
      height:          rect.height,
      rotate:          -5,
      transformOrigin: 'center center',
      pointerEvents:   'none',
      willChange:      'transform',
      zIndex:          50,
    });

    document.body.appendChild(pinnedClone);
    gsap.set(originalImg, { opacity: 0 });
    isCloneActive = true;
  }

  function removeClone() {
    if (!isCloneActive) return;
    pinnedClone?.remove();
    pinnedClone = null;
    const originalImg = container.querySelector('.tmw-project-marquee-img.tmw-pin img');
    if (originalImg) gsap.set(originalImg, { opacity: 1 });
    isCloneActive = false;
  }

  // ── Build / rebuild ScrollTrigger instances ───────────────────────────
  // Extracted so the resize handler can kill + recreate cleanly
  // without stacking a new `initProjectSection()` call.
  function buildTriggers() {
    ScrollTrigger.getAll()
      .filter(t => t.vars?.id?.startsWith('tmw-proj-'))
      .forEach(t => t.kill());

    // ── 1. Marquee image-strip entry animation ─────────────────────────
    if (!prefersReducedMotion) {
      ScrollTrigger.create({
        id:      'tmw-proj-marquee-move',
        trigger: marquee,
        start:   'top bottom',
        end:     'top top',
        scrub:   true,
        onUpdate: self => {
          gsap.set(marqueeImages, { x: `${-75 + self.progress * 25}%` });
        },
      });
    }

    // ── 2. Clone creation (marquee enters top of viewport) ─────────────
    if (!prefersReducedMotion) {
      ScrollTrigger.create({
        id:          'tmw-proj-clone',
        trigger:     marquee,
        start:       'top top',
        onEnter:     createClone,
        onEnterBack: createClone,
        onLeaveBack: removeClone,
      });
    }

    // ── 3. Horizontal scroll pin ────────────────────────────────────────
    ScrollTrigger.create({
      id:         'tmw-proj-hscroll-pin',
      trigger:    hscroll,
      start:      'top top',
      end:        () => `+=${window.innerHeight * 5}`,
      pin:        true,
      pinSpacing: true,
    });

    if (prefersReducedMotion) return; // No further animation on reduced motion

    // ── 4. Flip setup trigger ───────────────────────────────────────────
    // Fires when hscroll is 50% into the viewport — Flip state captured
    // at exactly the right moment so the clone position is accurate.
    ScrollTrigger.create({
      id:      'tmw-proj-flip-setup',
      trigger: hscroll,
      start:   'top 50%',
      end:     () => `+=${window.innerHeight * 5.5}`,

      onEnter: () => {
        if (pinnedClone && isCloneActive && !flipAnimation) {
          const state = Flip.getState(pinnedClone);

          // Reposition clone to full-screen (this becomes the end state)
          gsap.set(pinnedClone, {
            left:   0,
            top:    0,
            width:  '100%',
            height: '100svh',
            rotate: 0,
          });

          // Flip.from: animate FROM the captured small/rotated state TO full-screen
          flipAnimation = Flip.from(state, {
            duration: 1,
            ease:     'none',
            paused:   true,  // Scrubbed manually by scroll progress
          });
        }
      },

      onLeaveBack: () => {
        flipAnimation?.kill();
        flipAnimation = null;
        gsap.set(container,      { backgroundColor: lightColor });
        gsap.set(hscrollWrapper, { x: '0%' });
      },
    });

    // ── 5. Scroll-driven Flip progress + horizontal translate ───────────
    ScrollTrigger.create({
      id:      'tmw-proj-hscroll-progress',
      trigger: hscroll,
      start:   'top 50%',
      end:     () => `+=${window.innerHeight * 5.5}`,

      onUpdate: self => {
        const p = self.progress;

        // Bg: light → dark over first 5% of scroll (chapter transition)
        gsap.set(container, {
          backgroundColor: p < 0.05
            ? gsap.utils.interpolate(lightColor, darkColor, Math.min(p / 0.05, 1))
            : darkColor,
        });

        // Flip progress: 0–20% expands clone from marquee → fullscreen
        if (p <= 0.2 && flipAnimation) {
          flipAnimation.progress(p / 0.2);
        }

        // Horizontal slides: 20–95%
        if (p > 0.2 && p <= 0.95) {
          if (flipAnimation) flipAnimation.progress(1);

          const hProg = (p - 0.2) / 0.75;

          // Slides translate left
          gsap.set(hscrollWrapper, { x: `${-66.67 * hProg}%` });

          // Clone parallax: fixed @ 100vw width, translates in % of its own width
          // At full progress (hProg=1): translateX(-200%) = -200vw (2 slide-widths left)
          if (pinnedClone) {
            gsap.set(pinnedClone, { x: `${-((66.67 / 100) * 3 * hProg) * 100}%` });
          }
        }

        // Clamp final state (prevents drift past last position)
        if (p > 0.95) {
          if (flipAnimation) flipAnimation.progress(1);
          gsap.set(hscrollWrapper, { x: '-66.67%' });
          if (pinnedClone) gsap.set(pinnedClone, { x: '-200%' });
        }
      },
    });
  }

  buildTriggers();

  // ── Debounced resize: rebuild triggers without stacking event listeners ─
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Clean clone state — position is stale after resize
      removeClone();
      if (flipAnimation) {
        flipAnimation.kill();
        flipAnimation = null;
      }
      buildTriggers();
      ScrollTrigger.refresh();
    }, 300);
  });
}
