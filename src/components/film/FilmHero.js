/**
 * FilmHero.js — Opening Cinematic Chapter Controller
 * Tubelight Media Works · Feature & OTT Division
 *
 * Implements:
 *   - Scrubbed pinned hero sequence with zero callback dependencies
 *   - Background image scale-down & atmosphere mask
 *   - Expanding crimson cinematic revealer
 *   - Staggered cascade of verified Tubelight film production stills
 *   - Split screen outro shutter parting into Chapter II
 *   - 100% deterministic forward and reverse scroll fidelity
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initFilmHero() {
  const heroSection = document.querySelector('.film-hero');
  if (!heroSection) return;

  const heroBackground = heroSection.querySelector('.film-hero__bg');
  const heroContent = heroSection.querySelector('.film-hero__content');
  const heroRevealer = heroSection.querySelector('.film-hero__revealer');
  const heroImagesWrapper = heroSection.querySelector('.film-hero__images');
  const heroImages = gsap.utils.toArray('.film-hero__img-card');
  const heroOutroContent = heroSection.querySelector('.film-hero__outro-content');

  if (!heroOutroContent) return;

  // Clone outro for split parting effect if not already cloned
  let heroOutroRight = heroSection.querySelector('.film-hero__outro-right');
  if (!heroOutroRight) {
    heroOutroContent.classList.add('film-hero__outro-left');
    heroOutroRight = heroOutroContent.cloneNode(true);
    heroOutroRight.classList.remove('film-hero__outro-left');
    heroOutroRight.classList.add('film-hero__outro-right');
    heroOutroContent.parentNode.appendChild(heroOutroRight);
  }

  // Initial GSAP states
  gsap.set('.film-hero__outro-left', {
    clipPath: 'polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)',
    scale: 0,
    xPercent: 0,
  });
  gsap.set('.film-hero__outro-right', {
    clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)',
    scale: 0,
    xPercent: 0,
  });

  if (heroImagesWrapper) {
    gsap.set(heroImagesWrapper, { scale: 1, autoAlpha: 1 });
  }

  // Master scrubbed timeline
  const heroTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: heroSection,
      start: 'top top',
      end: () => `+=${window.innerHeight * 4}`,
      pin: true,
      pinSpacing: true,
      scrub: 1,
      invalidateOnRefresh: true,
    },
  });

  // 1. Initial background settle & intro text fade
  if (heroBackground) {
    heroTimeline.to(heroBackground, { scale: 1, duration: 0.45, ease: 'none' }, 0);
  }

  if (heroContent) {
    heroTimeline.to(heroContent, {
      opacity: 0,
      y: -35,
      filter: 'blur(10px)',
      duration: 0.3,
      ease: 'power2.in',
    }, 0.05);
  }

  // 2. Revealer expands from center vertical slit, then opens fully
  if (heroRevealer) {
    heroTimeline.to(heroRevealer, {
      clipPath: 'polygon(49.5% 0%, 50.5% 0%, 50.5% 100%, 49.5% 100%)',
      duration: 0.2,
      ease: 'power2.inOut',
    }, 0.08);

    heroTimeline.to(heroRevealer, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      duration: 0.28,
      ease: 'power2.out',
    }, 0.28);
  }

  // 3. Staggered cascade of film stills
  const cascadeStart = 0.42;
  const cascadeStagger = 0.05;
  const cascadeDuration = 0.16;

  heroImages.forEach((imgCard, index) => {
    heroTimeline.to(imgCard, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      scale: 1,
      duration: cascadeDuration,
      ease: 'power2.out',
    }, cascadeStart + index * cascadeStagger);
  });

  // 4. Outro split content scale-up
  const outroStart = cascadeStart + heroImages.length * cascadeStagger + 0.03;
  heroTimeline.to('.film-hero__outro-content', {
    scale: 1,
    duration: 0.18,
    ease: 'power2.out',
  }, outroStart);

  // 5. Hide elements underneath the outro
  const splitStart = outroStart + 0.18;
  heroTimeline.to([heroBackground, heroRevealer, heroImagesWrapper], {
    autoAlpha: 0,
    duration: 0.05,
  }, splitStart);

  // 6. Split screen shutter parting into Chapter II
  heroTimeline.to('.film-hero__outro-left', {
    xPercent: -108,
    duration: 0.32,
    ease: 'power3.inOut',
  }, splitStart + 0.02);

  heroTimeline.to('.film-hero__outro-right', {
    xPercent: 108,
    duration: 0.32,
    ease: 'power3.inOut',
  }, splitStart + 0.02);

  return heroTimeline;
}

