/**
 * PhotoDumpSection.js — Scroll-driven 3D perspective grid interlude.
 * Tubelight Media Works.
 *
 * ── ORIGIN ──────────────────────────────────────────────────────────────
 * Adapted from the purchased "Scroll3DGrid" component.
 * Original: independent Lenis + GSAP + ScrollTrigger standalone.
 * Integration: all scroll infrastructure stripped; uses the existing
 * global Lenis instance (established in HeroSection.js) and the existing
 * GSAP / ScrollTrigger registration. No new Lenis, no new RAF loop.
 *
 * ── RELIABILITY ARCHITECTURE ────────────────────────────────────────────
 * THE STUCK/STATIC BUG — ROOT CAUSE AND FIX:
 *
 * The original version initialized ScrollTrigger instances at module load
 * time, before grid images had loaded and settled layout. This caused
 * ScrollTrigger to measure element positions against an unstable DOM,
 * producing wrong trigger offsets. On the next ScrollTrigger.refresh()
 * (triggered by AboutSection.js), the triggers recalculated but the
 * timelines already had baked random() values — so GSAP tried to scrub
 * timelines whose position references were now inconsistent.
 *
 * FIX STRATEGY:
 * 1. invalidateOnRefresh: true  — forces GSAP to re-evaluate all tween
 *    values (including functions) on every ScrollTrigger.refresh(). This
 *    means random() values ARE re-evaluated after each resize/refresh,
 *    ensuring the from/to states always match the current layout.
 *
 * 2. Trigger cleanup: all Photo Dump triggers are prefixed 'tmw-pd-' and
 *    killed cleanly on resize before rebuild. This prevents trigger
 *    accumulation (a common cause of stuck timelines).
 *
 * 3. Deferred init: we wait one rAF tick after main.js calls us before
 *    building triggers. This guarantees the browser has painted the full
 *    page layout including all preceding pinned sections (Hero, About,
 *    Projects) whose GSAP spacers affect Photo Dump's scroll position.
 *
 * 4. ScrollTrigger.refresh() at end of initPhotoDumpSection() — ensures
 *    Photo Dump's triggers are registered against the final, stable page
 *    height that includes all GSAP pin spacers above it.
 *
 * ── SCROLL SYSTEM ───────────────────────────────────────────────────────
 * All ScrollTrigger instances are prefixed 'tmw-pd-' for targeted kill.
 * scrub: true timelines are BIDIRECTIONAL — reverse scroll naturally
 * reverses the timeline without any extra logic needed.
 *
 * ── RESPONSIVE ──────────────────────────────────────────────────────────
 * gsap.matchMedia() gates desktop vs mobile animation distances.
 * Mobile uses tighter scroll ranges (start/end) so animation feels
 * responsive without requiring excessive scrolling.
 *
 * ── REDUCED MOTION ──────────────────────────────────────────────────────
 * If prefers-reduced-motion is set, all ScrollTrigger animations are
 * bypassed. Section opacity is set to 1 (CSS fallback handles the rest).
 */

import gsap             from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// ScrollTrigger is already registered by main.js; re-registering is a no-op.
gsap.registerPlugin(ScrollTrigger);

// ── Utility: grid row/column helper (ported from utils.js) ─────────────
function getGrid(gridItems) {
  let elements = gsap.utils.toArray(gridItems);
  let bounds;

  const getSubset = (axis, dimension, alternating, merge) => {
    let a = [], subsets = {}, onlyEven = alternating === 'even', p;
    bounds.forEach((b, i) => {
      let position = Math.round(b[axis] + b[dimension] / 2);
      let subset   = subsets[position];
      subset || (subsets[position] = subset = []);
      subset.push(elements[i]);
    });
    for (p in subsets) a.push(subsets[p]);
    if (onlyEven || alternating === 'odd') {
      a = a.filter((_, i) => !(i % 2) === onlyEven);
    }
    if (merge) {
      let a2 = [];
      a.forEach(subset => a2.push(...subset));
      return a2;
    }
    return a;
  };

  elements.refresh = () => bounds = elements.map(el => el.getBoundingClientRect());
  elements.columns = (alternating, merge) => getSubset('left',  'width',  alternating, merge);
  elements.rows    = (alternating, merge) => getSubset('top',   'height', alternating, merge);
  elements.refresh();
  return elements;
}

// ── Animation definitions ────────────────────────────────────────────────
// KEY: invalidateOnRefresh:true forces GSAP to re-evaluate all function-
// based values (gsap.utils.random()) on every ScrollTrigger.refresh().
// This guarantees from/to values stay consistent with current layout
// and eliminates the primary cause of the stuck animation bug.
function applyAnimation(grid, animationType, isMobile) {
  const gridWrap       = grid.querySelector('.tmw-pd-grid-wrap');
  const gridItems      = grid.querySelectorAll('.tmw-pd-grid-item');
  const gridItemsInner = [...gridItems].map(item => item.querySelector('.tmw-pd-grid-item-inner'));

  // Mobile: much tighter scroll window (30% offset vs desktop 5%) so the
  // animation plays faster relative to user's swipe — more visual per scroll.
  // Desktop: full viewport traversal for cinematic pacing.
  const startOffset = isMobile ? 'top bottom+=30%' : 'top bottom+=5%';
  const endOffset   = isMobile ? 'bottom top-=30%' : 'bottom top-=5%';

  const timeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      id:                 `tmw-pd-grid-${grid.dataset.gridIndex}`,
      trigger:            gridWrap,
      start:              startOffset,
      end:                endOffset,
      scrub:              true,
      invalidateOnRefresh: true,  // ← KEY FIX: re-evaluates random() on refresh
    },
  });

  switch (animationType) {
    case 'type1':
      grid.style.setProperty('--tmw-pd-perspective', '1000px');
      grid.style.setProperty('--tmw-pd-inner-scale', '0.5');
      timeline
        .set(gridWrap, { rotationY: 25 })
        .set(gridItems, { z: () => gsap.utils.random(-1600, 200) })
        // xPercent tightened from ±500–1000 → ±100–250.
        // At ±1000 items were 10× their cell-width off-screen, visible
        // only near xPercent≈0. Now they start just off-screen and spend
        // the majority of the animation crossing through the visible area.
        .fromTo(gridItems,
          { xPercent: () => gsap.utils.random(-250, -100) },
          { xPercent: () => gsap.utils.random( 100,  250) }, 0)
        .fromTo(gridItemsInner, { scale: 2 }, { scale: 0.5 }, 0);
      break;

    case 'type2':
      grid.style.setProperty('--tmw-pd-grid-width',  '160%');
      grid.style.setProperty('--tmw-pd-perspective', '2000px');
      grid.style.setProperty('--tmw-pd-inner-scale', '0.5');
      grid.style.setProperty('--tmw-pd-item-ratio',  '0.8');
      grid.style.setProperty('--tmw-pd-columns',     '6');
      grid.style.setProperty('--tmw-pd-gap',         '14vw');
      timeline
        .set(gridWrap, { rotationX: 20 })
        .set(gridItems, { z: () => gsap.utils.random(-3000, -1000) })
        // yPercent tightened from 100–1000 → 25–150 (and reverse).
        // At ±1000 the items were 10× their cell-height above/below —
        // far outside their overflow:hidden cells — leaving only the
        // floating title visible on black. Now items sweep vertically
        // but spend most of the animation crossing through the visible
        // portion of their cell (roughly yPercent −80 to +80).
        .fromTo(gridItems,
          { yPercent: () => gsap.utils.random(25, 150), rotationY: -45, filter: 'brightness(200%)' },
          { ease: 'power2', yPercent: () => gsap.utils.random(-150, -25), rotationY: 45, filter: 'brightness(0%)' }, 0)
        .fromTo(gridWrap,
          { rotationZ: -5 },
          { rotationX: -20, rotationZ: 10, scale: 1.2 }, 0)
        .fromTo(gridItemsInner, { scale: 2 }, { scale: 0.5 }, 0);
      break;

    case 'type3':
      grid.style.setProperty('--tmw-pd-grid-width',  '105%');
      grid.style.setProperty('--tmw-pd-columns',     '8');
      grid.style.setProperty('--tmw-pd-perspective', '1500px');
      grid.style.setProperty('--tmw-pd-inner-scale', '0.5');
      timeline
        .set(gridItems, {
          transformOrigin: '50% 0%',
          z:               () => gsap.utils.random(-5000, -2000),
          rotationX:       () => gsap.utils.random(-65, -25),
          filter:          'brightness(0%)',
        })
        .to(gridItems, {
          xPercent:  () => gsap.utils.random(-150, 150),
          yPercent:  () => gsap.utils.random(-300, 300),
          rotationX: 0,
          filter:    'brightness(200%)',
        }, 0)
        .to(gridWrap, { z: 6500 }, 0)
        .fromTo(gridItemsInner, { scale: 2 }, { scale: 0.5 }, 0);
      break;

    case 'type4':
      grid.style.setProperty('--tmw-pd-grid-width', '50%');
      grid.style.setProperty('--tmw-pd-perspective','3000px');
      grid.style.setProperty('--tmw-pd-item-ratio', '0.8');
      grid.style.setProperty('--tmw-pd-columns',    '3');
      grid.style.setProperty('--tmw-pd-gap',        '1vw');
      timeline
        .set(gridWrap, { transformOrigin: '0% 50%', rotationY: 30, xPercent: -75 })
        .set(gridItems, { transformOrigin: '50% 0%' })
        .to(gridItems, { duration: 0.5, ease: 'power2',    z: 500, stagger: 0.04 }, 0)
        .to(gridItems, { duration: 0.5, ease: 'power2.in', z: 0,   stagger: 0.04 }, 0.5)
        .fromTo(gridItems,
          { rotationX: -70, filter: 'brightness(120%)' },
          { duration: 1, rotationX: 70, filter: 'brightness(0%)', stagger: 0.04 }, 0);
      break;

    case 'type5':
      grid.style.setProperty('--tmw-pd-grid-width', '120%');
      grid.style.setProperty('--tmw-pd-columns',    '8');
      grid.style.setProperty('--tmw-pd-gap',        '0');
      {
        const gridObj = getGrid(gridItems);
        timeline
          .set(gridWrap, { rotationX: 50 })
          .to(gridWrap, { rotationX: 30 })
          .fromTo(gridItems, { filter: 'brightness(0%)' }, { filter: 'brightness(100%)' }, 0)
          .to(gridObj.rows('even'), { xPercent: -100, ease: 'power1' }, 0)
          .to(gridObj.rows('odd'),  { xPercent:  100, ease: 'power1' }, 0)
          .addLabel('rowsEnd', '>-=0.15')
          .to(gridItems, { ease: 'power1', yPercent: () => gsap.utils.random(-100, 200) }, 'rowsEnd');
      }
      break;

    default:
      break;
  }
}

// ── Core builder — called at init and on resize ──────────────────────────
function buildPhotoDumpTriggers(section) {
  // Kill any existing Photo Dump triggers before rebuilding.
  // This prevents trigger accumulation on resize, which is a major
  // cause of the stuck animation state.
  ScrollTrigger.getAll()
    .filter(t => String(t.vars?.id || '').startsWith('tmw-pd-'))
    .forEach(t => t.kill());

  // Clear only the transform/filter properties that GSAP sets via animations.
  // We must NOT use clearProps:'all' here because grid-item-inner elements
  // have background-image set as inline HTML attributes — clearProps:'all'
  // would strip those and make the images disappear.
  const transformProps = 'transform,filter,opacity,x,y,z,rotationX,rotationY,rotationZ,scale,xPercent,yPercent';
  section.querySelectorAll('.tmw-pd-grid-wrap').forEach(el => gsap.set(el, { clearProps: transformProps }));
  section.querySelectorAll('.tmw-pd-grid-item').forEach(el => gsap.set(el, { clearProps: transformProps }));
  section.querySelectorAll('.tmw-pd-grid-item-inner').forEach(el => gsap.set(el, { clearProps: 'transform,scale' }));

  // Detect mobile breakpoint for responsive animation distances.
  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  // Apply animation per grid
  const animationTypes = ['type1', 'type2', 'type3', 'type4', 'type5'];
  const grids = section.querySelectorAll('.tmw-pd-grid');
  grids.forEach((grid, i) => {
    grid.dataset.gridIndex = i;
    applyAnimation(grid, animationTypes[i % animationTypes.length], isMobile);
  });

  // Section entrance: fade in from overlap with Project End.
  // scrub:true means this reverses naturally on upward scroll.
  gsap.fromTo(section,
    { opacity: 0 },
    {
      opacity: 1,
      ease:    'none',
      scrollTrigger: {
        id:                  'tmw-pd-entrance',
        trigger:             section,
        start:               'top 95%',
        end:                 'top 50%',
        scrub:               true,
        invalidateOnRefresh: true,
      },
    }
  );

  // Eyebrow label reveal — scrubbed so it works in both directions.
  const eyebrow = section.querySelector('.tmw-pd-eyebrow');
  if (eyebrow) {
    gsap.fromTo(eyebrow,
      { opacity: 0, y: 20 },
      {
        opacity: 0.5,
        y:       0,
        ease:    'none',
        scrollTrigger: {
          id:                  'tmw-pd-eyebrow',
          trigger:             eyebrow,
          start:               'top 85%',
          end:                 'top 55%',
          scrub:               true,
          invalidateOnRefresh: true,
        },
      }
    );
  }
}

// ── Public initialiser ────────────────────────────────────────────────────
export function initPhotoDumpSection() {
  const section = document.getElementById('tmw-photo-dump');
  if (!section) {
    console.warn('[TMW] PhotoDumpSection: #tmw-photo-dump not found — skipping.');
    return;
  }

  // Reduced-motion: set visible immediately, skip all scroll animation.
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    gsap.set(section, { opacity: 1 });
    return;
  }

  // ── Deferred initialization ──────────────────────────────────────────
  // Wait one rAF tick before building triggers. This ensures:
  // - Hero, About, and Projects pin spacers are fully inserted into the DOM
  // - The browser has laid out the complete page height
  // - ScrollTrigger measures Photo Dump's position against the FINAL layout
  // Without this deferral, ScrollTrigger can calculate trigger positions
  // against the pre-spacer page height and fire at incorrect scroll values.
  requestAnimationFrame(() => {
    buildPhotoDumpTriggers(section);

    // Final refresh: re-measures all trigger positions with stable layout.
    // This is separate from the global refresh in main.js because Photo Dump
    // deferred its init by one rAF — the global refresh already fired.
    ScrollTrigger.refresh();
  });

  // ── Debounced resize: rebuild triggers cleanly ───────────────────────
  // On resize, clear all pd triggers + rebuild with new viewport dimensions.
  // The clearProps in buildPhotoDumpTriggers() prevents stale inline
  // transform values from conflicting with the re-initialized animations.
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      buildPhotoDumpTriggers(section);
      ScrollTrigger.refresh();
    }, 250);
  });
}
