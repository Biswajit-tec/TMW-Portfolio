/**
 * PageTransition.js — Shared Cinematic Page Transition Controller
 * Tubelight Media Works · Adapted from provided Page Transition component
 *
 * Implements:
 *   - 20-column staggered shutter overlay
 *   - Signature brand insignia SVG path-draw & fill animation
 *   - Staggered reverse reveal on destination page load
 *   - Safe browser history (popstate / pageshow) reset & unmount cleanup
 */

import gsap from 'gsap';

let isTransitioning = false;
let overlayEl = null;
let logoOverlayEl = null;
let logoPathEl = null;
let blocks = [];
let pathLength = 0;
let revealTimeout = null;

function ensureElements() {
  if (overlayEl && logoOverlayEl) return;

  // 1. Shutter Overlay
  overlayEl = document.querySelector('.tmw-transition-overlay');
  if (!overlayEl) {
    overlayEl = document.createElement('div');
    overlayEl.className = 'tmw-transition-overlay';
    document.body.appendChild(overlayEl);
  }

  overlayEl.innerHTML = '';
  blocks = [];
  for (let i = 0; i < 20; i++) {
    const block = document.createElement('div');
    block.className = 'tmw-transition-block';
    overlayEl.appendChild(block);
    blocks.push(block);
  }

  // 2. Logo Overlay
  logoOverlayEl = document.querySelector('.tmw-logo-overlay');
  if (!logoOverlayEl) {
    logoOverlayEl = document.createElement('div');
    logoOverlayEl.className = 'tmw-logo-overlay';
    logoOverlayEl.innerHTML = `
      <div class="tmw-logo-container">
        <svg class="tmw-logo-svg" width="130" height="130" viewBox="-4 -4 133 136" fill="none">
          <path
            class="tmw-logo-path"
            d="M82.6306 0C79.8604 5.32092 74.9984 15.6531 72.43 24.0313C80.497 18.2644 89.0129 13.5149 97.6896 10.449C93.9825 17.5694 87.0092 32.5146 84.7598 42.5941C93.0521 37.1488 101.702 32.6834 110.474 29.7215C105.427 39.0923 95.1513 60.5111 94.4257 71.2193C83.5883 74.5743 52.906 88.8011 18.5906 118.443C25.5824 101.301 45.556 73.6638 70.6591 53.0204C57.6282 59.6057 38.4488 71.4317 17.8355 89.7486C22.896 76.8262 36.1412 57.0952 53.4438 40.1036C42.5167 46.1741 28.2058 55.6353 13 69.1471C20.7367 49.3908 50.4126 11.3841 82.6306 0Z"
            fill="none"
            stroke="#dcdbd5"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <div class="tmw-logo-brand">Tubelight Media Works</div>
    `;
    document.body.appendChild(logoOverlayEl);
  }

  logoPathEl = logoOverlayEl.querySelector('.tmw-logo-path');
  if (logoPathEl) {
    pathLength = logoPathEl.getTotalLength ? logoPathEl.getTotalLength() : 450;
    gsap.set(logoPathEl, {
      strokeDasharray: pathLength,
      strokeDashoffset: pathLength,
      fill: 'transparent',
    });
  }
}

export function initPageTransition() {
  ensureElements();

  const isTransitioningFromPrev = sessionStorage.getItem('tmw_transition') === 'true';

  if (isTransitioningFromPrev) {
    sessionStorage.removeItem('tmw_transition');
    revealPage();
  } else {
    // If loaded freshly / directly, ensure overlay is invisible and blocks scaled to 0
    gsap.set(blocks, { scaleX: 0 });
    gsap.set(logoOverlayEl, { opacity: 0 });
    if (overlayEl) overlayEl.style.pointerEvents = 'none';
    if (logoOverlayEl) logoOverlayEl.style.pointerEvents = 'none';
  }

  // Handle browser back/forward (bfcache recovery)
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      resetTransition();
    }
  });

  window.addEventListener('popstate', () => {
    resetTransition();
  });
}

export function revealPage() {
  ensureElements();

  if (revealTimeout) {
    clearTimeout(revealTimeout);
  }

  // Start with blocks fully covering screen from right
  gsap.set(blocks, { scaleX: 1, transformOrigin: 'right' });
  gsap.set(logoOverlayEl, { opacity: 0 });

  gsap.to(blocks, {
    scaleX: 0,
    duration: 0.45,
    stagger: 0.02,
    ease: 'power2.out',
    transformOrigin: 'right',
    onComplete: () => {
      isTransitioning = false;
      if (overlayEl) overlayEl.style.pointerEvents = 'none';
      if (logoOverlayEl) logoOverlayEl.style.pointerEvents = 'none';
    },
  });

  // Safety fallback
  revealTimeout = setTimeout(() => {
    if (blocks.length > 0) {
      const firstBlock = blocks[0];
      if (firstBlock && gsap.getProperty(firstBlock, 'scaleX') > 0) {
        gsap.to(blocks, {
          scaleX: 0,
          duration: 0.2,
          ease: 'power2.out',
          transformOrigin: 'right',
          onComplete: () => {
            isTransitioning = false;
            if (overlayEl) overlayEl.style.pointerEvents = 'none';
            if (logoOverlayEl) logoOverlayEl.style.pointerEvents = 'none';
          },
        });
      }
    }
  }, 900);
}

export function navigateTo(url) {
  if (isTransitioning) return;
  isTransitioning = true;

  ensureElements();

  if (overlayEl) overlayEl.style.pointerEvents = 'auto';
  if (logoOverlayEl) logoOverlayEl.style.pointerEvents = 'auto';

  sessionStorage.setItem('tmw_transition', 'true');

  const tl = gsap.timeline({
    onComplete: () => {
      window.location.href = url;
    },
  });

  // 1. Shutter blocks scale from left
  tl.to(blocks, {
    scaleX: 1,
    duration: 0.42,
    stagger: 0.02,
    ease: 'power2.out',
    transformOrigin: 'left',
  })
  // 2. Logo overlay fades in
  .to(logoOverlayEl, {
    opacity: 1,
    duration: 0.25,
    ease: 'power2.out',
  }, '-=0.18')
  // 3. Reset path for draw
  .set(logoPathEl, {
    strokeDashoffset: pathLength,
    fill: 'transparent',
  }, '-=0.2')
  // 4. Animate SVG stroke draw
  .to(logoPathEl, {
    strokeDashoffset: 0,
    duration: 1.1,
    ease: 'power2.inOut',
  }, '-=0.15')
  // 5. Fill logo with warm brand cream
  .to(logoPathEl, {
    fill: '#dcdbd5',
    duration: 0.4,
    ease: 'power2.out',
  }, '-=0.2')
  // 6. Hold for a moment to let the viewer absorb the emblem
  .to({}, { duration: 0.25 });
}

export function resetTransition() {
  isTransitioning = false;
  if (revealTimeout) clearTimeout(revealTimeout);
  if (blocks.length) {
    gsap.set(blocks, { scaleX: 0 });
  }
  if (logoOverlayEl) {
    gsap.set(logoOverlayEl, { opacity: 0 });
    logoOverlayEl.style.pointerEvents = 'none';
  }
  if (overlayEl) {
    overlayEl.style.pointerEvents = 'none';
  }
  sessionStorage.removeItem('tmw_transition');
}

