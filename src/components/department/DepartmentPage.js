/**
 * DepartmentPage.js — Interactive Netflix-Inspired Department Page Controller
 * Tubelight Mediaworks · Films, Brands, and Sports
 *
 * Implements:
 *   - Isolated department data rendering (no cross-department leakage)
 *   - Cinematic entrance animations (Hero zoom, title slide, meta stagger)
 *   - Viewport scroll reveal for project collection rows & cards
 *   - Horizontal carousel row scrolling (navigation buttons, touch drag)
 *   - Project Details Modal with smooth GSAP entrance & media view
 *   - Sticky navigation with scroll blur & active indicators
 */

import gsap from 'gsap';
import { DEPARTMENTS } from '../../data/projectsData.js';

export function initDepartmentPage(departmentId) {
  const deptData = DEPARTMENTS[departmentId];
  if (!deptData) {
    console.error(`[TMW] Unknown department ID: ${departmentId}`);
    return;
  }

  // 1. Render Isolated Department Content
  renderDepartmentPage(deptData);

  // 2. Setup Animations & Controllers
  playEntranceAnimations();
  setupNavScroll();
  setupCarousels();
  setupModal(deptData);
  setupRowScrollReveals();
}

function renderDepartmentPage(dept) {
  const appContainer = document.getElementById('tmw-dept-app');
  if (!appContainer) return;

  const { hero, collections } = dept;

  appContainer.innerHTML = `
    <!-- Top Navigation Bar -->
    <header class="tmw-dept-nav" id="tmw-dept-nav">
      <div class="tmw-dept-nav__left">
        <a href="/" class="tmw-dept-nav__logo" aria-label="Tubelight Mediaworks Home">
          <div class="tmw-dept-nav__logo-icon">
            <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </div>
          <span class="tmw-dept-nav__logo-text">Tubelight Mediaworks</span>
        </a>

        <nav aria-label="Department Navigation">
          <ul class="tmw-dept-nav__links">
            <li><a href="/" class="tmw-dept-nav__link">Home</a></li>
            <li><a href="/films" class="tmw-dept-nav__link ${dept.id === 'films' ? 'tmw-dept-nav__link--active' : ''}">Films</a></li>
            <li><a href="/brands" class="tmw-dept-nav__link ${dept.id === 'brands' ? 'tmw-dept-nav__link--active' : ''}">Brands</a></li>
            <li><a href="/sports" class="tmw-dept-nav__link ${dept.id === 'sports' ? 'tmw-dept-nav__link--active' : ''}">Sports</a></li>
            <li><a href="/#tmw-about" class="tmw-dept-nav__link">About Us</a></li>
          </ul>
        </nav>
      </div>

      <div class="tmw-dept-nav__right">
        <a href="/" class="tmw-dept-nav__home-btn">
          <span>← Back to Site</span>
        </a>
      </div>
    </header>

    <!-- Featured Hero Banner -->
    <section class="tmw-dept-hero" aria-label="Featured ${dept.name}">
      <div class="tmw-dept-hero__bg">
        <img src="${hero.heroImage || hero.image}" alt="${hero.title}" class="tmw-dept-hero__img" loading="eager" id="tmw-hero-img" />
        <div class="tmw-dept-hero__overlay"></div>
        <div class="tmw-dept-hero__vignette"></div>
      </div>

      <div class="tmw-dept-hero__content">
        <div class="tmw-dept-hero__badge" id="tmw-hero-badge">${dept.badge}</div>
        <h1 class="tmw-dept-hero__title" id="tmw-hero-title">${hero.title}</h1>
        
        <div class="tmw-dept-hero__meta" id="tmw-hero-meta">
          <span class="tmw-dept-pill tmw-dept-pill--red">${hero.year}</span>
          <span class="tmw-dept-pill tmw-dept-pill--hd">${hero.resolution}</span>
          <span class="tmw-dept-pill">${hero.duration}</span>
          <span>${hero.category}</span>
          <span>•</span>
          <span>${hero.platform}</span>
        </div>

        <p class="tmw-dept-hero__desc" id="tmw-hero-desc">${hero.overview}</p>

        <div class="tmw-dept-hero__actions" id="tmw-hero-actions">
          <button class="tmw-btn tmw-btn--primary" id="tmw-hero-watch-btn" data-project-id="${hero.id}">
            <svg viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>
            <span>Watch Feature</span>
          </button>
          <button class="tmw-btn tmw-btn--secondary" id="tmw-hero-info-btn" data-project-id="${hero.id}">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            <span>More Info</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Main Content: Horizontal Netflix Rows -->
    <main class="tmw-dept-main">
      ${collections.map((col, cIdx) => `
        <section class="tmw-dept-row" aria-label="${col.title}" data-row-index="${cIdx}">
          <div class="tmw-dept-row__header">
            <h2 class="tmw-dept-row__title">
              <span>${col.title}</span>
              <span class="tmw-dept-row__count">(${col.projects.length})</span>
            </h2>
          </div>

          <div class="tmw-dept-carousel-wrapper">
            <button class="tmw-dept-carousel-nav tmw-dept-carousel-nav--prev" aria-label="Scroll left in ${col.title}">
              <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>

            <div class="tmw-dept-carousel">
              ${col.projects.map(proj => `
                <article class="tmw-dept-card" data-project-id="${proj.id}" tabindex="0" role="button" aria-label="View project ${proj.title}">
                  <div class="tmw-dept-card__thumb">
                    <img src="${proj.thumbnail}" alt="${proj.title}" class="tmw-dept-card__img" loading="lazy" />
                    <div class="tmw-dept-card__play-badge">
                      <svg viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>
                    </div>
                    <span class="tmw-dept-card__duration">${proj.duration}</span>
                  </div>
                  <div class="tmw-dept-card__body">
                    <div class="tmw-dept-card__header">
                      <h3 class="tmw-dept-card__title">${proj.title}</h3>
                      <span class="tmw-dept-card__year">${proj.year}</span>
                    </div>
                    <div class="tmw-dept-card__cat">${proj.category}</div>
                    <div class="tmw-dept-card__tags">
                      ${(proj.tags || []).slice(0, 2).map(tag => `<span class="tmw-dept-card__tag">${tag}</span>`).join('')}
                    </div>
                  </div>
                </article>
              `).join('')}
            </div>

            <button class="tmw-dept-carousel-nav tmw-dept-carousel-nav--next" aria-label="Scroll right in ${col.title}">
              <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </section>
      `).join('')}
    </main>

    <!-- Netflix Expanded Project Modal -->
    <div class="tmw-dept-modal" id="tmw-dept-modal" aria-hidden="true" role="dialog" aria-modal="true">
      <div class="tmw-dept-modal__backdrop" id="tmw-modal-backdrop"></div>
      <div class="tmw-dept-modal__dialog" id="tmw-modal-dialog">
        <button class="tmw-dept-modal__close" id="tmw-modal-close" aria-label="Close details">
          <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div class="tmw-dept-modal__hero">
          <img src="" alt="" class="tmw-dept-modal__hero-img" id="tmw-modal-hero-img" />
          <div class="tmw-dept-modal__hero-overlay"></div>
          <div class="tmw-dept-modal__hero-content">
            <h2 class="tmw-dept-modal__title" id="tmw-modal-title"></h2>
            <div class="tmw-dept-modal__actions">
              <button class="tmw-btn tmw-btn--primary" id="tmw-modal-play-action">
                <svg viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>
                <span>Play Trailer</span>
              </button>
            </div>
          </div>
        </div>

        <div class="tmw-dept-modal__body">
          <div class="tmw-dept-modal__main">
            <div class="tmw-dept-modal__meta-row" id="tmw-modal-meta-row"></div>
            <p class="tmw-dept-modal__desc" id="tmw-modal-desc"></p>
          </div>
          <div class="tmw-dept-modal__sidebar">
            <div class="tmw-dept-modal__info-group">
              <span class="tmw-dept-modal__info-label">Director / Unit</span>
              <span class="tmw-dept-modal__info-value" id="tmw-modal-director">-</span>
            </div>
            <div class="tmw-dept-modal__info-group">
              <span class="tmw-dept-modal__info-label">Client / Platform</span>
              <span class="tmw-dept-modal__info-value" id="tmw-modal-client">-</span>
            </div>
            <div class="tmw-dept-modal__info-group">
              <span class="tmw-dept-modal__info-label">Format / Specs</span>
              <span class="tmw-dept-modal__info-value" id="tmw-modal-specs">-</span>
            </div>
            <div class="tmw-dept-modal__info-group">
              <span class="tmw-dept-modal__info-label">Department</span>
              <span class="tmw-dept-modal__info-value">${dept.name} · Tubelight Mediaworks</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Department Footer -->
    <footer class="tmw-dept-footer">
      <div class="tmw-dept-footer__inner">
        <div class="tmw-dept-footer__top">
          <div class="tmw-dept-footer__brand">
            <h3>Tubelight Mediaworks</h3>
            <p>Production with a point of view · Est. MMXXV</p>
          </div>
          <div class="tmw-dept-footer__links">
            <div class="tmw-dept-footer__col">
              <h4>Departments</h4>
              <a href="/films">Films</a>
              <a href="/brands">Brands</a>
              <a href="/sports">Sports</a>
            </div>
            <div class="tmw-dept-footer__col">
              <h4>Navigation</h4>
              <a href="/">Home</a>
              <a href="/#tmw-about">About</a>
              <a href="/#tmw-projects-chapter">Projects</a>
            </div>
            <div class="tmw-dept-footer__col">
              <h4>Connect</h4>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
              <a href="https://vimeo.com" target="_blank" rel="noopener noreferrer">Vimeo</a>
              <a href="mailto:contact@tubelightmediaworks.com">Email Us</a>
            </div>
          </div>
        </div>
        <div class="tmw-dept-footer__bottom">
          <span>© 2026 Tubelight Mediaworks. All rights reserved.</span>
          <span>Film · Commercials · Branded Content · Sports Media</span>
        </div>
      </div>
    </footer>
  `;
}

function playEntranceAnimations() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const heroImg = document.getElementById('tmw-hero-img');
  const heroBadge = document.getElementById('tmw-hero-badge');
  const heroTitle = document.getElementById('tmw-hero-title');
  const heroMeta = document.getElementById('tmw-hero-meta');
  const heroDesc = document.getElementById('tmw-hero-desc');
  const heroActions = document.getElementById('tmw-hero-actions');
  const nav = document.getElementById('tmw-dept-nav');

  const tl = gsap.timeline();

  // 1. Hero background zoom-out settle
  if (heroImg) {
    tl.fromTo(heroImg,
      { scale: 1.12, opacity: 0.7 },
      { scale: 1.03, opacity: 1, duration: 1.4, ease: 'power3.out' },
      0
    );
  }

  // 2. Navigation bar fade in
  if (nav) {
    tl.fromTo(nav,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' },
      0.1
    );
  }

  // 3. Hero content reveal
  if (heroBadge) {
    tl.fromTo(heroBadge,
      { y: -12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
      0.2
    );
  }

  if (heroTitle) {
    tl.fromTo(heroTitle,
      { y: 35, opacity: 0, filter: 'blur(10px)' },
      { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.9, ease: 'power3.out' },
      0.3
    );
  }

  if (heroMeta) {
    tl.fromTo(heroMeta,
      { y: 15, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
      0.45
    );
  }

  if (heroDesc) {
    tl.fromTo(heroDesc,
      { y: 15, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out' },
      0.55
    );
  }

  if (heroActions) {
    tl.fromTo(heroActions,
      { y: 15, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.5)' },
      0.65
    );
  }
}

function setupRowScrollReveals() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const rows = document.querySelectorAll('.tmw-dept-row');
  
  if (!window.IntersectionObserver) {
    rows.forEach(r => r.classList.add('tmw-dept-row--visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const row = entry.target;
        const cards = row.querySelectorAll('.tmw-dept-card');
        const header = row.querySelector('.tmw-dept-row__header');

        if (header) {
          gsap.fromTo(header,
            { y: 15, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }
          );
        }

        if (cards.length) {
          gsap.fromTo(cards,
            { y: 25, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'power3.out' }
          );
        }

        observer.unobserve(row);
      }
    });
  }, { threshold: 0.15 });

  rows.forEach(row => observer.observe(row));
}

function setupNavScroll() {
  const nav = document.getElementById('tmw-dept-nav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      nav.classList.add('tmw-dept-nav--scrolled');
    } else {
      nav.classList.remove('tmw-dept-nav--scrolled');
    }
  }, { passive: true });
}

function setupCarousels() {
  const wrappers = document.querySelectorAll('.tmw-dept-carousel-wrapper');

  wrappers.forEach(wrapper => {
    const carousel = wrapper.querySelector('.tmw-dept-carousel');
    const prevBtn = wrapper.querySelector('.tmw-dept-carousel-nav--prev');
    const nextBtn = wrapper.querySelector('.tmw-dept-carousel-nav--next');

    if (!carousel) return;

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        carousel.scrollBy({ left: -carousel.clientWidth * 0.75, behavior: 'smooth' });
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        carousel.scrollBy({ left: carousel.clientWidth * 0.75, behavior: 'smooth' });
      });
    }
  });
}

function setupModal(dept) {
  const modal = document.getElementById('tmw-dept-modal');
  const dialog = document.getElementById('tmw-modal-dialog');
  const backdrop = document.getElementById('tmw-modal-backdrop');
  const closeBtn = document.getElementById('tmw-modal-close');
  const heroImg = document.getElementById('tmw-modal-hero-img');
  const titleEl = document.getElementById('tmw-modal-title');
  const metaRow = document.getElementById('tmw-modal-meta-row');
  const descEl = document.getElementById('tmw-modal-desc');
  const directorEl = document.getElementById('tmw-modal-director');
  const clientEl = document.getElementById('tmw-modal-client');
  const specsEl = document.getElementById('tmw-modal-specs');
  const playAction = document.getElementById('tmw-modal-play-action');

  if (!modal) return;

  // Build a map of only this department's projects
  const allProjects = new Map();
  allProjects.set(dept.hero.id, dept.hero);
  dept.collections.forEach(col => {
    col.projects.forEach(p => {
      allProjects.set(p.id, { ...p, heroImage: p.heroImage || p.thumbnail });
    });
  });

  function openProject(projectId) {
    const proj = allProjects.get(projectId);
    if (!proj) return;

    if (heroImg) {
      heroImg.src = proj.heroImage || proj.thumbnail || proj.image;
      heroImg.alt = proj.title;
    }
    if (titleEl) titleEl.textContent = proj.title;
    if (descEl) descEl.textContent = proj.overview || proj.description || '';
    if (directorEl) directorEl.textContent = proj.director || 'Tubelight Mediaworks';
    if (clientEl) clientEl.textContent = proj.client || proj.platform || 'Original Production';
    if (specsEl) specsEl.textContent = proj.specs || proj.resolution || '4K Ultra HD';

    if (metaRow) {
      metaRow.innerHTML = `
        <span class="tmw-dept-pill tmw-dept-pill--red">${proj.year || '2025'}</span>
        <span class="tmw-dept-pill tmw-dept-pill--hd">${proj.specs || proj.resolution || '4K'}</span>
        <span class="tmw-dept-pill">${proj.duration || 'Feature'}</span>
        <span>${proj.category || ''}</span>
      `;
    }

    if (playAction) {
      playAction.onclick = () => {
        alert(`Now previewing "${proj.title}" — Tubelight Mediaworks`);
      };
    }

    modal.classList.add('tmw-dept-modal--open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (dialog) {
      gsap.fromTo(dialog,
        { scale: 0.92, y: 30, opacity: 0 },
        { scale: 1, y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }
      );
    }
  }

  function closeModal() {
    if (dialog) {
      gsap.to(dialog, {
        scale: 0.95,
        y: 15,
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => {
          modal.classList.remove('tmw-dept-modal--open');
          modal.setAttribute('aria-hidden', 'true');
          document.body.style.overflow = '';
        },
      });
    } else {
      modal.classList.remove('tmw-dept-modal--open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  // Bind Card Clicks
  document.querySelectorAll('.tmw-dept-card').forEach(card => {
    const pId = card.getAttribute('data-project-id');
    card.addEventListener('click', () => openProject(pId));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openProject(pId);
      }
    });
  });

  // Bind Hero Buttons
  const heroWatchBtn = document.getElementById('tmw-hero-watch-btn');
  const heroInfoBtn = document.getElementById('tmw-hero-info-btn');
  if (heroWatchBtn) {
    heroWatchBtn.addEventListener('click', () => openProject(dept.hero.id));
  }
  if (heroInfoBtn) {
    heroInfoBtn.addEventListener('click', () => openProject(dept.hero.id));
  }

  // Close handlers
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('tmw-dept-modal--open')) {
      closeModal();
    }
  });
}
