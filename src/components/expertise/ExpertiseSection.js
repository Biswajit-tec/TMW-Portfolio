/**
 * ExpertiseSection.js — Scroll-driven Expertise chapter for Tubelight Media Works.
 *
 * Three domains (FILMS → BRANDS → SPORTS) are revealed through a pinned
 * ScrollTrigger section. The scroll position is the single source of truth.
 *
 * Architecture:
 *   - Uses the global Lenis instance created by HeroSection.js. No second Lenis.
 *   - No wheel/touch hijacking. No preventDefault on scroll events.
 *   - All visual state derived from ScrollTrigger's self.progress (0→1).
 *   - Reverse scrolling works naturally because state is purely progress-driven.
 *   - The purchased slider's visual language (clip-path wipe, blur-title) is preserved.
 *
 * Scroll map:
 *   progress 0.00–0.33  → FILMS  (index 0)
 *   progress 0.33–0.66  → BRANDS (index 1)
 *   progress 0.66–1.00  → SPORTS (index 2)
 *
 * Image transition (from the purchased slider component):
 *   Incoming image: clip-path wipes from right (forward) or left (backward)
 *   Inner img:      translates from offset to 0 (counterpart motion)
 *   Outgoing img:   slides away in the opposite direction
 *   Text:           blurs out on old domain, blurs in on new domain
 *
 * Called from main.js AFTER the reveal loader resolves, sequentially after
 * initHeroSection() so ScrollTrigger can measure the pinned hero height first.
 */

import gsap              from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText }     from 'gsap/SplitText';
import { EXPERTISE }     from '../../config/content.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

// ─── Custom ease (from the purchased slider component) ───────────────────────
// Registered once; GSAP no-ops duplicate registrations safely.
const HOP_EASE = 'M0,0 C0.071,0.505 0.192,0.726 0.318,0.852 0.45,0.984 0.504,1 1,1';

export function initExpertiseSection() {
  // ─── Guard: section must exist ───────────────────────────────────────────
  const section = document.getElementById('tmw-expertise');
  if (!section) return;

  // ─── Reduced-motion: show first domain statically, no scroll pin ─────────
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion) {
    _setupReducedMotion(section);
    return;
  }

  // ─── Element refs ─────────────────────────────────────────────────────────
  const imageContainers = gsap.utils.toArray('.tmw-ex-img');   // 3 containers
  const innerImgs       = imageContainers.map(c => c.querySelector('img'));
  const panels          = gsap.utils.toArray('.tmw-ex-panel'); // 3 panels
  const progressDots    = gsap.utils.toArray('.tmw-ex-dot');
  const eyebrow         = section.querySelector('.tmw-ex-eyebrow');
  const counterEl       = section.querySelector('.tmw-ex-counter');
  const domainCount     = EXPERTISE.domains.length; // 3

  if (!imageContainers.length || panels.length < domainCount) return;

  // ─── SplitText: split titles into words for blur-reveal effect ───────────
  // After split, words start blurred+invisible (matches purchased component).
  const splitInstances = panels.map((panel) => {
    const el = panel.querySelector('.tmw-ex-title');
    if (!el) return null;
    const split = SplitText.create(el, {
      type: 'words',
      wordsClass: 'tmw-ex-word',
    });
    gsap.set(split.words, { filter: 'blur(75px)', opacity: 0 });
    return split;
  });

  // ─── Eyebrow: start hidden, animated in on scroll entry ──────────────────
  gsap.set(eyebrow, { opacity: 0, y: 12 });

  // ─── Active domain index ─────────────────────────────────────────────────
  // Tracks which domain is currently displayed. Never used as a one-way flag;
  // transitions always move from this index to the new target.
  let activeDomainIndex = 0;
  let isTransitioning   = false;

  // ─── Set initial image states ─────────────────────────────────────────────
  // First image: fully visible. All others: clipped (hidden to the right).
  function _setInitialImageStates() {
    imageContainers.forEach((container, i) => {
      if (i === 0) {
        gsap.set(container, {
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          zIndex: 2,
        });
        gsap.set(innerImgs[i], { x: 0 });
      } else {
        gsap.set(container, {
          clipPath: 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)',
          zIndex: 1,
        });
        const slideOffset = _getSlideOffset();
        gsap.set(innerImgs[i], { x: slideOffset });
      }
    });
  }

  _setInitialImageStates();

  // ─── Set initial panel states ─────────────────────────────────────────────
  panels.forEach((panel, i) => {
    const meta = panel.querySelector('.tmw-ex-meta');
    if (meta) gsap.set(meta, { opacity: i === 0 ? 1 : 0, y: i === 0 ? 0 : 8 });
  });

  // ─── Initial title reveal (Films, on section init) ───────────────────────
  // Delayed slightly so the reveal fires after the section is in view.
  if (splitInstances[0]) {
    gsap.to(splitInstances[0].words, {
      filter: 'blur(0px)',
      opacity: 1,
      duration: 1.6,
      ease: 'power3.out',
      delay: 0.4,
      overwrite: true,
    });
  }

  // ─── Initial progress dot ────────────────────────────────────────────────
  progressDots[0]?.classList.add('tmw-ex-dot--active');

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function _getSlideOffset() {
    return window.innerWidth < 1000 ? 60 : 120;
  }

  function _domainFromProgress(p) {
    if (p < 1 / 3) return 0;
    if (p < 2 / 3) return 1;
    return 2;
  }

  function _getSectionScrollHeight() {
    // Desktop: 3.5× vh (generous cinematic space).
    // Mobile: 2.2× vh (shorter per-domain transition to avoid excessive scrolling).
    return window.innerWidth < 768
      ? window.innerHeight * 2.2
      : window.innerHeight * 3.5;
  }

  // ─── Transition between domains ──────────────────────────────────────────
  // This is the primary visual engine. All state change comes through here.
  // Works in both directions. Killing previous tweens ensures no ghost animations.
  function transitionTo(toIndex, fromIndex) {
    if (toIndex === fromIndex) return;

    const direction    = toIndex > fromIndex ? 1 : -1; // +1 forward, -1 reverse
    const slideOffset  = _getSlideOffset();

    // Kill any in-progress transitions on all containers + images
    imageContainers.forEach(c => gsap.killTweensOf(c));
    innerImgs.forEach(img   => gsap.killTweensOf(img));
    splitInstances.forEach(s => s && gsap.killTweensOf(s.words));

    const outContainer = imageContainers[fromIndex];
    const outImg       = innerImgs[fromIndex];
    const inContainer  = imageContainers[toIndex];
    const inImg        = innerImgs[toIndex];

    // Immediately establish z-order before animation starts.
    // This is critical for rapid direction changes.
    imageContainers.forEach((c, i) => {
      gsap.set(c, { zIndex: i === toIndex ? 3 : i === fromIndex ? 2 : 1 });
    });

    // Bring incoming image to its start position (off-screen in the wipe direction)
    gsap.set(inImg, { x: direction * slideOffset });

    // Clip the incoming container to its edge (the wipe starts fully hidden)
    gsap.set(inContainer, {
      clipPath: direction > 0
        ? 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)'
        : 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)',
    });

    // ── Wipe incoming container into view ──
    gsap.to(inContainer, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      duration: 1.2,
      ease: HOP_EASE,
      overwrite: true,
    });

    // ── Slide incoming image to rest position ──
    gsap.to(inImg, {
      x: 0,
      duration: 1.2,
      ease: HOP_EASE,
      overwrite: true,
    });

    // ── Slide outgoing image away in the opposite direction ──
    gsap.to(outImg, {
      x: -direction * slideOffset,
      duration: 1.2,
      ease: HOP_EASE,
      overwrite: true,
      onComplete: () => {
        // After outgoing finishes: hide it behind its edge (out of view)
        // Only do this if this domain is no longer the active one,
        // to avoid corrupting state if a rapid reverse happened mid-tween.
        if (activeDomainIndex !== fromIndex) {
          gsap.set(outContainer, {
            clipPath: direction > 0
              ? 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)'
              : 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)',
            zIndex: 1,
          });
          gsap.set(outImg, { x: -direction * slideOffset });
        }
      },
    });

    // ── Text: blur out old domain, blur in new domain ──
    if (splitInstances[fromIndex]) {
      gsap.to(splitInstances[fromIndex].words, {
        filter: 'blur(75px)',
        opacity: 0,
        duration: 0.65,
        ease: 'power2.in',
        overwrite: true,
      });
    }
    if (splitInstances[toIndex]) {
      gsap.to(splitInstances[toIndex].words, {
        filter: 'blur(0px)',
        opacity: 1,
        duration: 1.0,
        delay: 0.2,
        ease: 'power3.out',
        overwrite: true,
      });
    }

    // ── Meta blocks: fade description+CTA in/out ──
    panels.forEach((panel, i) => {
      const meta = panel.querySelector('.tmw-ex-meta');
      if (!meta) return;
      gsap.to(meta, {
        opacity: i === toIndex ? 1 : 0,
        y:       i === toIndex ? 0 : 8,
        duration: 0.45,
        ease:    'power2.out',
        overwrite: true,
      });
    });

    // ── Progress dots ──
    progressDots.forEach((dot, i) => {
      dot.classList.toggle('tmw-ex-dot--active', i === toIndex);
    });

    // ── Counter ──
    if (counterEl) {
      counterEl.textContent = `0${toIndex + 1} / 0${domainCount}`;
    }

    // Update active index AFTER establishing animations
    activeDomainIndex = toIndex;
  }

  // ─── ScrollTrigger — pinned section ──────────────────────────────────────
  let st;

  function createScrollTrigger() {
    if (st) {
      st.kill();
      st = null;
    }

    st = ScrollTrigger.create({
      id:         'tmw-expertise',
      trigger:    section,
      start:      'top top',
      end:        () => `+=${_getSectionScrollHeight()}px`,
      pin:        true,
      pinSpacing: true,
      scrub:      1,

      onEnter: () => {
        // Animate eyebrow label in
        gsap.to(eyebrow, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });
        // Ensure first domain state is correct
        if (activeDomainIndex !== 0) {
          // Snap directly to Films without animation when entering from below
          _snapToDomain(0);
        }
      },

      onLeaveBack: () => {
        // Section scrolled above — hide eyebrow
        gsap.to(eyebrow, { opacity: 0, y: 12, duration: 0.4, ease: 'power2.in' });
      },

      onUpdate: (self) => {
        const p             = self.progress;
        const targetDomain  = _domainFromProgress(p);

        // Update counter continuously even within the same domain
        if (counterEl) {
          counterEl.textContent = `0${targetDomain + 1} / 0${domainCount}`;
        }

        if (targetDomain !== activeDomainIndex) {
          transitionTo(targetDomain, activeDomainIndex);
        }
      },
    });
  }

  // ─── Snap to domain (no animation — for instant state reset) ─────────────
  function _snapToDomain(index) {
    // Kill all running transitions
    imageContainers.forEach(c => gsap.killTweensOf(c));
    innerImgs.forEach(img   => gsap.killTweensOf(img));
    splitInstances.forEach(s => s && gsap.killTweensOf(s.words));

    const slideOffset = _getSlideOffset();

    imageContainers.forEach((container, i) => {
      if (i === index) {
        gsap.set(container, {
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          zIndex: 2,
        });
        gsap.set(innerImgs[i], { x: 0 });
      } else {
        gsap.set(container, {
          clipPath: i < index
            ? 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)'
            : 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)',
          zIndex: 1,
        });
        gsap.set(innerImgs[i], { x: i < index ? -slideOffset : slideOffset });
      }
    });

    panels.forEach((panel, i) => {
      const meta = panel.querySelector('.tmw-ex-meta');
      if (!meta) return;
      gsap.set(meta, { opacity: i === index ? 1 : 0, y: i === index ? 0 : 8 });
    });

    splitInstances.forEach((split, i) => {
      if (!split) return;
      gsap.set(split.words, {
        filter:  i === index ? 'blur(0px)' : 'blur(75px)',
        opacity: i === index ? 1 : 0,
      });
    });

    progressDots.forEach((dot, i) => {
      dot.classList.toggle('tmw-ex-dot--active', i === index);
    });

    if (counterEl) counterEl.textContent = `0${index + 1} / 0${domainCount}`;
    activeDomainIndex = index;
  }

  createScrollTrigger();

  // ─── Resize: rebuild trigger with updated scroll height ───────────────────
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      createScrollTrigger();
      ScrollTrigger.refresh();
    }, 250);
  });
}

// ─── Reduced-motion fallback ──────────────────────────────────────────────────
// All three domains are visible and accessible; no scroll animation runs.
function _setupReducedMotion(section) {
  section.querySelectorAll('.tmw-ex-meta').forEach(meta => {
    meta.style.opacity = '1';
    meta.style.transform = 'none';
  });
  section.querySelectorAll('.tmw-ex-word').forEach(w => {
    w.style.filter  = 'none';
    w.style.opacity = '1';
  });
  section.querySelectorAll('.tmw-ex-img').forEach((container, i) => {
    if (i === 0) {
      container.style.clipPath = 'none';
      container.style.zIndex   = '2';
    } else {
      container.style.opacity = '0';
    }
  });
  const eyebrow = section.querySelector('.tmw-ex-eyebrow');
  if (eyebrow) eyebrow.style.opacity = '1';
}
