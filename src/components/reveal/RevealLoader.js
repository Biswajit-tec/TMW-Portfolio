/**
 * RevealLoader.js — WebGL cinematic reveal loader for Tubelight Media Works.
 *
 * Renders a full-screen black plane with a Perlin-noise radial dissolve
 * (Three.js ShaderMaterial). The user clicks to trigger the reveal.
 *
 * Returns a Promise that resolves when the dissolve + fade-out complete,
 * signalling to main.js that the main site can be handed control.
 *
 * Cleans up: RAF loop, resize listener, Three.js renderer/geometry/material.
 */

import * as THREE from 'three';
import { gsap }   from 'gsap';
import { vertexShader, fragmentShader } from './shaders.js';
import { BRAND } from '../../config/content.js';

export function initRevealLoader() {
  // ─── DOM refs ─────────────────────────────────────────────────────────────
  const loaderEl   = document.getElementById('tmw-loader');
  const canvas     = document.getElementById('tmw-loader-canvas');
  const promptEl   = document.querySelector('.tmw-loader-prompt');
  const brandEl    = document.querySelector('.tmw-loader-brand');

  // Apply brand text from content config
  if (brandEl)  brandEl.textContent  = BRAND.name;
  if (promptEl) {
    const textSpan = promptEl.querySelector('.tmw-loader-prompt-text');
    if (textSpan) textSpan.textContent = BRAND.loaderPrompt;
  }

  // ─── Reduced-motion check ─────────────────────────────────────────────────
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  // ─── Three.js setup ───────────────────────────────────────────────────────
  const scene    = new THREE.Scene();
  const camera   = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const uniforms = {
    uTransition:  { value: 0.0 },
    uResolution:  { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uTime:        { value: 0.0 },
    // Warm amber glow complements the hero's crimson/dark palette
    uBorderColor: { value: new THREE.Color('#c87941') },
  };

  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    depthTest:  false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // ─── Resize handler ───────────────────────────────────────────────────────
  const handleResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    uniforms.uResolution.value.set(w, h);
  };
  window.addEventListener('resize', handleResize);

  // ─── RAF render loop ─────────────────────────────────────────────────────
  const clock = new THREE.Clock();
  let rafId;

  const tick = () => {
    uniforms.uTime.value = clock.getElapsedTime();
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(tick);
  };
  tick();

  // ─── Cleanup ──────────────────────────────────────────────────────────────
  const cleanup = () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', handleResize);
    renderer.dispose();
    geometry.dispose();
    material.dispose();
  };

  // ─── Prompt entrance animation ───────────────────────────────────────────
  if (!prefersReducedMotion) {
    // Stagger brand + prompt in after a cinematic pause
    gsap.fromTo(
      '.tmw-loader-brand',
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 1.2, delay: 0.6, ease: 'power2.out' }
    );
    gsap.fromTo(
      '.tmw-loader-year',
      { opacity: 0 },
      { opacity: 0.4, duration: 1.0, delay: 0.9, ease: 'power2.out' }
    );
    gsap.fromTo(
      promptEl,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 1.0, delay: 1.8, ease: 'power2.out' }
    );
    // Subtle pulse on prompt to guide the eye
    gsap.to(promptEl, {
      opacity: 0.7,
      duration: 1.4,
      delay: 3.2,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    });
  } else {
    // Reduced motion: show everything immediately at full opacity
    if (brandEl)  brandEl.style.opacity  = '1';
    if (promptEl) promptEl.style.opacity = '1';
  }

  // ─── Return a Promise that resolves when reveal is complete ───────────────
  return new Promise((resolve) => {
    let isRevealed = false;

    const triggerReveal = () => {
      if (isRevealed) return;
      isRevealed = true;

      // Kill the prompt pulse
      gsap.killTweensOf(promptEl);

      // Fade out prompt
      gsap.to(promptEl, {
        opacity: 0,
        y: prefersReducedMotion ? 0 : -16,
        duration: 0.4,
        ease: 'power2.inOut',
      });

      if (prefersReducedMotion) {
        // Skip WebGL dissolve — just fade the loader out
        gsap.to(loaderEl, {
          opacity: 0,
          duration: 0.5,
          ease: 'power2.out',
          onComplete: () => {
            if (loaderEl) {
              loaderEl.style.pointerEvents = 'none';
              loaderEl.style.display       = 'none';
            }
            cleanup();
            resolve();
          },
        });
        return;
      }

      // Full WebGL dissolve (3 s)
      gsap.to(uniforms.uTransition, {
        value: 1.0,
        duration: 3.0,
        ease: 'power2.inOut',
        onComplete: () => {
          // Fade the entire loader element out smoothly
          gsap.to(loaderEl, {
            opacity: 0,
            duration: 0.7,
            ease: 'power2.out',
            onComplete: () => {
              if (loaderEl) {
                loaderEl.style.pointerEvents = 'none';
                loaderEl.style.display       = 'none';
              }
              cleanup();
              resolve();
            },
          });
        },
      });
    };

    // Click anywhere to reveal
    window.addEventListener('click', triggerReveal, { once: true });

    // Keyboard accessibility: Enter or Space also trigger reveal
    const handleKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerReveal();
        window.removeEventListener('keydown', handleKey);
      }
    };
    window.addEventListener('keydown', handleKey);

    // Safety valve — auto-reveal after 90 s so users never get stuck
    const safetyTimer = setTimeout(() => {
      if (!isRevealed) triggerReveal();
    }, 90_000);

    // Store cleanup ref so we can cancel it on early trigger
    const originalTrigger = triggerReveal;
    // Patch triggerReveal to also clear the safety timer
    // (using a flag is simpler — isRevealed guard already covers this)
    void safetyTimer; // referenced above; no further action needed
  });
}
