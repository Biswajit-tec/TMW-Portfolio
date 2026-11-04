/**
 * ExpertiseSection.js — Sequential Scroll-Driven Expertise Chapter
 * Tubelight Mediaworks · FILMS → BRANDS → SPORTS
 *
 * Requirements:
 *   1. Deterministic 3-step sequential navigation (Films -> Brands -> Sports -> Next)
 *   2. Reverse navigation (Next -> Sports -> Brands -> Films -> Hero)
 *   3. Strict animation lock + debounce to prevent momentum / fast-scroll skipping
 *   4. Zero typography overlap via synchronized outgoing/incoming state management
 *   5. Cinematic entrance animation on department click (zoom, iris portal transition)
 *   6. Full-screen clickable department screens navigating to /films, /brands, /sports
 *   7. Seamless integration with the global Lenis smooth-scroll instance
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EXPERTISE } from '../../config/content.js';
import { navigateTo } from '../transition/PageTransition.js';
import { perf } from '../../utils/perf.js';

// Blur is a GPU filter pass over a huge text layer: off on weak devices, smaller on touch.
const BLUR_MAX = perf.low ? 0 : perf.touch ? 10 : 25;
const F = (px) => (BLUR_MAX ? `blur(${Math.min(px, BLUR_MAX)}px)` : 'none');

gsap.registerPlugin(ScrollTrigger);

// Custom Hop ease for signature cinematic clip-path wipes
const HOP_EASE = 'M0,0 C0.071,0.505 0.192,0.726 0.318,0.852 0.45,0.984 0.504,1 1,1';

export function initExpertiseSection(lenis) {
  const section = document.getElementById('tmw-expertise');
  if (!section) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    _setupReducedMotion(section);
    return;
  }

  // Element references
  const imageContainers = gsap.utils.toArray('.tmw-ex-img');
  const innerImgs       = imageContainers.map(c => c.querySelector('img'));
  const panels          = gsap.utils.toArray('.tmw-ex-panel');
  const progressDots    = gsap.utils.toArray('.tmw-ex-dot');
  const eyebrow         = section.querySelector('.tmw-ex-eyebrow');
  const counterEl       = section.querySelector('.tmw-ex-counter');
  const domainCount     = EXPERTISE.domains.length; // 3

  if (!imageContainers.length || panels.length < domainCount) return;

  // Create or retrieve cinematic portal overlay for smooth entrance transition
  let portalOverlay = section.querySelector('.tmw-ex-portal-overlay');
  if (!portalOverlay) {
    portalOverlay = document.createElement('div');
    portalOverlay.className = 'tmw-ex-portal-overlay';
    portalOverlay.style.cssText = `
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at center, rgba(10,7,3,0.3) 0%, rgba(10,7,3,0.98) 75%, #0a0703 100%);
      opacity: 0;
      pointer-events: none;
      z-index: 50;
      transition: opacity 600ms ease;
    `;
    section.appendChild(portalOverlay);
  }

  // Navigation routes
  const domainRoutes = ['/films', '/brands', '/sports'];

  // Touch devices can't be gesture-hijacked reliably (momentum scrolling ignores
  // preventDefault, and phones keep scrolling natively). There the section is
  // scroll-driven instead: it stays pinned for one screen of scroll per banner
  // and Films → Brands → Sports follow the scroll position.
  const scrollDriven = window.matchMedia('(pointer: coarse)').matches;

  // Department to restore when the visitor comes back from a domain page.
  const stored = sessionStorage.getItem('tmw_return_domain');
  sessionStorage.removeItem('tmw_return_domain');
  let returnIndex = stored !== null && Number(stored) < domainRoutes.length ? Number(stored) : null;

  // State
  let activeDomainIndex   = 0;
  let isTransitioning     = false;
  let isNavigating        = false;
  let inExpertiseMode     = false;
  let lastTransitionTime  = 0;
  let touchStartY         = 0;
  let touchStartX         = 0;

  function _getSlideOffset() {
    return window.innerWidth < 1000 ? 60 : 120;
  }

  // ─── Initial visual setup ────────────────────────────────────────────────
  function _setInitialStates() {
    isNavigating = false;
    if (portalOverlay) portalOverlay.style.opacity = '0';

    // Images
    imageContainers.forEach((container, i) => {
      if (i === 0) {
        gsap.set(container, {
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          zIndex: 2,
        });
        gsap.set(innerImgs[i], { x: 0, scale: 1 });
      } else {
        gsap.set(container, {
          clipPath: 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)',
          zIndex: 1,
        });
        gsap.set(innerImgs[i], { x: _getSlideOffset(), scale: 1 });
      }
    });

    // Panels & Typography
    panels.forEach((panel, i) => {
      const title = panel.querySelector('.tmw-ex-title');
      const meta  = panel.querySelector('.tmw-ex-meta');

      if (i === 0) {
        panel.classList.add('tmw-ex-panel--active');
        gsap.set(panel, { visibility: 'visible', opacity: 1, zIndex: 5, pointerEvents: 'auto' });
        if (title) gsap.set(title, { opacity: 1, y: 0, scale: 1, filter: 'none' });
        if (meta)  gsap.set(meta,  { opacity: 1, y: 0 });
      } else {
        panel.classList.remove('tmw-ex-panel--active');
        gsap.set(panel, { visibility: 'hidden', opacity: 0, zIndex: 1, pointerEvents: 'none' });
        if (title) gsap.set(title, { opacity: 0, y: 40, scale: 1, filter: F(30) });
        if (meta)  gsap.set(meta,  { opacity: 0, y: 15 });
      }
    });

    // Eyebrow & Counter
    gsap.set(eyebrow, { opacity: 0, y: 12 });
    if (counterEl) counterEl.textContent = `01 / 0${domainCount}`;
    progressDots.forEach((dot, i) => dot.classList.toggle('tmw-ex-dot--active', i === 0));
  }

  _setInitialStates();

  // Reset when navigating back via browser history
  window.addEventListener('pageshow', (event) => {
    _setInitialStates();
    if (activeDomainIndex > 0) _snapToDomain(activeDomainIndex);
  });

  // ─── Transition between domains ──────────────────────────────────────────
  function transitionTo(toIndex, fromIndex, onCompleteCallback) {
    if (toIndex === fromIndex || isTransitioning || isNavigating) return;

    isTransitioning = true;
    lastTransitionTime = Date.now();

    const direction   = toIndex > fromIndex ? 1 : -1;
    const slideOffset = _getSlideOffset();

    const outContainer = imageContainers[fromIndex];
    const outImg       = innerImgs[fromIndex];
    const inContainer  = imageContainers[toIndex];
    const inImg        = innerImgs[toIndex];

    const outPanel     = panels[fromIndex];
    const inPanel      = panels[toIndex];
    const outTitle     = outPanel?.querySelector('.tmw-ex-title');
    const outMeta      = outPanel?.querySelector('.tmw-ex-meta');
    const inTitle      = inPanel?.querySelector('.tmw-ex-title');
    const inMeta       = inPanel?.querySelector('.tmw-ex-meta');

    // Kill running tweens on active elements
    imageContainers.forEach(c => gsap.killTweensOf(c));
    innerImgs.forEach(img => gsap.killTweensOf(img));
    panels.forEach(p => {
      const t = p.querySelector('.tmw-ex-title');
      const m = p.querySelector('.tmw-ex-meta');
      if (t) gsap.killTweensOf(t);
      if (m) gsap.killTweensOf(m);
    });

    // 1. Establish z-index layers
    imageContainers.forEach((c, i) => {
      gsap.set(c, { zIndex: i === toIndex ? 3 : i === fromIndex ? 2 : 1 });
    });

    // 2. Prepare incoming image & container
    gsap.set(inImg, { x: direction * slideOffset, scale: 1 });
    gsap.set(inContainer, {
      clipPath: direction > 0
        ? 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)'
        : 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)',
    });

    // 3. Prepare incoming panel
    inPanel.classList.add('tmw-ex-panel--active');
    gsap.set(inPanel, { visibility: 'visible', opacity: 1, zIndex: 5, pointerEvents: 'auto' });
    outPanel.classList.remove('tmw-ex-panel--active');
    gsap.set(outPanel, { pointerEvents: 'none' });

    // Hide any other panel completely
    panels.forEach((p, idx) => {
      if (idx !== toIndex && idx !== fromIndex) {
        p.classList.remove('tmw-ex-panel--active');
        gsap.set(p, { visibility: 'hidden', opacity: 0, zIndex: 1, pointerEvents: 'none' });
      }
    });

    // ── Master timeline for coordinated motion ──
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(outPanel, { visibility: 'hidden', opacity: 0, zIndex: 1 });
        if (outContainer) {
          gsap.set(outContainer, {
            clipPath: direction > 0
              ? 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)'
              : 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)',
            zIndex: 1,
          });
        }

        activeDomainIndex = toIndex;
        setTimeout(() => {
          isTransitioning = false;
          if (onCompleteCallback) onCompleteCallback();
        }, 150);
      },
    });

    // Outgoing text animation: rapid clean exit without lingering
    if (outTitle) {
      tl.set(outTitle, { filter: F(0) }, 0);   // explicit start value (resting state is 'none')
      tl.to(outTitle, {
        y: -direction * 35,
        opacity: 0,
        filter: F(25),
        duration: 0.35,
        ease: 'power2.in',
      }, 0);
    }
    if (outMeta) {
      tl.to(outMeta, {
        opacity: 0,
        y: -direction * 12,
        duration: 0.25,
        ease: 'power2.in',
      }, 0);
    }

    // Image Wipe
    tl.to(inContainer, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      duration: 0.95,
      ease: HOP_EASE,
    }, 0.05);

    tl.to(inImg, {
      x: 0,
      duration: 0.95,
      ease: HOP_EASE,
    }, 0.05);

    tl.to(outImg, {
      x: -direction * slideOffset,
      duration: 0.95,
      ease: HOP_EASE,
    }, 0.05);

    // Incoming text animation: starts as outgoing has exited
    if (inTitle) {
      tl.fromTo(inTitle,
        { y: direction * 45, opacity: 0, filter: F(25), scale: 1 },
        { y: 0, opacity: 1, filter: F(0), scale: 1, duration: 0.75, ease: 'power3.out',
          onComplete: () => gsap.set(inTitle, { filter: 'none' }) },
        0.25
      );
    }
    if (inMeta) {
      tl.fromTo(inMeta,
        { y: direction * 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out' },
        0.35
      );
    }

    // Progress dots & counter
    progressDots.forEach((dot, i) => {
      dot.classList.toggle('tmw-ex-dot--active', i === toIndex);
    });
    if (counterEl) {
      counterEl.textContent = `0${toIndex + 1} / 0${domainCount}`;
    }
  }

  // ─── Instant snap to domain (for direct jumps / scroll entry) ─────────────
  function _snapToDomain(index) {
    isTransitioning = false;
    activeDomainIndex = index;
    const slideOffset = _getSlideOffset();

    imageContainers.forEach(c => gsap.killTweensOf(c));
    innerImgs.forEach(img => gsap.killTweensOf(img));

    imageContainers.forEach((container, i) => {
      if (i === index) {
        gsap.set(container, {
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          zIndex: 2,
        });
        gsap.set(innerImgs[i], { x: 0, scale: 1 });
      } else {
        gsap.set(container, {
          clipPath: i < index
            ? 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)'
            : 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)',
          zIndex: 1,
        });
        gsap.set(innerImgs[i], { x: i < index ? -slideOffset : slideOffset, scale: 1 });
      }
    });

    panels.forEach((panel, i) => {
      const title = panel.querySelector('.tmw-ex-title');
      const meta  = panel.querySelector('.tmw-ex-meta');

      if (i === index) {
        panel.classList.add('tmw-ex-panel--active');
        gsap.set(panel, { visibility: 'visible', opacity: 1, zIndex: 5, pointerEvents: 'auto' });
        if (title) gsap.set(title, { opacity: 1, y: 0, scale: 1, filter: 'none' });
        if (meta)  gsap.set(meta,  { opacity: 1, y: 0 });
      } else {
        panel.classList.remove('tmw-ex-panel--active');
        gsap.set(panel, { visibility: 'hidden', opacity: 0, zIndex: 1, pointerEvents: 'none' });
        if (title) gsap.set(title, { opacity: 0, y: 40, scale: 1, filter: F(30) });
        if (meta)  gsap.set(meta,  { opacity: 0, y: 15 });
      }
    });

    progressDots.forEach((dot, i) => {
      dot.classList.toggle('tmw-ex-dot--active', i === index);
    });
    if (counterEl) counterEl.textContent = `0${index + 1} / 0${domainCount}`;
  }

  // ─── Step Navigation Handlers ────────────────────────────────────────────
  function handleStepForward() {
    if (isTransitioning || isNavigating) return;

    if (activeDomainIndex < domainCount - 1) {
      transitionTo(activeDomainIndex + 1, activeDomainIndex);
    } else {
      exitToNextSection();
    }
  }

  function handleStepBackward() {
    if (isTransitioning || isNavigating) return;

    if (activeDomainIndex > 0) {
      transitionTo(activeDomainIndex - 1, activeDomainIndex);
    } else {
      exitToPrevSection();
    }
  }

  function exitToNextSection() {
    inExpertiseMode = false;
    if (lenis) lenis.start();

    const nextEl = document.getElementById('tmw-about') || document.getElementById('tmw-projects-chapter');
    if (nextEl) {
      if (lenis && typeof lenis.scrollTo === 'function') {
        lenis.scrollTo(nextEl, {
          duration: 1.2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });
      } else {
        nextEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  function exitToPrevSection() {
    inExpertiseMode = false;
    if (lenis) lenis.start();

    const heroEl = document.getElementById('tmw-hero');
    if (heroEl) {
      if (lenis && typeof lenis.scrollTo === 'function') {
        lenis.scrollTo(heroEl, {
          duration: 1.2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });
      } else {
        heroEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  // ─── Input Listeners (Wheel, Touch, Keydown) ─────────────────────────────
  function onWheel(e) {
    if (!inExpertiseMode || isNavigating) return;

    e.preventDefault();
    const now = Date.now();
    if (isTransitioning || now - lastTransitionTime < 300) return;

    if (e.deltaY > 15) {
      handleStepForward();
    } else if (e.deltaY < -15) {
      handleStepBackward();
    }
  }

  function onTouchStart(e) {
    if (!inExpertiseMode || isNavigating || !e.touches.length) return;
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
  }

  function onTouchMove(e) {
    if (!inExpertiseMode || isNavigating) return;
    e.preventDefault();
  }

  function onTouchEnd(e) {
    if (!inExpertiseMode || isNavigating || !e.changedTouches.length) return;

    const diffY = touchStartY - e.changedTouches[0].clientY;
    const diffX = touchStartX - e.changedTouches[0].clientX;
    const now   = Date.now();

    if (isTransitioning || now - lastTransitionTime < 300) return;

    if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 35) {
      if (diffY > 0) {
        handleStepForward();
      } else {
        handleStepBackward();
      }
    }
  }

  function onKeyDown(e) {
    if (!inExpertiseMode || isNavigating) return;

    if (['ArrowDown', 'PageDown', 'Space'].includes(e.code)) {
      e.preventDefault();
      handleStepForward();
    } else if (['ArrowUp', 'PageUp'].includes(e.code)) {
      e.preventDefault();
      handleStepBackward();
    }
  }

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('keydown', onKeyDown);

  // ─── Cinematic Entrance Animation on Department Click ───────────────────
  function triggerCinematicEntrance(index) {
    if (isTransitioning || isNavigating) return;
    isNavigating = true;

    const route = domainRoutes[index];
    if (!route) return;

    // Remember the department so Back returns to it, not to the top of the site.
    sessionStorage.setItem('tmw_return_domain', String(index));

    const activeImg = innerImgs[index];
    const activePanel = panels[index];
    const title = activePanel?.querySelector('.tmw-ex-title');
    const meta = activePanel?.querySelector('.tmw-ex-meta');
    const cta = activePanel?.querySelector('.tmw-ex-cta');

    // 1. Immediate interactive feedback
    if (cta) {
      cta.style.backgroundColor = 'var(--tmw-cream)';
      cta.style.color = 'var(--tmw-black)';
    }

    // 2. Cinematic zoom & portal effect
    const entranceTl = gsap.timeline({
      onComplete: () => {
        navigateTo(route);
      },
    });

    if (activeImg) {
      entranceTl.to(activeImg, {
        scale: 1.2,
        duration: 0.65,
        ease: 'power3.inOut',
      }, 0);
    }

    if (title) {
      entranceTl.set(title, { filter: F(0) }, 0);
      entranceTl.to(title, {
        scale: 1.08,
        y: -25,
        opacity: 0,
        filter: F(20),
        duration: 0.5,
        ease: 'power2.in',
      }, 0);
    }

    if (meta) {
      entranceTl.to(meta, {
        opacity: 0,
        y: 20,
        duration: 0.4,
        ease: 'power2.in',
      }, 0);
    }

    if (portalOverlay) {
      entranceTl.to(portalOverlay, {
        opacity: 1,
        duration: 0.6,
        ease: 'power2.inOut',
      }, 0.05);
    }
  }

  // ─── Click Navigation on Entire Department Screen ─────────────────────────
  panels.forEach((panel, index) => {
    panel.setAttribute('tabindex', '0');
    panel.setAttribute('role', 'button');
    panel.setAttribute('aria-label', `Explore ${EXPERTISE.domains[index]?.title || 'Department'}`);

    panel.addEventListener('click', () => {
      triggerCinematicEntrance(index);
    });

    panel.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerCinematicEntrance(index);
      }
    });
  });

  // ─── Scroll-driven switching (touch devices) ──────────────────────────────
  // Which banner a scroll progress (0–1) belongs to, with a little hysteresis so
  // hovering on a boundary doesn't flip back and forth.
  const bannerAt = (progress) => {
    const raw = progress * domainCount;
    let want = activeDomainIndex;
    if (raw > activeDomainIndex + 1.04)      want = Math.floor(raw - 0.04);
    else if (raw < activeDomainIndex - 0.04) want = Math.floor(raw + 0.04);
    return Math.max(0, Math.min(domainCount - 1, want));
  };
  // Plain (no hysteresis) lookup for when the section is entered at an arbitrary point.
  const bannerNow = (progress) => Math.max(0, Math.min(domainCount - 1, Math.floor(progress * domainCount)));
  let wantedIndex = 0;
  function syncToScroll() {
    if (isTransitioning || isNavigating || wantedIndex === activeDomainIndex) return;
    // Re-check once the transition ends: the user may have scrolled on meanwhile.
    transitionTo(wantedIndex, activeDomainIndex, () => {
      const st = ScrollTrigger.getById('tmw-expertise-trigger');
      if (st && st.isActive) wantedIndex = bannerAt(st.progress);
      syncToScroll();
    });
  }

  // ─── ScrollTrigger: Section Entry & Mode Activation ───────────────────────
  ScrollTrigger.create({
    id: 'tmw-expertise-trigger',
    trigger: section,
    start: 'top top',
    end: scrollDriven ? `+=${domainCount * 100}%` : '+=100%',
    pin: true,
    pinSpacing: true,

    onEnter: (self) => {
      gsap.to(eyebrow, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });
      _snapToDomain(returnIndex ?? (scrollDriven ? bannerNow(self.progress) : 0));
      returnIndex = null;
      wantedIndex = activeDomainIndex;
      if (scrollDriven) return;
      inExpertiseMode = true;
      lastTransitionTime = Date.now() + 250;
      if (lenis) lenis.stop();
    },

    onEnterBack: (self) => {
      gsap.to(eyebrow, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });
      _snapToDomain(scrollDriven ? bannerNow(self.progress) : 2);
      wantedIndex = activeDomainIndex;
      if (scrollDriven) return;
      inExpertiseMode = true;
      lastTransitionTime = Date.now() + 250;
      if (lenis) lenis.stop();
    },

    onUpdate: (self) => {
      if (!scrollDriven) return;
      wantedIndex = bannerAt(self.progress);
      syncToScroll();
    },

    onLeave: () => {
      inExpertiseMode = false;
      if (lenis) lenis.start();
    },

    onLeaveBack: () => {
      inExpertiseMode = false;
      gsap.to(eyebrow, { opacity: 0, y: 12, duration: 0.4, ease: 'power2.in' });
      if (lenis) lenis.start();
    },
  });

  // ─── Returning from /films, /brands or /sports ────────────────────────────
  // Jump straight to the department the visitor came from (after the final
  // ScrollTrigger refresh in main.js has measured the page).
  if (returnIndex !== null && lenis) {
    requestAnimationFrame(() => {
      const st = ScrollTrigger.getById('tmw-expertise-trigger');
      if (!st) return;
      // Scroll-driven: land in the middle of that banner's share of the pin.
      const target = scrollDriven
        ? st.start + ((returnIndex + 0.5) / domainCount) * (st.end - st.start)
        : st.start + 1;
      lenis.scrollTo(target, { immediate: true, force: true });
      ScrollTrigger.update();
    });
  }

  // Global escape / external navigation unlock
  window.TMW_unlockExpertise = () => {
    inExpertiseMode = false;
    if (lenis) lenis.start();
  };

  document.querySelectorAll('.tmw-nav-menu-link, .tmw-menu-toggle').forEach(el => {
    el.addEventListener('click', () => {
      if (window.TMW_unlockExpertise) window.TMW_unlockExpertise();
    });
  });
}

// ─── Reduced-motion fallback ──────────────────────────────────────────────────
function _setupReducedMotion(section) {
  section.querySelectorAll('.tmw-ex-panel').forEach((panel, i) => {
    panel.style.visibility = i === 0 ? 'visible' : 'hidden';
    panel.style.opacity = i === 0 ? '1' : '0';
    panel.style.pointerEvents = i === 0 ? 'auto' : 'none';
  });
  section.querySelectorAll('.tmw-ex-img').forEach((container, i) => {
    container.style.clipPath = i === 0 ? 'none' : 'polygon(0 0, 0 0, 0 0, 0 0)';
    container.style.zIndex   = i === 0 ? '2' : '1';
  });
  const eyebrow = section.querySelector('.tmw-ex-eyebrow');
  if (eyebrow) eyebrow.style.opacity = '1';
}
