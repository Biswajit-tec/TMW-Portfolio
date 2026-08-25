/**
 * RevealLoader.js — Cinematic auto-reveal mask for Tubelight Media Works.
 *
 * Architecture (MASK model):
 *   - The hero is already rendered and positioned beneath this loader.
 *   - The WebGL canvas renders a solid-black plane that COVERS the hero.
 *   - As uTransition (0→1), the plane dissolves, progressively revealing
 *     the hero underneath — no separate "hero appears after loader" step.
 *   - After the first WebGL frame, the loader's CSS background is removed
 *     so transparent WebGL pixels show the hero, not the loader background.
 *
 * Timing:
 *   t=0s    Three.js renders (solid black, covers hero)
 *   t=0.4s  Brand wordmark fades in
 *   t=2.0s  Auto-dissolve begins; brand text fades out simultaneously
 *   t=5.0s  Dissolve complete; loader removed from DOM flow → Promise resolves
 *
 * Returns: Promise<void> — resolves when loader is fully removed.
 */

import * as THREE from 'three';
import { gsap }   from 'gsap';
import { vertexShader, fragmentShader } from './shaders.js';
import { BRAND } from '../../config/content.js';

export function initRevealLoader() {
  const loaderEl = document.getElementById('tmw-loader');
  const canvas   = document.getElementById('tmw-loader-canvas');
  const brandEl  = document.querySelector('.tmw-loader-brand');
  const yearEl   = document.querySelector('.tmw-loader-year');

  if (brandEl) brandEl.textContent = BRAND.name;
  if (yearEl)  yearEl.textContent  = BRAND.established;

  // ─── Reduced motion: skip dissolve, reveal immediately ────────────────
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion) {
    if (loaderEl) {
      loaderEl.style.pointerEvents = 'none';
      loaderEl.style.display       = 'none';
    }
    return Promise.resolve();
  }

  // ─── Three.js setup ──────────────────────────────────────────────────
  const scene  = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const uniforms = {
    uTransition:  { value: 0.0 },
    uResolution:  { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uTime:        { value: 0.0 },
    uBorderColor: { value: new THREE.Color('#c87941') }, // warm amber
  };

  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    vertexShader, fragmentShader, uniforms,
    transparent: true, depthWrite: false, depthTest: false,
  });
  scene.add(new THREE.Mesh(geometry, material));

  // ─── Resize handler ──────────────────────────────────────────────────
  const handleResize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    uniforms.uResolution.value.set(w, h);
  };
  window.addEventListener('resize', handleResize);

  // ─── Three.js cleanup ────────────────────────────────────────────────
  const cleanup = () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', handleResize);
    renderer.dispose();
    geometry.dispose();
    material.dispose();
  };

  // ─── RAF render loop ─────────────────────────────────────────────────
  const clock = new THREE.Clock();
  let rafId;
  let firstFrame = true;

  const tick = () => {
    uniforms.uTime.value = clock.getElapsedTime();
    renderer.render(scene, camera);

    if (firstFrame) {
      firstFrame = false;
      // WebGL is now rendering a solid-black plane via shader.
      // Drop the loader's CSS background-color so transparent WebGL pixels
      // will reveal the hero (not the loader div's own background).
      if (loaderEl) loaderEl.style.backgroundColor = 'transparent';
    }

    rafId = requestAnimationFrame(tick);
  };
  tick();

  // ─── Brand text entrance ─────────────────────────────────────────────
  gsap.fromTo(brandEl,
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0, duration: 0.9, delay: 0.4, ease: 'power2.out' }
  );
  gsap.fromTo(yearEl,
    { opacity: 0 },
    { opacity: 0.4, duration: 0.7, delay: 0.7, ease: 'power2.out' }
  );

  // ─── Promise: resolves when dissolve + removal is complete ───────────
  return new Promise((resolve) => {
    let resolved = false;

    const safeResolve = () => {
      if (resolved) return;
      resolved = true;
      if (loaderEl) {
        loaderEl.style.pointerEvents = 'none';
        loaderEl.style.display       = 'none';
      }
      cleanup();
      resolve();
    };

    // ── Auto-dissolve after 2 s cinematic pause ────────────────────────
    const dissolveTimer = setTimeout(() => {
      // Fade out brand text simultaneously with dissolve start
      gsap.to([brandEl, yearEl], {
        opacity: 0,
        y:       -8,
        duration: 0.45,
        ease:    'power2.in',
      });

      // WebGL radial dissolve (3 s)
      gsap.to(uniforms.uTransition, {
        value:    1.0,
        duration: 3.0,
        ease:     'power2.inOut',
        onComplete: safeResolve,
      });
    }, 2000);

    // Safety valve — never trap the user longer than 10 s
    setTimeout(() => {
      clearTimeout(dissolveTimer);
      safeResolve();
    }, 10_000);
  });
}
