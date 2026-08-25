/**
 * NavbarSection.js — Primary Navigation Component for Tubelight Media Works.
 *
 * Adapted faithfully from the purchased navbar component.
 * All selectors scoped to .tmw-menu-* and .tmw-nav-* to avoid global collisions.
 *
 * ── SCROLL & INTERACTION ARCHITECTURE ──────────────────────────────────
 * Reuses the single global Lenis instance from HeroSection.js.
 * When internal anchor links are clicked:
 *   1. Closes the SVG wave overlay smoothly.
 *   2. Invokes lenis.scrollTo(targetEl) with natural easing.
 *   3. Restores accessibility states and focus.
 *
 * ── REVEAL COORDINATION ────────────────────────────────────────────────
 * Toggle button stays hidden (opacity: 0) during the initial WebGL reveal
 * mask, and reveals via `revealNavbar()` once the loader resolves.
 */

import gsap from 'gsap';

export function initNavbar(lenis) {
  const toggle    = document.getElementById('tmw-menu-toggle');
  const menu      = document.getElementById('tmw-nav-menu');
  const overlay   = document.querySelector('.tmw-nav-overlay');
  const menuLinks = document.querySelectorAll('.tmw-nav-menu-link');

  if (!toggle || !menu || !overlay) {
    console.warn('[TMW] NavbarSection: required elements not found — skipping init.');
    return { revealNavbar: () => {} };
  }

  // ── Initial GSAP States ──────────────────────────────────────────────
  gsap.set(menu, { visibility: 'hidden' });
  gsap.set(menuLinks, { top: '100%' });

  // ── Main Wave Overlay & Menu Reveal Timeline ─────────────────────────
  const tl = gsap.timeline({ paused: true });

  tl
    /* 1. SVG wave overlay slides down across the viewport */
    .to(overlay, {
      y:        0,
      duration: 1.2,
      ease:     'power3.inOut',
    }, 0)

    /* 2. Reveal menu container right as wave covers the screen */
    .set(menu, { visibility: 'visible' }, 0.55)
    .call(() => menu.classList.add('is-open'), null, 0.55)

    /* 3. Staggered reveal of menu items sliding up from clips */
    .to(menuLinks, {
      top:      0,
      duration: 0.9,
      stagger:  0.07,
      ease:     'power3.out',
    }, 0.6);

  // ── Menu Open / Close Controllers ────────────────────────────────────
  function closeMenu() {
    toggle.classList.remove('is-active');
    toggle.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    menu.classList.remove('is-open');
    tl.reverse();
  }

  function openMenu() {
    toggle.classList.add('is-active');
    toggle.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
    tl.play();
  }

  // Toggle click
  toggle.addEventListener('click', () => {
    const isOpen = !tl.reversed() && tl.progress() > 0;
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !tl.reversed() && tl.progress() > 0) {
      closeMenu();
    }
  });

  // ── Smooth Navigation with Global Lenis ───────────────────────────────
  menuLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      link.addEventListener('click', (e) => {
        e.preventDefault();

        const targetEl = document.querySelector(href);
        closeMenu();

        if (targetEl) {
          // Slight delay to let the wave start reversing for seamless cinema feel
          setTimeout(() => {
            if (lenis && typeof lenis.scrollTo === 'function') {
              lenis.scrollTo(targetEl, {
                offset:   0,
                duration: 1.5,
                easing:   (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
              });
            } else {
              window.scrollTo({
                top:      targetEl.offsetTop,
                behavior: 'smooth',
              });
            }
          }, 350);
        }
      });
    }
  });

  // ── Coordinated Entrance Method ──────────────────────────────────────
  function revealNavbar() {
    toggle.classList.add('is-ready');
  }

  return { revealNavbar };
}
