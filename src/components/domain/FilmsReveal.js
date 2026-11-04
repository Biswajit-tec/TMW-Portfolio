/**
 * FilmsReveal — pinned image mask reveal (UI library scroll animation 29).
 * Desktop: the image column pins while each image wipes away to reveal the next.
 * Mobile: images and copy interleave and each image drifts as it passes.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Dark tints that the page background shifts through, one per image change.
const BG_COLORS = ['#0b1219', '#190c13', '#1b1009'];

export function initFilmsReveal({ lenis } = {}) {
  const root = document.querySelector('.tmw-reveal');
  if (!root) return;

  const wrappers = gsap.utils.toArray('.arch__right .img-wrapper', root);
  const imgs = wrappers.map((w) => w.querySelector('img'));
  const infos = gsap.utils.toArray('.arch__left .arch__info', root);
  wrappers.forEach((w) => (w.style.zIndex = w.dataset.index));

  const setOrder = (mobile) => {
    infos.forEach((el, i) => (el.style.order = mobile ? i * 2 : ''));
    wrappers.forEach((el, i) => (el.style.order = mobile ? i * 2 + 1 : ''));
  };

  // Category nav: jump to the first work of a type, highlight the type in view.
  const navBtns = [...document.querySelectorAll('.tmw-domain-nav [data-cat]')];
  const setActive = (cat) => navBtns.forEach((b) => b.classList.toggle('is-active', b.dataset.cat === cat));
  navBtns.forEach((btn) =>
    btn.addEventListener('click', () => {
      const first = infos.find((el) => el.dataset.cat === btn.dataset.cat);
      const mobile = window.matchMedia('(max-width: 768px)').matches;
      lenis?.scrollTo(first, { offset: mobile ? -70 : 0, duration: 1.4 });
    })
  );
  const navTriggers = infos.map((info) =>
    ScrollTrigger.create({
      trigger: info,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => self.isActive && setActive(info.dataset.cat),
    })
  );

  const mm = gsap.matchMedia();

  mm.add('(min-width: 769px)', () => {
    setOrder(false);
    const main = gsap.timeline({
      scrollTrigger: { trigger: '.arch', start: 'top top', end: 'bottom bottom', pin: '.arch__right', scrub: true },
    });
    gsap.set(imgs, { clipPath: 'inset(0)', objectPosition: '0px 0%' });

    imgs.forEach((img, i) => {
      const next = imgs[i + 1];
      if (!next) return;
      main.add(
        gsap.timeline()
          .to('body', { backgroundColor: BG_COLORS[i % BG_COLORS.length], duration: 1.5, ease: 'power2.inOut' }, 0)
          .to(img, { clipPath: 'inset(0px 0px 100%)', objectPosition: '0px 60%', duration: 1.5, ease: 'none' }, 0)
          .to(next, { objectPosition: '0px 40%', duration: 1.5, ease: 'none' }, 0)
      );
    });
  });

  mm.add('(max-width: 768px)', () => {
    setOrder(true);
    gsap.set(imgs, { objectPosition: '0px 60%' });
    imgs.forEach((img, i) => {
      gsap.timeline({
        scrollTrigger: { trigger: img, start: 'top-=70% top+=50%', end: 'bottom+=200% bottom', scrub: true },
      })
        .to(img, { objectPosition: '0px 30%', duration: 5, ease: 'none' })
        .to('body', { backgroundColor: BG_COLORS[i % BG_COLORS.length], duration: 1.5, ease: 'power2.inOut' });
    });
  });

  return () => {
    mm.revert();
    navTriggers.forEach((t) => t.kill());
  };
}
