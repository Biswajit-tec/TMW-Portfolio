
document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger, Flip)

  const lightColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--light")
    .trim()
  const darkColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--dark")
    .trim()

  function interpolateColor(color1, color2, factor) {
    return gsap.utils.interpolate(color1, color2, factor)
  }

  gsap.to(".marquee-images", {
    scrollTrigger: {
      trigger: ".marquee",
      start: "top bottom",
      end: "top top",
      scrub: true,
      onUpdate: self => {
        const xPosition = -75 + self.progress * 25
        gsap.set(".marquee-images", { x: `${xPosition}%` })
      },
    },
  })

  let pinnedMarqueeImgClone = null
  let isImgCloneActive = false

  function createPinnedMarqueeImgClone() {
    if (isImgCloneActive) return

    const originalMarqueeImg = document.querySelector(".marquee-img.pin img")
    const rect = originalMarqueeImg.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    pinnedMarqueeImgClone = originalMarqueeImg.cloneNode(true)

    gsap.set(pinnedMarqueeImgClone, {
      position: "fixed",
      left: centerX - originalMarqueeImg.offsetWidth / 2,
      top: centerY - originalMarqueeImg.offsetHeight / 2,
      width: originalMarqueeImg.offsetWidth,
      height: originalMarqueeImg.offsetHeight,
      transform: "rotate(-5deg)",
      transformOrigin: "center center",
      pointerEvents: "none",
      willChange: "transform",
      zIndex: 100,
    })

    document.body.appendChild(pinnedMarqueeImgClone)
    gsap.set(originalMarqueeImg, { opacity: 0 })
    isImgCloneActive = true
  }

  function removePinnedMarqueeImgClone() {
    if (!isImgCloneActive) return
    if (pinnedMarqueeImgClone) {
      pinnedMarqueeImgClone.remove()
      pinnedMarqueeImgClone = null
    }
    const originalMarqueeImg = document.querySelector(".marquee-img.pin img")
    gsap.set(originalMarqueeImg, { opacity: 1 })
    isImgCloneActive = false
  }

  ScrollTrigger.create({
    trigger: ".horizontal-scroll",
    start: "top top",
    end: () => `+=${window.innerHeight * 5}`,
    pin: true,
  })

  ScrollTrigger.create({
    trigger: ".marquee",
    start: "top top",
    onEnter: createPinnedMarqueeImgClone,
    onEnterBack: createPinnedMarqueeImgClone,
    onLeaveBack: removePinnedMarqueeImgClone,
  })

  let flipAnimation = null

  ScrollTrigger.create({
    trigger: ".horizontal-scroll",
    start: "top 50%",
    end: () => `+=${window.innerHeight * 5.5}`,
    onEnter: () => {
      if (pinnedMarqueeImgClone && isImgCloneActive && !flipAnimation) {
        const state = Flip.getState(pinnedMarqueeImgClone)

        gsap.set(pinnedMarqueeImgClone, {
          position: "fixed",
          left: 0,
          top: 0,
          width: "100%",
          height: "100svh",
          transform: "rotate(0deg)",
          transformOrigin: "center center",
        })

        flipAnimation = Flip.from(state, {
          duration: 1,
          ease: "none",
          paused: true,
        })
      }
    },
    onLeaveBack: () => {
      if (flipAnimation) {
        flipAnimation.kill()
        flipAnimation = null
      }
      gsap.set(".container", { backgroundColor: lightColor })
      gsap.set(".horizontal-scroll-wrapper", { x: "0%" })
    },
  })

  ScrollTrigger.create({
    trigger: ".horizontal-scroll",
    start: "top 50%",
    end: () => `+=${window.innerHeight * 5.5}`,
    onUpdate: self => {
      const progress = self.progress

      if (progress <= 0.05) {
        const bgColorProgress = Math.min(progress / 0.05, 1)
        gsap.set(".container", {
          backgroundColor: interpolateColor(
            lightColor,
            darkColor,
            bgColorProgress
          ),
        })
      } else {
        gsap.set(".container", { backgroundColor: darkColor })
      }

      if (progress <= 0.2 && flipAnimation) {
        flipAnimation.progress(progress / 0.2)
      }

      if (progress > 0.2 && progress <= 0.95) {
        if (flipAnimation) flipAnimation.progress(1)

        const horizontalProgress = (progress - 0.2) / 0.75
        gsap.set(".horizontal-scroll-wrapper", {
          x: `${-66.67 * horizontalProgress}%`,
        })

        const imageTranslateX = -((66.67 / 100) * 3 * horizontalProgress) * 100
        gsap.set(pinnedMarqueeImgClone, { x: `${imageTranslateX}%` })
      }

      if (progress > 0.95) {
        if (flipAnimation) flipAnimation.progress(1)
        gsap.set(pinnedMarqueeImgClone, { x: "-200%" })
        gsap.set(".horizontal-scroll-wrapper", { x: "-66.67%" })
      }
    },
  })
})