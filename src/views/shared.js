/**
 * views/shared.js — Shared UI components used across multiple views.
 */

import { getTheme, setTheme } from '../store.js';
import { iconSun, iconMoon } from '../icons.js';

/**
 * Returns the HTML for a theme toggle button.
 * @param {string} id - unique element id
 */
export function renderThemeToggle(id) {
  return `
    <button
      class="btn-theme"
      id="${id}"
      aria-label="Перемкнути тему"
      title="Перемкнути тему"
    >
      ${iconSun}
    </button>`;
}

/**
 * Wire up a theme toggle button by element id.
 * Updates icon and calls setTheme.
 */
export function wireThemeToggle(id) {
  const btn = document.getElementById(id);
  if (!btn) return;

  function updateIcon() {
    const theme = getTheme();
    btn.innerHTML = theme === 'dark' ? iconSun : iconMoon;
    btn.setAttribute('aria-label', theme === 'dark' ? 'Увімкнути світлу тему' : 'Увімкнути темну тему');
  }

  updateIcon();

  btn.addEventListener('click', () => {
    const current = getTheme();
    setTheme(current === 'dark' ? 'light' : 'dark');
    updateIcon();
  });
}

/**
 * Escape HTML special chars.
 */
export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Format a chapter status label.
 */
export function statusLabel(status) {
  switch (status) {
    case 'reading': return 'Читаю';
    case 'done':    return 'Прочитано';
    default:        return '';
  }
}
