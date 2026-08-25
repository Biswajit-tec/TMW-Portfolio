/**
 * FooterSection.js — Production-grade Footer & Particle Explosion for Tubelight Media Works.
 *
 * Adapted from the purchased Codegrid image explosion scroll animation.
 * All selectors scoped to .tmw-footer-* to prevent global collisions.
 *
 * ── SCROLL ARCHITECTURE ────────────────────────────────────────────────
 * Reuses the existing single Lenis + ScrollTrigger system.
 * Triggered via ScrollTrigger ('tmw-footer-explosion-trigger') on entering viewport.
 *
 * ── PARTICLE PERFORMANCE (HARD REQUIREMENT) ────────────────────────────
 * The physics RAF loop runs ONLY during the active explosion burst and
 * automatically terminates (cancels animation frame) as soon as all
 * particles have completed their arc and settled below view.
 * Zero background loops.
 */

import gsap             from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initFooterSection() {
  const footer             = document.querySelector('.tmw-footer');
  const explosionContainer = document.querySelector('.tmw-footer-explosion');
  const backToTopBtn       = document.querySelector('.tmw-footer-back-to-top');

  if (!footer || !explosionContainer) {
    console.warn('[TMW] FooterSection: required elements not found — skipping init.');
    return;
  }

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  // ── Back to Top Smooth Scroll ─────────────────────────────────────────
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (prefersReducedMotion) return;

  // ── Particle Physics Engine ───────────────────────────────────────────
  const config = {
    gravity:         0.28,
    friction:        0.988,
    horizontalForce: window.innerWidth < 768 ? 16 : 26,
    verticalForce:   window.innerWidth < 768 ? 14 : 18,
    rotationSpeed:   10,
    resetDelay:      500,
  };

  const imageParticleCount = 15;
  const imagePaths = Array.from(
    { length: imageParticleCount },
    (_, i) => `/images/footer/img${i + 1}.jpg`
  );

  class Particle {
    constructor(element) {
      this.element       = element;
      this.x             = 0;
      this.y             = 0;
      this.vx            = (Math.random() - 0.5) * config.horizontalForce;
      this.vy            = -config.verticalForce - Math.random() * 10;
      this.rotation      = 0;
      this.rotationSpeed = (Math.random() - 0.5) * config.rotationSpeed;
    }

    update() {
      this.vy += config.gravity;
      this.vx *= config.friction;
      this.vy *= config.friction;
      this.rotationSpeed *= config.friction;

      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.rotationSpeed;

      if (this.element) {
        this.element.style.transform = `translate3d(${this.x}px, ${this.y}px, 0) rotate(${this.rotation}deg)`;
      }
    }
  }

  let particles           = [];
  let isExploding         = false;
  let animationFrameId    = null;

  function createParticles() {
    explosionContainer.innerHTML = '';
    particles = [];

    const fragment = document.createDocumentFragment();

    imagePaths.forEach((path, index) => {
      const img = document.createElement('img');
      img.src = path;
      img.alt = `Production frame ${index + 1}`;
      img.className = 'tmw-footer-particle-img';
      img.loading = 'lazy';
      img.decoding = 'async';
      fragment.appendChild(img);
    });

    explosionContainer.appendChild(fragment);

    const elements = explosionContainer.querySelectorAll('.tmw-footer-particle-img');
    particles = Array.from(elements).map(el => new Particle(el));
  }

  function explode() {
    if (isExploding) return;
    isExploding = true;

    createParticles();

    let finished = false;

    function animate() {
      if (finished) return;

      particles.forEach(p => p.update());

      // Check if all particles have cleared the top arc and descended below view
      const containerH = explosionContainer.offsetHeight || 600;
      const allSettled = particles.length > 0 && particles.every(p => p.y > containerH * 0.4 && p.vy > 0);

      if (allSettled) {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        finished = true;
        setTimeout(() => {
          isExploding = false;
        }, config.resetDelay);
        return;
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    animationFrameId = requestAnimationFrame(animate);
  }

  // Pre-load images lazily in background
  imagePaths.forEach(path => {
    const img = new Image();
    img.src = path;
  });

  // ── ScrollTrigger Viewport Activation ────────────────────────────────
  ScrollTrigger.getAll()
    .filter(t => t.vars?.id?.startsWith('tmw-footer-'))
    .forEach(t => t.kill());

  ScrollTrigger.create({
    id:       'tmw-footer-explosion-trigger',
    trigger:  footer,
    start:    'top 75%',
    onEnter:  explode,
    onEnterBack: () => {
      if (!isExploding) explode();
    },
  });

  // ── Debounced Resize Handler ─────────────────────────────────────────
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      config.horizontalForce = window.innerWidth < 768 ? 16 : 26;
      config.verticalForce   = window.innerWidth < 768 ? 14 : 18;
      isExploding = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }, 250);
  });
}
