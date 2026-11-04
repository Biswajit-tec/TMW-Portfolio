/**
 * resize.js — one coordinated "layout changed" handler for every section that has to
 * rebuild its ScrollTriggers (About, Project, Project End, Photo Dump, Footer).
 *
 * Why this exists: each section used to rebuild itself on its own resize timer. That
 * caused two real bugs on phones:
 *
 *  1. Mobile browsers fire `resize` whenever the address bar collapses or re-appears —
 *     i.e. while scrolling, and most of all when the scroll direction reverses. Every
 *     section tore itself down and rebuilt mid-gesture: visible snapping/flashing.
 *  2. ScrollTrigger measures triggers in creation order, and pin spacers push everything
 *     below them down. Independent rebuilds recreated the triggers out of document order,
 *     so the photo dump was measured *before* the pins above it existed: its start/end
 *     moved ~5000 px too early, every grid reported "finished" (progress 1) and the photo
 *     dump became a frozen, static image wall.
 *
 * Rules enforced here:
 *  • On touch devices a height-only change is just the address bar — ignore it entirely.
 *    (Width changes — rotation, split view — still rebuild.)
 *  • When a rebuild is needed, run every registered rebuild in registration order
 *    (= document order, since sections are initialised top to bottom), then refresh once.
 */
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { perf } from './perf.js';

const rebuilders = [];
let appliedW = window.innerWidth;
let appliedH = window.innerHeight;
let timer = 0;

/** Register a section's "rebuild my triggers" callback. Call order = document order. */
export function onLayoutChange(fn) {
  rebuilders.push(fn);
}

/** Has the viewport changed in a way that matters since the sections were last built? */
function needsRebuild() {
  if (window.innerWidth !== appliedW) return true;   // rotation, split view, window resize
  if (perf.touch) return false;                      // touch: height-only change = address bar
  return window.innerHeight !== appliedH;            // desktop: pin lengths depend on height
}

function rebuildAll() {
  if (!needsRebuild()) return;
  appliedW = window.innerWidth;
  appliedH = window.innerHeight;
  rebuilders.forEach((fn) => {
    try { fn(); } catch (err) { console.warn('[TMW] layout rebuild failed', err); }
  });
  ScrollTrigger.refresh();
}

function onViewportEvent() {
  clearTimeout(timer);
  if (!needsRebuild()) return;
  timer = setTimeout(rebuildAll, 280);
}

window.addEventListener('resize', onViewportEvent);
window.addEventListener('orientationchange', onViewportEvent);
