/**
 * perf.js — device tiering + shared scroll setup.
 *
 * `perf.low` is true on weak hardware (≤4 GB RAM, ≤4 cores, Data Saver) or
 * when a short frame-rate probe measures a slow device. Heavy effects (WebGL
 * dissolve, blur filters, backdrop-filter, per-item filters) check it and
 * fall back to cheap equivalents. <html data-perf="low|high"> mirrors it so
 * CSS can do the same.
 */
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';   // stopped/smooth state rules (lenis.stop() didn't actually lock scrolling without it)
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const nav = navigator;
const touch = window.matchMedia('(pointer: coarse)').matches;
const weak =
  (nav.deviceMemory && nav.deviceMemory <= 4) ||
  (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) ||
  !!nav.connection?.saveData;

// ?perf=low / ?perf=high forces a tier (handy for testing the fallbacks).
const forced = new URLSearchParams(location.search).get('perf');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const perf = {
  low: forced ? forced === 'low' : !!weak,
  touch,
  /** Canvas pixel-ratio cap: the dissolve is a soft noise mask, so low res is fine. */
  get dpr() {
    return Math.min(window.devicePixelRatio || 1, this.low ? 1 : touch ? 1.25 : 1.5);
  },
};

const apply = () => (document.documentElement.dataset.perf = perf.low ? 'low' : 'high');
apply();

/**
 * Samples frame times for ~1 s once the page is interactive; if the median
 * frame is slower than ~30 fps, downgrade to the low tier (CSS reacts at once,
 * JS effects read `perf.low` the next time they run).
 */
export function probeFrameRate() {
  if (perf.low || forced) return;
  const deltas = [];
  let last = 0;
  const sample = (t) => {
    if (last) deltas.push(t - last);
    last = t;
    if (deltas.length < 40) return requestAnimationFrame(sample);
    deltas.sort((a, b) => a - b);
    if (deltas[deltas.length >> 1] > 34) {
      perf.low = true;
      apply();
    }
  };
  setTimeout(() => requestAnimationFrame(sample), 1500);
}

/** ScrollTrigger scrub smoothing: Lenis already eases scrolling, so touch needs less extra lag. */
export const scrubSmooth = () => (perf.touch ? 0.4 : 1);

let configured = false;
/** One Lenis instance driven by the GSAP ticker; native scrolling on touch and weak devices. */
export function createLenis(options = {}) {
  if (!configured) {
    configured = true;
    // iOS/Android URL-bar show/hide fires resize: don't re-measure every pin for it.
    ScrollTrigger.config({ ignoreMobileResize: true });
  }
  const lenis = new Lenis({
    lerp: 0.1,
    smoothWheel: !perf.low && !reduced,
    // Touch: drive scrolling through Lenis too, so phones get the same inertia as desktop
    // and ScrollTrigger pins update in the same frame as the scroll (no pin jitter while
    // flinging on iOS). Weak devices and reduced-motion keep plain native scrolling.
    syncTouch: perf.touch && !perf.low && !reduced,
    syncTouchLerp: 0.09,
    touchInertiaExponent: 1.8,
    ...options,
  });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  lenis.destroyTicker = () => gsap.ticker.remove(tick);
  return lenis;
}

/** Defer non-critical work until the main thread is idle. */
export const whenIdle = (fn, timeout = 2000) =>
  'requestIdleCallback' in window ? requestIdleCallback(fn, { timeout }) : setTimeout(fn, 200);
