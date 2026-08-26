/**
 * main.js — Tubelight Media Works application orchestrator.
 *
 * SEQUENCE:
 *   1. Lock scroll (prevent user from scrolling behind the reveal layer)
 *   2. initHeroSection() — hero renders immediately beneath the reveal canvas.
 *      Creates the SINGLE Lenis instance for the entire site.
 *      Registers lenis.on('scroll', ScrollTrigger.update) — every ScrollTrigger
 *      instance on the page (hero, about, project, project-end, photo-dump)
 *      automatically uses Lenis-smoothed positions via this one binding.
 *   3. initRevealLoader() — WebGL mask auto-dissolves after 2s. Resolves ~5s.
 *   4. Unlock scroll, expose site to screen readers.
 *   5. initAboutSection()      — ScrollTrigger refresh after loader removal.
 *   6. initProjectSection()    — Flip + horizontal scroll, no Lenis param needed.
 *   7. initProjectEndSection() — Gallery collapse + wordmark, no Lenis param needed.
 *   8. initPhotoDumpSection()  — 3D perspective grid interlude. Uses global scroll.
 *   9. initFooterSection()     — Particle burst + back-to-top interaction.
 *  10. ScrollTrigger.refresh() — final authoritative refresh with full page height.
 *
 * SCROLL ARCHITECTURE:
 *   One Lenis instance. One ScrollTrigger.update binding. All sections share it.
 *   No component creates its own scroll system.
 *
 * LAYERING:
 *   z: 1000  #tmw-loader       (position: fixed — WebGL mask)
 *   z: 100   .tmw-pe-wordmark  (position: fixed — floats during Project End)
 *   z: 50    pinnedClone       (position: fixed — during Project hscroll)
 *   z: auto  #tmw-site         (position: relative — all page content)
 *
 * No component has knowledge of another; orchestration lives only here.
 */

import { initRevealLoader }       from './components/reveal/RevealLoader.js';
import { initHeroSection }        from './components/hero/HeroSection.js';
import { initAboutSection }       from './components/about/AboutSection.js';
import { initProjectSection }     from './components/project/ProjectSection.js';
import { initProjectEndSection }  from './components/project-end/ProjectEndSection.js';
import { initPhotoDumpSection }   from './components/photo-dump/PhotoDumpSection.js';
import { initFooterSection }      from './components/footer/FooterSection.js';
import { initNavbar }             from './components/navbar/NavbarSection.js';
import { ScrollTrigger }          from 'gsap/ScrollTrigger';
import gsap                       from 'gsap';

gsap.registerPlugin(ScrollTrigger);

async function bootstrap() {
  // ── Lock scroll during the cinematic reveal ────────────────────────────
  document.body.style.overflowY = 'hidden';

  // ── Hero + Lenis initialise beneath the reveal layer ──────────────────
  // initHeroSection() creates the single Lenis instance and registers
  // lenis.on('scroll', ScrollTrigger.update). All subsequent ScrollTrigger
  // instances automatically use Lenis-smoothed positions.
  const lenis = initHeroSection();

  // ── Navbar initialises with the shared Lenis instance ─────────────────
  const { revealNavbar } = initNavbar(lenis);

  // ── Reveal: auto-dissolves after 2s, acts as a mask over the hero ─────
  try {
    await initRevealLoader();
  } catch (err) {
    console.warn('[TMW] Reveal loader error — proceeding to site.', err);
  }

  // ── Reveal navbar toggle button once intro completes ──────────────────
  revealNavbar();

  // ── Unlock scroll, make site accessible ───────────────────────────────
  document.body.style.overflowY = '';
  document.getElementById('tmw-site')?.removeAttribute('aria-hidden');

  // ── Section inits — sequential, each builds on the same scroll system ──
  // About: 3D card flip
  initAboutSection();

  // Project: Flip + marquee + horizontal scroll
  initProjectSection();

  // Project End: gallery collapse + wordmark + word fade
  initProjectEndSection();

  // Photo Dump: 3D perspective grid interlude (replaces Ending)
  initPhotoDumpSection();

  // Footer: particle burst physics + back-to-top interaction
  initFooterSection();

  // ── Final refresh: authoritative measurement with full page height ──────
  ScrollTrigger.refresh();
}

bootstrap();


