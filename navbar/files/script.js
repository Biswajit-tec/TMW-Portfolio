/* =====================================================
   PURITY OF NOISE — MENU
   script.js

   One paused GSAP timeline, played forward to open and
   reversed to close.

   How the wave works now (previous jittery version removed):
   The SVG <path> has the wave shape BAKED IN — its bottom
   edge is a permanent curve. We never morph it.

   Instead, the whole .overlay element translates:
     closed: translateY(-100%)   (sits above the viewport)
     open:   translateY(0)        (covers the viewport, curve
                                   hanging below the fold)

   One transform property interpolated linearly = perfectly
   smooth, GPU-accelerated, and reverses identically.
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {

   /* ── DOM refs ── */
   const toggle    = document.getElementById('js-toggle')
   const menu      = document.getElementById('js-menu')
   const overlay   = document.querySelector('.overlay')
   const menuLinks = document.querySelectorAll('.menu-link')

   /* ── Initial states ── */
   gsap.set(menu, { visibility: 'hidden' })
   gsap.set(menuLinks, { top: '100%' })

   /* ── Main timeline ── */
   const tl = gsap.timeline({ paused: true })

   tl
      /* 1. Overlay slides down from above — ONE transform tween.
            Because we're animating a single `y` number (not an
            SVG path with multiple control points), the motion
            is perfectly continuous. The wave shape is static;
            it only travels through space.
            `power3.inOut` gives a natural accelerate-decelerate
            curve that looks clean both forward AND reversed. */
      .to(overlay, {
         y: 0,
         duration: 1.2,
         ease: 'power3.inOut',
      }, 0)

      /* 2. Reveal menu container when wave has just covered us */
      .set(menu, { visibility: 'visible' }, 0.55)
      .call(() => menu.classList.add('is-open'), null, 0.55)

      /* 3. Menu links slide up out of their clipped containers */
      .to(menuLinks, {
         top: 0,
         duration: 0.9,
         stagger: 0.07,
         ease: 'power3.out',
      }, 0.6)

   /* ── Toggle click ── */
   toggle.addEventListener('click', () => {
      /* "Currently open" = timeline played forward AND not reversed back */
      const isOpen = !tl.reversed() && tl.progress() > 0

      if (isOpen) {
         toggle.classList.remove('is-active')
         toggle.setAttribute('aria-expanded', 'false')
         menu.setAttribute('aria-hidden', 'true')
         menu.classList.remove('is-open')
         tl.reverse()
      } else {
         toggle.classList.add('is-active')
         toggle.setAttribute('aria-expanded', 'true')
         menu.setAttribute('aria-hidden', 'false')
         tl.play()
      }
   })

   /* Close on Escape */
   document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !tl.reversed() && tl.progress() > 0) {
         toggle.click()
      }
   })
})
