/**
 * AboutSection.js — Scroll-driven About section for Tubelight Media Works.
 *
 * Adapted from the purchased three-card flip component.
 * All selectors scoped to `.tmw-about-*` / `#tmw-card-*`.
 *
 * Desktop (≥1000px) — ScrollTrigger pinned (2.5× viewport height):
 *   Progress 10–30%: section header fades + translates in; container narrows
 *   Progress 40%:    cards separate with gap + individual rounded corners
 *   Progress 65%:    3D card flip (rotationY 180°) + outer cards tilt ±15°
 *   Progress 65–100%: cards rest in flipped state (intentional stillness)°
 *
 * Mobile (<1000px) — CSS lays the cards out as a vertical stack, and each
 * card gets its own ScrollTrigger that flips it (rotationY 180°) as it
 * scrolls into view, so the copy on the card backs is reachable there too.
 *
 * Called from main.js AFTER the reveal loader Promise resolves,
 * so ScrollTrigger.refresh() can correctly measure the full page height
 * (hero pin + about sections).
 */

import gsap             from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// ScrollTrigger is already registered by HeroSection; re-registering is a no-op
gsap.registerPlugin(ScrollTrigger);

export function initAboutSection() {
  const cardContainer = document.querySelector('.tmw-about-cards');
  const stickyHeader  = document.querySelector('.tmw-about-header h2');

  if (!cardContainer || !stickyHeader) return;

  let isGapAnimationCompleted  = false;
  let isFlipAnimationCompleted = false;

  // Retained so a re-init can revert the previous context instead of
  // stacking a new matchMedia (and its triggers) on every resize.
  let mm = null;

  // ─── initAnimations — creates / re-creates ScrollTrigger on resize ────
  function initAnimations() {
    // Kill every About trigger — the desktop sticky pin AND the per-card
    // mobile flips — while leaving Hero/Project triggers untouched.
    ScrollTrigger.getAll()
      .filter(t => String(t.vars?.id || '').startsWith('tmw-about-'))
      .forEach(t => t.kill());

    if (mm) mm.revert();
    mm = gsap.matchMedia();

    // ── Mobile: vertical stack, each card flips as it scrolls into view ──
    mm.add('(max-width: 999px)', () => {
      // Drop desktop-only inline styles (width/gap/tilt) so CSS can lay the
      // stack out cleanly — but do NOT clear the cards' own transform here,
      // since the per-card flip below owns it.
      gsap.set(['.tmw-about-cards', '.tmw-about-header h2'], { clearProps: 'all' });
      gsap.set(['#tmw-card-2', '#tmw-card-3'], { marginLeft: '', zIndex: '' });
      gsap.set('.tmw-about-card', { clearProps: 'all' });

      isGapAnimationCompleted  = false;
      isFlipAnimationCompleted = false;

      const cards = gsap.utils.toArray('.tmw-about-card');

      // One trigger per card: flip to the copy side on the way down,
      // flip back to the image on the way up.
      cards.forEach((card, i) => {
        ScrollTrigger.create({
          id:      `tmw-about-card-flip-${i}`,
          trigger: card,
          start:   'top 70%',
          onEnter:     () => gsap.to(card, { rotationY: 180, duration: 0.9, ease: 'power3.inOut' }),
          onLeaveBack: () => gsap.to(card, { rotationY: 0,   duration: 0.9, ease: 'power3.inOut' }),
        });
      });

      return () => {
        gsap.set(cards, { clearProps: 'all' });
      };
    });

    // ── Desktop: 3-phase scroll animation, pinned ─────────────────────────
    mm.add('(min-width: 1000px)', () => {
      // Set the initial state explicitly so there is no jump between
      // CSS defaults and the first onUpdate call
      gsap.set(cardContainer, { width: '75%', columnGap: '0px' });
      gsap.set(['#tmw-card-2', '#tmw-card-3'], { marginLeft: '-1px' });
      ScrollTrigger.create({
        id:         'tmw-about-sticky',
        trigger:    '.tmw-about-sticky',
        start:      'top top',
        end:        `+=${window.innerHeight * 2.5}px`,
        scrub:      1,
        pin:        true,
        pinSpacing: true,

        onUpdate: self => {
          const p = self.progress;

          // ── Phase 1 (10–30%): header fades in; container width 75→60% ─
          if (p >= 0.1 && p <= 0.3) {
            const hp = gsap.utils.mapRange(0.1, 0.3, 0, 1, p);
            gsap.set(stickyHeader, {
              y:       gsap.utils.mapRange(0, 1, 40, 0, hp),
              opacity: gsap.utils.mapRange(0, 1, 0, 1, hp),
            });
          } else if (p < 0.1) {
            gsap.set(stickyHeader, { y: 40, opacity: 0 });
          } else {
            gsap.set(stickyHeader, { y: 0, opacity: 1 });
          }

          if (p <= 0.3) {
            gsap.set(cardContainer, {
              width: `${gsap.utils.mapRange(0, 0.3, 75, 60, p)}%`,
            });
          } else {
            gsap.set(cardContainer, { width: '60%' });
          }

          // ── Phase 2 (40%+): cards separate + get individual border radii ─
          if (p >= 0.4 && !isGapAnimationCompleted) {
            // Clear the -1px overlap now that cards are visually separating
            gsap.to(['#tmw-card-2', '#tmw-card-3'], { marginLeft: '0px', duration: 0.5, ease: 'power3.out' });
            gsap.to(cardContainer, { gap: '20px', duration: 0.5, ease: 'power3.out' });
            gsap.to(['#tmw-card-1', '#tmw-card-2', '#tmw-card-3'], {
              borderRadius: '20px',
              duration: 0.5,
              ease: 'power3.out',
            });
            isGapAnimationCompleted = true;
          } else if (p < 0.4 && isGapAnimationCompleted) {
            // Restore the -1px overlap as cards come back together
            gsap.to(cardContainer, { gap: '0px', duration: 0.5, ease: 'power3.out' });
            gsap.to(['#tmw-card-2', '#tmw-card-3'], { marginLeft: '-1px', duration: 0.5, ease: 'power3.out' });
            gsap.to('#tmw-card-1', { borderRadius: '20px 0 0 20px', duration: 0.5, ease: 'power3.out' });
            gsap.to('#tmw-card-2', { borderRadius: '0',            duration: 0.5, ease: 'power3.out' });
            gsap.to('#tmw-card-3', { borderRadius: '0 20px 20px 0', duration: 0.5, ease: 'power3.out' });
            isGapAnimationCompleted = false;
          }

          // ── Phase 3 (65%+): 3D card flip + outer cards tilt ──────────────
          if (p >= 0.65 && !isFlipAnimationCompleted) {
            gsap.to('.tmw-about-card', {
              rotationY: 180,
              duration:  0.75,
              ease:      'power3.inOut',
              stagger:   0.1,
            });
            gsap.to(['#tmw-card-1', '#tmw-card-3'], {
              y:         30,
              rotationZ: i => [-15, 15][i],
              duration:  0.75,
              ease:      'power3.inOut',
            });
            isFlipAnimationCompleted = true;
          } else if (p < 0.65 && isFlipAnimationCompleted) {
            gsap.to('.tmw-about-card', {
              rotationY: 0,
              duration:  0.75,
              ease:      'power3.inOut',
              stagger:   -0.1,
            });
            gsap.to(['#tmw-card-1', '#tmw-card-3'], {
              y:         0,
              rotationZ: 0,
              duration:  0.75,
              ease:      'power3.inOut',
            });
            isFlipAnimationCompleted = false;
          }
        },
      });

      return () => {};
    });
  }

  initAnimations();

  // Refresh after init so ScrollTrigger knows the full page height
  // (hero pin adds 5×vh before the about sections)
  ScrollTrigger.refresh();

  // ── Debounced resize: re-init triggers + refresh ───────────────────────
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      isGapAnimationCompleted  = false;
      isFlipAnimationCompleted = false;
      initAnimations();
      ScrollTrigger.refresh();
    }, 250);
  });
}
