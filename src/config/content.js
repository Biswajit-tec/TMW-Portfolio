/**
 * content.js — Centralized brand copy for Tubelight Media Works.
 *
 * All client-facing text lives here so it can be updated without
 * touching component logic. Replace values here to rebrand the site.
 */

export const BRAND = {
  name: 'Tubelight Media Works',
  tagline: 'Production with a point of view.',
  established: 'Est. MMXXV',
  loaderPrompt: 'Enter the work',
};

export const HERO = {
  /** Main foreground headline — visible on initial load */
  headline: 'Stories made\nto be seen.',

  /** Background text revealed as the foreground panel slides away */
  columns: [
    {
      title: 'Motion',
      body: 'Every frame drawn from deliberate light and engineered shadow. Stories that exist between the signal and the silence that follows.',
    },
    {
      title: 'Vision',
      body: 'Where the image stops moving and the emotion takes over. Work built to outlast the moment it was made for.',
    },
  ],

  /** Outro headline — revealed by SplitText mask at end of scroll sequence */
  outroHeadline: 'Production with a point of view.',
};

export const NAV = {
  primary: [
    { num: 'I',   label: 'Home',     href: '#tmw-hero' },
    { num: 'II',  label: 'About',    href: '#tmw-about' },
    { num: 'III', label: 'Projects', href: '#tmw-projects-chapter' },
    { num: 'IV',  label: 'Closing',  href: '#tmw-ending' },
  ],
  secondary: {
    top: [
      { label: 'Start a Project', href: '#tmw-ending' },
      { label: 'Showcase',        href: '#tmw-projects-chapter' },
    ],
    bottom: [
      { label: 'Contact',         href: '#tmw-footer' },
      { label: 'Instagram',       href: 'https://instagram.com', external: true },
      { label: 'Vimeo',           href: 'https://vimeo.com',     external: true },
    ],
  },
};

export const ABOUT = {
  intro: {
    /** Intro full-screen headline — first About section */
    headline: 'We make films\nfor a world\nthat moves.',
  },
  sticky: {
    /** Sticky section header — above the card animation */
    header: 'What we do.',
    /** Card backs — revealed on scroll via 3D flip */
    cards: [
      { number: '( 01 )', title: 'Film &amp; Branded Content' },
      { number: '( 02 )', title: 'Visual Campaigns' },
      { number: '( 03 )', title: 'Moving Image' },
    ],
  },
  outro: {
    /** Outro full-screen statement */
    headline: 'We are Tubelight\nMedia Works.',
  },
};

export const PROJECTS = {
  intro: {
    /** Full-viewport headline — cream bg, first beat of the projects chapter */
    headline: 'Work that\nspeaks first.',
  },
  slides: [
    {
      number:   '01',
      title:    'After Light',
      category: 'Film · 2025',
    },
    {
      number:   '02',
      title:    'Parallel',
      category: 'Branded Content · 2024',
    },
  ],
  outro: {
    /** Dark-bg editorial statement — bridge into Project End */
    headline: 'Every frame\nis a decision.',
  },
  end: {
    /** Project End section — spotlight gallery + CTA */
    headline: 'Selected work from\n2023 — 2025.',
    cta:      'Start a project',
    footer:   'Tubelight Media Works',
  },
};

export const ENDING = {
  /** Closing statement before the final footer */
  headline: 'The next frame\nstarts here.',
  subtext: 'Have a story to tell? Let\'s make it move.',
  cta: 'Start a project',
  ctaHref: '#contact',
};

export const FOOTER = {
  brand: 'TUBELIGHT MEDIA WORKS',
  tagline: 'Production House',
  disciplines: 'Film · Commercials · Branded Content · Moving Image',
  meta: 'Est. MMXXV · Global Production',
  copyright: '© 2026 Tubelight Media Works. All rights reserved.',
  links: [
    { label: 'Instagram', href: 'https://instagram.com' },
    { label: 'Vimeo', href: 'https://vimeo.com' },
    { label: 'Email', href: 'mailto:contact@tubelightmediaworks.com' },
  ],
};

