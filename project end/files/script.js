import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText);

const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

const spotlightGallery = document.querySelector(".hero-spotlight-gallery");
const spotlightImages = document.querySelectorAll(".hero-spotlight-item img");
const logo = document.querySelector(".logo");
const heroFooter = document.querySelector(".hero-footer");
const heroInner = document.querySelector(".hero-inner");
const heroOverlay = document.querySelector(".hero-overlay");
const heroButton = document.querySelector(".hero-header .btn");

const lerp = (from, to, t) => from + (to - from) * t;

const mapRange = (value, rangeStart, rangeEnd) =>
  gsap.utils.clamp(0, 1, (value - rangeStart) / (rangeEnd - rangeStart));

const headlineSplit = SplitText.create(".hero-header h3", {
  type: "words",
  wordsClass: "word",
});

const headerFadeTargets = [...headlineSplit.words, heroButton];
gsap.set(headerFadeTargets, { opacity: 0 });

const headerFadeStep = (0.6 - 0.1) / headerFadeTargets.length;
const headerFadeDuration = headerFadeStep * 3;

const MOBILE_BREAKPOINT = 1000;

let logoStartScale = 6;
gsap.matchMedia().add(`(max-width: ${MOBILE_BREAKPOINT}px)`, () => {
  logoStartScale = 2;
  return () => (logoStartScale = 6);
});

ScrollTrigger.create({
  trigger: ".hero",
  start: "top top",
  end: `+=${window.innerHeight * 4}px`,
  pin: true,
  pinSpacing: false,
  onUpdate: (self) => {
    const scrollProgress = self.progress;

    const galleryProgress = mapRange(scrollProgress, 0, 0.75);
    const galleryScale = lerp(1, 0.5, galleryProgress);
    gsap.set(spotlightGallery, { scale: galleryScale });

    const imageScale = lerp(1.25, 1, galleryProgress);
    gsap.set(spotlightImages, { scale: imageScale });

    const logoScale = lerp(logoStartScale, 1, galleryProgress);

    const oneRem = parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );
    const logoScaledHeight = logo.offsetHeight * logoScale;
    const logoTravelDistance =
      window.innerHeight - logoScaledHeight - oneRem * 4;

    gsap.set(logo, {
      scale: logoScale,
      y: -logoTravelDistance * galleryProgress,
    });

    const footerProgress = mapRange(scrollProgress, 0.05, 0.25);
    gsap.set(heroFooter, {
      scale: lerp(1, 0.75, footerProgress),
      filter: `blur(${lerp(0, 20, footerProgress)}px)`,
      opacity: lerp(1, 0, footerProgress),
    });

    headerFadeTargets.forEach((target, index) => {
      const targetStart = 0.1 + index * headerFadeStep;
      const targetProgress = mapRange(
        scrollProgress,
        targetStart,
        targetStart + headerFadeDuration,
      );
      gsap.set(target, { opacity: targetProgress });
    });
  },
});

ScrollTrigger.create({
  trigger: ".studio",
  start: "top bottom",
  end: "top top",
  scrub: true,
  onUpdate: (self) => {
    const exitProgress = self.progress;

    gsap.set(heroInner, { y: `${-25 * exitProgress}%` });

    gsap.set(heroOverlay, { opacity: exitProgress });
  },
});
