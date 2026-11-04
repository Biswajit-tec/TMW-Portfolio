/**
 * ProjectEndSection.js — Spotlight gallery close, Tubelight Media Works.
 *
 * Adapted from the purchased Voltlites scroll animation component.
 * All selectors scoped to .tmw-pe-* to prevent global collisions.
 *
 * ── SCROLL ARCHITECTURE ────────────────────────────────────────────────
 * Operates within the existing single Lenis → ScrollTrigger system.
 * NO new Lenis instance is created here. The original component created
 * its own Lenis; we intentionally discard that in favour of the global
 * instance established in HeroSection.js, which already registers
 * lenis.on('scroll', ScrollTrigger.update) — making all ScrollTrigger
 * instances here automatically smooth without any extra plumbing.
 *
 * ── ANIMATION SEQUENCE (.tmw-pe-hero pinned, 4×vh scroll space) ────────
 * Progress 0–5%:   Wordmark fades in from opacity:0
 * Progress 0–75%:  Gallery scales 1 → 0.5 (collapses toward centre)
 *                  Images within gallery de-zoom 1.25 → 1
 *                  Wordmark scales from large (6× desktop / 2× mobile)
 *                  → scale(1), traveling upward as the gallery clears
 * Progress 5–25%:  Footer label blurs + shrinks + fades out
 * Progress 10–60%: Headline words fade in (staggered, via SplitText)
 * Progress 85–100%: Dark overlay fades in (soft resting close — extensible
 *                   exit for future sections below)
 * Progress 90–100%: Wordmark fades out (clean state when pin ends)
 *
 * On onLeaveBack: opacity reset for wordmark and headline targets.
 *
 * ── EXTENSIBILITY ──────────────────────────────────────────────────────
 * .studio and .connect sections are intentionally NOT included.
 * The pin uses pinSpacing:true so GSAP adds spacer after the section.
 * Future sections placed after #tmw-project-end will appear naturally
 * below this spacer with no restructuring needed.
 */

import gsap             from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText }     from 'gsap/SplitText';
import { perf }          from '../../utils/perf.js';
import { onLayoutChange } from '../../utils/resize.js';

// ScrollTrigger already registered by HeroSection; re-registering is a no-op.
// SplitText already registered by HeroSection; same.
gsap.registerPlugin(ScrollTrigger, SplitText);

export function initProjectEndSection() {
  // ── Element refs ──────────────────────────────────────────────────────
  const hero             = document.querySelector('.tmw-pe-hero');
  const spotlightGallery = document.querySelector('.tmw-pe-gallery');
  const spotlightImages  = document.querySelectorAll('.tmw-pe-item img');
  const wordmark         = document.querySelector('.tmw-pe-wordmark');
  const heroFooter       = document.querySelector('.tmw-pe-footer');
  const heroOverlay      = document.querySelector('.tmw-pe-overlay');
  const heroButton       = document.querySelector('.tmw-pe-cta');

  if (!hero || !spotlightGallery || !wordmark) {
    console.warn('[TMW] ProjectEndSection: required elements not found — skipping init.');
    return;
  }

  // ── Reduced-motion check ──────────────────────────────────────────────
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion) {
    // Immediately expose all content at its resting state
    gsap.set(spotlightGallery, { scale: 0.75 });
    gsap.set(spotlightImages,  { scale: 1 });
    gsap.set(wordmark,         { scale: 1, y: 0, opacity: 1 });
    gsap.set(heroButton,       { opacity: 1 });
    return;
  }

  // ── SplitText — headline words ────────────────────────────────────────
  const headlineSplit = SplitText.create('.tmw-pe-header h3', {
    type:       'words',
    wordsClass: 'tmw-pe-word',
  });

  const headerFadeTargets = [...headlineSplit.words, heroButton].filter(Boolean);
  gsap.set(headerFadeTargets, { opacity: 0 });

  // Stagger parameters: words fade in from 10% to 60% of pin progress
  const headerFadeStep     = (0.6 - 0.1) / Math.max(headerFadeTargets.length, 1);
  const headerFadeDuration = headerFadeStep * 3;

  // ── Wordmark start scale (responsive) ────────────────────────────────
  let wordmarkStartScale = 6;
  const mm = gsap.matchMedia();
  mm.add('(max-width: 999px)', () => {
    wordmarkStartScale = 2;
    return () => { wordmarkStartScale = 6; };
  });

  // Set wordmark initial state (starts invisible + large)
  gsap.set(wordmark, {
    scale:           wordmarkStartScale,
    y:               0,
    opacity:         0,
    transformOrigin: 'bottom left',
  });

  // ── Helpers ───────────────────────────────────────────────────────────
  const mapRange = (value, start, end) =>
    gsap.utils.clamp(0, 1, (value - start) / (end - start));

  const lerp = (from, to, t) => from + (to - from) * t;

  // ── Cached layout + reusable setters (per-frame handler stays allocation-free) ─
  let oneRem = 16, wordmarkBaseH = 0, lastFooterProg = -1;
  const wordOpacity       = [];
  // Direct style writes (quickSetter doesn't reliably render transforms on these).
  // The gallery is centred by CSS (translate(-50%, -50%)), so that offset is kept.
  const imageList         = [...spotlightImages];
  const setGalleryScale   = (v) => { spotlightGallery.style.transform = `translate(-50%, -50%) scale(${v})`; };
  const setImagesScale    = (v) => { const t = `scale(${v})`; for (let i = 0; i < imageList.length; i++) imageList[i].style.transform = t; };
  const setWordmark       = (scale, y, opacity) => {
    wordmark.style.transform = `translate3d(0, ${y}px, 0) scale(${scale})`;
    wordmark.style.opacity   = opacity;
  };
  const setOverlay        = (v) => { heroOverlay.style.opacity = v; };

  // Layout metrics are read here (not per frame) and again whenever ScrollTrigger
  // re-measures the page (fonts loading, resize), so the cache never goes stale.
  function measure() {
    oneRem        = parseFloat(getComputedStyle(document.documentElement).fontSize);
    wordmarkBaseH = wordmark.offsetHeight;   // unaffected by the scale transform
  }
  ScrollTrigger.addEventListener('refreshInit', measure);

  // ── Build / rebuild ScrollTrigger instances ───────────────────────────
  function buildTriggers() {
    ScrollTrigger.getAll()
      .filter(t => t.vars?.id?.startsWith('tmw-pe-'))
      .forEach(t => t.kill());

    measure();
    lastFooterProg = -1;
    wordOpacity.length = 0;

    ScrollTrigger.create({
      id:         'tmw-pe-hero-pin',
      trigger:    hero,
      start:      'top top',
      end:        `+=${window.innerHeight * 4}px`,
      pin:        true,
      pinSpacing: true,   // GSAP adds spacer; future sections slot below naturally

      // Scroll backward past section start: reset all animated states
      onLeaveBack: () => {
        wordOpacity.length = 0;     // cache no longer matches the DOM
        lastFooterProg     = -1;
        gsap.set(wordmark,          { opacity: 0 });
        gsap.set(headerFadeTargets, { opacity: 0 });
        gsap.set(heroOverlay,       { opacity: 0 });
      },

      onUpdate: self => {
        const p = self.progress;

        // ── Gallery + images ─────────────────────────────────────────────
        const galleryProg = mapRange(p, 0, 0.75);
        setGalleryScale(lerp(1, 0.5, galleryProg));
        setImagesScale(lerp(1.25, 1, galleryProg));

        // ── Wordmark ─────────────────────────────────────────────────────
        // Scale: large → 1, traveling upward as gallery clears the bottom.
        // (Layout metrics are cached in buildTriggers — no reads per frame.)
        const wordmarkScale = lerp(wordmarkStartScale, 1, galleryProg);
        const travelDist    = window.innerHeight - wordmarkBaseH * wordmarkScale - oneRem * 4;

        // Wordmark opacity: fade in 0→5%, fade out 90→100%
        let wOpacity;
        if      (p < 0.05) wOpacity = p / 0.05;
        else if (p >= 0.9) wOpacity = 1 - (p - 0.9) / 0.1;
        else               wOpacity = 1;

        setWordmark(wordmarkScale, -travelDist * galleryProg, wOpacity);

        // ── Footer label blurs + fades (5–25%) ──────────────────────────
        // Blur is a per-frame GPU filter pass: skipped on the low tier.
        const footerProg = mapRange(p, 0.05, 0.25);
        if (heroFooter && footerProg !== lastFooterProg) {
          lastFooterProg = footerProg;
          gsap.set(heroFooter, {
            scale:   lerp(1, 0.75, footerProg),
            opacity: lerp(1, 0,    footerProg),
            ...(perf.low ? {} : { filter: `blur(${lerp(0, 20, footerProg)}px)` }),
          });
        }

        // ── Headline words fade in (staggered 10–60%) ───────────────────
        for (let i = 0; i < headerFadeTargets.length; i++) {
          const tStart  = 0.1 + i * headerFadeStep;
          const opacity = mapRange(p, tStart, tStart + headerFadeDuration);
          if (opacity !== wordOpacity[i]) {
            wordOpacity[i] = opacity;
            headerFadeTargets[i].style.opacity = opacity;
          }
        }

        // ── Exit overlay: dark veil 85–100% ─────────────────────────────
        setOverlay(lerp(0, 0.65, mapRange(p, 0.85, 1.0)));
      },
    });
  }

  buildTriggers();

  // ── Layout change: rebuild via the shared, ordered handler (see utils/resize.js) ──
  onLayoutChange(buildTriggers);
}
