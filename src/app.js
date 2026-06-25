/**
 * app.js — Novel Reader entry point.
 *
 * Bootstraps the application:
 * 1. Applies saved theme
 * 2. Initialises the router
 * 3. Dispatches to the correct view on every route change
 */

import { ensureSchema, applyTheme, getTheme } from './store.js';
import { onRoute, init as initRouter } from './router.js';
import { renderHome } from './views/home.js';
import { renderTitle } from './views/title.js';
import { renderReader } from './views/reader.js';
import { destroySettingsPanel } from './views/settings.js';

// ─── Boot ────────────────────────────────────────────────────────────────────

// 1. Schema version check
ensureSchema();

// 2. Apply saved theme before any paint
applyTheme(getTheme());

// 3. Root container
const appEl = document.getElementById('app');

// 4. Router handler
onRoute(async (route) => {
  // Always tear down settings panel when navigating
  destroySettingsPanel();

  // Scroll to top on every navigation
  window.scrollTo(0, 0);

  // Clear previous view
  appEl.innerHTML = '';

  try {
    switch (route.view) {
      case 'home':
        await renderHome(appEl);
        break;

      case 'title':
        await renderTitle(appEl, route.novelId);
        break;

      case 'reader':
        await renderReader(appEl, route.novelId, route.chapterId);
        break;

      default:
        appEl.innerHTML = `
          <div class="state-card">
            <div class="state-card__icon">🗺️</div>
            <p class="state-card__title">Сторінку не знайдено</p>
            <a href="#/" class="btn btn-primary" style="margin-top:8px">На головну</a>
          </div>`;
    }
  } catch (err) {
    console.error('[app] Помилка рендерингу:', err);
    appEl.innerHTML = `
      <div class="state-card">
        <div class="state-card__icon">⚠️</div>
        <p class="state-card__title">Щось пішло не так</p>
        <p class="state-card__text">${escapeHtml(err.message)}</p>
        <a href="#/" class="btn btn-secondary" style="margin-top:8px">На головну</a>
      </div>`;
  }

  // Hide splash screen after first render
  hideSplash();
});

// 5. Start the router (fires initial route)
initRouter();

// ─── Helpers ─────────────────────────────────────────────────────────────────

let splashHidden = false;
function hideSplash() {
  if (splashHidden) return;
  splashHidden = true;
  const splash = document.getElementById('splash');
  if (splash) {
    splash.classList.add('hidden');
    setTimeout(() => splash.remove(), 300);
  }
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
