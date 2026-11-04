/**
 * sports.js — Route Controller for Sports Portfolio
 * Tubelight Media Works · Prepared for upcoming redesign
 */

import { initPageTransition, navigateTo } from '../components/transition/PageTransition.js';

function initSportsPage() {
  initPageTransition();

  const backBtn = document.getElementById('tmw-film-back');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('/');
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSportsPage);
} else {
  initSportsPage();
}
