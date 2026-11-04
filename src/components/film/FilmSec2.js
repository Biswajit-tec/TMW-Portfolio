/**
 * FilmSec2.js — Chapter II Sticky Grid Scroll Controller
 * Tubelight Media Works · Moving Image & Narrative Film Archive
 *
 * Implements:
 *   - 3-column converging grid entrance (alternating directional stagger)
 *   - Central aperture zoom & split expansion
 *   - Continuous scrubbed editorial content reveal through grid center
 *   - 100% reversible scrub with zero brittle callbacks
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initFilmSec2() {
  const sec2 = document.querySelector('.film-sec2');
  if (!sec2) return;

  const stickyBlock = sec2.querySelector('.film-sec2__block-main');
  const wrapper = sec2.querySelector('.film-sec2__wrapper');
  const grid = sec2.querySelector('.film-sec2__grid');
  const items = gsap.utils.toArray('.film-sec2__item');
  const content = sec2.querySelector('.film-sec2__content');
  const eyebrow = sec2.querySelector('.film-sec2__eyebrow');
  const title = sec2.querySelector('.film-sec2__title');
  const desc = sec2.querySelector('.film-sec2__description');
  const actions = sec2.querySelector('.film-sec2__actions');
  const intro = sec2.querySelector('.film-sec2__intro');

  if (intro) {
    gsap.fromTo(intro,
      { y: 45, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: intro,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      }
    );
  }

  if (!stickyBlock || !grid || !items.length) return;

  // 1. Group items into 3 columns
  const numColumns = 3;
  const columns = Array.from({ length: numColumns }, () => []);
  items.forEach((item, index) => {
    columns[index % numColumns].push(item);
  });

  // 2. Initial GSAP states
  gsap.set(content, { autoAlpha: 0 });
  if (eyebrow) gsap.set(eyebrow, { y: 15, opacity: 0 });
  if (title) gsap.set(title, { y: 30, opacity: 0 });
  if (desc) gsap.set(desc, { y: 20, opacity: 0 });
  if (actions) gsap.set(actions, { y: 15, opacity: 0 });

  // 3. Parallax entrance for the sticky block wrapper
  if (wrapper) {
    gsap.fromTo(wrapper,
      { yPercent: -15 },
      {
        yPercent: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: stickyBlock,
          start: 'top bottom',
          end: 'top top',
          scrub: true,
        },
      }
    );
  }

  // 4. Master scrubbed timeline for the sticky grid & aperture content
  const windowH = window.innerHeight;
  const dy = windowH * 0.9;

  const gridTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: stickyBlock,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
      invalidateOnRefresh: true,
    },
  });

  // ── Phase A: Grid Convergence from Viewport Edges (0.00 -> 0.45) ──
  // Column 0 (left) and Column 2 (right) slide from top
  // Column 1 (center) slides from bottom
  columns.forEach((column, colIndex) => {
    const fromTop = colIndex % 2 === 0;
    gridTimeline.fromTo(
      column,
      { y: () => window.innerHeight * 0.9 * (fromTop ? -1 : 1) },
      {
        y: 0,
        stagger: {
          each: 0.05,
          from: fromTop ? 'end' : 'start',
        },
        duration: 0.45,
        ease: 'power2.out',
      },
      0
    );
  });

  // ── Phase B: Grid Zoom & Aperture Split (0.42 -> 0.82) ──
  // Grid zooms out 2.15x
  gridTimeline.to(grid, {
    scale: 2.15,
    duration: 0.4,
    ease: 'power3.inOut',
  }, 0.42);

  // Column 0 drifts left, Column 2 drifts right
  gridTimeline.to(columns[0], {
    xPercent: -48,
    duration: 0.4,
    ease: 'power3.inOut',
  }, 0.42);

  gridTimeline.to(columns[2], {
    xPercent: 48,
    duration: 0.4,
    ease: 'power3.inOut',
  }, 0.42);

  // Center column items split apart vertically (top half goes up, bottom half goes down)
  const centerColLen = columns[1].length;
  gridTimeline.to(columns[1], {
    yPercent: (index) => (index < Math.floor(centerColLen / 2) ? -55 : 55),
    opacity: 0.25,
    duration: 0.35,
    ease: 'power2.inOut',
  }, 0.45);

  // Dim outer columns slightly to focus on center content
  gridTimeline.to([columns[0], columns[2]], {
    opacity: 0.3,
    duration: 0.35,
    ease: 'power2.inOut',
  }, 0.45);

  // ── Phase C: Editorial Content Reveal through Central Opening (0.60 -> 1.00) ──
  gridTimeline.to(content, {
    autoAlpha: 1,
    duration: 0.2,
    ease: 'power2.out',
  }, 0.6);

  if (eyebrow) {
    gridTimeline.to(eyebrow, {
      y: 0,
      opacity: 1,
      duration: 0.22,
      ease: 'power2.out',
    }, 0.62);
  }

  if (title) {
    gridTimeline.to(title, {
      y: 0,
      opacity: 1,
      duration: 0.28,
      ease: 'power3.out',
    }, 0.66);
  }

  if (desc) {
    gridTimeline.to(desc, {
      y: 0,
      opacity: 1,
      duration: 0.25,
      ease: 'power2.out',
    }, 0.72);
  }

  if (actions) {
    gridTimeline.to(actions, {
      y: 0,
      opacity: 1,
      duration: 0.22,
      ease: 'power2.out',
    }, 0.78);
  }

  // Settle at 1.0
  gridTimeline.to({}, { duration: 0.08 });

  return gridTimeline;
}
