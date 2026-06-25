/**
 * api.js — Data fetching helpers for Novel Reader.
 *
 * Resolves paths relative to the app root.
 * Works both on GitHub Pages (https://user.github.io/repo/) and
 * locally via an HTTP server (http://localhost:PORT/).
 *
 * NOTE: file:// protocol does NOT support fetch() for security reasons.
 * Always serve locally with an HTTP server (see serve.js / README).
 */

/**
 * Detect the base URL.
 * - On GitHub Pages: https://user.github.io/Shkotov-Novel_Reader/
 * - Local HTTP:      http://localhost:8080/
 */
function getBase() {
  const { origin, pathname } = window.location;
  // Keep everything up to and including the last slash
  const dir = pathname.endsWith('/')
    ? pathname
    : pathname.substring(0, pathname.lastIndexOf('/') + 1);
  return origin + dir;
}

const BASE = getBase();

async function fetchJSON(path) {
  const url = BASE + path;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Помилка завантаження ${url}: HTTP ${res.status}`);
  return res.json();
}

async function fetchText(path) {
  const url = BASE + path;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Не вдалося завантажити файл: ${url} (HTTP ${res.status})`);
  return res.text();
}

/**
 * Load ZFolder/index.json.
 * Returns the novels array.
 */
export async function loadIndex() {
  const index = await fetchJSON('ZFolder/index.json');
  return index.novels ?? [];
}

/**
 * Load a novel's title.json.
 * @param {string} folder - folder name inside ZFolder/
 */
export async function loadTitle(folder) {
  return fetchJSON(`ZFolder/${folder}/title.json`);
}

/**
 * Load a Markdown chapter file as raw text.
 * @param {string} folder - folder name inside ZFolder/
 * @param {string} file   - filename (e.g. "chapter1_translation.md")
 */
export async function loadChapter(folder, file) {
  return fetchText(`ZFolder/${folder}/${file}`);
}

/**
 * Build the URL for a cover image.
 * @param {string} folder    - folder name inside ZFolder/
 * @param {string} coverFile - cover filename (e.g. "cover.webp")
 */
export function coverURL(folder, coverFile) {
  return BASE + `ZFolder/${folder}/${coverFile}`;
}
