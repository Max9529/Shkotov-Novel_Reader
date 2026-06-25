/**
 * router.js — Hash-based SPA router.
 *
 * Routes:
 *   #/                          → home
 *   #/novel/:id                 → title page
 *   #/novel/:id/:chapterId      → reader
 */

const listeners = [];

export function onRoute(fn) {
  listeners.push(fn);
}

export function getRoute() {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  const parts = hash.split('/').filter(Boolean);

  if (parts.length === 0) return { view: 'home' };
  if (parts[0] === 'novel' && parts[1] && !parts[2]) {
    return { view: 'title', novelId: parts[1] };
  }
  if (parts[0] === 'novel' && parts[1] && parts[2]) {
    return { view: 'reader', novelId: parts[1], chapterId: parts[2] };
  }
  return { view: 'home' };
}

function dispatch() {
  const route = getRoute();
  listeners.forEach(fn => fn(route));
}

window.addEventListener('hashchange', dispatch);

export function navigate(path) {
  window.location.hash = path;
}

export function navigateHome() {
  navigate('/');
}

export function navigateToNovel(novelId) {
  navigate(`/novel/${novelId}`);
}

export function navigateToChapter(novelId, chapterId) {
  navigate(`/novel/${novelId}/${chapterId}`);
}

export function init() {
  dispatch();
}
