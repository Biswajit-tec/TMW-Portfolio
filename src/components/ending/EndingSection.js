/**
 * EndingSection.js — Closing statement & motion experience for Tubelight Media Works.
 *
 * Adapted from the purchased Lottie scroll animation component.
 * All selectors scoped to .tmw-ending-* to prevent global collisions.
 *
 * ── SCROLL ARCHITECTURE ────────────────────────────────────────────────
 * Reuses the existing single Lenis + ScrollTrigger system.
 * Operates cleanly with registered ScrollTrigger instances (prefixed `tmw-ending-*`).
 *
 * ── ANIMATION MECHANICS ────────────────────────────────────────────────
 * 1. Hero Image Width Transformation:
 *    As the ending stage scrolls into view, .tmw-ending-hero-img transitions
 *    from an expansive wide composition down to an anchored card.
 * 2. Lottie Motion & Frame Scrubbing:
 *    The Lottie SVG character (duck.json) translates upward, flips horizontally
 *    based on scroll direction, and steps through animation frames in sync with scroll.
 * 3. Reduced Motion Support:
 *    Gracefully provides a static, balanced resting state for users with prefers-reduced-motion.
 */

import gsap             from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import lottie           from 'lottie-web';

gsap.registerPlugin(ScrollTrigger);

export function initEndingSection() {
  const stage           = document.querySelector('.tmw-ending-stage');
  const section         = document.querySelector('#tmw-ending');
  const heroImg         = document.querySelector('.tmw-ending-hero-img');
  const lottieContainer = document.querySelector('.tmw-ending-lottie');

  if (!stage || !section || !heroImg || !lottieContainer) {
    console.warn('[TMW] EndingSection: required elements not found — skipping init.');
    return;
  }

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  // ── Lottie Animation Loader ──────────────────────────────────────────
  let lottieAnimation = null;
  try {
    lottieAnimation = lottie.loadAnimation({
      container: lottieContainer,
      path:      '/images/ending/duck.json',
      renderer:  'svg',
      autoplay:  false,
      loop:      true,
    });
  } catch (err) {
    console.warn('[TMW] EndingSection: Failed to load Lottie animation.', err);
  }

  if (prefersReducedMotion) {
    gsap.set(heroImg, { width: '320px' });
    if (lottieAnimation) {
      lottieAnimation.addEventListener('DOMLoaded', () => {
        lottieAnimation.goToAndStop(10, true);
      });
    }
    return;
  }

  // ── Scroll Direction Tracking ────────────────────────────────────────
  let scrollDirection = 'down';
  let lastScrollY = window.scrollY;

  const updateScrollDirection = () => {
    const currentScrollY = window.scrollY;
    scrollDirection = currentScrollY >= lastScrollY ? 'down' : 'up';
    lastScrollY = currentScrollY;
  };
  window.addEventListener('scroll', updateScrollDirection, { passive: true });

  let isAnimationPaused = false;

  // ── Build / Rebuild Triggers ─────────────────────────────────────────
  function buildTriggers() {
    ScrollTrigger.getAll()
      .filter(t => t.vars?.id?.startsWith('tmw-ending-'))
      .forEach(t => t.kill());

    const isMobile = window.innerWidth <= 1000;
    const heroImgInitialWidth = heroImg.parentElement ? heroImg.parentElement.offsetWidth * (isMobile ? 0.85 : 0.6) : 600;
    const heroImgTargetWidth  = isMobile ? 220 : 320;

    // Trigger 1: Hero Image width transformation (wide → anchored card)
    ScrollTrigger.create({
      id:       'tmw-ending-img-shrink',
      trigger:  stage,
      start:    'top bottom',
      end:      'top 30%',
      scrub:    1,
      onUpdate: self => {
        const currentWidth = heroImgInitialWidth - self.progress * (heroImgInitialWidth - heroImgTargetWidth);
        gsap.set(heroImg, { width: `${Math.max(currentWidth, heroImgTargetWidth)}px` });
      },
    });

    // Trigger 2: Lottie position offset & flip on direction
    ScrollTrigger.create({
      id:       'tmw-ending-lottie-move',
      trigger:  stage,
      start:    'top 30%',
      end:      'bottom top',
      scrub:    1,
      onUpdate: self => {
        const lottieOffset = self.progress * window.innerHeight * 0.9;
        isAnimationPaused  = self.progress > 0;

        gsap.set(lottieContainer, {
          y:       -lottieOffset,
          rotateY: scrollDirection === 'up' ? -180 : 0,
        });
      },
    });

    // Trigger 3: Lottie frame scrubbing
    ScrollTrigger.create({
      id:       'tmw-ending-lottie-frames',
      trigger:  section,
      start:    'top top',
      end:      'bottom top',
      scrub:    1,
      onUpdate: self => {
        if (lottieAnimation && lottieAnimation.totalFrames && !isAnimationPaused) {
          const scrollDist     = self.scroll() - self.start;
          const pixelsPerFrame = 4;
          const frame          = Math.floor(Math.max(0, scrollDist) / pixelsPerFrame) % lottieAnimation.totalFrames;
          lottieAnimation.goToAndStop(frame, true);
        }

        gsap.set(lottieContainer, {
          rotateY: scrollDirection === 'up' ? -180 : 0,
        });
      },
    });
  }

  // Initial trigger setup
  if (lottieAnimation) {
    lottieAnimation.addEventListener('DOMLoaded', () => {
      buildTriggers();
    });
  } else {
    buildTriggers();
  }

  // ── Debounced Resize Handler ─────────────────────────────────────────
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      buildTriggers();
      ScrollTrigger.refresh();
    }, 250);
  });
}
