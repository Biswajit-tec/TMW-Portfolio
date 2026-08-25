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
  links: [
    { label: 'Work', href: '#work' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ],
};
